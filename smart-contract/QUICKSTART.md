# Quick Start Guide

## Installation

1. Navigate to the smart-contract directory:
```bash
cd smart-contract
```

2. Install dependencies:
```bash
npm install
```

## Compile Contracts

```bash
npm run compile
```

## Run Tests

```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Generate coverage report
npm run test:coverage
```

## Deploy to Testnet

1. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

2. Fill in your values:
   - `PRIVATE_KEY`: Your wallet private key
   - `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC URL
   - `BASESCAN_API_KEY`: Your Basescan API key (for verification)

3. Deploy:
```bash
npm run deploy:base-sepolia
```

## Deploy to Mainnet

⚠️ **WARNING**: Only deploy to mainnet after thorough testing and security audit!

1. Update `.env` with mainnet values:
   - `BASE_MAINNET_RPC_URL`: Base mainnet RPC URL
   - `USDC_ADDRESS`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

2. Deploy:
```bash
npm run deploy:base
```

## Post-Deployment Steps

After deployment, you need to:

1. **Set Yield Protocol** (if using):
```typescript
await savingsPlan.setYieldProtocol(yieldProtocolAddress);
```

2. **Grant Keeper Role**:
```typescript
await savingsPlan.grantRole(await savingsPlan.KEEPER_ROLE(), keeperAddress);
```

3. **Grant Emergency Role**:
```typescript
await savingsPlan.grantRole(await savingsPlan.EMERGENCY_ROLE(), emergencyAddress);
```

4. **Verify Contract** (should happen automatically, but you can verify manually):
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <USDC_ADDRESS> <PENALTY> <MIN_DEDUCTION> <MAX_DEDUCTION> <PROTOCOL_FEE> <USER_YIELD_SHARE>
```

## Testing Locally

The test suite includes:
- ✅ Unit tests for all functions
- ✅ Integration tests for complete user journeys
- ✅ Security tests for reentrancy, access control, and edge cases
- ✅ Yield generation tests
- ✅ Emergency function tests

Run specific test files:
```bash
npx hardhat test test/SavingsPlan.test.ts
npx hardhat test test/SavingsPlan.security.test.ts
```

## Project Structure

```
smart-contract/
├── contracts/
│   ├── SavingsPlan.sol              # Main contract
│   ├── interfaces/                  # Interface definitions
│   └── mocks/                       # Mock contracts for testing
├── test/
│   ├── SavingsPlan.test.ts         # Main test suite
│   └── SavingsPlan.security.test.ts # Security tests
├── scripts/
│   └── deploy.ts                    # Deployment script
└── hardhat.config.ts               # Hardhat configuration
```

## Common Issues

### OpenZeppelin Import Errors
If you see import errors for OpenZeppelin contracts, run:
```bash
npm install
```

### Type Errors
If TypeScript types are missing, run:
```bash
npm run compile
```

### Network Connection Issues
Make sure your RPC URLs in `.env` are correct and accessible.

## Next Steps

1. Review the contract code in `contracts/SavingsPlan.sol`
2. Run the test suite to understand functionality
3. Deploy to testnet and test thoroughly
4. Consider a professional security audit before mainnet
5. Set up monitoring for contract events
6. Configure keeper infrastructure for automated deductions

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review test files for usage examples
- Consult Solidity and Hardhat documentation

