'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../../lib/i18n';
import { useRouter } from 'next/navigation';
import {
  User,
  Volume2,
  Mic,
  Globe,
  LogOut,
  Shield,
  HelpCircle,
  ChevronRight,
  Sparkles,
  X,
  Phone,
  CheckCircle2,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, settings, t, setLanguage, toggleAppSounds, toggleVoiceGuidance, logout, speakText } =
    useApp();
  const router = useRouter();

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogoutClick = () => {
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nt_user');
      localStorage.removeItem('nt-customer-profile');
      window.location.href = '/';
    }
  };

  return (
    <div className="p-4 space-y-4 pb-6 relative">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">{t('settingsHeading')}</h2>
        <p className="text-xs text-slate-500">Manage account, language, audio and accessibility</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt="Profile Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {user?.fullName || 'Anand Sharma'}
            </h3>
            <p className="text-xs text-slate-500">{user?.phone || '+91 98765 43210'}</p>
            <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full capitalize">
              Role: {user?.role || 'Customer'}
            </span>
          </div>
        </div>

        <button className="text-xs font-semibold text-blue-800 hover:underline">
          Edit
        </button>
      </div>

      {/* Audio & Accessibility Toggles Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{t('audioAccessibility')}</span>
        </div>

        {/* App Sounds Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">{t('appSounds')}</h4>
              <p className="text-[11px] text-slate-500">Play audio chime on booking & actions</p>
            </div>
          </div>

          <button
            onClick={toggleAppSounds}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
              settings.appSounds ? 'bg-blue-800' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                settings.appSounds ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Voice Guidance Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 mt-0.5">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">{t('voiceGuidance')}</h4>
              <p className="text-[10px] text-slate-500 leading-snug max-w-[210px]">
                {t('voiceGuidanceDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={toggleVoiceGuidance}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
              settings.voiceGuidance ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                settings.voiceGuidance ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Demo Voice Readout Trigger */}
        {settings.voiceGuidance && (
          <button
            onClick={() => speakText('Welcome to Neighborly Trust. Accessible service booking is active.')}
            className="w-full py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center space-x-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>Test Voice Guidance Readout</span>
          </button>
        )}
      </div>

      {/* Language Selector Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
          <Globe className="w-4 h-4 text-blue-800" />
          <span>App Interface Language</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = settings.selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{lang.nativeLabel}</span>
                <span className="text-[10px] opacity-75">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Support Links */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        <div
          onClick={() => setShowPrivacyModal(true)}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
        >
          <div className="flex items-center space-x-3 text-xs text-slate-700 font-bold">
            <Shield className="w-4 h-4 text-blue-800" />
            <span>Privacy & OWASP Data Security</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div
          onClick={() => setShowHelpModal(true)}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
        >
          <div className="flex items-center space-x-3 text-xs text-slate-700 font-bold">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Help & Local Helpline Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogoutClick}
        type="button"
        className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('logoutBtn')}</span>
      </button>

      {/* Privacy & OWASP Data Security Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-800" />
                <span>Privacy & OWASP Security</span>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 space-y-1">
                <p className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-800" /> DPDP Act 2023 Compliant
                </p>
                <p className="text-[11px] text-slate-600">Your phone number and location are used exclusively to connect you with nearby verified service providers.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p><strong>Zero Third-Party Tracking:</strong> Your data is never sold or shared with external advertising networks.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p><strong>Local Storage Isolation:</strong> Session tokens and user profiles are stored in isolated browser storage.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p><strong>OWASP Top 10 Hardened:</strong> Input fields are protected against cross-site scripting (XSS) and injection attacks.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 transition cursor-pointer shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Help & Local Helpline Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span>Help & Local Helpline Support</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <a
                href="tel:18008787289"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>Call Toll-Free Helpline (1-800-TRUST-AZURE)</span>
              </a>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-slate-700">
                <p className="font-extrabold text-slate-900 text-xs">Frequently Asked Questions:</p>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <p><strong>Q: How do I pay service providers?</strong><br />You pay directly to the provider via UPI or cash upon completion.</p>
                  <p><strong>Q: Are service providers background checked?</strong><br />Yes, all listed providers undergo local identity verification.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Close Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
