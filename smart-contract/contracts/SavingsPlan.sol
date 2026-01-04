// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IYieldProtocol.sol";

/**
 * @title SavingsPlan
 * @notice Automated USDC savings platform with yield generation on Base network
 * @dev Production-grade contract with comprehensive security features
 */
contract SavingsPlan is ReentrancyGuard, Pausable, AccessControl, Ownable2Step {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    /// @notice Supported plan durations in days
    uint256 public constant PLAN_DURATION_1_MONTH = 30 days;
    uint256 public constant PLAN_DURATION_3_MONTHS = 90 days;
    uint256 public constant PLAN_DURATION_6_MONTHS = 180 days;
    uint256 public constant PLAN_DURATION_1_YEAR = 365 days;
    
    /// @notice Role for keepers who can execute daily deductions
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    
    /// @notice Role for emergency responders
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    /// @notice Precision for yield calculations (1e18)
    uint256 public constant PRECISION = 1e18;
    
    /// @notice Maximum early withdrawal penalty (50%)
    uint256 public constant MAX_EARLY_WITHDRAWAL_PENALTY = 5000; // 50% in basis points
    
    /// @notice Minimum deposit threshold before deploying to yield protocol
    uint256 public constant MIN_YIELD_DEPOSIT_THRESHOLD = 1000 * 1e6; // 1000 USDC (6 decimals)

    // ============ State Variables ============
    
    /// @notice USDC token address on Base
    IERC20 public immutable usdcToken;
    
    /// @notice Current yield protocol integration
    IYieldProtocol public yieldProtocol;
    
    /// @notice Total number of plans created
    uint256 public totalPlans;
    
    /// @notice Early withdrawal penalty (in basis points, e.g., 1000 = 10%)
    uint256 public earlyWithdrawalPenalty;
    
    /// @notice Minimum daily deduction amount
    uint256 public minDailyDeduction;
    
    /// @notice Maximum daily deduction amount
    uint256 public maxDailyDeduction;
    
    /// @notice Protocol fee percentage (in basis points)
    uint256 public protocolFeeBps;
    
    /// @notice User yield share percentage (in basis points, rest goes to protocol)
    uint256 public userYieldShareBps;
    
    /// @notice Minimum pooling threshold for yield deposits
    uint256 public minYieldDepositThreshold;
    
    /// @notice Total principal deposited by all users
    uint256 public totalPrincipal;
    
    /// @notice Total yield earned by all users
    uint256 public totalUserYield;
    
    /// @notice Total protocol yield/fees
    uint256 public totalProtocolYield;
    
    /// @notice Total shares in yield protocol
    uint256 public totalYieldShares;
    
    /// @notice Emergency withdrawal timelock delay
    uint256 public emergencyWithdrawalDelay;
    
    /// @notice Mapping from plan ID to Plan struct
    mapping(uint256 => Plan) public plans;
    
    /// @notice Mapping from user address to array of plan IDs
    mapping(address => uint256[]) public userPlans;
    
    /// @notice Mapping for scheduled emergency withdrawals
    mapping(bytes32 => EmergencyWithdrawal) public emergencyWithdrawals;
    
    /// @notice Track last yield harvest timestamp
    uint256 public lastYieldHarvest;
    
    /// @notice Yield harvest interval
    uint256 public yieldHarvestInterval;

    // ============ Structs ============
    
    /**
     * @notice Savings plan structure
     */
    struct Plan {
        address owner;                    // Plan owner address
        uint256 dailyAmount;               // Daily USDC deduction amount
        uint256 startDate;                 // Plan start timestamp
        uint256 endDate;                   // Plan maturity timestamp
        uint256 totalTarget;               // Total target amount (dailyAmount * days)
        uint256 accumulatedBalance;        // Current accumulated balance
        uint256 principalDeposited;        // Total principal deposited
        uint256 yieldEarned;               // Yield earned by this plan
        uint256 lastDeductionDate;         // Last successful deduction date
        uint256 successfulDeductions;      // Number of successful deductions
        uint256 missedDeductions;         // Number of missed deductions
        bool isActive;                     // Whether plan is still active
        bool isCompleted;                  // Whether plan has been completed
        PlanDuration duration;             // Plan duration enum
    }
    
    /**
     * @notice Plan duration options
     */
    enum PlanDuration {
        ONE_MONTH,
        THREE_MONTHS,
        SIX_MONTHS,
        ONE_YEAR
    }
    
    /**
     * @notice Emergency withdrawal request structure
     */
    struct EmergencyWithdrawal {
        address admin;                     // Admin who scheduled the withdrawal
        address user;                      // User whose funds are being withdrawn
        uint256 planId;                    // Plan ID
        uint256 amount;                    // Amount to withdraw (0 = full balance)
        uint256 scheduledTime;            // When withdrawal was scheduled
        uint256 executionTime;             // When withdrawal can be executed
        bytes32 reasonHash;                // Hash of reason for withdrawal
        bool executed;                     // Whether withdrawal has been executed
        bool cancelled;                    // Whether withdrawal has been cancelled
    }

    // ============ Events ============
    
    event PlanCreated(
        uint256 indexed planId,
        address indexed owner,
        uint256 dailyAmount,
        PlanDuration duration,
        uint256 startDate,
        uint256 endDate,
        uint256 totalTarget
    );
    
    event DeductionExecuted(
        uint256 indexed planId,
        address indexed owner,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    
    event DeductionMissed(
        uint256 indexed planId,
        address indexed owner,
        uint256 expectedAmount,
        uint256 timestamp
    );
    
    event PlanCompleted(
        uint256 indexed planId,
        address indexed owner,
        uint256 totalAccumulated,
        uint256 totalYield
    );
    
    event WithdrawalExecuted(
        uint256 indexed planId,
        address indexed owner,
        uint256 amount,
        uint256 penalty,
        bool isEarly,
        uint256 timestamp
    );
    
    event YieldDeposited(
        uint256 amount,
        address indexed yieldProtocol,
        uint256 shares,
        uint256 timestamp
    );
    
    event YieldWithdrawn(
        uint256 amount,
        address indexed yieldProtocol,
        uint256 shares,
        uint256 timestamp
    );
    
    event YieldHarvested(
        uint256 totalYield,
        uint256 userShare,
        uint256 protocolShare,
        uint256 timestamp
    );
    
    event YieldDistributed(
        address indexed user,
        uint256 indexed planId,
        uint256 yieldAmount,
        uint256 timestamp
    );
    
    event YieldProtocolUpdated(
        address indexed oldProtocol,
        address indexed newProtocol,
        uint256 timestamp
    );
    
    event EmergencyYieldExit(
        uint256 amount,
        address indexed yieldProtocol,
        bytes32 reason,
        uint256 timestamp
    );
    
    event EmergencyWithdrawalScheduled(
        bytes32 indexed withdrawalId,
        address indexed admin,
        address indexed user,
        uint256 planId,
        uint256 amount,
        uint256 executionTime,
        bytes32 reasonHash
    );
    
    event EmergencyWithdrawalExecuted(
        bytes32 indexed withdrawalId,
        address indexed admin,
        address indexed user,
        uint256 planId,
        uint256 amount,
        bytes32 reasonHash,
        uint256 timestamp
    );
    
    event EmergencyWithdrawalCancelled(
        bytes32 indexed withdrawalId,
        address indexed admin,
        address indexed user,
        uint256 planId,
        uint256 timestamp
    );
    
    event ParametersUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue,
        uint256 timestamp
    );
    
    event ProtocolFeeWithdrawn(
        address indexed admin,
        uint256 amount,
        uint256 timestamp
    );

    // ============ Errors ============
    
    error InvalidPlanDuration();
    error InvalidDailyAmount();
    error InvalidPlanId();
    error PlanNotActive();
    error PlanAlreadyCompleted();
    error InsufficientBalance();
    error DeductionAlreadyExecuted();
    error PlanNotMature();
    error InvalidWithdrawalAmount();
    error Unauthorized();
    error InvalidYieldProtocol();
    error YieldProtocolUnhealthy();
    error InsufficientYieldBalance();
    error InvalidEmergencyWithdrawal();
    error EmergencyWithdrawalNotReady();
    error EmergencyWithdrawalAlreadyExecuted();
    error EmergencyWithdrawalIsCancelled();
    error InvalidParameter();
    error AccountingMismatch();

    // ============ Modifiers ============
    
    modifier validPlanId(uint256 planId) {
        if (planId == 0 || planId > totalPlans) revert InvalidPlanId();
        _;
    }
    
    modifier onlyPlanOwner(uint256 planId) {
        if (plans[planId].owner != msg.sender) revert Unauthorized();
        _;
    }

    // ============ Constructor ============
    
    /**
     * @notice Initialize the SavingsPlan contract
     * @param _usdcToken USDC token address on Base
     * @param _earlyWithdrawalPenalty Early withdrawal penalty in basis points
     * @param _minDailyDeduction Minimum daily deduction amount
     * @param _maxDailyDeduction Maximum daily deduction amount
     * @param _protocolFeeBps Protocol fee in basis points
     * @param _userYieldShareBps User yield share in basis points (rest to protocol)
     */
    constructor(
        address _usdcToken,
        uint256 _earlyWithdrawalPenalty,
        uint256 _minDailyDeduction,
        uint256 _maxDailyDeduction,
        uint256 _protocolFeeBps,
        uint256 _userYieldShareBps
    ) Ownable(msg.sender) {
        if (_usdcToken == address(0)) revert InvalidParameter();
        if (_earlyWithdrawalPenalty > MAX_EARLY_WITHDRAWAL_PENALTY) revert InvalidParameter();
        if (_minDailyDeduction == 0 || _minDailyDeduction >= _maxDailyDeduction) revert InvalidParameter();
        if (_userYieldShareBps > 10000) revert InvalidParameter();
        
        usdcToken = IERC20(_usdcToken);
        earlyWithdrawalPenalty = _earlyWithdrawalPenalty;
        minDailyDeduction = _minDailyDeduction;
        maxDailyDeduction = _maxDailyDeduction;
        protocolFeeBps = _protocolFeeBps;
        userYieldShareBps = _userYieldShareBps;
        minYieldDepositThreshold = MIN_YIELD_DEPOSIT_THRESHOLD;
        emergencyWithdrawalDelay = 48 hours;
        yieldHarvestInterval = 1 days;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ============ User Functions ============
    
    /**
     * @notice Create a new savings plan
     * @param dailyAmount Daily USDC deduction amount (must be within min/max limits)
     * @param duration Plan duration (0 = 1 month, 1 = 3 months, 2 = 6 months, 3 = 1 year)
     * @return planId The ID of the newly created plan
     */
    function createPlan(
        uint256 dailyAmount,
        PlanDuration duration
    ) external whenNotPaused nonReentrant returns (uint256 planId) {
        if (dailyAmount < minDailyDeduction || dailyAmount > maxDailyDeduction) {
            revert InvalidDailyAmount();
        }
        
        uint256 planDurationDays;
        // Validate enum value by checking its underlying uint8 value
        // PlanDuration enum has 4 values: 0, 1, 2, 3
        uint8 durationValue = uint8(duration);
        if (durationValue > 3) {
            revert InvalidPlanDuration();
        }
        if (durationValue == uint8(PlanDuration.ONE_MONTH)) {
            planDurationDays = PLAN_DURATION_1_MONTH;
        } else if (durationValue == uint8(PlanDuration.THREE_MONTHS)) {
            planDurationDays = PLAN_DURATION_3_MONTHS;
        } else if (durationValue == uint8(PlanDuration.SIX_MONTHS)) {
            planDurationDays = PLAN_DURATION_6_MONTHS;
        } else if (durationValue == uint8(PlanDuration.ONE_YEAR)) {
            planDurationDays = PLAN_DURATION_1_YEAR;
        } else {
            // This should never happen if durationValue <= 3, but keep as safety
            revert InvalidPlanDuration();
        }
        
        uint256 totalTarget = dailyAmount * (planDurationDays / 1 days);
        uint256 startDate = block.timestamp;
        uint256 endDate = startDate + planDurationDays;
        
        planId = ++totalPlans;
        
        plans[planId] = Plan({
            owner: msg.sender,
            dailyAmount: dailyAmount,
            startDate: startDate,
            endDate: endDate,
            totalTarget: totalTarget,
            accumulatedBalance: 0,
            principalDeposited: 0,
            yieldEarned: 0,
            lastDeductionDate: 0,
            successfulDeductions: 0,
            missedDeductions: 0,
            isActive: true,
            isCompleted: false,
            duration: duration
        });
        
        userPlans[msg.sender].push(planId);
        
        emit PlanCreated(
            planId,
            msg.sender,
            dailyAmount,
            duration,
            startDate,
            endDate,
            totalTarget
        );
        
        return planId;
    }
    
    /**
     * @notice Execute daily deduction for a specific plan
     * @param planId The plan ID to execute deduction for
     * @dev Can be called by keeper or plan owner
     */
    function executeDeduction(
        uint256 planId
    ) external validPlanId(planId) whenNotPaused nonReentrant {
        Plan storage plan = plans[planId];
        
        if (!plan.isActive || plan.isCompleted) {
            revert PlanNotActive();
        }
        
        if (block.timestamp >= plan.endDate) {
            // Plan has reached maturity
            plan.isActive = false;
            plan.isCompleted = true;
            emit PlanCompleted(planId, plan.owner, plan.accumulatedBalance, plan.yieldEarned);
            return;
        }
        
        // Calculate expected deduction date (start date + number of successful deductions)
        uint256 expectedDeductionDate = plan.startDate + (plan.successfulDeductions * 1 days);
        
        // Check if deduction for this day has already been executed
        if (plan.lastDeductionDate > 0) {
            // If last deduction was very recent (within last hour), it's a duplicate attempt
            // This catches immediate duplicate calls
            if (block.timestamp <= plan.lastDeductionDate + 1 hours) {
                revert DeductionAlreadyExecuted();
            }
            
            // Also check if last deduction was on or after the expected date for current deduction
            // This catches cases where we're trying to execute a deduction that was already done
            if (plan.lastDeductionDate >= expectedDeductionDate - 1 hours) {
                revert DeductionAlreadyExecuted();
            }
        }
        
        // Check if it's too early (allow some tolerance for timing)
        // Only check if we haven't executed this deduction yet and it's significantly before the expected time
        if (block.timestamp < expectedDeductionDate - 1 hours) {
            revert InvalidParameter();
        }
        
        // Check user's USDC balance and allowance
        uint256 userBalance = usdcToken.balanceOf(plan.owner);
        uint256 userAllowance = usdcToken.allowance(plan.owner, address(this));
        
        if (userBalance < plan.dailyAmount || userAllowance < plan.dailyAmount) {
            // Mark as missed deduction
            plan.missedDeductions++;
            emit DeductionMissed(planId, plan.owner, plan.dailyAmount, block.timestamp);
            return;
        }
        
        // Transfer USDC from user to contract
        usdcToken.safeTransferFrom(plan.owner, address(this), plan.dailyAmount);
        
        // Update plan state
        plan.accumulatedBalance += plan.dailyAmount;
        plan.principalDeposited += plan.dailyAmount;
        plan.lastDeductionDate = block.timestamp;
        plan.successfulDeductions++;
        totalPrincipal += plan.dailyAmount;
        
        // Check if we should deposit to yield protocol
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        if (
            address(yieldProtocol) != address(0) &&
            contractBalance >= minYieldDepositThreshold &&
            yieldProtocol.isHealthy()
        ) {
            _depositToYield(contractBalance);
        }
        
        emit DeductionExecuted(
            planId,
            plan.owner,
            plan.dailyAmount,
            plan.accumulatedBalance,
            block.timestamp
        );
    }
    
    /**
     * @notice Execute deductions for multiple plans in batch
     * @param planIds Array of plan IDs to process
     * @dev More gas efficient for keepers processing many plans
     */
    function executeDeductionsBatch(
        uint256[] calldata planIds
    ) external whenNotPaused nonReentrant {
        uint256 contractBalanceBefore = usdcToken.balanceOf(address(this));
        
        for (uint256 i = 0; i < planIds.length; i++) {
            uint256 planId = planIds[i];
            if (planId == 0 || planId > totalPlans) continue;
            
            Plan storage plan = plans[planId];
            
            if (!plan.isActive || plan.isCompleted) continue;
            if (block.timestamp > plan.endDate) {
                plan.isActive = false;
                plan.isCompleted = true;
                emit PlanCompleted(planId, plan.owner, plan.accumulatedBalance, plan.yieldEarned);
                continue;
            }
            
            uint256 expectedDeductionDate = plan.startDate + (plan.successfulDeductions * 1 days);
            if (plan.lastDeductionDate >= expectedDeductionDate) continue;
            if (block.timestamp < expectedDeductionDate - 1 hours) continue;
            
            uint256 userBalance = usdcToken.balanceOf(plan.owner);
            uint256 userAllowance = usdcToken.allowance(plan.owner, address(this));
            
            if (userBalance < plan.dailyAmount || userAllowance < plan.dailyAmount) {
                plan.missedDeductions++;
                emit DeductionMissed(planId, plan.owner, plan.dailyAmount, block.timestamp);
                continue;
            }
            
            usdcToken.safeTransferFrom(plan.owner, address(this), plan.dailyAmount);
            
            plan.accumulatedBalance += plan.dailyAmount;
            plan.principalDeposited += plan.dailyAmount;
            plan.lastDeductionDate = block.timestamp;
            plan.successfulDeductions++;
            totalPrincipal += plan.dailyAmount;
            
            emit DeductionExecuted(
                planId,
                plan.owner,
                plan.dailyAmount,
                plan.accumulatedBalance,
                block.timestamp
            );
        }
        
        // Deposit to yield protocol if threshold met
        uint256 contractBalanceAfter = usdcToken.balanceOf(address(this));
        if (
            address(yieldProtocol) != address(0) &&
            contractBalanceAfter >= minYieldDepositThreshold &&
            yieldProtocol.isHealthy() &&
            contractBalanceAfter > contractBalanceBefore
        ) {
            uint256 newFunds = contractBalanceAfter - contractBalanceBefore;
            _depositToYield(newFunds);
        }
    }
    
    /**
     * @notice Withdraw funds from a completed or active plan
     * @param planId The plan ID to withdraw from
     * @param amount Amount to withdraw (0 = withdraw all available)
     * @return withdrawnAmount The amount actually withdrawn
     */
    function withdraw(
        uint256 planId,
        uint256 amount
    ) external validPlanId(planId) onlyPlanOwner(planId) nonReentrant returns (uint256 withdrawnAmount) {
        Plan storage plan = plans[planId];
        
        if (!plan.isActive && plan.isCompleted) {
            // Plan already completed and withdrawn
            revert PlanNotActive();
        }
        
        bool isEarly = block.timestamp < plan.endDate;
        uint256 availableBalance = plan.accumulatedBalance + plan.yieldEarned;
        
        uint256 requestedAmount = amount;
        if (requestedAmount == 0) {
            requestedAmount = availableBalance;
        }
        
        if (requestedAmount > availableBalance) {
            revert InvalidWithdrawalAmount();
        }
        
        // Calculate penalty for early withdrawal
        uint256 penalty = 0;
        uint256 withdrawAmount = requestedAmount;
        if (isEarly) {
            penalty = (requestedAmount * earlyWithdrawalPenalty) / 10000;
            withdrawAmount = requestedAmount - penalty;
        }
        
        // Calculate proportional amounts from principal and yield
        uint256 principalToWithdraw = 0;
        uint256 yieldToWithdraw = 0;
        if (availableBalance > 0) {
            principalToWithdraw = (plan.accumulatedBalance * requestedAmount) / availableBalance;
            yieldToWithdraw = (plan.yieldEarned * requestedAmount) / availableBalance;
        } else {
            principalToWithdraw = requestedAmount;
        }
        
        // Update plan state
        plan.accumulatedBalance -= principalToWithdraw;
        plan.yieldEarned -= yieldToWithdraw;
        
        amount = withdrawAmount; // Update amount to what user actually receives
        if (plan.accumulatedBalance == 0 && plan.yieldEarned == 0) {
            plan.isActive = false;
            plan.isCompleted = true;
        }
        
        // Withdraw from yield protocol if needed
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        if (amount > contractBalance && address(yieldProtocol) != address(0)) {
            uint256 needed = amount - contractBalance;
            _withdrawFromYield(needed);
        }
        
        // Transfer to user
        usdcToken.safeTransfer(plan.owner, amount);
        withdrawnAmount = amount;
        
        emit WithdrawalExecuted(
            planId,
            plan.owner,
            amount,
            penalty,
            isEarly,
            block.timestamp
        );
    }
    
    /**
     * @notice Claim accumulated yield for a specific plan
     * @param planId The plan ID to claim yield for
     * @return yieldAmount The yield amount claimed
     */
    function claimYield(
        uint256 planId
    ) external validPlanId(planId) onlyPlanOwner(planId) nonReentrant returns (uint256 yieldAmount) {
        Plan storage plan = plans[planId];
        
        if (!plan.isActive && !plan.isCompleted) {
            revert PlanNotActive();
        }
        
        // Calculate and distribute yield
        yieldAmount = _calculateAndDistributeYield(planId);
        
        if (yieldAmount == 0) {
            return 0;
        }
        
        // Withdraw from yield protocol if needed
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        if (yieldAmount > contractBalance && address(yieldProtocol) != address(0)) {
            uint256 needed = yieldAmount - contractBalance;
            _withdrawFromYield(needed);
        }
        
        // Transfer yield to user
        usdcToken.safeTransfer(plan.owner, yieldAmount);
        
        emit YieldDistributed(plan.owner, planId, yieldAmount, block.timestamp);
        
        return yieldAmount;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get plan details
     * @param planId The plan ID
     * @return plan The plan struct
     */
    function getPlan(uint256 planId) external view validPlanId(planId) returns (Plan memory plan) {
        return plans[planId];
    }
    
    /**
     * @notice Get all plan IDs for a user
     * @param user User address
     * @return Array of plan IDs
     */
    function getUserPlans(address user) external view returns (uint256[] memory) {
        return userPlans[user];
    }
    
    /**
     * @notice Get accumulated yield for a plan
     * @param planId The plan ID
     * @return yieldAmount The accumulated yield amount
     */
    function getAccumulatedYield(uint256 planId) external view validPlanId(planId) returns (uint256 yieldAmount) {
        Plan memory plan = plans[planId];
        if (plan.principalDeposited == 0) return 0;
        
        // Calculate user's share of total yield based on principal and time
        if (totalPrincipal == 0 || totalYieldShares == 0) return 0;
        
        uint256 userShare = (plan.principalDeposited * totalYieldShares) / totalPrincipal;
        uint256 timeFactor = _calculateTimeFactor(plan);
        
        yieldAmount = (userShare * timeFactor) / PRECISION;
        yieldAmount = (yieldAmount * userYieldShareBps) / 10000;
        
        return yieldAmount;
    }
    
    /**
     * @notice Get next scheduled deduction date for a plan
     * @param planId The plan ID
     * @return nextDeductionDate The next deduction timestamp
     */
    function getNextDeductionDate(uint256 planId) external view validPlanId(planId) returns (uint256 nextDeductionDate) {
        Plan memory plan = plans[planId];
        if (!plan.isActive || plan.isCompleted) return 0;
        if (block.timestamp > plan.endDate) return 0;
        
        return plan.startDate + ((plan.successfulDeductions + 1) * 1 days);
    }
    
    /**
     * @notice Check if plan is mature
     * @param planId The plan ID
     * @return isMature True if plan has reached maturity
     */
    function isPlanMature(uint256 planId) external view validPlanId(planId) returns (bool isMature) {
        Plan memory plan = plans[planId];
        return block.timestamp >= plan.endDate;
    }
    
    /**
     * @notice Calculate early withdrawal penalty for an amount
     * @param planId The plan ID
     * @param amount The withdrawal amount
     * @return penalty The penalty amount
     */
    function calculateEarlyWithdrawalPenalty(
        uint256 planId,
        uint256 amount
    ) external view validPlanId(planId) returns (uint256 penalty) {
        Plan memory plan = plans[planId];
        if (block.timestamp >= plan.endDate) return 0;
        return (amount * earlyWithdrawalPenalty) / 10000;
    }
    
    /**
     * @notice Get total contract balance (on-chain + in yield protocol)
     * @return balance Total USDC balance
     */
    function getTotalContractBalance() external view returns (uint256 balance) {
        uint256 onChainBalance = usdcToken.balanceOf(address(this));
        uint256 yieldBalance = 0;
        if (address(yieldProtocol) != address(0)) {
            try yieldProtocol.getBalance() returns (uint256 bal) {
                yieldBalance = bal;
            } catch {
                yieldBalance = 0;
            }
        }
        return onChainBalance + yieldBalance;
    }
    
    /**
     * @notice Get yield protocol information
     * @return protocolAddress The yield protocol address
     * @return protocolName The protocol name
     * @return currentAPY The current APY
     * @return isHealthy Whether protocol is healthy
     * @return balanceInProtocol Balance in yield protocol
     */
    function getYieldProtocolInfo() external view returns (
        address protocolAddress,
        string memory protocolName,
        uint256 currentAPY,
        bool isHealthy,
        uint256 balanceInProtocol
    ) {
        if (address(yieldProtocol) == address(0)) {
            return (address(0), "", 0, false, 0);
        }
        
        try yieldProtocol.getProtocolName() returns (string memory name) {
            protocolName = name;
        } catch {
            protocolName = "Unknown";
        }
        
        try yieldProtocol.getAPY() returns (uint256 apy) {
            currentAPY = apy;
        } catch {
            currentAPY = 0;
        }
        
        try yieldProtocol.isHealthy() returns (bool healthy) {
            isHealthy = healthy;
        } catch {
            isHealthy = false;
        }
        
        try yieldProtocol.getBalance() returns (uint256 bal) {
            balanceInProtocol = bal;
        } catch {
            balanceInProtocol = 0;
        }
        
        return (address(yieldProtocol), protocolName, currentAPY, isHealthy, balanceInProtocol);
    }
    
    /**
     * @notice Get projected final balance including estimated yield
     * @param planId The plan ID
     * @return projectedBalance Projected balance at maturity
     */
    function getProjectedBalance(uint256 planId) external view validPlanId(planId) returns (uint256 projectedBalance) {
        Plan memory plan = plans[planId];
        uint256 currentBalance = plan.accumulatedBalance;
        
        // Estimate remaining deductions
        uint256 daysRemaining = (plan.endDate - block.timestamp) / 1 days;
        if (daysRemaining > 0 && block.timestamp < plan.endDate) {
            currentBalance += (plan.dailyAmount * daysRemaining);
        }
        
        // Estimate yield if protocol is set
        if (address(yieldProtocol) != address(0)) {
            try yieldProtocol.getAPY() returns (uint256 apy) {
                uint256 daysInPlan = (plan.endDate - plan.startDate) / 1 days;
                uint256 estimatedYield = (currentBalance * apy * daysInPlan) / (365 * PRECISION);
                estimatedYield = (estimatedYield * userYieldShareBps) / 10000;
                projectedBalance = currentBalance + estimatedYield;
            } catch {
                projectedBalance = currentBalance;
            }
        } else {
            projectedBalance = currentBalance;
        }
        
        return projectedBalance;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Set or update yield protocol
     * @param _yieldProtocol Address of the yield protocol contract
     */
    function setYieldProtocol(address _yieldProtocol) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_yieldProtocol != address(0)) {
            // Validate it's a contract
            if (_yieldProtocol.code.length == 0) {
                revert InvalidYieldProtocol();
            }
            
            // Check if protocol is healthy
            try IYieldProtocol(_yieldProtocol).isHealthy() returns (bool healthy) {
                if (!healthy) revert YieldProtocolUnhealthy();
            } catch {
                revert InvalidYieldProtocol();
            }
        }
        
        address oldProtocol = address(yieldProtocol);
        yieldProtocol = IYieldProtocol(_yieldProtocol);
        
        emit YieldProtocolUpdated(oldProtocol, _yieldProtocol, block.timestamp);
    }
    
    /**
     * @notice Update early withdrawal penalty
     * @param _penalty New penalty in basis points
     */
    function setEarlyWithdrawalPenalty(uint256 _penalty) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_penalty > MAX_EARLY_WITHDRAWAL_PENALTY) revert InvalidParameter();
        uint256 oldValue = earlyWithdrawalPenalty;
        earlyWithdrawalPenalty = _penalty;
        emit ParametersUpdated("earlyWithdrawalPenalty", oldValue, _penalty, block.timestamp);
    }
    
    /**
     * @notice Update daily deduction limits
     * @param _min New minimum daily deduction
     * @param _max New maximum daily deduction
     */
    function setDailyDeductionLimits(
        uint256 _min,
        uint256 _max
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_min == 0 || _min >= _max) revert InvalidParameter();
        uint256 oldMin = minDailyDeduction;
        uint256 oldMax = maxDailyDeduction;
        minDailyDeduction = _min;
        maxDailyDeduction = _max;
        emit ParametersUpdated("minDailyDeduction", oldMin, _min, block.timestamp);
        emit ParametersUpdated("maxDailyDeduction", oldMax, _max, block.timestamp);
    }
    
    /**
     * @notice Update yield distribution parameters
     * @param _userYieldShareBps User yield share in basis points
     * @param _protocolFeeBps Protocol fee in basis points
     */
    function setYieldDistribution(
        uint256 _userYieldShareBps,
        uint256 _protocolFeeBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_userYieldShareBps > 10000) revert InvalidParameter();
        uint256 oldUserShare = userYieldShareBps;
        uint256 oldFee = protocolFeeBps;
        userYieldShareBps = _userYieldShareBps;
        protocolFeeBps = _protocolFeeBps;
        emit ParametersUpdated("userYieldShareBps", oldUserShare, _userYieldShareBps, block.timestamp);
        emit ParametersUpdated("protocolFeeBps", oldFee, _protocolFeeBps, block.timestamp);
    }
    
    /**
     * @notice Set minimum yield deposit threshold
     * @param _threshold New threshold amount
     */
    function setMinYieldDepositThreshold(uint256 _threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldValue = minYieldDepositThreshold;
        minYieldDepositThreshold = _threshold;
        emit ParametersUpdated("minYieldDepositThreshold", oldValue, _threshold, block.timestamp);
    }
    
    /**
     * @notice Harvest yield from yield protocol
     * @dev Can be called by keeper or admin
     */
    function harvestYield() external onlyRole(KEEPER_ROLE) nonReentrant {
        if (address(yieldProtocol) == address(0)) return;
        if (!yieldProtocol.isHealthy()) revert YieldProtocolUnhealthy();
        if (block.timestamp < lastYieldHarvest + yieldHarvestInterval) return;
        
        uint256 yieldBalance = yieldProtocol.getBalance();
        
        if (yieldBalance <= totalPrincipal) {
            // No yield earned yet
            return;
        }
        
        uint256 totalYield = yieldBalance - totalPrincipal;
        uint256 userYield = (totalYield * userYieldShareBps) / 10000;
        uint256 protocolYield = totalYield - userYield;
        
        // Withdraw yield portion
        if (totalYield > 0) {
            _withdrawFromYield(totalYield);
        }
        
        totalUserYield += userYield;
        totalProtocolYield += protocolYield;
        lastYieldHarvest = block.timestamp;
        
        emit YieldHarvested(totalYield, userYield, protocolYield, block.timestamp);
    }
    
    /**
     * @notice Emergency withdraw all funds from yield protocol
     * @param reasonHash Hash of the reason for emergency exit
     */
    function emergencyExitYield(bytes32 reasonHash) external onlyRole(EMERGENCY_ROLE) nonReentrant {
        if (address(yieldProtocol) == address(0)) return;
        
        uint256 amount = yieldProtocol.emergencyWithdraw();
        totalYieldShares = 0;
        
        emit EmergencyYieldExit(amount, address(yieldProtocol), reasonHash, block.timestamp);
    }
    
    /**
     * @notice Schedule an emergency withdrawal for a user
     * @param user User address
     * @param planId Plan ID
     * @param amount Amount to withdraw (0 = full balance)
     * @param reasonHash Hash of reason for emergency withdrawal
     * @return withdrawalId The withdrawal request ID
     */
    function scheduleEmergencyWithdrawal(
        address user,
        uint256 planId,
        uint256 amount,
        bytes32 reasonHash
    ) external onlyRole(EMERGENCY_ROLE) whenPaused returns (bytes32 withdrawalId) {
        if (planId == 0 || planId > totalPlans) revert InvalidPlanId();
        Plan memory plan = plans[planId];
        if (plan.owner != user) revert InvalidParameter();
        
        withdrawalId = keccak256(abi.encodePacked(msg.sender, user, planId, amount, block.timestamp, reasonHash));
        
        emergencyWithdrawals[withdrawalId] = EmergencyWithdrawal({
            admin: msg.sender,
            user: user,
            planId: planId,
            amount: amount,
            scheduledTime: block.timestamp,
            executionTime: block.timestamp + emergencyWithdrawalDelay,
            reasonHash: reasonHash,
            executed: false,
            cancelled: false
        });
        
        emit EmergencyWithdrawalScheduled(
            withdrawalId,
            msg.sender,
            user,
            planId,
            amount,
            block.timestamp + emergencyWithdrawalDelay,
            reasonHash
        );
        
        return withdrawalId;
    }
    
    /**
     * @notice Execute a scheduled emergency withdrawal
     * @param withdrawalId The withdrawal request ID
     */
    function executeEmergencyWithdrawal(
        bytes32 withdrawalId
    ) external onlyRole(EMERGENCY_ROLE) whenPaused nonReentrant {
        EmergencyWithdrawal storage withdrawal = emergencyWithdrawals[withdrawalId];
        
        if (withdrawal.admin == address(0)) revert InvalidEmergencyWithdrawal();
        if (withdrawal.executed) revert EmergencyWithdrawalAlreadyExecuted();
        if (withdrawal.cancelled) revert EmergencyWithdrawalIsCancelled();
        if (block.timestamp < withdrawal.executionTime) revert EmergencyWithdrawalNotReady();
        
        Plan storage plan = plans[withdrawal.planId];
        uint256 withdrawAmount = withdrawal.amount;
        
        if (withdrawAmount == 0) {
            withdrawAmount = plan.accumulatedBalance + plan.yieldEarned;
        }
        
        if (withdrawAmount > plan.accumulatedBalance + plan.yieldEarned) {
            withdrawAmount = plan.accumulatedBalance + plan.yieldEarned;
        }
        
        // Withdraw from yield if needed
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        if (withdrawAmount > contractBalance && address(yieldProtocol) != address(0)) {
            uint256 needed = withdrawAmount - contractBalance;
            _withdrawFromYield(needed);
        }
        
        // Update plan state
        if (withdrawAmount >= plan.accumulatedBalance) {
            plan.yieldEarned -= (withdrawAmount - plan.accumulatedBalance);
            plan.accumulatedBalance = 0;
        } else {
            plan.accumulatedBalance -= withdrawAmount;
        }
        
        plan.isActive = false;
        plan.isCompleted = true;
        withdrawal.executed = true;
        
        // Transfer to user (never to admin)
        usdcToken.safeTransfer(withdrawal.user, withdrawAmount);
        
        emit EmergencyWithdrawalExecuted(
            withdrawalId,
            withdrawal.admin,
            withdrawal.user,
            withdrawal.planId,
            withdrawAmount,
            withdrawal.reasonHash,
            block.timestamp
        );
    }
    
    /**
     * @notice Cancel a scheduled emergency withdrawal
     * @param withdrawalId The withdrawal request ID
     */
    function cancelEmergencyWithdrawal(
        bytes32 withdrawalId
    ) external onlyRole(EMERGENCY_ROLE) {
        EmergencyWithdrawal storage withdrawal = emergencyWithdrawals[withdrawalId];
        
        if (withdrawal.admin == address(0)) revert InvalidEmergencyWithdrawal();
        if (withdrawal.executed) revert EmergencyWithdrawalAlreadyExecuted();
        if (withdrawal.cancelled) revert EmergencyWithdrawalIsCancelled();
        
        withdrawal.cancelled = true;
        
        emit EmergencyWithdrawalCancelled(
            withdrawalId,
            withdrawal.admin,
            withdrawal.user,
            withdrawal.planId,
            block.timestamp
        );
    }
    
    /**
     * @notice Withdraw protocol fees
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdrawProtocolFees(
        uint256 amount,
        address to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert InvalidParameter();
        if (amount > totalProtocolYield) revert InvalidWithdrawalAmount();
        
        totalProtocolYield -= amount;
        usdcToken.safeTransfer(to, amount);
        
        emit ProtocolFeeWithdrawn(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Set emergency withdrawal delay
     * @param _delay New delay in seconds
     */
    function setEmergencyWithdrawalDelay(uint256 _delay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldValue = emergencyWithdrawalDelay;
        emergencyWithdrawalDelay = _delay;
        emit ParametersUpdated("emergencyWithdrawalDelay", oldValue, _delay, block.timestamp);
    }

    // ============ Internal Functions ============
    
    /**
     * @notice Deposit USDC to yield protocol
     * @param amount Amount to deposit
     */
    function _depositToYield(uint256 amount) internal {
        if (address(yieldProtocol) == address(0)) return;
        if (amount == 0) return;
        
        // Use forceApprove (OpenZeppelin v5 replacement for safeApprove)
        usdcToken.forceApprove(address(yieldProtocol), amount);
        
        try yieldProtocol.deposit(amount) returns (uint256 shares) {
            totalYieldShares += shares;
            emit YieldDeposited(amount, address(yieldProtocol), shares, block.timestamp);
        } catch {
            // If deposit fails, continue without yield
            usdcToken.forceApprove(address(yieldProtocol), 0);
        }
    }
    
    /**
     * @notice Withdraw USDC from yield protocol
     * @param amount Amount to withdraw
     */
    function _withdrawFromYield(uint256 amount) internal {
        if (address(yieldProtocol) == address(0)) return;
        if (totalYieldShares == 0) return;
        
        // Calculate shares needed (approximate, actual may vary)
        uint256 yieldBalance = yieldProtocol.getBalance();
        if (yieldBalance == 0) return;
        
        uint256 sharesToWithdraw = (amount * totalYieldShares) / yieldBalance;
        if (sharesToWithdraw > totalYieldShares) {
            sharesToWithdraw = totalYieldShares;
        }
        
        try yieldProtocol.withdraw(sharesToWithdraw) returns (uint256 withdrawn) {
            totalYieldShares -= sharesToWithdraw;
            emit YieldWithdrawn(withdrawn, address(yieldProtocol), sharesToWithdraw, block.timestamp);
        } catch {
            // If withdrawal fails, try emergency withdraw
            try yieldProtocol.emergencyWithdraw() returns (uint256 emergencyAmount) {
                totalYieldShares = 0;
                emit EmergencyYieldExit(emergencyAmount, address(yieldProtocol), keccak256("WITHDRAWAL_FAILED"), block.timestamp);
            } catch {
                // Last resort: protocol is broken, funds may be stuck
            }
        }
    }
    
    /**
     * @notice Calculate and distribute yield for a plan
     * @param planId The plan ID
     * @return yieldAmount The yield amount to distribute
     */
    function _calculateAndDistributeYield(uint256 planId) internal returns (uint256 yieldAmount) {
        Plan storage plan = plans[planId];
        
        if (plan.principalDeposited == 0) return 0;
        if (totalPrincipal == 0 || totalYieldShares == 0) return 0;
        
        // Calculate user's share based on principal
        uint256 userShare = (plan.principalDeposited * totalYieldShares) / totalPrincipal;
        uint256 timeFactor = _calculateTimeFactor(plan);
        
        // Calculate yield
        uint256 yieldBalance = yieldProtocol.getBalance();
        if (yieldBalance <= totalPrincipal) return 0;
        uint256 totalYield = yieldBalance - totalPrincipal;
        
        yieldAmount = (userShare * totalYield * timeFactor) / (totalYieldShares * PRECISION);
        yieldAmount = (yieldAmount * userYieldShareBps) / 10000;
        
        // Update plan state
        plan.yieldEarned += yieldAmount;
        totalUserYield += yieldAmount;
        
        return yieldAmount;
    }
    
    /**
     * @notice Calculate time factor for yield distribution
     * @param plan The plan struct
     * @return timeFactor Time factor scaled by PRECISION
     */
    function _calculateTimeFactor(Plan memory plan) internal view returns (uint256 timeFactor) {
        uint256 planDuration = plan.endDate - plan.startDate;
        uint256 timeElapsed = block.timestamp > plan.endDate ? planDuration : (block.timestamp - plan.startDate);
        
        if (planDuration == 0) return PRECISION;
        return (timeElapsed * PRECISION) / planDuration;
    }
    
    /**
     * @notice Verify accounting invariants
     * @dev Internal function for testing and monitoring
     */
    function _verifyAccounting() internal view {
        uint256 onChainBalance = usdcToken.balanceOf(address(this));
        uint256 yieldBalance = 0;
        if (address(yieldProtocol) != address(0)) {
            try yieldProtocol.getBalance() returns (uint256 bal) {
                yieldBalance = bal;
            } catch {
                yieldBalance = 0;
            }
        }
        
        uint256 totalFunds = onChainBalance + yieldBalance;
        uint256 expectedTotal = totalPrincipal + totalUserYield + totalProtocolYield;
        
        // Allow small rounding differences (1 USDC)
        if (totalFunds < expectedTotal - 1e6 || totalFunds > expectedTotal + 1e6) {
            revert AccountingMismatch();
        }
    }
}

