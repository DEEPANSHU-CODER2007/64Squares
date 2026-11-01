'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Users, Search, Puzzle, GraduationCap, ArrowRight } from 'lucide-react';

export default function PlayHubPage() {
  const primaryModes = [
    {
      title: 'Play a Friend',
      desc: 'Direct 2-Player match on one board. Enter custom player names and start playing immediately.',
      href: '/play/friend',
      icon: Users,
      badge: '2-Player',
    },
    {
      title: 'Play Computer',
      desc: 'Challenge the Stockfish engine. 5 difficulty tiers from Beginner to Expert with move undo.',
      href: '/play/computer',
      icon: Bot,
      badge: 'Single Player',
    },
  ];

  const secondaryModes = [
    {
      title: 'Tactical Puzzles',
      desc: 'Sharpen tactical recognition with verified puzzles.',
      href: '/puzzles',
      icon: Puzzle,
    },
    {
      title: 'Analysis Board',
      desc: 'Deep Stockfish engine evaluation and FEN/PGN replay.',
      href: '/analysis',
      icon: Search,
    },
    {
      title: 'Chess Lessons',
      desc: 'Interactive guide to piece movement and tactical motifs.',
      href: '/learn',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C201D] dark:text-[#F4F3EA] tracking-tight">
          Select Game Mode
        </h1>
        <p className="text-xs sm:text-sm text-[#626B64] dark:text-[#A5ADA5] mt-1">
          Choose how you want to play on 64Squares
        </p>
      </div>

      {/* Primary Play Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {primaryModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link
              key={mode.title}
              href={mode.href}
              className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] hover:border-[#557F39] dark:hover:border-[#81B64C] shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between hover:-translate-y-0.5 active:translate-y-0"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-[#F1F0EB] dark:bg-[#252C27] text-[#557F39] dark:text-[#81B64C] group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#557F39]/10 dark:bg-[#81B64C]/15 text-[#557F39] dark:text-[#81B64C]">
                    {mode.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#1C201D] dark:text-[#F4F3EA] group-hover:text-[#557F39] dark:group-hover:text-[#81B64C] transition-colors">
                  {mode.title}
                </h2>
                <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] mt-1.5 leading-relaxed">
                  {mode.desc}
                </p>
              </div>

              <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-[#557F39] dark:text-[#81B64C]">
                <span>Start Playing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary Study & Practice Modes */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A857D] dark:text-[#8E9790] px-1 mb-3">
          Practice & Analysis
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {secondaryModes.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#2C342E] hover:border-[#557F39] dark:hover:border-[#81B64C] transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <Icon className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />
                    <span className="text-sm font-bold text-[#1C201D] dark:text-[#F4F3EA] group-hover:text-[#557F39] dark:group-hover:text-[#81B64C] transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] leading-normal">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
