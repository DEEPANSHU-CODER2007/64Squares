'use client';

import React, { useState, useEffect } from 'react';
import { BOARD_THEMES } from '@/lib/chess/types';
import { soundManager } from '@/lib/chess/audio';
import { useTheme } from '@/components/ThemeProvider';
import { Settings, Check, Volume2, VolumeX, Palette, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<string>('emerald');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [coordinatesEnabled, setCoordinatesEnabled] = useState<boolean>(true);
  const [legalHintsEnabled, setLegalHintsEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('64squares_theme') || 'emerald';
    const storedCoords = localStorage.getItem('64squares_coords') !== 'false';
    const storedHints = localStorage.getItem('64squares_hints') !== 'false';
    const isMuted = soundManager.getMuted();

    setSelectedTheme(storedTheme);
    setSoundEnabled(!isMuted);
    setCoordinatesEnabled(storedCoords);
    setLegalHintsEnabled(storedHints);
  }, []);

  const handleSave = () => {
    localStorage.setItem('64squares_theme', selectedTheme);
    localStorage.setItem('64squares_coords', coordinatesEnabled ? 'true' : 'false');
    localStorage.setItem('64squares_hints', legalHintsEnabled ? 'true' : 'false');
    soundManager.setMuted(!soundEnabled);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto px-4 py-8 sm:py-12 w-full">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#E2E2D9] dark:border-[#303831]">
        <div className="p-3 rounded-xl bg-[#F1F0EB] dark:bg-[#252C27] border border-[#E2E2D9] dark:border-[#303831] text-[#557F39] dark:text-[#81B64C]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1C201D] dark:text-[#F4F3EA]">Preferences & Settings</h1>
          <p className="text-xs text-[#626B64] dark:text-[#A5ADA5]">Customize your visual theme, chessboard, audio, and gameplay hints</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* App Interface Theme */}
        <div className="bg-white dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C201D] dark:text-[#F4F3EA]">
              Interface Theme
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAppTheme('light')}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                appTheme === 'light'
                  ? 'bg-[#F7F6F2] border-[#557F39] text-[#1C201D] font-bold shadow-xs'
                  : 'bg-white border-[#E2E2D9] text-[#626B64] hover:border-[#557F39]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#EFEFEA] text-amber-600">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Light Theme</div>
                  <div className="text-[11px] text-[#626B64]">Warm ivory & muted green</div>
                </div>
              </div>
              {appTheme === 'light' && <Check className="w-4 h-4 text-[#557F39]" />}
            </button>

            <button
              onClick={() => setAppTheme('dark')}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                appTheme === 'dark'
                  ? 'bg-[#252C27] border-[#81B64C] text-[#F4F3EA] font-bold shadow-xs'
                  : 'bg-[#101311] border-[#303831] text-[#A5ADA5] hover:border-[#81B64C]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#171B18] text-emerald-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Dark Theme</div>
                  <div className="text-[11px] text-[#A5ADA5]">Charcoal & emerald green</div>
                </div>
              </div>
              {appTheme === 'dark' && <Check className="w-4 h-4 text-[#81B64C]" />}
            </button>
          </div>
        </div>

        {/* Board Color Themes */}
        <div className="bg-white dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C201D] dark:text-[#F4F3EA]">
              Chessboard Squares
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {BOARD_THEMES.map((th) => {
              const isSelected = selectedTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#F7F6F2] dark:bg-[#252C27] border-[#557F39] dark:border-[#81B64C] shadow-xs'
                      : 'bg-white dark:bg-[#101311] border-[#E2E2D9] dark:border-[#303831] hover:border-[#557F39]/40 dark:hover:border-[#81B64C]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Mini 2x2 board swatch */}
                    <div className="w-8 h-8 rounded-md overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/10">
                      <div style={{ backgroundColor: th.lightSquare }} />
                      <div style={{ backgroundColor: th.darkSquare }} />
                      <div style={{ backgroundColor: th.darkSquare }} />
                      <div style={{ backgroundColor: th.lightSquare }} />
                    </div>
                    <span className="text-xs font-semibold text-[#1C201D] dark:text-[#F4F3EA]">{th.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio & Sound */}
        <div className="bg-white dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#F1F0EB] dark:bg-[#252C27] text-[#557F39] dark:text-[#81B64C]">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C201D] dark:text-[#F4F3EA]">Sound Effects</h3>
                <p className="text-xs text-[#626B64] dark:text-[#A5ADA5]">Audio feedback for moves, captures, checks, and game over</p>
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label="Toggle Sound Effects"
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                soundEnabled ? 'bg-[#557F39] dark:bg-[#81B64C]' : 'bg-[#D6D6CE] dark:bg-[#303831]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Board Options */}
        <div className="bg-white dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 shadow-sm divide-y divide-[#E2E2D9] dark:divide-[#303831]">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C201D] dark:text-[#F4F3EA]">Board Coordinates</h3>
              <p className="text-xs text-[#626B64] dark:text-[#A5ADA5]">Display ranks (1-8) and files (a-h) along the board borders</p>
            </div>
            <button
              onClick={() => setCoordinatesEnabled(!coordinatesEnabled)}
              aria-label="Toggle Coordinates"
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                coordinatesEnabled ? 'bg-[#557F39] dark:bg-[#81B64C]' : 'bg-[#D6D6CE] dark:bg-[#303831]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  coordinatesEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C201D] dark:text-[#F4F3EA]">Legal Move Hints</h3>
              <p className="text-xs text-[#626B64] dark:text-[#A5ADA5]">Show dots and capture rings on valid destination squares</p>
            </div>
            <button
              onClick={() => setLegalHintsEnabled(!legalHintsEnabled)}
              aria-label="Toggle Move Hints"
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                legalHintsEnabled ? 'bg-[#557F39] dark:bg-[#81B64C]' : 'bg-[#D6D6CE] dark:bg-[#303831]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  legalHintsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-[#557F39] dark:text-[#81B64C] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#557F39] hover:bg-[#486E30] dark:bg-[#81B64C] dark:hover:bg-[#91C85A] text-white dark:text-[#101311] font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
