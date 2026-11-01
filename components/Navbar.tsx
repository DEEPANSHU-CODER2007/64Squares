'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import {
  Swords,
  Puzzle,
  GraduationCap,
  Search,
  Settings,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/play', label: 'Play', icon: Swords },
    { href: '/puzzles', label: 'Puzzles', icon: Puzzle },
    { href: '/learn', label: 'Learn', icon: GraduationCap },
    { href: '/analysis', label: 'Analysis', icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E2D9] dark:border-[#303831] bg-[#F7F6F2]/90 dark:bg-[#111412]/90 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Logo size="md" />

        {/* Desktop Primary Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EFEFEA] dark:bg-[#252C27] text-[#557F39] dark:text-[#81B64C] font-semibold shadow-2xs'
                    : 'text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Quick Play + Theme Toggle & Settings */}
        <div className="flex items-center gap-2">
          <Link
            href="/play"
            className="chess-btn-green hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Play</span>
          </Link>

          <ThemeToggle />

          <Link
            href="/settings"
            title="Settings & Preferences"
            className="p-2 rounded-xl text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
