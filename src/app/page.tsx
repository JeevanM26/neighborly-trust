'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronLeft, Search, Zap, Wrench, Hammer, Home as HomeIcon, Bell,
  User, Star, ShieldCheck, MapPin, Calendar,
  LogOut, CheckCircle2, Clock, TrendingUp,
  Briefcase, Lock, CreditCard, Navigation, IndianRupee,
  Phone, MessageSquare, ChevronRight, Settings, Award,
  Sparkles, BadgeCheck, Wallet, ArrowUpRight, Filter,
  SlidersHorizontal, Grid3X3, List, Heart, Share2, X, AlertCircle
} from 'lucide-react';
import { calculateCommission, formatINR, sortProvidersByDistanceAndFeatured, distanceKm } from '../lib/commission';
import { ProviderProfile, Booking } from '../lib/types';
import { supabase } from '../lib/supabase';

const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), { ssr: false });

// ─── Design Tokens ────────────────────────────────────────────────────────────
const NAVY = '#0B3D66';
const NAVY_DEEP = '#072A4A';
const GOLD = '#F5A623';
const SKY = '#EAF2FB';

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'All', icon: Grid3X3, color: '#0B3D66' },
  { name: 'Electrician', icon: Zap, color: '#F59E0B' },
  { name: 'Plumber', icon: Wrench, color: '#3B82F6' },
  { name: 'Carpenter', icon: Hammer, color: '#8B5CF6' },
  { name: 'Home Clean', icon: HomeIcon, color: '#10B981' },
];

// ─── Demo workers ─────────────────────────────────────────────────────────────
const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 };

const INITIAL_WORKERS: ProviderProfile[] = [
  {
    id: '1', name: 'Rajesh Kumar', role: 'Master Electrician', category: 'Electrician',
    rating: 4.9, reviews_count: 248, lat: 13.9381, lng: 75.5745,
    is_online: true, hourly_rate: 350, featured: true,
    tags: ['Licensed', 'Insured', '20+ Yrs'],
    description: 'Expert in residential wiring, panel upgrades, and solar installations.',
    about: 'Rajesh has been serving the Shivamogga district for over 20 years. Specialises in residential wiring, MCB panel upgrades, solar installations, and emergency electrical work. All work guaranteed for 1 year.',
    area: 'Shivamogga & Surrounding Areas',
  },
  {
    id: '2', name: 'Priya Sharma', role: 'Plumbing Specialist', category: 'Plumber',
    rating: 4.8, reviews_count: 176, lat: 13.9142, lng: 75.5812,
    is_online: true, hourly_rate: 400, featured: true,
    tags: ['Licensed', 'Same Day', '10+ Yrs'],
    description: 'Fast, leak-free plumbing repairs and new installations.',
    about: 'Priya specialises in pipe fitting, borewell connections, overhead tank installations, and bathroom plumbing — done right the first time, every time.',
    area: 'Green Valley & Surrounding Areas',
  },
  {
    id: '3', name: 'Suresh Nayak', role: 'Master Carpenter', category: 'Carpenter',
    rating: 5.0, reviews_count: 312, lat: 13.9335, lng: 75.5622,
    is_online: true, hourly_rate: 300, featured: false,
    tags: ['Licensed', 'Custom Work', '25+ Yrs'],
    description: 'Custom furniture, modular kitchens & woodwork built to last.',
    about: 'Suresh crafts custom furniture, modular kitchen cabinets, door and window frames, and decorative woodwork. Over 300 five-star reviews speak for his craftsmanship.',
    area: 'Central Market & Surrounding Areas',
  },
  {
    id: '4', name: 'Meena Kulkarni', role: 'Home Cleaning Expert', category: 'Home Clean',
    rating: 4.7, reviews_count: 130, lat: 13.9218, lng: 75.5758,
    is_online: true, hourly_rate: 250, featured: false,
    tags: ['Verified', 'Eco-Friendly', '5+ Yrs'],
    description: 'Deep cleaning and sanitising for homes and offices.',
    about: 'Meena provides deep cleaning, dusting, floor mopping, and full bathroom sanitisation for homes and small offices. Eco-friendly supplies available on request.',
    area: 'Green Valley & Surrounding Areas',
  },
  {
    id: '5', name: 'Arjun Patil', role: 'Electrician', category: 'Electrician',
    rating: 4.6, reviews_count: 89, lat: 13.9260, lng: 75.5700,
    is_online: false, hourly_rate: 280, featured: false,
    tags: ['Licensed', 'Emergency', '8+ Yrs'],
    description: 'Affordable electrical repairs for homes and farms.',
    about: 'Arjun handles all types of electrical repairs, wiring, and fixture installations. Available for emergency call-outs across the district.',
    area: 'Shivamogga North',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return a.village || a.town || a.suburb || a.county || a.city || data.display_name?.split(',')[0] || null;
  } catch { return null; }
}

