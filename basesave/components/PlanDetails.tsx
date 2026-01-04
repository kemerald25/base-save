'use client';

import { formatUSDC, formatDate, formatDateTime, daysUntil } from '@/lib/utils/format';
import { PLAN_DURATION_LABELS } from '@/lib/contracts/config';
import { usePlan, useAccumulatedYield, useIsPlanMature, useEarlyWithdrawalPenalty, useWithdraw, useClaimYield } from '@/hooks/useSavingsPlan';
import { Calendar, TrendingUp, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import type { SavingsPlan } from '@/lib/supabase/types';

interface PlanDetailsProps {
  planId: number;
  plan: SavingsPlan;
}

export function PlanDetails({ planId, plan }: PlanDetailsProps) {
  const { data: onChainPlan } = usePlan(planId);
  const { data: accumulatedYield } = useAccumulatedYield(planId);
  const { data: isMature } = useIsPlanMature(planId);
  const { data: penalty } = useEarlyWithdrawalPenalty(planId);
  const { withdraw, isPending: isWithdrawing } = useWithdraw();
  const { claimYield, isPending: isClaiming } = useClaimYield();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const planData = onChainPlan || {
    accumulatedBalance: BigInt(plan.accumulated_balance),
    principalDeposited: BigInt(plan.principal_deposited),
    yieldEarned: BigInt(plan.yield_earned || '0'),
    isCompleted: plan.is_completed,
    isActive: plan.is_active,
    endDate: BigInt(plan.end_date),
    successfulDeductions: BigInt(plan.successful_deductions),
    missedDeductions: BigInt(plan.missed_deductions),
  };

  const daysRemaining = daysUntil(plan.end_date);
  const canWithdraw = planData.accumulatedBalance > 0n;
  const canClaimYield = accumulatedYield && accumulatedYield > 0n;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#141519] border border-[#1E1F25] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {PLAN_DURATION_LABELS[plan.duration as keyof typeof PLAN_DURATION_LABELS]} Plan
            </h2>
            <p className="text-sm text-[#A0A0A0]">
              Created {formatDate(plan.created_at)}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            planData.isCompleted 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : planData.isActive
              ? 'bg-[#0052FF]/20 text-[#00D4FF] border border-[#0052FF]/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {planData.isCompleted ? 'Completed' : planData.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0F1116] border border-[#1E1F25] rounded-xl p-4">
            <p className="text-xs text-[#A0A0A0] mb-1">Accumulated</p>
            <p className="text-2xl font-bold text-white">
              ${formatUSDC(planData.accumulatedBalance.toString())}
            </p>
          </div>
          <div className="bg-[#0F1116] border border-[#1E1F25] rounded-xl p-4">
            <p className="text-xs text-[#A0A0A0] mb-1">Target</p>
            <p className="text-2xl font-bold text-white">
              ${formatUSDC(plan.total_target)}
            </p>
          </div>
          <div className="bg-[#0F1116] border border-[#1E1F25] rounded-xl p-4">
            <p className="text-xs text-[#A0A0A0] mb-1">Daily Amount</p>
            <p className="text-2xl font-bold text-white">
              ${formatUSDC(plan.daily_amount)}
            </p>
          </div>
          <div className="bg-[#0F1116] border border-[#1E1F25] rounded-xl p-4">
            <p className="text-xs text-[#A0A0A0] mb-1">Yield Earned</p>
            <p className="text-2xl font-bold text-[#00D4FF]">
              ${formatUSDC(planData.yieldEarned.toString())}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[#141519] border border-[#1E1F25] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#A0A0A0]">Deductions</span>
              <span className="text-white font-semibold">
                {planData.successfulDeductions.toString()} / {Math.ceil(Number(plan.total_target) / Number(plan.daily_amount))}
              </span>
            </div>
            <div className="w-full bg-[#0F1116] rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#0052FF] to-[#0066FF] h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(
                    (Number(planData.successfulDeductions) / Math.ceil(Number(plan.total_target) / Number(plan.daily_amount))) * 100,
                    100
                  )}%` 
                }}
              />
            </div>
          </div>
          {planData.missedDeductions > 0n && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Clock className="h-4 w-4" />
              <span>{planData.missedDeductions.toString()} missed deductions</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[#141519] border border-[#1E1F25] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-[#A0A0A0]" />
            <div>
              <p className="text-sm text-[#A0A0A0]">Start Date</p>
              <p className="text-white font-semibold">{formatDate(plan.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#A0A0A0]" />
            <div>
              <p className="text-sm text-[#A0A0A0]">End Date</p>
              <p className="text-white font-semibold">{formatDate(plan.end_date)}</p>
            </div>
          </div>
          {!planData.isCompleted && daysRemaining > 0 && (
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-[#00D4FF]" />
              <div>
                <p className="text-sm text-[#A0A0A0]">Days Remaining</p>
                <p className="text-white font-semibold">{daysRemaining} days</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {canClaimYield && (
          <button
            onClick={() => claimYield(planId)}
            disabled={isClaiming}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0px_20px_45px_rgba(0,82,255,0.35)] transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp className="h-5 w-5" />
            Claim Yield (${formatUSDC(accumulatedYield?.toString() || '0')})
          </button>
        )}
        {canWithdraw && (
          <button
            onClick={() => withdraw(planId)}
            disabled={isWithdrawing}
            className="w-full py-4 px-6 rounded-xl border border-[#0052FF] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0052FF]/10 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-5 w-5" />
            {isMature ? 'Withdraw' : `Early Withdraw (Penalty: ${penalty ? formatUSDC(penalty.toString()) : '0'} USDC)`}
          </button>
        )}
      </div>
    </div>
  );
}

