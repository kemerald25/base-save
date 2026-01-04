'use client';

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { BottomNav } from '@/components/BottomNav';
import { BrandFooter } from '@/components/BrandFooter';
import { CreatePlanModal } from '@/components/CreatePlanModal';
import { PlanCard } from '@/components/PlanCard';
import { useUserPlans } from '@/hooks/useSupabasePlans';
import { useUSDCBalance } from '@/hooks/useSavingsPlan';
import { Zap, Plus, TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useState } from 'react';
import { formatUSDC } from '@/lib/utils/format';

// Detect if we're in Farcaster miniapp environment
function isFarcasterMiniapp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      typeof sdk !== 'undefined' && 
      sdk !== null && 
      sdk.actions &&
      typeof sdk.actions.signIn === 'function'
    );
  } catch {
    return false;
  }
}

export default function Home() {
  // All hooks must be called at the top, before any conditional returns
  const { token, userData, signIn, signOut, isAuthenticated, isLoading } = useQuickAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: plans, isLoading: plansLoading } = useUserPlans();
  const { data: usdcBalance } = useUSDCBalance();

  const displayName = userData?.fid ? 'Explorer #' + userData.fid : 'Friend';
  const isMiniapp = isFarcasterMiniapp();

  const containerClasses = 'min-h-screen bg-[#0A0B0D] text-white';
  const shellClasses = 'max-w-[430px] mx-auto px-4 py-8 pb-32 space-y-6';
  const cardClasses =
    'bg-[#141519] border border-[#1E1F25] rounded-2xl p-6 shadow-[0px_25px_80px_rgba(0,82,255,0.08)] transition-colors duration-300 hover:border-[#0052FF]/40';
  const primaryButtonClasses =
    'w-full bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold py-3 px-6 rounded-xl shadow-[0px_20px_45px_rgba(0,82,255,0.35)] transition-all duration-200 hover:shadow-[0px_25px_55px_rgba(0,82,255,0.55)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';
  const badgeClasses =
    'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0052FF]/10 text-[#00D4FF] text-[11px] font-semibold tracking-wide border border-[#0052FF]/25';

  // In miniapp, don't show connect wallet UI - authentication happens automatically
  if (!isAuthenticated) {
    // In miniapp, show loading state instead of connect wallet button
    if (isMiniapp && isLoading) {
      return (
        <>
          <main className={containerClasses}>
            <div className="flex min-h-screen items-center justify-center px-4 pb-32">
              <div className="w-full max-w-[380px] space-y-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0052FF]/15 border border-[#0052FF]/30">
                  <Zap className="h-8 w-8 text-[#00D4FF] animate-pulse" />
                </div>
                <p className="text-sm text-[#A0A0A0]">Connecting...</p>
              </div>
            </div>
          </main>
          <BottomNav />
        </>
      );
    }
    
    // Web browser - show connect wallet UI
    return (
      <>
        <main className={containerClasses}>
          <div className="flex min-h-screen items-center justify-center px-4 pb-32">
            <div className="w-full max-w-[380px] space-y-8 text-center">
              <span className={badgeClasses}>Base transaction mini app</span>
              <div className={`${cardClasses} space-y-4`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0052FF]/30 bg-[#0052FF]/15">
                  <Zap className="h-8 w-8 text-[#00D4FF]" />
                </div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-[#0052FF] to-[#00D4FF] bg-clip-text text-transparent">
                    basesave
                  </span>
                </h1>
                <p className="text-sm text-[#A0A0A0]">A daily saving protocol built on the baseapp</p>
                <button 
                  onClick={async () => {
                    try {
                      await signIn();
                    } catch (error: any) {
                      // Error is already handled in the hook, just log for debugging
                      if (error?.message && !error.message.includes('cancelled')) {
                        console.error('Sign-in error:', error);
                      }
                    }
                  }} 
                  disabled={isLoading} 
                  className={primaryButtonClasses}
                >
                  {isLoading ? 'Connecting…' : 'Connect to continue'}
                </button>
              </div>
              <BrandFooter />
            </div>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <main className={containerClasses}>
        <div className={shellClasses}>
          <header className="space-y-3 border-b border-[#1E1F25] pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-[#0052FF] to-[#00D4FF] bg-clip-text text-transparent">
                    basesave
                  </span>
                </h1>
                <p className="text-sm text-[#A0A0A0] mt-1">A daily saving protocol built on the baseapp</p>
              </div>
              <button onClick={signOut} className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] hover:text-white transition-colors">
                Sign Out
              </button>
            </div>
          </header>

          {/* Balance Card */}
          <section className={`${cardClasses} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">USDC Balance</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {usdcBalance ? formatUSDC(usdcBalance) : '0.00'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0052FF]/20 border border-[#0052FF]/30">
                <WalletIcon className="h-6 w-6 text-[#00D4FF]" />
              </div>
            </div>
            <Wallet />
          </section>

          {/* Create Plan Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className={`${primaryButtonClasses} flex items-center justify-center gap-2`}
          >
            <Plus className="h-5 w-5" />
            Create Savings Plan
          </button>

          {/* Plans Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Savings Plans</h2>
              {plans && plans.length > 0 && (
                <span className="text-sm text-[#A0A0A0]">{plans.length} {plans.length === 1 ? 'plan' : 'plans'}</span>
              )}
            </div>

            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                  />
                ))}
              </div>
            ) : (
              <div className={`${cardClasses} text-center py-12`}>
                <div className="mx-auto w-16 h-16 rounded-full bg-[#0052FF]/20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-[#00D4FF]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No savings plans yet</h3>
                <p className="text-sm text-[#A0A0A0] mb-6">
                  Start your savings journey by creating your first plan
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white font-semibold hover:shadow-[0px_20px_45px_rgba(0,82,255,0.35)] transition-all"
                >
                  Create Your First Plan
                </button>
              </div>
            )}
          </section>

          <BrandFooter />
        </div>
      </main>
      <BottomNav />
      <CreatePlanModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
