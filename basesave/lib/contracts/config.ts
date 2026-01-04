import { base } from 'viem/chains';

// Base Mainnet USDC address
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Contract addresses - Update these after deployment
export const SAVINGS_PLAN_CONTRACT_ADDRESS = 
  (process.env.NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS || 
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Plan duration enum values
export enum PlanDuration {
  ONE_MONTH = 0,
  THREE_MONTHS = 1,
  SIX_MONTHS = 2,
  ONE_YEAR = 3,
}

export const PLAN_DURATION_DAYS = {
  [PlanDuration.ONE_MONTH]: 30,
  [PlanDuration.THREE_MONTHS]: 90,
  [PlanDuration.SIX_MONTHS]: 180,
  [PlanDuration.ONE_YEAR]: 365,
} as const;

export const PLAN_DURATION_LABELS = {
  [PlanDuration.ONE_MONTH]: '1 Month',
  [PlanDuration.THREE_MONTHS]: '3 Months',
  [PlanDuration.SIX_MONTHS]: '6 Months',
  [PlanDuration.ONE_YEAR]: '1 Year',
} as const;

// USDC has 6 decimals
export const USDC_DECIMALS = 6;

// Contract ABI - Import from artifacts or typechain
// For now, we'll use a simplified version
export const SAVINGS_PLAN_ABI = [
  {
    inputs: [
      { name: '_dailyAmount', type: 'uint256' },
      { name: '_duration', type: 'uint8' },
    ],
    name: 'createPlan',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'executeDeduction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'planId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'claimYield',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'getPlan',
    outputs: [
      {
        components: [
          { name: 'owner', type: 'address' },
          { name: 'dailyAmount', type: 'uint256' },
          { name: 'startDate', type: 'uint256' },
          { name: 'endDate', type: 'uint256' },
          { name: 'totalTarget', type: 'uint256' },
          { name: 'accumulatedBalance', type: 'uint256' },
          { name: 'principalDeposited', type: 'uint256' },
          { name: 'yieldEarned', type: 'uint256' },
          { name: 'lastDeductionDate', type: 'uint256' },
          { name: 'successfulDeductions', type: 'uint256' },
          { name: 'missedDeductions', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'isCompleted', type: 'bool' },
          { name: 'duration', type: 'uint8' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'getAccumulatedYield',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'calculateEarlyWithdrawalPenalty',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'planId', type: 'uint256' }],
    name: 'isPlanMature',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserPlans',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPlans',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'planId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'dailyAmount', type: 'uint256' },
      { indexed: false, name: 'duration', type: 'uint8' },
      { indexed: false, name: 'startDate', type: 'uint256' },
      { indexed: false, name: 'endDate', type: 'uint256' },
    ],
    name: 'PlanCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'planId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'balance', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'DeductionExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'planId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'penalty', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'WithdrawalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'planId', type: 'uint256' },
      { indexed: false, name: 'yieldAmount', type: 'uint256' },
      { indexed: false, name: 'protocolFee', type: 'uint256' },
    ],
    name: 'YieldDistributed',
    type: 'event',
  },
] as const;

