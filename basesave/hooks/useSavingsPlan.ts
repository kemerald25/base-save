'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SAVINGS_PLAN_CONTRACT_ADDRESS, SAVINGS_PLAN_ABI, USDC_ADDRESS } from '@/lib/contracts/config';
import { ERC20_ABI } from '@/lib/contracts/erc20';
import { parseUSDC, formatUSDC } from '@/lib/utils/format';
import { supabase } from '@/lib/supabase/client';
import type { SavingsPlan } from '@/lib/supabase/types';

interface PlanData {
  owner: string;
  dailyAmount: bigint;
  startDate: bigint;
  endDate: bigint;
  totalTarget: bigint;
  accumulatedBalance: bigint;
  principalDeposited: bigint;
  yieldEarned: bigint;
  lastDeductionDate: bigint;
  successfulDeductions: bigint;
  missedDeductions: bigint;
  isActive: boolean;
  isCompleted: boolean;
  duration: number;
}

/**
 * Hook to get user's USDC balance
 */
export function useUSDCBalance() {
  const { address } = useAccount();

  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to check USDC allowance for the savings plan contract
 */
export function useUSDCAllowance() {
  const { address } = useAccount();

  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' 
      ? [address, SAVINGS_PLAN_CONTRACT_ADDRESS] 
      : undefined,
    query: {
      enabled: !!address && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/**
 * Hook to approve USDC spending
 */
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount: bigint) => {
    try {
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SAVINGS_PLAN_CONTRACT_ADDRESS as `0x${string}`, amount],
      });
    } catch (error: any) {
      // Handle user rejection gracefully
      if (error?.name === 'UserRejectedRequestError' || 
          error?.code === 4001 || 
          error?.message?.includes('rejected')) {
        throw new Error('Transaction cancelled. Please approve when ready.');
      }
      throw error;
    }
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to get a specific plan from the contract
 */
export function usePlan(planId: bigint | number | null) {
  return useReadContract({
    address: SAVINGS_PLAN_CONTRACT_ADDRESS,
    abi: SAVINGS_PLAN_ABI,
    functionName: 'getPlan',
    args: planId !== null ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== null && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/**
 * Hook to get user's plan IDs
 */
export function useUserPlanIds() {
  const { address } = useAccount();

  return useReadContract({
    address: SAVINGS_PLAN_CONTRACT_ADDRESS,
    abi: SAVINGS_PLAN_ABI,
    functionName: 'getUserPlans',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/**
 * Hook to get accumulated yield for a plan
 */
export function useAccumulatedYield(planId: bigint | number | null) {
  return useReadContract({
    address: SAVINGS_PLAN_CONTRACT_ADDRESS,
    abi: SAVINGS_PLAN_ABI,
    functionName: 'getAccumulatedYield',
    args: planId !== null ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== null && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/**
 * Hook to check if plan is mature
 */
export function useIsPlanMature(planId: bigint | number | null) {
  return useReadContract({
    address: SAVINGS_PLAN_CONTRACT_ADDRESS,
    abi: SAVINGS_PLAN_ABI,
    functionName: 'isPlanMature',
    args: planId !== null ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== null && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/**
 * Hook to calculate early withdrawal penalty
 */
export function useEarlyWithdrawalPenalty(planId: bigint | number | null) {
  return useReadContract({
    address: SAVINGS_PLAN_CONTRACT_ADDRESS,
    abi: SAVINGS_PLAN_ABI,
    functionName: 'calculateEarlyWithdrawalPenalty',
    args: planId !== null ? [BigInt(planId)] : undefined,
    query: {
      enabled: planId !== null && SAVINGS_PLAN_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });
}

/**
 * Hook to create a new savings plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPlan = async (dailyAmount: string, duration: number) => {
    const amount = parseUSDC(dailyAmount);
    writeContract({
      address: SAVINGS_PLAN_CONTRACT_ADDRESS,
      abi: SAVINGS_PLAN_ABI,
      functionName: 'createPlan',
      args: [amount, duration],
    });
  };

  // Invalidate queries when transaction succeeds
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['userPlanIds', address] });
    queryClient.invalidateQueries({ queryKey: ['plans'] });
  }

  return {
    createPlan,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to execute a deduction
 */
export function useExecuteDeduction() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeDeduction = async (planId: bigint | number) => {
    writeContract({
      address: SAVINGS_PLAN_CONTRACT_ADDRESS,
      abi: SAVINGS_PLAN_ABI,
      functionName: 'executeDeduction',
      args: [BigInt(planId)],
    });
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['plans'] });
  }

  return {
    executeDeduction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw from a plan
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (planId: bigint | number, amount?: string) => {
    if (amount) {
      const amountBigInt = parseUSDC(amount);
      writeContract({
        address: SAVINGS_PLAN_CONTRACT_ADDRESS,
        abi: SAVINGS_PLAN_ABI,
        functionName: 'withdraw',
        args: [BigInt(planId), amountBigInt],
      });
    } else {
      writeContract({
        address: SAVINGS_PLAN_CONTRACT_ADDRESS,
        abi: SAVINGS_PLAN_ABI,
        functionName: 'withdraw',
        args: [BigInt(planId)],
      });
    }
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    queryClient.invalidateQueries({ queryKey: ['userPlanIds'] });
  }

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to claim yield
 */
export function useClaimYield() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimYield = async (planId: bigint | number) => {
    writeContract({
      address: SAVINGS_PLAN_CONTRACT_ADDRESS,
      abi: SAVINGS_PLAN_ABI,
      functionName: 'claimYield',
      args: [BigInt(planId)],
    });
  };

  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    queryClient.invalidateQueries({ queryKey: ['accumulatedYield'] });
  }

  return {
    claimYield,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

