'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { BottomNav } from './BottomNav';
import { ToastNotification } from './ToastNotification';
import { ShieldCheck, Volume2, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../lib/i18n';
import Link from 'next/link';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, settings, setLanguage } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-0 sm:py-6 px-0 sm:px-4">
      {/* Mobile-first Shell */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen sm:min-h-[840px] sm:rounded-3xl sm:shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col relative pb-20">
        <ToastNotification />

        {/* Brand Header Bar */}
        <header className="bg-blue-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-30">
          <Link href="/home" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-white">
                {t('appTitle')}
              </h1>
              <p className="text-[10px] text-blue-200 font-medium tracking-wide mt-0.5">
                {t('tagline')}
              </p>
            </div>
          </Link>

          {/* Top Accessibility & Language Header Actions */}
          <div className="flex items-center space-x-2">
            {settings.voiceGuidance && (
              <span className="flex items-center space-x-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>Voice</span>
              </span>
            )}

            {/* Quick Lang Switcher Pill */}
            <div className="relative">
              <select
                value={settings.selectedLanguage}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-blue-900/80 text-white text-xs border border-blue-600 rounded-lg px-2 py-1 pr-6 focus:outline-none appearance-none cursor-pointer font-medium"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.nativeLabel}
                  </option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 text-blue-300 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Bottom Nav Bar */}
        <BottomNav />
      </div>
    </div>
  );
};
