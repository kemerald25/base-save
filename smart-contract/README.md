# Base Save Smart Contract

Production-grade smart contract for an automated USDC savings platform on Base network with yield generation capabilities.

## Features

- **Automated Savings Plans**: Create recurring savings plans with daily USDC deductions
- **Multiple Plan Durations**: 1 month, 3 months, 6 months, or 1 year
- **Yield Generation**: Integrate with DeFi protocols (Aave, Compound, Moonwell) for yield on locked funds
- **Flexible Withdrawals**: Mature withdrawals without penalty, early withdrawals with configurable penalty
- **Security First**: Comprehensive security features including reentrancy protection, access control, and emergency mechanisms
- **Gas Optimized**: Efficient batch operations and optimized storage layout

## Project Structure

```
smart-contract/
├── contracts/
│   ├── SavingsPlan.sol          # Main savings contract
│   ├── interfaces/
│   │   ├── IYieldProtocol.sol   # Yield protocol interface
│   │   └── IERC20.sol           # ERC20 interface
│   └── mocks/
│       ├── MockUSDC.sol         # Mock USDC for testing
│       └── MockYieldProtocol.sol # Mock yield protocol for testing
├── test/
│   └── SavingsPlan.test.ts      # Comprehensive test suite
├── scripts/
│   └── deploy.ts                # Deployment script
├── hardhat.config.ts            # Hardhat configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Hardhat >= 2.19.0

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Update `.env` with:
   - Your private key (for deployment)
   - Base network RPC URLs
   - Basescan API key (for contract verification)
   - USDC token address

## Compilation

Compile the contracts:
```bash
npm run compile
```

## Testing

**Note**: Hardhat uses Mocha and Chai for testing by default (not Jest). The test framework is configured to work seamlessly with Hardhat's testing environment.

Run the test suite:
```bash
npm test
```

Run tests with gas reporting:
```bash
npm run test:gas
```

Generate coverage report:
```bash
npm run test:coverage
```

The test suite includes:
- **Unit Tests** (`SavingsPlan.test.ts`): Core functionality tests
- **Security Tests** (`SavingsPlan.security.test.ts`): Security-focused tests including reentrancy, access control, and edge cases

## Deployment

### Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:base-sepolia
```

### Deploy to Base Mainnet

```bash
npm run deploy:base
```

## Contract Addresses

### Base Mainnet
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Base Sepolia
- Check Base Sepolia documentation for testnet USDC address

## Usage

### Creating a Savings Plan

```solidity
// Create a 1-month plan with 10 USDC daily deductions
uint256 dailyAmount = 10 * 10**6; // 10 USDC (6 decimals)
savingsPlan.createPlan(dailyAmount, 0); // 0 = ONE_MONTH
```

### Executing Daily Deductions

```solidity
// Keeper or user can execute deduction
savingsPlan.executeDeduction(planId);

// Or batch execute multiple plans
uint256[] memory planIds = [1, 2, 3];
savingsPlan.executeDeductionsBatch(planIds);
```

### Withdrawing Funds

```solidity
// Withdraw all funds (0 = withdraw all)
savingsPlan.withdraw(planId, 0);

// Withdraw specific amount
savingsPlan.withdraw(planId, amount);
```

### Claiming Yield

```solidity
// Claim accumulated yield
savingsPlan.claimYield(planId);
```

## Admin Functions

### Setting Yield Protocol

```solidity
// Set yield protocol address
savingsPlan.setYieldProtocol(yieldProtocolAddress);
```

### Updating Parameters

```solidity
// Update early withdrawal penalty (in basis points)
savingsPlan.setEarlyWithdrawalPenalty(1500); // 15%

// Update daily deduction limits
savingsPlan.setDailyDeductionLimits(minAmount, maxAmount);

// Update yield distribution
savingsPlan.setYieldDistribution(userYieldShareBps, protocolFeeBps);
```

### Emergency Functions

```solidity
// Pause contract
savingsPlan.pause();

// Schedule emergency withdrawal
bytes32 reasonHash = keccak256("EMERGENCY_REASON");
savingsPlan.scheduleEmergencyWithdrawal(user, planId, amount, reasonHash);

// Execute emergency withdrawal (after delay)
savingsPlan.executeEmergencyWithdrawal(withdrawalId);

// Emergency exit from yield protocol
savingsPlan.emergencyExitYield(reasonHash);
```

## Security Features

### Reentrancy Protection
- All state-changing functions protected with `ReentrancyGuard`
- Checks-effects-interactions pattern enforced

### Access Control
- Role-based access control using OpenZeppelin's `AccessControl`
- Separate roles for keepers, emergency responders, and admins
- Two-step ownership transfer

### Input Validation
- All user inputs validated
- Bounds checking on amounts and durations
- Sanity checks on all operations

### Emergency Controls
- Pausable functionality
- Emergency withdrawal mechanism with timelock
- Emergency exit from yield protocols

## Yield Protocol Integration

The contract supports integration with any yield protocol that implements the `IYieldProtocol` interface:

```solidity
interface IYieldProtocol {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function getBalance() external view returns (uint256);
    function getAPY() external view returns (uint256);
    function getProtocolName() external view returns (string memory);
    function isHealthy() external view returns (bool);
    function emergencyWithdraw() external returns (uint256);
}
```

### Supported Protocols

- **Aave V3 on Base**: Lending protocol for yield generation
- **Compound V3 on Base**: Money market protocol
- **Moonwell on Base**: DeFi lending protocol
- **Custom Protocols**: Any protocol implementing the interface

## Testing

The test suite includes:

- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end user journeys
- **Security Tests**: Reentrancy, access control, edge cases
- **Yield Tests**: Yield generation and distribution
- **Emergency Tests**: Emergency withdrawal scenarios

Test coverage target: 95%+

## Gas Optimization

- Efficient storage packing
- Batch operations for multiple plans
- Minimal external calls
- Optimized yield calculations

## Audit Considerations

Before mainnet deployment:

1. ✅ Comprehensive test coverage (95%+)
2. ✅ Security best practices implemented
3. ✅ Access control properly configured
4. ✅ Emergency procedures documented
5. ✅ Gas optimization verified
6. ⚠️ Professional security audit recommended
7. ⚠️ Formal verification considered

## License

MIT

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always audit smart contracts before deploying to mainnet with real funds.