function useUserLocation() {
  const [loc, setLoc] = useState(DEFAULT_LOCATION);
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [placeName, setPlaceName] = useState<string | null>(null);
  const lastRef = useRef({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng, time: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('denied'); return;
    }
    setStatus('loading');
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const now = Date.now();
        const dist = distanceKm(lastRef.current.lat, lastRef.current.lng, next.lat, next.lng);
        if (lastRef.current.time === 0 || dist > 0.03 || now - lastRef.current.time > 15000) {
          lastRef.current = { ...next, time: now };
          setLoc(next); setStatus('granted');
          const name = await reverseGeocode(next.lat, next.lng);
          if (name) setPlaceName(name);
        }
      },
      () => { setLoc(DEFAULT_LOCATION); setStatus('denied'); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { loc, status, placeName };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'} strokeWidth={0} fill={i <= Math.round(rating) ? '#F5A623' : '#e2e8f0'} />
      ))}
      <span className="text-xs font-bold text-slate-700 ml-1">{rating}</span>
    </span>
  );
}

function Avatar({ size = 40, name = 'U', ring = true }: { size?: number; name?: string; ring?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const colors = ['#0B3D66','#1a5a96','#072A4A','#1e40af','#7c3aed'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${ring ? 'ring-2 ring-white shadow-md' : ''}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function Pill({ label, color = '#0B3D66' }: { label: string; color?: string }) {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: color + '18', color }}
    >
      {label}
    </span>
  );
}

function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' | 'info' }) {
  if (!message) return null;
  const bg = type === 'error' ? '#DC2626' : type === 'info' ? '#0B3D66' : '#059669';
  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Bell : CheckCircle2;
  return (
    <div
      className="absolute left-4 right-4 bottom-24 z-50 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-slide-up"
      style={{ background: bg }}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function LocationBadge({ status, placeName }: { status: string; placeName: string | null }) {
  if (status === 'granted') {
    return (
      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-emerald-700">
          {placeName ? `Live GPS · ${placeName}` : 'GPS Active'}
        </span>
      </div>
    );
  }
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5">
        <Navigation size={11} className="text-slate-400 animate-pulse" />
        <span className="text-[11px] font-medium text-slate-500">Locating…</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
      <Navigation size={11} className="text-amber-600" />
      <span className="text-[11px] font-semibold text-amber-700">GPS off · Shivamogga</span>
    </div>
  );
}

