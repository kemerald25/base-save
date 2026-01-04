// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IYieldProtocol
 * @notice Interface for yield-generating protocol integrations
 * @dev This interface allows the savings contract to work with different yield protocols
 */
interface IYieldProtocol {
    /**
     * @notice Deposit USDC into the yield protocol
     * @param amount Amount of USDC to deposit
     * @return shares Amount of shares/receipt tokens received
     */
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Withdraw USDC from the yield protocol
     * @param shares Amount of shares to redeem
     * @return amount Amount of USDC received
     */
    function withdraw(uint256 shares) external returns (uint256 amount);

    /**
     * @notice Get the current balance of USDC in the yield protocol
     * @return balance Total USDC balance (principal + yield)
     */
    function getBalance() external view returns (uint256 balance);

    /**
     * @notice Get the current APY/APR of the yield protocol
     * @return apy Annual percentage yield (scaled by 1e18, e.g., 5% = 5e16)
     */
    function getAPY() external view returns (uint256 apy);

    /**
     * @notice Get the protocol name
     * @return name Human-readable protocol name
     */
    function getProtocolName() external view returns (string memory name);

    /**
     * @notice Check if the protocol is healthy and operational
     * @return isHealthy True if protocol is functioning normally
     */
    function isHealthy() external view returns (bool isHealthy);

    /**
     * @notice Emergency withdraw all funds from the protocol
     * @return amount Amount of USDC withdrawn
     */
    function emergencyWithdraw() external returns (uint256 amount);
}

