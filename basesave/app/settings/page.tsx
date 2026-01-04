'use client';

import { BottomNav } from '@/components/BottomNav';
import { BrandFooter } from '@/components/BrandFooter';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { Bell, Moon, Shield, Info, LogOut, Cpu, Gauge, Sparkles } from 'lucide-react';

const containerClasses = 'min-h-screen bg-[#0A0B0D] text-white';
const shellClasses = 'max-w-[430px] mx-auto px-4 py-8 pb-32 space-y-6';
const cardClasses =
  'bg-[#141519] border border-[#1E1F25] rounded-2xl p-6 shadow-[0px_25px_80px_rgba(0,82,255,0.08)] transition-colors duration-300 hover:border-[#0052FF]/40';
const primaryButtonClasses =
  'w-full bg-gradient-to-r from-[#FF4B6E] to-[#FF6B3D] text-white font-semibold py-3 px-6 rounded-xl shadow-[0px_20px_45px_rgba(255,75,110,0.35)] transition-all duration-200 hover:shadow-[0px_25px_55px_rgba(255,75,110,0.55)] active:scale-95';

export default function Settings() {
  const { signOut } = useQuickAuth();

  const settings = [
    { icon: Bell, title: 'Notifications', description: 'Manage your notifications' },
    { icon: Moon, title: 'Theme', description: 'Dark mode preferences' },
    { icon: Shield, title: 'Privacy', description: 'Privacy and security settings' },
    { icon: Info, title: 'About', description: 'App information and version' },
  ];

  return (
    <>
      <main className={containerClasses}>
        <div className={shellClasses}>
          <header className="space-y-3 border-b border-[#1E1F25] pb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A0A0A0]">Settings</p>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#0052FF] to-[#00D4FF] bg-clip-text text-transparent">
                Control Center
              </span>
            </h1>
            <p className="text-sm text-[#A0A0A0]">Fine-tune basesave for a perfect Base-native experience.</p>
          </header>

          <section className={`${cardClasses} space-y-3`}>
            {settings.map(({ icon: Icon, title, description }) => (
              <button
                key={title}
                className="flex w-full items-center justify-between rounded-2xl border border-[#1E1F25] bg-[#0F1116] px-4 py-4 text-left transition-all duration-200 hover:border-[#0052FF]/40"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0052FF]/20 bg-[#0052FF]/10 text-[#00D4FF]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-[#A0A0A0]">{description}</p>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-[#A0A0A0]" />
              </button>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-4">
            {[
              { label: 'Performance', value: 'Ultra', Icon: Gauge },
              { label: 'Security', value: 'Shielded', Icon: Cpu },
            ].map(({ label, value, Icon }) => (
              <div key={label} className={`${cardClasses} flex flex-col space-y-2 bg-[#101217]`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0052FF]/25 bg-[#0052FF]/10 text-[#00D4FF]">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </section>

          <section className={cardClasses}>
            <div className="space-y-2 text-xs text-[#A0A0A0]">
              <p>Need to sign out? You can jump back in via Quick Auth anytime.</p>
            </div>
            <button onClick={signOut} className={`${primaryButtonClasses} mt-4`}>
              <span className="flex items-center justify-center gap-2 text-sm">
                <LogOut className="h-4 w-4" />
                Sign Out Securely
              </span>
            </button>
          </section>

          <BrandFooter />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
