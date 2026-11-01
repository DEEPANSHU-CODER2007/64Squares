'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Puzzle, GraduationCap, Search, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/play', label: 'Play', icon: Swords },
    { href: '/puzzles', label: 'Puzzles', icon: Puzzle },
    { href: '/learn', label: 'Learn', icon: GraduationCap },
    { href: '/analysis', label: 'Analysis', icon: Search },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F6F2]/95 dark:bg-[#171B18]/95 backdrop-blur-md border-t border-[#E2E2D9] dark:border-[#303831] px-2 py-1.5 flex items-center justify-around select-none safe-area-bottom shadow-lg transition-colors"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-[#557F39] dark:text-[#81B64C] font-bold'
                : 'text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] active:scale-95'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-[#557F39]/15 dark:bg-[#81B64C]/15' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
