'use client';

import { BottomNav } from '@/components/BottomNav';
import { BrandFooter } from '@/components/BrandFooter';
import { TrendingUp, Flame, Star, Zap, ArrowRight, Sparkles } from 'lucide-react';

const cardClasses =
  'bg-[#141519] border border-[#1E1F25] rounded-2xl p-6 shadow-[0px_25px_80px_rgba(0,82,255,0.08)] transition-colors duration-300 hover:border-[#0052FF]/40';

export default function Explore() {
  const categories = [
    { icon: TrendingUp, title: 'Trending', badge: 'Live' },
    { icon: Flame, title: 'Hot Drops', badge: 'Now' },
    { icon: Star, title: 'Featured', badge: 'Top' },
    { icon: Zap, title: 'Fresh', badge: 'New' },
  ];

  const spots = [
    { id: 1, title: 'basesave Quest Hub', description: 'Curated missions, Base-native actions, and rapid progression loops.' },
    { id: 2, title: 'Creator Highlights', description: 'Discover standout experiences and agents in the defi space.' },
    { id: 3, title: 'Community Radar', description: 'Live signals from Farcaster, Warpcast, and Base social layers.' },
    { id: 4, title: 'Dev Royale Updates', description: 'Fresh templates, UI kits, and flows specifically for basesave builders.' },
  ];

  return (
    <>
      <main className="min-h-screen bg-[#0A0B0D] text-white">
        <div className="max-w-[430px] mx-auto px-4 py-8 pb-32 space-y-6">
          <header className="space-y-3 border-b border-[#1E1F25] pb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0]">Discover</p>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#0052FF] to-[#00D4FF] bg-clip-text text-transparent">
                Explore basesave
              </span>
            </h1>
            <p className="text-sm text-[#A0A0A0]">A daily saving protocol built on the baseapp</p>
          </header>

          <section className="grid grid-cols-2 gap-4">
            {categories.map(({ icon: Icon, title, badge }) => (
              <div key={title} className={`${cardClasses} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0052FF]/25 bg-[#0052FF]/10 text-[#00D4FF]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A0A0A0]">{badge}</span>
                </div>
                <p className="text-sm font-semibold">{title}</p>
              </div>
            ))}
          </section>

          <section className={`${cardClasses} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Spotlight</p>
                <h2 className="text-xl font-semibold">What&apos;s next</h2>
              </div>
              <Sparkles className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <div className="space-y-4">
              {spots.map((spot) => (
                <div
                  key={spot.id}
                  className="rounded-2xl border border-[#1E1F25] bg-[#101217] p-4 transition-all duration-200 hover:border-[#0052FF]/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0052FF]/25 bg-[#0052FF]/10 text-lg font-semibold">
                      {spot.id.toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{spot.title}</h3>
                        <ArrowRight className="h-4 w-4 text-[#A0A0A0]" />
                      </div>
                      <p className="text-sm text-[#A0A0A0] leading-relaxed">{spot.description}</p>
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#00D4FF]">
                        Base drop
                      </span>
                    </div>
                  </div>
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
