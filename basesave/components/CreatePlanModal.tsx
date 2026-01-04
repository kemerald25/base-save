'use client';

import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { PLAN_DURATION_LABELS, PlanDuration, PLAN_DURATION_DAYS } from '@/lib/contracts/config';
import { useCreatePlan, useApproveUSDC, useUSDCAllowance, useUSDCBalance } from '@/hooks/useSavingsPlan';
import { useSavePlan } from '@/hooks/useSupabasePlans';
import { parseUSDC, formatUSDC } from '@/lib/utils/format';
import { useAccount } from 'wagmi';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePlanModal({ isOpen, onClose }: CreatePlanModalProps) {
  const { address } = useAccount();
  const [dailyAmount, setDailyAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>(PlanDuration.ONE_MONTH);
  const [step, setStep] = useState<'input' | 'approve' | 'creating'>('input');

  const { data: balance } = useUSDCBalance();
  const { data: allowance } = useUSDCAllowance();
  const { approve, isPending: isApproving, isSuccess: isApproved } = useApproveUSDC();
  const { createPlan, isPending: isCreating, isSuccess: isCreated, hash } = useCreatePlan();
  const { mutate: savePlan } = useSavePlan();

  if (!isOpen) return null;

  const dailyAmountBigInt = dailyAmount ? parseUSDC(dailyAmount) : 0n;
  const days = PLAN_DURATION_DAYS[selectedDuration];
  const totalTarget = dailyAmountBigInt * BigInt(days);
  const needsApproval = !allowance || allowance < totalTarget;
  const hasEnoughBalance = balance && balance >= totalTarget;

  const handleCreate = async () => {
    if (!dailyAmount || !hasEnoughBalance) return;

    // Step 1: Approve if needed
    if (needsApproval) {
      setStep('approve');
      await approve(totalTarget);
      return;
    }

    // Step 2: Create plan
    setStep('creating');
    createPlan(dailyAmount, selectedDuration);
  };

  // Save to Supabase when plan is created
  if (isCreated && hash) {
    // Extract plan ID from transaction receipt or wait for event
    // For now, we'll save with a placeholder and update later
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + (days * 24 * 60 * 60);
    
    savePlan({
      planId: 0, // Will be updated when we get the actual plan ID
      dailyAmount,
      duration: selectedDuration,
      startDate: startDate.toString(),
      endDate: endDate.toString(),
      totalTarget: totalTarget.toString(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141519] border border-[#1E1F25] rounded-2xl p-6 w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create Savings Plan</h2>
          <button
            onClick={onClose}
            className="text-[#A0A0A0] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'input' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Daily Amount (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0A0A0]" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={dailyAmount}
                    onChange={(e) => setDailyAmount(e.target.value)}
                    placeholder="10.00"
                    className="w-full bg-[#0F1116] border border-[#1E1F25] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#A0A0A0] focus:outline-none focus:border-[#0052FF]"
                  />
                </div>
                {balance && (
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Balance: ${formatUSDC(balance)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Duration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PLAN_DURATION_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDuration(Number(key) as PlanDuration)}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedDuration === Number(key)
                          ? 'border-[#0052FF] bg-[#0052FF]/10 text-white'
                          : 'border-[#1E1F25] bg-[#0F1116] text-[#A0A0A0] hover:border-[#0052FF]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">{label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {dailyAmount && (
                <div className="bg-[#0F1116] border border-[#1E1F25] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#A0A0A0]">Daily Amount</span>
                    <span className="text-white font-semibold">${dailyAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#A0A0A0]">Duration</span>
                    <span className="text-white font-semibold">{days} days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-[#1E1F25]">
                    <span className="text-[#A0A0A0]">Total Target</span>
                    <span className="text-white font-semibold text-lg">
                      ${formatUSDC(totalTarget.toString())}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-[#1E1F25] text-[#A0A0A0] hover:border-[#0052FF]/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!dailyAmount || !hasEnoughBalance || isCreating}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0px_20px_45px_rgba(0,82,255,0.35)] transition-all"
              >
                {needsApproval ? 'Approve & Create' : 'Create Plan'}
              </button>
            </div>
          </>
        )}

        {step === 'approve' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#0052FF]/20 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-[#00D4FF] animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Approve USDC</h3>
              <p className="text-sm text-[#A0A0A0]">
                Please approve the transaction in your wallet to allow the contract to deduct USDC.
              </p>
            </div>
            {isApproved && (
              <button
                onClick={() => {
                  setStep('creating');
                  createPlan(dailyAmount, selectedDuration);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold"
              >
                Create Plan
              </button>
            )}
            {isApproving && (
              <p className="text-sm text-[#A0A0A0]">Waiting for approval...</p>
            )}
          </div>
        )}

        {step === 'creating' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#0052FF]/20 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-[#00D4FF] animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Creating Plan</h3>
              <p className="text-sm text-[#A0A0A0]">
                {isCreating ? 'Please confirm the transaction in your wallet...' : 'Plan created successfully!'}
              </p>
            </div>
            {isCreated && (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

