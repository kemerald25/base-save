// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IYieldProtocol.sol";

/**
 * @title MockYieldProtocol
 * @notice Mock implementation of yield protocol for testing
 * @dev Simulates a yield-generating protocol with configurable APY
 */
contract MockYieldProtocol is IYieldProtocol {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable usdcToken;
    uint256 public apy; // APY in basis points (e.g., 500 = 5%)
    uint256 public totalDeposited;
    uint256 public totalShares;
    bool public isHealthyFlag;
    
    mapping(address => uint256) public shares;
    
    constructor(address _usdcToken, uint256 _apy) {
        usdcToken = IERC20(_usdcToken);
        apy = _apy;
        isHealthyFlag = true;
    }
    
    function deposit(uint256 amount) external override returns (uint256) {
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 newShares = amount; // 1:1 for simplicity
        shares[msg.sender] += newShares;
        totalDeposited += amount;
        totalShares += newShares;
        
        return newShares;
    }
    
    function withdraw(uint256 sharesToWithdraw) external override returns (uint256) {
        require(shares[msg.sender] >= sharesToWithdraw, "Insufficient shares");
        
        // Calculate amount with yield
        uint256 principal = (sharesToWithdraw * totalDeposited) / totalShares;
        uint256 yieldEarned = (principal * apy * 365) / (10000 * 365); // Simplified daily yield
        uint256 totalAmount = principal + yieldEarned;
        
        shares[msg.sender] -= sharesToWithdraw;
        totalShares -= sharesToWithdraw;
        totalDeposited -= principal;
        
        usdcToken.safeTransfer(msg.sender, totalAmount);
        return totalAmount;
    }
    
    function getBalance() external view override returns (uint256) {
        // Return total balance including yield
        uint256 yieldEarned = (totalDeposited * apy * 365) / (10000 * 365);
        return totalDeposited + yieldEarned;
    }
    
    function getAPY() external view override returns (uint256) {
        return apy * 1e14; // Convert to 1e18 scale (e.g., 500 bps = 5e16)
    }
    
    function getProtocolName() external pure override returns (string memory) {
        return "MockYieldProtocol";
    }
    
    function isHealthy() external view override returns (bool) {
        return isHealthyFlag;
    }
    
    function emergencyWithdraw() external override returns (uint256) {
        uint256 balance = usdcToken.balanceOf(address(this));
        usdcToken.safeTransfer(msg.sender, balance);
        totalDeposited = 0;
        totalShares = 0;
        return balance;
    }
    
    // Test helper functions
    function setAPY(uint256 _apy) external {
        apy = _apy;
    }
    
    function setHealthy(bool _healthy) external {
        isHealthyFlag = _healthy;
    }
}

