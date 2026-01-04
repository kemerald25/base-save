'use client';

import { BottomNav } from '@/components/BottomNav';
import { BrandFooter } from '@/components/BrandFooter';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { User, Wallet, Award, Activity } from 'lucide-react';

const containerClasses = 'min-h-screen bg-[#0A0B0D] text-white';
const shellClasses = 'max-w-[430px] mx-auto px-4 py-8 pb-32 space-y-6';
const cardClasses =
  'bg-[#141519] border border-[#1E1F25] rounded-2xl p-6 shadow-[0px_25px_80px_rgba(0,82,255,0.08)] transition-colors duration-300 hover:border-[#0052FF]/40';

export default function Profile() {
  const { userData } = useQuickAuth();
  const displayName =
    userData?.fid ? 'Explorer #' + userData.fid : 'User';

  return (
    <>
      <main className={containerClasses}>
        <div className={shellClasses}>
          <header className="space-y-3 border-b border-[#1E1F25] pb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0]">Profile</p>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#0052FF] to-[#00D4FF] bg-clip-text text-transparent">
                Identity Hub
              </span>
            </h1>
            <p className="text-sm text-[#A0A0A0]">Your Farcaster + Base credentials inside basesave.</p>
          </header>

          <section className={`${cardClasses} space-y-6`}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0052FF]/30 bg-[#0052FF]/15">
                <User className="h-8 w-8 text-[#00D4FF]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">Display Name</p>
                <p className="text-xl font-semibold">{displayName}</p>
                {userData?.fid && <p className="text-xs text-[#A0A0A0]">FID: {userData.fid}</p>}
              </div>
            </div>

            {userData?.address && (
              <div className="rounded-2xl border border-[#1E1F25] bg-[#0F1116] p-4">
                <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                  <span className="flex items-center gap-2 text-sm text-white">
                    <Wallet className="h-4 w-4 text-[#00D4FF]" />
                    Wallet Address
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs text-white">{userData.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Achievements', value: '0' }, { label: 'Activity', value: '0' }].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#1E1F25] bg-[#0F1116] p-4 text-center transition-colors duration-200 hover:border-[#0052FF]/40"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0052FF]/10 text-[#00D4FF]">
                    {item.label === 'Achievements' ? <Award className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                  </div>
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${cardClasses} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Account Status</p>
                <h2 className="text-xl font-semibold">Royale credentials</h2>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Status', value: 'Active' },
                { label: 'Member Since', value: 'Today' },
                { label: 'Tier', value: 'Explorer' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-[#1E1F25] bg-[#101217] px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <BrandFooter />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
