import { ethers } from "hardhat";

/**
 * Deployment script for SavingsPlan contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base-sepolia
 *   npx hardhat run scripts/deploy.ts --network base
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Base mainnet USDC address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  // Base Sepolia USDC address: Check Base Sepolia docs for testnet USDC
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  
  // Configuration parameters
  const EARLY_WITHDRAWAL_PENALTY = 1000; // 10% in basis points
  const MIN_DAILY_DEDUCTION = ethers.parseUnits("1", 6); // 1 USDC
  const MAX_DAILY_DEDUCTION = ethers.parseUnits("10000", 6); // 10,000 USDC
  const PROTOCOL_FEE_BPS = 500; // 5% in basis points
  const USER_YIELD_SHARE_BPS = 9000; // 90% to users, 10% to protocol

  console.log("\nDeployment Parameters:");
  console.log("  USDC Address:", USDC_ADDRESS);
  console.log("  Early Withdrawal Penalty:", EARLY_WITHDRAWAL_PENALTY, "bps (10%)");
  console.log("  Min Daily Deduction:", MIN_DAILY_DEDUCTION.toString());
  console.log("  Max Daily Deduction:", MAX_DAILY_DEDUCTION.toString());
  console.log("  Protocol Fee:", PROTOCOL_FEE_BPS, "bps (5%)");
  console.log("  User Yield Share:", USER_YIELD_SHARE_BPS, "bps (90%)");

  // Deploy SavingsPlan
  console.log("\nDeploying SavingsPlan...");
  const SavingsPlanFactory = await ethers.getContractFactory("SavingsPlan");
  const savingsPlan = await SavingsPlanFactory.deploy(
    USDC_ADDRESS,
    EARLY_WITHDRAWAL_PENALTY,
    MIN_DAILY_DEDUCTION,
    MAX_DAILY_DEDUCTION,
    PROTOCOL_FEE_BPS,
    USER_YIELD_SHARE_BPS
  );

  await savingsPlan.waitForDeployment();
  const savingsPlanAddress = await savingsPlan.getAddress();

  console.log("SavingsPlan deployed to:", savingsPlanAddress);

  // Wait for block confirmations
  console.log("\nWaiting for block confirmations...");
  await savingsPlan.deploymentTransaction()?.wait(5);

  // Verify contract on block explorer (if on testnet/mainnet)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nVerifying contract on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: savingsPlanAddress,
        constructorArguments: [
          USDC_ADDRESS,
          EARLY_WITHDRAWAL_PENALTY,
          MIN_DAILY_DEDUCTION,
          MAX_DAILY_DEDUCTION,
          PROTOCOL_FEE_BPS,
          USER_YIELD_SHARE_BPS,
        ],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("SavingsPlan Address:", savingsPlanAddress);
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("\nNext steps:");
  console.log("1. Set yield protocol: savingsPlan.setYieldProtocol(yieldProtocolAddress)");
  console.log("2. Grant KEEPER_ROLE to keeper address");
  console.log("3. Grant EMERGENCY_ROLE to emergency responder address");
  console.log("4. Update parameters as needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

