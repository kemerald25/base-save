'use client';

import { formatUSDC, formatDate, daysUntil, calculatePercentage } from '@/lib/utils/format';
import { PLAN_DURATION_LABELS } from '@/lib/contracts/config';
import { Calendar, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { SavingsPlan } from '@/lib/supabase/types';

interface PlanCardProps {
  plan: SavingsPlan;
  onChainData?: {
    accumulatedBalance: bigint;
    isCompleted: boolean;
    isActive: boolean;
    endDate: bigint;
  };
}

export function PlanCard({ plan, onChainData }: PlanCardProps) {
  const accumulatedBalance = onChainData?.accumulatedBalance 
    ? BigInt(onChainData.accumulatedBalance.toString())
    : BigInt(plan.accumulated_balance);
  const totalTarget = BigInt(plan.total_target);
  const progress = calculatePercentage(accumulatedBalance, totalTarget);
  const daysRemaining = daysUntil(plan.end_date);
  const isCompleted = onChainData?.isCompleted ?? plan.is_completed;
  const isActive = onChainData?.isActive ?? plan.is_active;

  return (
    <Link href={`/plans/${plan.plan_id}`}>
      <div className="bg-[#141519] border border-[#1E1F25] rounded-2xl p-6 hover:border-[#0052FF]/40 transition-all duration-300 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {PLAN_DURATION_LABELS[plan.duration as keyof typeof PLAN_DURATION_LABELS]}
            </h3>
            <p className="text-sm text-[#A0A0A0]">
              ${formatUSDC(plan.daily_amount)} / day
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isCompleted 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : isActive
              ? 'bg-[#0052FF]/20 text-[#00D4FF] border border-[#0052FF]/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {isCompleted ? 'Completed' : isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#A0A0A0]">Progress</span>
              <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#0F1116] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#0052FF] to-[#0066FF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-[#A0A0A0] mb-1">Saved</p>
              <p className="text-lg font-semibold text-white">
                ${formatUSDC(accumulatedBalance.toString())}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A0A0A0] mb-1">Target</p>
              <p className="text-lg font-semibold text-white">
                ${formatUSDC(plan.total_target)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-[#1E1F25]">
            <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
              <Calendar className="h-4 w-4" />
              <span>Ends {formatDate(plan.end_date)}</span>
            </div>
            {!isCompleted && daysRemaining > 0 && (
              <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                <Clock className="h-4 w-4" />
                <span>{daysRemaining} days left</span>
              </div>
            )}
            {plan.yield_earned && BigInt(plan.yield_earned) > 0n && (
              <div className="flex items-center gap-2 text-xs text-[#00D4FF]">
                <TrendingUp className="h-4 w-4" />
                <span>${formatUSDC(plan.yield_earned)} yield</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

