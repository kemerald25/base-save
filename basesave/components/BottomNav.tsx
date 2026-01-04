'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, User, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#141519]/95 border-t border-[#1E1F25] backdrop-blur-lg">
      <div className="max-w-[430px] mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#0052FF]' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0052FF]/15 border border-[#0052FF]/30 shadow-[0_10px_30px_rgba(0,82,255,0.25)]'
                      : 'border border-transparent hover:border-[#0052FF]/20'
                  }`}
                >
                  <Icon size={24} />
                </span>
                <span className="text-[11px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