// ─── SPLASH / ONBOARDING ──────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: <ShieldCheck size={56} color="white" />,
      title: 'Verified Professionals',
      desc: 'Every service provider is background-checked, licensed, and verified before joining.',
      gradient: 'linear-gradient(145deg,#0B3D66,#072A4A)',
    },
    {
      icon: <Navigation size={56} color="white" />,
      title: 'Real-Time Nearby Match',
      desc: 'Live GPS shows you the closest available experts in seconds — not minutes.',
      gradient: 'linear-gradient(145deg,#1a5a96,#0B3D66)',
    },
    {
      icon: <IndianRupee size={56} color="white" />,
      title: 'Fair & Transparent Pricing',
      desc: 'See exact rates upfront. No hidden fees. Pay only 8% platform fee on completion.',
      gradient: 'linear-gradient(145deg,#072A4A,#0B3D66)',
    },
  ];

  const current = slides[step];

  return (
    <div className="h-full flex flex-col" style={{ background: current.gradient, transition: 'background 0.6s ease' }}>
      {/* Skip */}
      <div className="flex justify-end p-5">
        <button onClick={onDone} className="text-white/60 text-xs font-semibold hover:text-white transition">
          Skip →
        </button>
      </div>

      {/* Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-28 h-28 rounded-3xl glass-dark flex items-center justify-center mb-8 animate-float shadow-2xl">
          {current.icon}
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-3 animate-fade-in">{current.title}</h2>
        <p className="text-sm text-white/70 leading-relaxed max-w-xs animate-fade-in delay-100">{current.desc}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-6">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="rounded-full transition-all duration-300"
            style={{ width: i === step ? 24 : 8, height: 8, background: i === step ? 'white' : 'rgba(255,255,255,0.35)' }}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 space-y-3">
        {step < slides.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="w-full py-4 rounded-2xl glass font-bold text-slate-800 text-sm btn-press shadow-lg"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onDone}
            className="w-full py-4 rounded-2xl font-extrabold text-sm btn-press shadow-xl"
            style={{ background: GOLD, color: '#fff' }}
          >
            Get Started →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PHONE OTP LOGIN (shared by Customer & Provider) ──────────────────────────
function PhoneOTPLogin({
  role, onLogin, goOther, notify
}: {
  role: 'customer' | 'provider';
  onLogin: () => void;
  goOther: () => void;
  notify: (m: string, t?: 'success'|'error'|'info') => void;
}) {
  const isCustomer = role === 'customer';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = async () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) { setError('Please enter a valid 10-digit Indian mobile number.'); return; }
    if (!consent) { setError('Please accept the privacy consent to continue.'); return; }
    setError(''); setLoading(true);

    try {
      // Try Supabase phone OTP
      const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: `+91${phone.replace(/\s/g, '')}` });
      if (otpErr) throw otpErr;
    } catch {
      // In demo/dev mode without Twilio, proceed anyway showing OTP screen
    }

    setLoading(false);
    setStep('otp');
    setCountdown(30);
    notify('OTP sent to +91 ' + phone, 'info');
    setTimeout(() => otpRefs[0].current?.focus(), 100);
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 3) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 4) { setError('Please enter the 4-digit OTP.'); return; }
    setError(''); setLoading(true);

    try {
      const { error: verErr } = await supabase.auth.verifyOtp({
        phone: `+91${phone.replace(/\s/g, '')}`,
        token: code,
        type: 'sms',
      });
      if (verErr && code !== '1234') throw verErr; // demo OTP = 1234
    } catch {
      // Demo mode: accept '1234' as valid OTP
      if (code !== '1234') { setError('Incorrect OTP. Please try again.'); setLoading(false); return; }
    }

    setLoading(false);
    notify(`Welcome, ${name}! 🎉`, 'success');
    setTimeout(onLogin, 600);
  };

  const HeroIcon = isCustomer ? HomeIcon : Briefcase;
  const badgeColor = isCustomer ? '#10b981' : GOLD;
  const BadgeIcon = isCustomer ? BadgeCheck : Award;

  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ background: 'linear-gradient(180deg,#EAF2FB 0%,#f8fafc 100%)' }}>

      {/* Role Toggle */}
      <div className="px-5 pt-5">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          <button
            onClick={isCustomer ? undefined : goOther}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${isCustomer ? 'text-white shadow-md' : 'text-slate-500'}`}
            style={isCustomer ? { background: NAVY } : {}}
          >
            Customer
          </button>
          <button
            onClick={!isCustomer ? undefined : goOther}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${!isCustomer ? 'text-white shadow-md' : 'text-slate-500'}`}
            style={!isCustomer ? { background: NAVY } : {}}
          >
            Service Provider
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center pt-7 pb-5 px-5">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-3xl shadow-2xl flex items-center justify-center"
            style={{ background: isCustomer ? 'linear-gradient(145deg,#0B3D66,#072A4A)' : 'linear-gradient(145deg,#072A4A,#1a5a96)' }}>
            <HeroIcon color="white" size={34} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-white" style={{ background: badgeColor }}>
            <BadgeIcon size={13} color="white" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {isCustomer ? 'Neighborly Trust' : 'Provider Portal'}
        </h1>
        <p className="text-sm text-slate-500 mt-1 text-center">
          {isCustomer ? 'Verified local services at your doorstep' : 'Manage your jobs, earnings & availability'}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
          {(isCustomer
            ? ['10K+ Jobs','⭐ 4.8 Rated','Govt. Verified']
            : ['₹ Daily Pay','Live Job Alerts','Free Listing']
          ).map(b => (
            <span key={b} className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-1">{b}</span>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Details ── */}
      {step === 'details' && (
        <div className="px-5 pb-10 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              {isCustomer ? 'Sign up / Sign in' : 'Provider Sign in'}
            </h2>
            <p className="text-xs text-slate-500">
              Enter your name and mobile number. We will send a 4-digit OTP on your phone.
            </p>

            {/* Name */}
            <label className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 input-ring transition-all">
              <User size={16} className="text-slate-400 flex-shrink-0" />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name (e.g. Raju Sharma)"
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400"
              />
            </label>

            {/* Phone */}
            <label className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 input-ring transition-all">
              <div className="flex items-center gap-1.5 flex-shrink-0 border-r border-slate-300 pr-2.5 mr-0.5">
                <span className="text-sm">🇮🇳</span>
                <span className="text-sm font-semibold text-slate-600">+91</span>
              </div>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile Number"
                inputMode="numeric"
                maxLength={10}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400"
              />
            </label>

            {/* Consent */}
            <label className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-800 flex-shrink-0"
              />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Privacy Consent (DPDP Act 2023):</strong> I allow Neighborly Trust to use my mobile number and GPS location to connect me with nearby verified service providers.
              </p>
            </label>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-3">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm btn-press shadow-lg flex items-center justify-center gap-2"
              style={{ background: loading ? '#1a5a96' : 'linear-gradient(135deg,#0B3D66,#072A4A)' }}
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending OTP…</>
                : <><Phone size={16} /> Send OTP →</>
              }
            </button>

            <p className="text-center text-[11px] text-slate-400">
              By continuing you agree to our <span className="text-blue-700 font-semibold">Terms</span> & <span className="text-blue-700 font-semibold">Privacy Policy</span>
            </p>
          </div>

          {isCustomer && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center">
              <p className="text-xs font-semibold text-amber-800">
                🔒 No password needed. Just your phone number.
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">Works on any basic smartphone — even without internet data after OTP.</p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: OTP Entry ── */}
      {step === 'otp' && (
        <div className="px-5 pb-10 animate-slide-up">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 space-y-4">
            {/* Back */}
            <button onClick={() => { setStep('details'); setOtp(['','','','']); setError(''); }} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 -mb-1">
              <ChevronLeft size={14} /> Change number
            </button>

            <div className="text-center pb-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: 'linear-gradient(145deg,#0B3D66,#072A4A)' }}>
                <Phone size={26} color="white" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Enter OTP</h2>
              <p className="text-xs text-slate-500 mt-1">
                We sent a 4-digit code to <strong className="text-slate-700">+91 {phone}</strong>
              </p>
              <p className="text-[11px] text-blue-700 font-semibold mt-1">Demo mode: use OTP <strong>1234</strong></p>
            </div>

            {/* 4-box OTP input */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, idx)}
                  onKeyDown={e => handleOtpKey(e, idx)}
                  className="w-14 h-14 text-center text-2xl font-extrabold text-slate-900 border-2 rounded-2xl transition-all focus:border-blue-800 focus:shadow-md"
                  style={{ borderColor: digit ? NAVY : '#e2e8f0', background: digit ? '#EAF2FB' : '#f8fafc' }}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-3">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            <button
              onClick={verifyOTP}
              disabled={loading || otp.join('').length < 4}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm btn-press shadow-lg flex items-center justify-center gap-2"
              style={{ background: otp.join('').length < 4 ? '#94a3b8' : 'linear-gradient(135deg,#0B3D66,#072A4A)' }}
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying…</>
                : <><CheckCircle2 size={16} /> Verify & Continue</>
              }
            </button>

            {/* Resend */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs text-slate-400">Resend OTP in <strong className="text-slate-600">{countdown}s</strong></p>
              ) : (
                <button onClick={sendOTP} className="text-xs font-bold text-blue-800 hover:underline">
                  Didn't receive? Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── WORKER CARD ──────────────────────────────────────────────────────────────
function WorkerCard({ w, onSelect }: { w: ProviderProfile; onSelect: () => void }) {
  const catColor = CATEGORIES.find(c => c.name === w.category)?.color || NAVY;
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm card-hover p-4 cursor-pointer flex items-center gap-3.5 animate-fade-in"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar size={50} name={w.name} />
        {w.is_online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 badge-online rounded-full ring-2 ring-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-sm text-slate-900 truncate">{w.name}</p>
          {w.featured && (
            <span className="inline-flex items-center gap-0.5 badge-featured text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Sparkles size={8} /> PRO
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-slate-500 truncate">{w.role}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <StarRating rating={w.rating} />
          <span className="text-[10px] text-slate-400">({w.reviews_count})</span>
          {w.distanceLabel && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <MapPin size={10} />{w.distanceLabel}
            </span>
          )}
        </div>
      </div>

      {/* Rate */}
      <div className="text-right flex-shrink-0">
        <p className="font-extrabold text-sm text-slate-900">{formatINR(w.hourly_rate)}</p>
        <p className="text-[10px] text-slate-400">/visit</p>
        <ChevronRight size={14} className="text-slate-300 ml-auto mt-1" />
      </div>
    </div>
  );
}

// ─── WORKER DETAIL ────────────────────────────────────────────────────────────
function WorkerDetail({ w, onBook, onBack }: { w: ProviderProfile; onBook: () => void; onBack: () => void }) {
  const catColor = CATEGORIES.find(c => c.name === w.category)?.color || NAVY;
  const commission = calculateCommission(w.hourly_rate, 0.08);
  const [liked, setLiked] = useState(false);

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar animate-scale-in">
      {/* Hero Header */}
      <div className="relative p-5 pb-4" style={{ background: 'linear-gradient(145deg,#0B3D66,#072A4A)' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="w-8 h-8 rounded-full glass flex items-center justify-center btn-press">
            <ChevronLeft size={18} color={NAVY} />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setLiked(l => !l)} className="w-8 h-8 rounded-full glass flex items-center justify-center btn-press">
              <Heart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : NAVY} />
            </button>
            <button className="w-8 h-8 rounded-full glass flex items-center justify-center btn-press">
              <Share2 size={16} color={NAVY} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar size={64} name={w.name} />
            {w.is_online && (
              <span className="absolute bottom-0 right-0 w-4 h-4 badge-online rounded-full ring-2 ring-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-extrabold text-white">{w.name}</h1>
              {w.featured && <BadgeCheck size={18} color={GOLD} />}
            </div>
            <p className="text-sm text-white/70">{w.role}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <StarRating rating={w.rating} size={12} />
              <span className="text-xs text-white/60">· {w.reviews_count} reviews</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {w.tags?.map(t => (
            <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full glass-dark text-white/80">{t}</span>
          ))}
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full glass-dark text-white/80">
            {w.is_online ? '🟢 Available Now' : '⭕ Offline'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-4">
        {/* Area */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <MapPin size={13} className="text-slate-400" />{w.area}
        </div>

        {/* About */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">About</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{w.about || w.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rating', value: `${w.rating}★`, color: GOLD },
            { label: 'Reviews', value: `${w.reviews_count}+`, color: NAVY },
            { label: 'Response', value: '< 30 min', color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
              <p className="text-base font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-slate-600">Service Rate</p>
              <p className="text-2xl font-extrabold text-slate-900">{formatINR(w.hourly_rate)}<span className="text-sm font-normal text-slate-400">/visit</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">Platform fee (8%)</p>
              <p className="text-sm font-bold text-slate-700">{formatINR(commission)}</p>
            </div>
          </div>
          <div className="h-px bg-blue-200 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">You pay total</span>
            <span className="text-base font-extrabold text-blue-900">{formatINR(w.hourly_rate + commission)}</span>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm btn-press transition" style={{ borderColor: NAVY, color: NAVY }}>
            <Phone size={15} /> Call
          </button>
          <button className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm btn-press transition" style={{ borderColor: NAVY, color: NAVY }}>
            <MessageSquare size={15} /> Chat
          </button>
        </div>
      </div>

      {/* Book CTA */}
      <div className="p-5 pt-0 pb-6">
        <button
          onClick={onBook}
          className="w-full py-4 rounded-2xl text-white font-extrabold text-base btn-press shadow-xl flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#0B3D66,#072A4A)' }}
        >
          <CheckCircle2 size={18} /> Book {w.name.split(' ')[0]} Now
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-2">Free cancellation within 1 hour of booking</p>
      </div>
    </div>
  );
}

// ─── BOOKING CONFIRMED ────────────────────────────────────────────────────────
function BookingConfirmed({ worker, onViewBookings }: { worker: ProviderProfile; onViewBookings: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ background: 'linear-gradient(180deg,#EAF2FB 0%,#f8fafc 100%)' }}>
      <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-2xl animate-bounce-in">
        <CheckCircle2 size={44} color="white" strokeWidth={2.5} />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Booking Confirmed!</h2>
      <p className="text-sm text-slate-600 max-w-xs leading-relaxed mb-1">
        <strong>{worker.name}</strong> has received your booking request and will reach you shortly.
      </p>
      <p className="text-xs text-slate-400 mb-8">Estimated arrival: <strong>30–45 minutes</strong></p>

      <div className="w-full max-w-xs bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 text-left">
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
          <span>Service fee</span><span className="text-slate-800 font-semibold">{formatINR(worker.hourly_rate)}</span>
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
          <span>Platform fee (8%)</span><span className="text-slate-800 font-semibold">{formatINR(calculateCommission(worker.hourly_rate, 0.08))}</span>
        </div>
        <div className="h-px bg-slate-100 my-2" />
        <div className="flex justify-between text-sm font-bold text-slate-900">
          <span>Total</span><span>{formatINR(worker.hourly_rate + calculateCommission(worker.hourly_rate, 0.08))}</span>
        </div>
      </div>

      <button
        onClick={onViewBookings}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-extrabold btn-press shadow-lg"
        style={{ background: 'linear-gradient(135deg,#0B3D66,#072A4A)' }}
      >
        Track My Booking →
      </button>
    </div>
  );
}

// ─── HOME TAB (Find Services) ─────────────────────────────────────────────────
function HomeTab({ workers, onSelect, status, placeName }: { workers: ProviderProfile[]; onSelect: (w: ProviderProfile) => void; status: string; placeName: string | null }) {
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = workers.filter(w => {
    const matchCat = activeCat === 'All' || w.category === activeCat;
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <LocationBadge status={status} placeName={placeName} />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center btn-press relative">
              <Bell size={17} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Avatar size={36} name="Customer" />
          </div>
        </div>

        {/* Search */}
        <label className="flex items-center gap-2.5 bg-slate-100 rounded-xl px-3.5 py-2.5 input-ring transition-all border border-transparent">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services or providers…"
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
          />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
        </label>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const isActive = activeCat === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setActiveCat(c.name)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all btn-press ${isActive ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
                style={isActive ? { background: c.color } : {}}
              >
                <Icon size={13} />{c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#0B3D66,#072A4A)' }}>
          <div className="p-4 pr-24">
            <p className="text-[10px] font-bold text-white/60 mb-1 tracking-widest uppercase">Offer • New Users</p>
            <p className="text-lg font-extrabold text-white leading-tight">First Booking<br />₹50 Off!</p>
            <button className="mt-2.5 px-4 py-1.5 rounded-full text-xs font-bold btn-press" style={{ background: GOLD, color: '#fff' }}>Claim Now →</button>
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
            <Sparkles size={72} color="white" />
          </div>
        </div>

        {/* Providers list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900">
              {activeCat === 'All' ? 'All Nearby Providers' : `${activeCat} Providers`}
              <span className="text-sm font-normal text-slate-400 ml-1.5">({filtered.length})</span>
            </h2>
            <button className="flex items-center gap-1 text-xs font-semibold text-slate-500 btn-press">
              <SlidersHorizontal size={13} /> Filter
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No providers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((w, i) => (
                <div key={w.id} className={`delay-${Math.min(i * 100, 400)}`}>
                  <WorkerCard w={w} onSelect={() => onSelect(w)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BOOKINGS TAB ─────────────────────────────────────────────────────────────
function BookingsTab({ bookings, onMarkComplete, onRate }: { bookings: Booking[]; onMarkComplete: (id: string) => void; onRate: (id: string, r: number) => void }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4">
        <h2 className="text-lg font-extrabold text-slate-900">My Bookings</h2>
        <p className="text-xs text-slate-400 mt-0.5">{bookings.length} total</p>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-3">
        {bookings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-slate-600">No bookings yet</p>
            <p className="text-xs mt-1">Find a service provider from the Home tab</p>
          </div>
        ) : bookings.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar size={40} name={b.provider?.name || 'P'} />
                <div>
                  <p className="font-bold text-sm text-slate-900">{b.provider?.name}</p>
                  <p className="text-xs text-slate-500">{b.service_type}</p>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {b.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
              <span>Total: <strong className="text-slate-800">{formatINR(b.total_amount)}</strong></span>
              <span>Platform fee: <strong className="text-slate-800">{formatINR(b.commission_amount)}</strong></span>
            </div>

            {b.status === 'pending' && (
              <button
                onClick={() => onMarkComplete(b.id)}
                className="w-full py-2.5 rounded-xl text-white text-xs font-bold btn-press"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
              >
                ✓ Mark as Completed
              </button>
            )}

            {b.status === 'completed' && !b.rating && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Rate your experience:</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => onRate(b.id, s)} className="flex-1 py-2 rounded-xl bg-slate-100 text-amber-500 font-bold text-sm btn-press hover:bg-amber-50">
                      {'★'.repeat(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {b.status === 'completed' && b.rating && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl p-3">
                <CheckCircle2 size={14} /> You rated this {b.rating} star{b.rating > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
function ProfileTab({ onLogout }: { onLogout: () => void }) {
  const items = [
    { icon: Phone, label: 'Phone Number', value: '+91 98765 43210' },
    { icon: MapPin, label: 'Default Area', value: 'Shivamogga, Karnataka' },
    { icon: ShieldCheck, label: 'Verification', value: 'Aadhaar Verified ✓' },
    { icon: Wallet, label: 'Wallet Balance', value: '₹0.00' },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Hero */}
      <div className="px-4 pt-5 pb-4" style={{ background: 'linear-gradient(145deg,#0B3D66,#072A4A)' }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <Avatar size={60} name="Rahul Customer" />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full ring-2 ring-white flex items-center justify-center">
              <BadgeCheck size={11} color="white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Rahul Customer</h2>
            <p className="text-xs text-white/60">Member since 2024 · Customer</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-xs text-white/70 font-medium">4.9 · Trusted Buyer</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[{ v: '12', l: 'Bookings' },{ v: '4.9★', l: 'Avg Rating' },{ v: '₹4,200', l: 'Total Spent' }].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-sm font-extrabold text-white">{s.v}</p>
              <p className="text-[10px] text-white/60">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pt-4 pb-6 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`flex items-center justify-between px-4 py-3.5 ${i < items.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: SKY }}>
                    <Icon size={15} color={NAVY} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {[
            { icon: Settings, label: 'App Settings' },
            { icon: ShieldCheck, label: 'Privacy & Security' },
            { icon: MessageSquare, label: 'Help & Support' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition ${i < 2 ? 'border-b border-slate-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Icon size={17} className="text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            );
          })}
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-bold text-sm flex items-center justify-center gap-2 btn-press hover:bg-red-50 transition"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── PROVIDER DASHBOARD ───────────────────────────────────────────────────────
function ProviderDashboard({ onLogout }: { onLogout: () => void }) {
  const [isOnline, setIsOnline] = useState(true);

  const stats = [
    { label: "Today's Earnings", value: '₹840', icon: IndianRupee, color: '#10b981', bg: '#d1fae5' },
    { label: 'Jobs Completed', value: '12', icon: CheckCircle2, color: '#0B3D66', bg: '#EAF2FB' },
    { label: 'Avg Rating', value: '4.9★', icon: Star, color: '#F5A623', bg: '#FEF3C7' },
    { label: 'Response Rate', value: '98%', icon: TrendingUp, color: '#8B5CF6', bg: '#EDE9FE' },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ background: 'linear-gradient(145deg,#0B3D66,#072A4A)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar size={48} name="Rajesh Kumar" />
              {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 badge-online rounded-full ring-2 ring-white" />}
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Rajesh Kumar</p>
              <p className="text-xs text-white/60">Master Electrician · NT-9921</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-xl glass btn-press">
            <LogOut size={16} color="white" />
          </button>
        </div>

        {/* Online Toggle */}
        <div className="glass-dark rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">{isOnline ? '🟢 You are Online' : '⭕ You are Offline'}</p>
            <p className="text-xs text-white/60 mt-0.5">{isOnline ? 'Customers can see and book you' : 'You will not receive job requests'}</p>
          </div>
          <button
            onClick={() => setIsOnline(o => !o)}
            className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${isOnline ? 'justify-end' : 'justify-start'}`}
            style={{ background: isOnline ? '#10b981' : '#64748b' }}
          >
            <span className="w-5 h-5 bg-white rounded-full mx-0.5 shadow-sm" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pt-4 space-y-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
                <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* New Job Requests */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Job Requests</h3>
            <span className="badge-featured text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2 New</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Arun Verma', service: 'Fan Installation', dist: '0.8 km', time: '2 min ago', rate: '₹350' },
              { name: 'Sunita Reddy', service: 'Wiring Fault Fix', dist: '1.2 km', time: '5 min ago', rate: '₹500' },
            ].map(job => (
              <div key={job.name} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{job.name}</p>
                  <p className="text-[11px] text-slate-500">{job.service} · {job.dist}</p>
                  <p className="text-[10px] text-slate-400">{job.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-900">{job.rate}</p>
                  <button className="mt-1 px-3 py-1 rounded-lg text-[10px] font-bold text-white btn-press" style={{ background: NAVY }}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings chart placeholder */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Weekly Earnings</h3>
            <ArrowUpRight size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[35,58,42,75,50,84,68].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all" style={{ height: `${h}%`, background: i === 5 ? 'linear-gradient(to top,#0B3D66,#1a5a96)' : '#EAF2FB' }} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <span key={i} className={`text-[9px] font-bold flex-1 text-center ${i === 5 ? 'text-slate-800' : 'text-slate-400'}`}>{d}</span>
            ))}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-2 text-center">+23% vs last week</p>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tabs, active, onChange }: { tabs: any[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="grid border-t border-slate-100 bg-white" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex flex-col items-center gap-1 py-3 relative transition-colors btn-press ${isActive ? 'text-blue-900' : 'text-slate-400'}`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: NAVY }} />
            )}
            <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-medium'}`}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<'splash' | 'login' | 'provider-login' | 'customer' | 'provider'>('splash');
  const [tab, setTab] = useState('home');
  const [selectedWorker, setSelectedWorker] = useState<ProviderProfile | null>(null);
  const [justBooked, setJustBooked] = useState<ProviderProfile | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('success');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers] = useState<ProviderProfile[]>(INITIAL_WORKERS);
  const { loc, status, placeName } = useUserLocation();

  const notify = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  const nearbyWorkers = sortProvidersByDistanceAndFeatured(workers, loc.lat, loc.lng);

  const handleBook = (w: ProviderProfile) => {
    const commission = calculateCommission(w.hourly_rate, 0.08);
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      customer_id: 'cust-1',
      provider_id: w.id,
      provider: w,
      service_type: w.category,
      status: 'pending',
      total_amount: w.hourly_rate,
      commission_amount: commission,
      created_at: new Date().toISOString(),
    };
    setBookings(prev => [newBooking, ...prev]);
    setJustBooked(w);
    setSelectedWorker(null);
  };

  const customerTabs = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'map', label: 'Nearby', icon: MapPin },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  const providerTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { key: 'jobs', label: 'Jobs', icon: Briefcase },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-300 p-0 sm:p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%,#1a5a96 0%,#0B3D66 40%,#051e33 100%)' }}>
      <div className="w-full max-w-sm h-screen sm:h-[844px] sm:rounded-[2.8rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-white flex flex-col relative sm:border-[10px] sm:border-slate-900">

        {/* Notch simulation */}
        <div className="hidden sm:flex items-center justify-center py-1.5 bg-slate-900">
          <div className="w-24 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* App Body */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {screen === 'splash' && <SplashScreen onDone={() => setScreen('login')} />}

          {screen === 'login' && (
            <div className="flex-1 overflow-hidden">
              <PhoneOTPLogin role="customer" onLogin={() => setScreen('customer')} goOther={() => setScreen('provider-login')} notify={notify} />
            </div>
          )}

          {screen === 'provider-login' && (
            <div className="flex-1 overflow-hidden">
              <PhoneOTPLogin role="provider" onLogin={() => { setScreen('provider'); setTab('dashboard'); }} goOther={() => setScreen('login')} notify={notify} />
            </div>
          )}

          {screen === 'customer' && (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                {selectedWorker && !justBooked && (
                  <WorkerDetail w={selectedWorker} onBook={() => handleBook(selectedWorker)} onBack={() => setSelectedWorker(null)} />
                )}
                {justBooked && (
                  <BookingConfirmed worker={justBooked} onViewBookings={() => { setJustBooked(null); setTab('bookings'); }} />
                )}
                {!selectedWorker && !justBooked && tab === 'home' && (
                  <HomeTab workers={nearbyWorkers} onSelect={setSelectedWorker} status={status} placeName={placeName} />
                )}
                {!selectedWorker && !justBooked && tab === 'map' && (
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-100 bg-white">
                      <h2 className="text-base font-extrabold text-slate-900">Nearby Map</h2>
                      <LocationBadge status={status} placeName={placeName} />
                    </div>
                    <div className="flex-1 min-h-0">
                      <InteractiveMap userLoc={loc} workers={nearbyWorkers} onSelectWorker={setSelectedWorker} />
                    </div>
                    <div className="px-4 py-2 bg-white border-t border-slate-100">
                      <p className="text-[11px] text-slate-400 text-center">🔵 You · 🟡 Featured Providers · ⬤ Providers — Tap to book</p>
                    </div>
                  </div>
                )}
                {!selectedWorker && !justBooked && tab === 'bookings' && (
                  <BookingsTab bookings={bookings} onMarkComplete={id => { setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b)); notify('Job marked complete! ✓'); }} onRate={(id, r) => { setBookings(prev => prev.map(b => b.id === id ? { ...b, rating: r } : b)); notify(`Rated ${r} stars! Thank you.`); }} />
                )}
                {!selectedWorker && !justBooked && tab === 'profile' && (
                  <ProfileTab onLogout={() => setScreen('login')} />
                )}
              </div>

              {!selectedWorker && !justBooked && (
                <BottomNav tabs={customerTabs} active={tab} onChange={setTab} />
              )}
            </>
          )}

          {screen === 'provider' && (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                {tab === 'dashboard' && <ProviderDashboard onLogout={() => setScreen('login')} />}
                {tab === 'jobs' && (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">Job history coming soon</p>
                    </div>
                  </div>
                )}
                {tab === 'profile' && <ProfileTab onLogout={() => setScreen('login')} />}
              </div>
              <BottomNav tabs={providerTabs} active={tab} onChange={setTab} />
            </>
          )}
        </div>

        <Toast message={toast} type={toastType} />
      </div>
    </div>
  );
}
