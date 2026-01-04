'use client';

import { useParams } from 'next/navigation';
import { usePlanById } from '@/hooks/useSupabasePlans';
import { PlanDetails } from '@/components/PlanDetails';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params?.id ? Number(params.id) : null;
  const { data: plan, isLoading } = usePlanById(planId);

  if (isLoading) {
    return (
      <>
        <main className="min-h-screen bg-[#0A0B0D] text-white">
          <div className="max-w-[430px] mx-auto px-4 py-8 pb-32">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#0052FF]/20 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-[#A0A0A0]">Loading plan...</p>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <main className="min-h-screen bg-[#0A0B0D] text-white">
          <div className="max-w-[430px] mx-auto px-4 py-8 pb-32">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-2">Plan not found</p>
                <p className="text-sm text-[#A0A0A0] mb-6">The plan you're looking for doesn't exist.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#0A0B0D] text-white">
        <div className="max-w-[430px] mx-auto px-4 py-8 pb-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#A0A0A0] hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <PlanDetails planId={plan.plan_id} plan={plan} />
        </div>
      </main>
      <BottomNav />
    </>
  );
}

