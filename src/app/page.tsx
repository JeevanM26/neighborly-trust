"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Search, Zap, Wrench, Hammer, Home as HomeIcon, Bell,
  User, Star, ShieldCheck, Phone, MessageSquare, MapPin, Calendar,
  Menu, Globe, Volume2, Mic, LogOut, CheckCircle2, Clock, TrendingUp,
  Briefcase, Mail, Lock, CreditCard, Plus, Navigation, X, IndianRupee, Trash2,
  AlertCircle
} from "lucide-react";

/* ---------------------------------------------------------
   NEIGHBORLY TRUST — prototype
   Palette: Navy #0B3D66 / Deep Navy #072A4A / Sky tint #EAF2FB
   Body: Inter-esque system stack. Big tap targets for rural/low-literacy UX.
--------------------------------------------------------- */

const NAVY = "#0B3D66";
const NAVY_DEEP = "#072A4A";
const SKY = "#EAF2FB";
const GOLD = "#F5A623";

const LANGS = ["English", "हिन्दी", "বাংলা", "తెలుగు", "मराठी", "தமிழ்", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം", "ਪੰਜਾਬੀ"];

const CATEGORIES = [
  { name: "Electrician", icon: Zap },
  { name: "Plumber", icon: Wrench },
  { name: "Carpenter", icon: Hammer },
  { name: "Home Clean", icon: HomeIcon },
];

// Fallback center used until the user's live location is available (or if they decline).
const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 }; // Shivamogga, Karnataka

const WORKERS = [
  {
    id: 1, name: "Jim Caldwell", role: "Master Electrician", category: "Electrician", rating: 4.9, reviews: 124,
    lat: 13.9381, lng: 75.5745, available: "Available today", tags: ["Licensed", "Insured", "20+ Yrs Exp."],
    icon: Zap,
    about: "Reliable electrical work for homes and farms. I specialize in residential wiring, panel upgrades, and barn lighting — from historic farmhouses to modern setups.",
    area: "Serving Madison County & Areas",
  },
  {
    id: 2, name: "Sarah Jenkins", role: "Plumbing Specialist", category: "Plumber", rating: 4.8, reviews: 89,
    lat: 13.9142, lng: 75.5812, available: "Emergency service", tags: ["Licensed", "Insured", "10+ Yrs Exp."],
    icon: Wrench,
    about: "Fast, honest plumbing repairs — leaks, pipe fitting, borewell connections, and tank installs, done right the first time.",
    area: "Serving Green Valley & Areas",
  },
  {
    id: 3, name: "Robert Evans", role: "Master Carpenter", category: "Carpenter", rating: 5.0, reviews: 215,
    lat: 13.9335, lng: 75.5622, available: "Highly rated", tags: ["Licensed", "Insured", "25+ Yrs Exp."],
    icon: Hammer,
    about: "Custom furniture, door and window fitting, and general woodwork repairs — built to last a generation.",
    area: "Serving Central Market & Areas",
  },
  {
    id: 4, name: "Meena Kulkarni", role: "Home Cleaning Expert", category: "Home Clean", rating: 4.7, reviews: 63,
    lat: 13.9218, lng: 75.5758, available: "Available today", tags: ["Verified", "Eco-Friendly", "5+ Yrs Exp."],
    icon: HomeIcon,
    about: "Deep cleaning, dusting, and sanitizing for homes and small offices. Bring my own eco-friendly supplies on request.",
    area: "Serving Green Valley & Areas",
  },
];

// Distance between two lat/lng points in km (haversine formula).
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

// Reverse-geocode lat/lng into a human-readable place name via OpenStreetMap Nominatim.
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return a.village || a.town || a.suburb || a.county || a.city || data.display_name?.split(",")[0] || null;
  } catch (e) {
    return null;
  }
}

// Hook: tries to get the browser's real GPS location, falls back to DEFAULT_LOCATION.
function useUserLocation() {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState("loading"); // loading | granted | denied
  const [placeName, setPlaceName] = useState<string | null>(null);

  const request = () => {
    if (!navigator.geolocation) {
      setLoc(DEFAULT_LOCATION);
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(next);
        setStatus("granted");
        const name = await reverseGeocode(next.lat, next.lng);
        if (name) setPlaceName(name);
      },
      () => {
        setLoc(DEFAULT_LOCATION);
        setStatus("denied");
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => { request(); }, []);

  return { loc: loc || DEFAULT_LOCATION, status, placeName, retry: request };
}

// Adds a live `distanceKm`/`distanceLabel` to each worker relative to `loc`, nearest first.
function withDistances(workers: typeof WORKERS, loc: { lat: number; lng: number }) {
  return workers
    .map((w) => {
      const km = distanceKm(loc.lat, loc.lng, w.lat, w.lng);
      return { ...w, distanceKm: km, distance: formatDistance(km) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function LocationBanner({ status, placeName, retry }: { status: string; placeName: string | null; retry: () => void }) {
  if (status === "granted") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold mt-2" style={{ color: "#16A34A" }}>
        <Navigation size={13} />
        {placeName ? `Showing workers near ${placeName}` : "Showing workers near your current location"}
      </div>
    );
  }
  if (status === "loading") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold mt-2 text-slate-400">
        <Navigation size={13} className="animate-pulse" /> Finding your location…
      </div>
    );
  }
  return (
    <button
      onClick={retry}
      className="w-full flex items-center gap-2 rounded-lg mt-2 px-3 py-2 text-xs font-semibold"
      style={{ background: "#FEF3C7", color: "#92400E" }}
    >
      <Navigation size={13} className="flex-shrink-0" />
      <span className="flex-1 text-left">Location off — showing default area. Tap to enable for nearby results.</span>
    </button>
  );
}

const JOBS = [
  { id: 1, title: "Lawn Mowing & Cleanup", price: "₹850", tag: "Premium", loc: "Green Valley, Sector 4 • 1.2 km away", icon: HomeIcon },
  { id: 2, title: "Package Pickup", price: "₹150", tag: "Standard", loc: "Central Market Hub • 0.5 km away", icon: Briefcase },
];

/* ---------- small building blocks ---------- */

function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 rounded-full active:bg-slate-100">
            <ChevronLeft size={26} color={NAVY} />
          </button>
        )}
        <span className="font-bold text-lg" style={{ color: NAVY }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#0B3D66", "#2563EB", "#0D9488", "#7C3AED", "#C2410C", "#059669"];
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ size = 36, name = "User", onClick }: { size?: number; name?: string; onClick?: () => void }) {
  const content = (
    <div
      className="rounded-full flex items-center justify-center ring-2 ring-white shadow font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
  return onClick ? (
    <button onClick={onClick} aria-label="Open profile">{content}</button>
  ) : (
    content
  );
}

function ServiceImage({ icon: Icon, className, iconSize = 22 }: { icon: React.ElementType; className?: string; iconSize?: number }) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: SKY }}>
      <Icon size={iconSize} color={NAVY} />
    </div>
  );
}

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg flex items-center gap-2" style={{ background: NAVY_DEEP, maxWidth: "90%" }}>
      <CheckCircle2 size={15} className="flex-shrink-0" />
      <span className="truncate">{message}</span>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      <Star size={14} fill="currentColor" strokeWidth={0} />
      <span className="text-sm font-semibold text-slate-700">{rating}</span>
    </span>
  );
}

function BottomNav({ tabs, active, onChange }: { tabs: { key: string; label: string; icon: React.ElementType }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="grid border-t border-slate-100 bg-white sticky bottom-0" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="flex flex-col items-center gap-1 py-2.5"
            style={{ color: isActive ? NAVY : "#94A3B8" }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LangChips({ selected, onSelect, dark }: { selected: string; onSelect: (l: string) => void; dark?: boolean }) {
  return (
    <div className="mt-6">
      <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${dark ? "text-white/80" : "text-slate-500"}`}>
        <Globe size={13} /> SELECT LANGUAGE / भाषा चुनें
      </div>
      <div className="flex flex-wrap gap-2">
        {LANGS.map((l) => {
          const isSel = l === selected;
          return (
            <button
              key={l}
              onClick={() => onSelect(l)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
              style={
                isSel
                  ? { background: NAVY, color: "white", borderColor: NAVY }
                  : dark
                  ? { background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.25)" }
                  : { background: "white", color: NAVY, borderColor: "#CBD5E1" }
              }
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- screens ---------- */

// ─── PHONE OTP LOGIN — Customer ───────────────────────────────────────────────
function CustomerLogin({ onLogin, goProvider, lang, setLang, notify }: {
  onLogin: () => void; goProvider: () => void; lang: string; setLang: (l: string) => void; notify: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = () => {
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) { setError("Please enter a valid 10-digit mobile number."); return; }
    if (!consent) { setError("Please accept the privacy consent."); return; }
    setError(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      setCountdown(30);
      notify("OTP sent to +91 " + phone);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    }, 800);
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 3) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const verifyOTP = () => {
    const code = otp.join("");
    if (code.length < 4) { setError("Please enter the 4-digit OTP."); return; }
    if (code !== "1234") { setError("Incorrect OTP. Try 1234 for demo."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 600);
  };

  if (step === "otp") {
    return (
      <div className="h-full overflow-y-auto" style={{ background: SKY }}>
        <div className="px-6 pt-4 pb-2">
          <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button className="flex-1 py-2 rounded-full text-sm font-bold text-white" style={{ background: NAVY }}>
              I'm a Customer
            </button>
            <button onClick={goProvider} className="flex-1 py-2 rounded-full text-sm font-bold text-slate-500">
              I'm a Worker
            </button>
          </div>
        </div>
        <div className="px-6 pb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: NAVY }}>
              <HomeIcon color="white" size={30} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>Neighborly Trust</h1>
            <p className="text-slate-500 text-sm mt-0.5">Local reliability you can count on.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <button onClick={() => { setStep("details"); setOtp(["","","",""]); setError(""); }} className="flex items-center gap-1 text-xs font-semibold mb-3" style={{ color: NAVY }}>
              <ChevronLeft size={14} /> Change number
            </button>
            <h2 className="text-lg font-bold text-center mb-1" style={{ color: NAVY_DEEP }}>Enter OTP</h2>
            <p className="text-center text-xs text-slate-500 mb-1">Sent to +91 {phone}</p>
            <p className="text-center text-xs font-semibold mb-4" style={{ color: NAVY }}>Demo mode: use OTP <strong>1234</strong></p>

            <div className="flex justify-center gap-3 mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKey(e, idx)}
                  className="w-14 h-14 text-center text-2xl font-extrabold border-2 rounded-xl outline-none transition-all"
                  style={{ borderColor: digit ? NAVY : "#CBD5E1", background: digit ? SKY : "white" }}
                />
              ))}
            </div>

            {error && <p className="text-xs font-semibold text-red-600 mb-2">{error}</p>}

            <button
              onClick={verifyOTP}
              disabled={loading || otp.join("").length < 4}
              className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow active:opacity-80 disabled:opacity-50"
              style={{ background: NAVY_DEEP }}
            >
              {loading ? "Verifying…" : "Verify & Continue →"}
            </button>

            <div className="text-center mt-3">
              {countdown > 0 ? (
                <p className="text-xs text-slate-400">Resend OTP in <strong>{countdown}s</strong></p>
              ) : (
                <button onClick={sendOTP} className="text-xs font-semibold underline" style={{ color: NAVY }}>Resend OTP</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: SKY }}>
      <div className="px-6 pt-4 pb-2">
        <div className="flex bg-white rounded-full p-1 shadow-sm">
          <button className="flex-1 py-2 rounded-full text-sm font-bold text-white" style={{ background: NAVY }}>
            I'm a Customer
          </button>
          <button onClick={goProvider} className="flex-1 py-2 rounded-full text-sm font-bold text-slate-500">
            I'm a Worker
          </button>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: NAVY }}>
            <HomeIcon color="white" size={30} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>Neighborly Trust</h1>
          <p className="text-slate-500 text-sm mt-0.5">Local reliability you can count on.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="text-lg font-bold text-center mb-4" style={{ color: NAVY_DEEP }}>Customer Login</h2>
          <p className="text-xs text-slate-500 text-center mb-4">Enter your name and mobile number. We'll send you a 4-digit OTP.</p>

          <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <User size={18} className="text-slate-400" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full outline-none text-sm" />
          </label>

          <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <div className="flex items-center gap-1 flex-shrink-0 border-r border-slate-300 pr-2 mr-1">
              <span className="text-sm">🇮🇳</span>
              <span className="text-sm font-semibold text-slate-600">+91</span>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Mobile Number"
              inputMode="numeric"
              maxLength={10}
              className="w-full outline-none text-sm"
            />
          </label>

          <label className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-800 flex-shrink-0"
            />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Privacy Consent (DPDP Act 2023):</strong> I allow Neighborly Trust to use my mobile number and GPS location to connect me with nearby verified service providers.
            </p>
          </label>

          {error && <p className="text-xs font-semibold text-red-600 mb-2">{error}</p>}

          <button
            onClick={sendOTP}
            disabled={loading}
            className="w-full mt-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow active:opacity-80"
            style={{ background: NAVY_DEEP }}
          >
            {loading ? "Sending OTP…" : <><Phone size={15} /> Send OTP →</>}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-200 flex-1" /><span className="text-xs text-slate-400">or</span><div className="h-px bg-slate-200 flex-1" />
          </div>

          <button onClick={sendOTP} className="w-full py-3 rounded-xl font-bold border-2 active:opacity-80" style={{ borderColor: NAVY, color: NAVY }}>
            Join as a Customer
          </button>

          <LangChips selected={lang} onSelect={setLang} />
        </div>

        <button
          onClick={goProvider}
          className="w-full mt-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          style={{ background: "#DCEAFB", color: NAVY }}
        >
          <Wrench size={16} /> Join as a Service Provider
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-6">© 2024 Neighborly Trust Inc.</p>
      </div>
    </div>
  );
}

// ─── PHONE OTP LOGIN — Provider ───────────────────────────────────────────────
function ProviderLogin({ onLogin, goCustomer, notify }: {
  onLogin: () => void; goCustomer: () => void; notify: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = () => {
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) { setError("Please enter a valid 10-digit mobile number."); return; }
    setError(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      setCountdown(30);
      notify("OTP sent to +91 " + phone);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    }, 800);
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 3) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const verifyOTP = () => {
    const code = otp.join("");
    if (code.length < 4) { setError("Please enter the 4-digit OTP."); return; }
    if (code !== "1234") { setError("Incorrect OTP. Try 1234 for demo."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 600);
  };

  if (step === "otp") {
    return (
      <div className="h-full overflow-y-auto" style={{ background: SKY }}>
        <div className="px-6 pt-4 pb-2">
          <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button onClick={goCustomer} className="flex-1 py-2 rounded-full text-sm font-bold text-slate-500">I'm a Customer</button>
            <button className="flex-1 py-2 rounded-full text-sm font-bold text-white" style={{ background: NAVY }}>I'm a Worker</button>
          </div>
        </div>
        <div className="px-6 pb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck color={NAVY} size={26} />
              <h1 className="text-xl font-extrabold" style={{ color: NAVY }}>Neighborly Trust</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5 border" style={{ borderColor: NAVY_DEEP }}>
            <button onClick={() => { setStep("details"); setOtp(["","","",""]); setError(""); }} className="flex items-center gap-1 text-xs font-semibold mb-3" style={{ color: NAVY }}>
              <ChevronLeft size={14} /> Change number
            </button>
            <h2 className="text-xl font-extrabold text-center" style={{ color: NAVY_DEEP }}>Enter OTP</h2>
            <p className="text-center text-xs text-slate-500 mt-1 mb-1">Sent to +91 {phone}</p>
            <p className="text-center text-xs font-semibold mb-4" style={{ color: NAVY }}>Demo mode: use OTP <strong>1234</strong></p>

            <div className="flex justify-center gap-3 mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKey(e, idx)}
                  className="w-14 h-14 text-center text-2xl font-extrabold border-2 rounded-xl outline-none transition-all"
                  style={{ borderColor: digit ? NAVY : "#CBD5E1", background: digit ? SKY : "white" }}
                />
              ))}
            </div>

            {error && <p className="text-xs font-semibold text-red-600 mb-2">{error}</p>}

            <button
              onClick={verifyOTP}
              disabled={loading || otp.join("").length < 4}
              className="w-full py-3 rounded-xl text-white font-bold shadow active:opacity-80 disabled:opacity-50"
              style={{ background: NAVY_DEEP }}
            >
              {loading ? "Verifying…" : "Verify & Start Working →"}
            </button>

            <div className="text-center mt-3">
              {countdown > 0 ? (
                <p className="text-xs text-slate-400">Resend OTP in <strong>{countdown}s</strong></p>
              ) : (
                <button onClick={sendOTP} className="text-xs font-semibold underline" style={{ color: NAVY }}>Resend OTP</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: SKY }}>
      <div className="px-6 pt-4 pb-2">
        <div className="flex bg-white rounded-full p-1 shadow-sm">
          <button onClick={goCustomer} className="flex-1 py-2 rounded-full text-sm font-bold text-slate-500">
            I'm a Customer
          </button>
          <button className="flex-1 py-2 rounded-full text-sm font-bold text-white" style={{ background: NAVY }}>
            I'm a Worker
          </button>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck color={NAVY} size={26} />
            <h1 className="text-xl font-extrabold" style={{ color: NAVY }}>Neighborly Trust</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 border" style={{ borderColor: NAVY_DEEP }}>
          <h2 className="text-xl font-extrabold text-center" style={{ color: NAVY_DEEP }}>Provider Login</h2>
          <p className="text-center text-sm text-slate-500 mt-1 mb-4">Enter your name and mobile number to receive an OTP.</p>

          <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <User size={18} className="text-slate-400" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajesh Kumar" className="w-full outline-none text-sm bg-transparent" />
          </label>

          <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <div className="flex items-center gap-1 flex-shrink-0 border-r border-slate-300 pr-2 mr-1">
              <span className="text-sm">🇮🇳</span>
              <span className="text-sm font-semibold text-slate-600">+91</span>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Mobile Number"
              inputMode="numeric"
              maxLength={10}
              className="w-full outline-none text-sm bg-transparent"
            />
          </label>

          {error && <p className="text-xs font-semibold text-red-600 mb-2">{error}</p>}

          <button
            onClick={sendOTP}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-white font-bold shadow active:opacity-80"
            style={{ background: NAVY_DEEP }}
          >
            {loading ? "Sending OTP…" : "Send OTP →"}
          </button>

          <p className="text-center text-sm mt-4">
            Looking for a service?{" "}
            <button onClick={goCustomer} className="font-bold underline" style={{ color: NAVY }}>Customer Login</button>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
            📞 Need help? <a href="tel:18008787289" className="underline font-semibold" style={{ color: NAVY }}>Call 1-800-TRUST-AZURE</a>
          </p>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-6">© 2024 Neighborly Trust Inc.</p>
      </div>
    </div>
  );
}

function FindServices({ onOpenWorker, profileImg, onOpenProfile }: { onOpenWorker: (w: any) => void; profileImg: string; onOpenProfile: () => void }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { loc, status, placeName, retry } = useUserLocation();

  const nearby = withDistances(WORKERS, loc);
  const filtered = nearby.filter((w) => {
    const matchesCategory = !category || w.category === category;
    const matchesQuery = !query || w.name.toLowerCase().includes(query.toLowerCase()) || w.role.toLowerCase().includes(query.toLowerCase()) || w.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <span className="font-extrabold text-lg" style={{ color: NAVY }}>Neighborly Trust</span>
        <Avatar size={34} name={profileImg} onClick={onOpenProfile} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h2 className="text-xl font-extrabold mt-4 mb-2" style={{ color: NAVY_DEEP }}>Find Services</h2>
        <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Electricians, Plumbers..."
            className="w-full outline-none text-sm"
          />
        </label>
        <LocationBanner status={status} placeName={placeName} retry={retry} />

        <div className="flex items-center justify-between mt-5 mb-2">
          <h3 className="font-bold text-slate-800">Categories</h3>
          {category && (
            <button onClick={() => setCategory(null)} className="text-sm font-semibold" style={{ color: NAVY }}>
              Clear filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {CATEGORIES.map((c) => {
            const isSel = category === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setCategory(isSel ? null : c.name)}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 border-2 transition"
                style={isSel ? { background: NAVY, borderColor: NAVY } : { background: SKY, borderColor: "transparent" }}
              >
                <c.icon size={20} color={isSel ? "white" : NAVY} />
                <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: isSel ? "white" : "#334155" }}>{c.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: SKY }}>
            <ShieldCheck size={20} color={NAVY} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">Secure Your Home Today</span>
              <span className="text-[10px] text-slate-400 font-semibold">Ad</span>
            </div>
            <p className="text-xs text-slate-500">Affordable home insurance quotes from top providers.</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 mb-2">
          <h3 className="font-bold text-slate-800">{category ? `${category}s Nearby` : "Nearest to You"}</h3>
          <span className="text-xs text-slate-400">{filtered.length} found</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Search size={32} className="mx-auto text-slate-300" />
            <p className="text-slate-400 mt-2 text-sm">No matches. Try a different search or category.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => onOpenWorker(w)}
              className="w-full flex gap-3 rounded-xl border border-slate-100 shadow-sm p-2.5 text-left"
            >
              <ServiceImage icon={w.icon} className="w-16 h-16 rounded-lg flex-shrink-0" iconSize={26} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{w.name}</p>
                <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5" style={{ background: SKY, color: NAVY }}>
                  {w.role}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <Stars rating={w.rating} />
                  <span className="text-xs font-semibold flex items-center gap-1" style={{ color: NAVY }}>
                    <MapPin size={11} /> {w.distance}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

function MapNearby({ onOpenWorker, profileImg, onOpenProfile, notify }: { onOpenWorker: (w: any) => void; profileImg: string; onOpenProfile: () => void; notify: (m: string) => void }) {
  const [trade, setTrade] = useState("All Trades");
  const { loc, status, placeName, retry } = useUserLocation();
  const nearby = withDistances(WORKERS, loc);
  const visibleWorkers = trade === "All Trades" ? nearby : nearby.filter((w) => w.category === trade);
  const activeNearby = nearby.filter((w) => w.distanceKm <= 3).length;
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <span className="font-extrabold text-lg" style={{ color: NAVY }}>Neighborly Trust</span>
        <Avatar size={34} name={profileImg} onClick={onOpenProfile} />
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="px-4 pt-3"><LocationBanner status={status} placeName={placeName} retry={retry} /></div>
        <div className="relative h-44 m-4 mt-2 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg,#DCEFE0,#C9E4D3)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-200 animate-pulse" />
          </div>
          {[[20, 30], [70, 20], [40, 70], [80, 60]].map(([x, y], i) => (
            <MapPin key={i} size={18} color={NAVY} className="absolute" style={{ left: `${x}%`, top: `${y}%` }} />
          ))}
          <div className="absolute bottom-2 left-2 bg-white/95 rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow" style={{ color: NAVY }}>
            <ShieldCheck size={13} /> {activeNearby} Specialists Active Nearby
          </div>
        </div>

        <div className="px-4">
          <h3 className="font-bold text-slate-800 mb-2">Nearby Specialists</h3>
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {["All Trades", "Electrician", "Plumber", "Carpenter", "Home Clean"].map((t) => {
              const isSel = trade === t;
              return (
                <button
                  key={t}
                  onClick={() => setTrade(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                  style={isSel ? { background: NAVY, color: "white" } : { border: "1px solid #CBD5E1", color: "#475569" }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {visibleWorkers.map((w) => (
              <div key={w.id} className="rounded-xl border border-slate-100 shadow-sm p-3">
                <button onClick={() => onOpenWorker(w)} className="flex gap-3 text-left w-full">
                  <ServiceImage icon={w.icon} className="w-14 h-14 rounded-full" iconSize={22} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{w.name}</p>
                    <p className="text-xs font-semibold" style={{ color: NAVY }}>{w.role}</p>
                    <Stars rating={w.rating} />
                    <p className="text-xs text-slate-400 mt-0.5">{w.distance} • {w.available}</p>
                  </div>
                </button>
                <div className="flex gap-2 mt-2.5">
                  <button onClick={() => notify(`Calling ${w.name.split(" ")[0]}…`)} className="flex-1 py-2 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1 active:opacity-80" style={{ background: NAVY }}>
                    <Phone size={13} /> Call Now
                  </button>
                  <button onClick={() => notify(`Opening chat with ${w.name.split(" ")[0]}…`)} className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border active:opacity-80" style={{ borderColor: NAVY, color: NAVY }}>
                    <MessageSquare size={13} /> Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkerProfile({ worker, onBack, onBook, profileImg, notify }: { worker: any; onBack: () => void; onBook: () => void; profileImg: string; notify: (m: string) => void }) {
  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto" style={{ background: "#FDFBF8" }}>
      <TopBar title="Neighborly Trust" onBack={onBack} right={<Avatar size={32} name={profileImg} />} />
      <div className="px-4 pb-6">
        <div className="relative mt-3">
          <ServiceImage icon={worker.icon} className="w-full h-52 rounded-xl" iconSize={56} />
          <span className="absolute bottom-2 left-2 bg-blue-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={13} /> Verified Pro
          </span>
        </div>

        <h1 className="text-xl font-extrabold mt-3" style={{ color: NAVY_DEEP }}>{worker.name}</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Stars rating={worker.rating} /> <span className="text-sm text-slate-400">({worker.reviews}+ reviews)</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {worker.tags.map((t: string) => (
            <span key={t} className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ borderColor: NAVY, color: NAVY }}>{t}</span>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 p-3.5">
          <p className="flex items-center gap-1.5 font-bold text-slate-800 text-sm mb-1.5"><User size={15} /> About</p>
          <p className="text-sm text-slate-600 leading-relaxed">{worker.about}</p>
        </div>

        <div className="mt-4 rounded-xl p-4" style={{ background: SKY }}>
          <p className="text-sm text-slate-700 mb-3">Pricing and scheduling are negotiated directly with the worker.</p>
          <button onClick={() => notify(`Calling ${worker.name.split(" ")[0]}…`)} className="w-full py-3 rounded-full text-white font-bold flex items-center justify-center gap-2 mb-2 active:opacity-80" style={{ background: NAVY_DEEP }}>
            <Phone size={16} /> Call {worker.name.split(" ")[0]}
          </button>
          <button onClick={() => notify(`Opening chat with ${worker.name.split(" ")[0]}…`)} className="w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 border-2 active:opacity-80" style={{ borderColor: NAVY_DEEP, color: NAVY_DEEP }}>
            <MessageSquare size={16} /> Send Message
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 p-3.5">
          <p className="font-bold text-slate-800 text-sm mb-2">Location</p>
          <div className="h-24 rounded-lg" style={{ background: "linear-gradient(135deg,#DCEFE0,#C9E4D3)" }} />
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin size={12} /> {worker.area}</p>
        </div>

        <button
          onClick={onBook}
          className="w-full mt-4 py-3.5 rounded-full text-white font-bold shadow-lg"
          style={{ background: NAVY }}
        >
          Book {worker.name.split(" ")[0]}
        </button>
      </div>
    </div>
  );
}

function BookingConfirm({ worker, onDone }: { worker: any; onDone: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center" style={{ background: SKY }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: NAVY }}>
        <CheckCircle2 color="white" size={40} />
      </div>
      <h2 className="text-xl font-extrabold" style={{ color: NAVY_DEEP }}>Booking Requested!</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-xs">
        {worker.name} has been notified. They'll call or message you shortly to confirm timing and price.
      </p>
      <div className="bg-white rounded-xl p-4 mt-6 w-full max-w-xs text-left shadow-sm">
        <div className="flex items-center gap-3">
          <ServiceImage icon={worker.icon} className="w-11 h-11 rounded-full" iconSize={18} />
          <div>
            <p className="font-bold text-sm text-slate-800">{worker.name}</p>
            <p className="text-xs text-slate-500">{worker.role}</p>
          </div>
        </div>
      </div>
      <button onClick={onDone} className="w-full max-w-xs mt-6 py-3 rounded-full text-white font-bold" style={{ background: NAVY_DEEP }}>
        Back to Bookings
      </button>
    </div>
  );
}

function RateWorkerCard({ worker, existingRating, onSubmit }: { worker: any; existingRating: number; onSubmit: (r: number) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (existingRating) {
    return (
      <div className="rounded-xl border border-slate-100 p-3.5 mt-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "#16A34A" }}>
        <CheckCircle2 size={16} /> You rated {worker.name.split(" ")[0]} {existingRating} star{existingRating > 1 ? "s" : ""}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-100 p-3.5 mt-3">
      <p className="font-bold text-sm text-slate-800 mb-1">Rate your experience</p>
      <p className="text-xs text-slate-500 mb-2">How was the work {worker.name.split(" ")[0]} did for you?</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} aria-label={`Rate ${n} stars`}>
            <Star size={26} className={(hover || rating) >= n ? "text-amber-500" : "text-slate-200"} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
      <button
        disabled={rating === 0}
        onClick={() => onSubmit(rating)}
        className="w-full py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-40"
        style={{ background: NAVY_DEEP }}
      >
        Submit Rating
      </button>
    </div>
  );
}

function MyBookings({ bookings, onMarkComplete, onRate }: { bookings: any[]; onMarkComplete: (id: string) => void; onRate: (id: string, r: number) => void }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="My Bookings" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {bookings.length === 0 ? (
          <div className="text-center mt-16">
            <Calendar size={40} className="mx-auto text-slate-300" />
            <p className="text-slate-400 mt-3 text-sm">No bookings yet.<br />Find a service to get started.</p>
          </div>
        ) : (
          [...bookings].reverse().map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-100 shadow-sm p-3 mb-3">
              <div className="flex gap-3 items-center">
                <ServiceImage icon={b.worker.icon} className="w-14 h-14 rounded-lg" iconSize={22} />
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{b.worker.name}</p>
                  <p className="text-xs text-slate-500">{b.worker.role}</p>
                  <span
                    className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={b.status === "Completed" ? { background: "#DCFCE7", color: "#15803D" } : { background: "#FEF3C7", color: "#92400E" }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
              {b.status === "Pending Confirmation" && (
                <button
                  onClick={() => onMarkComplete(b.id)}
                  className="w-full mt-3 py-2 rounded-lg text-xs font-bold border-2"
                  style={{ borderColor: NAVY, color: NAVY }}
                >
                  Mark Job as Completed
                </button>
              )}
              {b.status === "Completed" && (
                <RateWorkerCard worker={b.worker} existingRating={b.rating} onSubmit={(r) => onRate(b.id, r)} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfileEditScreen({ onBack, profile, onSave }: { onBack: () => void; profile: any; onSave: (p: any) => void }) {
  const [draft, setDraft] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name: draft || profile.name, phone: phone || profile.phone });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="Profile Edit" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center mb-5">
          <Avatar size={72} name={draft || "User"} />
          <p className="text-xs text-slate-400 mt-2">Your initials are shown as your photo</p>
        </div>

        <label className="block text-xs font-bold text-slate-500 mb-1">FULL NAME</label>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm outline-none mb-4" />

        <label className="block text-xs font-bold text-slate-500 mb-1">PHONE NUMBER</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm outline-none mb-4" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-full text-white font-bold shadow disabled:opacity-60"
          style={{ background: NAVY_DEEP }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <p className="text-center text-sm font-semibold mt-3" style={{ color: "#16A34A" }}>✓ Profile updated</p>
        )}
      </div>
    </div>
  );
}

function LanguageScreen({ onBack, selected, onSelect }: { onBack: () => void; selected: string; onSelect: (l: string) => void }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="Language Preference" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-slate-500 mb-4">Choose the language you're most comfortable with. You can change this anytime.</p>
        <div className="grid grid-cols-2 gap-2.5">
          {LANGS.map((l) => {
            const isSel = l === selected;
            return (
              <button
                key={l}
                onClick={() => onSelect(l)}
                className="py-3 rounded-xl text-sm font-bold border-2 flex items-center justify-center gap-2"
                style={isSel ? { background: NAVY, borderColor: NAVY, color: "white" } : { borderColor: "#CBD5E1", color: "#334155" }}
              >
                {isSel && <CheckCircle2 size={15} />} {l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [alerts, setAlerts] = useState(true);
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(false);
  const Row = ({ title, sub, on, set }: { title: string; sub: string; on: boolean; set: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
      <div className="flex-1 pr-3">
        <p className="font-bold text-sm text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <button
        onClick={() => set(!on)}
        className="w-12 h-7 rounded-full flex items-center px-0.5 flex-shrink-0"
        style={{ background: on ? NAVY : "#E2E8F0", justifyContent: on ? "flex-end" : "flex-start" }}
      >
        <span className="w-6 h-6 bg-white rounded-full shadow" />
      </button>
    </div>
  );
  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="Notifications" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <Row title="Push Alerts" sub="New job requests and messages" on={alerts} set={setAlerts} />
        <Row title="SMS Updates" sub="Booking confirmations via text" on={sms} set={setSms} />
        <Row title="Email Summary" sub="Weekly activity summary" on={email} set={setEmail} />
      </div>
    </div>
  );
}

function Settings({ onLogout, profile, onSaveProfile, onOpenBookings }: { onLogout: () => void; profile: any; onSaveProfile: (p: any) => void; onOpenBookings: () => void }) {
  const [view, setView] = useState("main");
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const [lang, setLang] = useState("English");

  const Toggle = ({ on, set }: { on: boolean; set: (v: boolean) => void }) => (
    <button
      onClick={() => set(!on)}
      className="w-12 h-7 rounded-full flex items-center px-0.5 transition"
      style={{ background: on ? NAVY : "#E2E8F0", justifyContent: on ? "flex-end" : "flex-start" }}
    >
      <span className="w-6 h-6 bg-white rounded-full shadow" />
    </button>
  );
  const Row = ({ icon: Icon, title, sub, right, onClick }: { icon: React.ElementType; title: string; sub: string; right?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} disabled={!onClick} className="w-full flex items-center gap-3 py-3 text-left">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: NAVY }}>
        <Icon size={18} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      {right}
    </button>
  );
  const Section = ({ title }: { title: string }) => <p className="text-xs font-bold text-slate-400 mt-5 mb-1 tracking-wide">{title}</p>;

  if (view === "profile") return <ProfileEditScreen onBack={() => setView("main")} profile={profile} onSave={onSaveProfile} />;
  if (view === "language") return <LanguageScreen onBack={() => setView("main")} selected={lang} onSelect={(l) => { setLang(l); setView("main"); }} />;
  if (view === "notifications") return <NotificationsScreen onBack={() => setView("main")} />;

  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="Settings" right={<Avatar size={34} name={profile.name} />} />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <Section title="ACCOUNT" />
        <Row icon={User} title="Profile Edit" sub="Update your details & identity" onClick={() => setView("profile")} right={<span className="text-slate-300">›</span>} />
        <div className="h-px bg-slate-100" />
        <Row icon={Globe} title="Language Preference" sub="English, Hindi, Marathi, & more" onClick={() => setView("language")} right={<span className="text-sm text-slate-400">{lang} ›</span>} />

        <Section title="AUDIO & ACCESSIBILITY" />
        <Row icon={Volume2} title="App Sounds" sub="Feedback for clicks and actions" right={<Toggle on={sound} set={setSound} />} />
        <div className="h-px bg-slate-100" />
        <Row icon={Mic} title="Voice Guidance" sub="Assistance for rural & varied literacy" right={<Toggle on={voice} set={setVoice} />} />

        <Section title="PREFERENCES" />
        <Row icon={Bell} title="Notifications" sub="Alerts, SMS, and Email" onClick={() => setView("notifications")} right={<span className="text-slate-300">›</span>} />

        <Section title="MY BOOKINGS" />
        <Row icon={Calendar} title="Booking History" sub="View and manage your past services" onClick={onOpenBookings} right={<span className="text-slate-300">›</span>} />

        <button
          onClick={onLogout}
          className="w-full mt-6 py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2"
          style={{ borderColor: "#DC2626", color: "#DC2626" }}
        >
          <LogOut size={16} /> Logout
        </button>
        <p className="text-center text-xs text-slate-400 mt-4">Version 2.4.1 (Stable)<br />Neighborly Trust © 2024</p>
      </div>
    </div>
  );
}

function PostService({ onBack, onPost }: { onBack: () => void; onPost: (l: any) => void }) {
  const [service, setService] = useState("");
  const [rate, setRate] = useState("");
  const [desc, setDesc] = useState("");
  const [shareLoc, setShareLoc] = useState(true);

  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="Post a Service" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-slate-500 mb-4">List a service you offer so nearby customers can find and book you directly.</p>

        <label className="block text-xs font-bold text-slate-500 mb-1">SERVICE TYPE</label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setService(c.name)}
              className="flex flex-col items-center gap-1.5 rounded-xl py-3 border-2"
              style={service === c.name ? { background: NAVY, borderColor: NAVY } : { background: SKY, borderColor: "transparent" }}
            >
              <c.icon size={20} color={service === c.name ? "white" : NAVY} />
              <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: service === c.name ? "white" : "#334155" }}>{c.name}</span>
            </button>
          ))}
        </div>

        <label className="block text-xs font-bold text-slate-500 mb-1">STARTING RATE</label>
        <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-3 mb-4">
          <IndianRupee size={16} className="text-slate-400" />
          <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 300 per visit" className="w-full outline-none text-sm" />
        </label>

        <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIBE YOUR WORK</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Wiring repair, fan and light fitting, panel upgrades..."
          rows={4}
          className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm outline-none mb-4"
        />

        <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: SKY }}>
          <Navigation size={20} color={NAVY} />
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">Share Live Location</p>
            <p className="text-xs text-slate-500">Customers see your real-time location while you're online.</p>
          </div>
          <button
            onClick={() => setShareLoc(!shareLoc)}
            className="w-12 h-7 rounded-full flex items-center px-0.5 flex-shrink-0"
            style={{ background: shareLoc ? NAVY : "#CBD5E1", justifyContent: shareLoc ? "flex-end" : "flex-start" }}
          >
            <span className="w-6 h-6 bg-white rounded-full shadow" />
          </button>
        </div>

        <button
          disabled={!service}
          onClick={() => onPost({ service, rate: rate || "Ask for rate", desc: desc || "No description added.", shareLoc })}
          className="w-full mt-6 py-3.5 rounded-full text-white font-bold shadow disabled:opacity-40"
          style={{ background: NAVY_DEEP }}
        >
          Post Service
        </button>
      </div>
    </div>
  );
}

function MyListings({ listings, online, onRemove, onAdd }: { listings: any[]; online: boolean; onRemove: (i: number) => void; onAdd: () => void }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar title="My Listings" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-xl p-3.5 flex items-center gap-3 mb-4" style={{ background: online ? "#EAF7EE" : SKY }}>
          <div className="relative">
            <Navigation size={20} color={online ? "#16A34A" : NAVY} />
            {online && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-ping" />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">{online ? "Live location is ON" : "Live location is OFF"}</p>
            <p className="text-xs text-slate-500">{online ? "Nearby customers can see you on the map right now." : "Go online from the dashboard to broadcast your location."}</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center mt-10">
            <Briefcase size={36} className="mx-auto text-slate-300" />
            <p className="text-slate-400 mt-3 text-sm">You haven't posted any services yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l: any, i: number) => {
              const cat = CATEGORIES.find((c) => c.name === l.service);
              const Icon = cat ? cat.icon : Briefcase;
              return (
                <div key={i} className="rounded-xl border border-slate-100 shadow-sm p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: SKY }}>
                      <Icon size={20} color={NAVY} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-slate-800">{l.service}</p>
                        <button onClick={() => onRemove(i)}><Trash2 size={15} className="text-slate-300" /></button>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: NAVY }}>₹{l.rate}</p>
                      <p className="text-xs text-slate-500 mt-1">{l.desc}</p>
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-2"
                        style={{ background: l.shareLoc && online ? "#DCFCE7" : "#F1F5F9", color: l.shareLoc && online ? "#15803D" : "#64748B" }}
                      >
                        <Navigation size={10} /> {l.shareLoc && online ? "Live on map" : "Location hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onAdd}
          className="w-full mt-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-dashed"
          style={{ borderColor: NAVY, color: NAVY }}
        >
          <Plus size={16} /> Post a New Service
        </button>
      </div>
    </div>
  );
}

function ProviderDashboard({ onOpenSettings, profileImg, online, setOnline, listingsCount, notify, onOpenListings }: {
  onOpenSettings: () => void; profileImg: string; online: boolean; setOnline: (v: boolean) => void; listingsCount: number; notify: (m: string) => void; onOpenListings: () => void;
}) {
  const days = [
    { d: "Monday, Oct 21", tasks: "8 tasks • 7h 15m", pct: 75 },
    { d: "Tuesday, Oct 22", tasks: "9 tasks • 8h 30m", pct: 90 },
    { d: "Wednesday, Oct 23", tasks: "6 tasks • 5h 45m", pct: 55 },
  ];
  const [jobs, setJobs] = useState(JOBS);
  const respondJob = (id: number, accepted: boolean) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    notify(accepted ? "Job accepted — customer notified" : "Job declined");
  };
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-4 py-4 flex items-center justify-between text-white" style={{ background: NAVY }}>
        <div className="flex items-center gap-2">
          <span className="font-extrabold flex items-center gap-1"><ShieldCheck size={18} /> Neighborly Trust</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => notify("No new notifications")} aria-label="Notifications"><Bell size={20} /></button>
          <button onClick={onOpenSettings}><Avatar size={28} name={profileImg} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mt-4 flex items-center justify-between">
          <div>
            <p className="font-extrabold text-slate-800">Your Status</p>
            <p className="text-xs text-slate-400">{online ? "You're visible to nearby customers" : "Go online to start receiving jobs"}</p>
          </div>
          <button
            onClick={() => setOnline(!online)}
            className="w-14 h-8 rounded-full flex items-center px-1 transition"
            style={{ background: online ? "#16A34A" : "#E2E8F0", justifyContent: online ? "flex-end" : "flex-start" }}
          >
            <span className="w-6 h-6 bg-white rounded-full shadow" />
          </button>
        </div>
        <p className="text-right text-xs font-bold mt-1" style={{ color: online ? "#16A34A" : "#94A3B8" }}>
          {online ? "Online" : "Offline"}
        </p>

        <div className="rounded-xl p-3.5 flex items-center gap-3 mt-3" style={{ background: online ? "#EAF7EE" : SKY }}>
          <div className="relative flex-shrink-0">
            <Navigation size={20} color={online ? "#16A34A" : NAVY} />
            {online && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-ping" />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">{online ? "Live location sharing is ON" : "Live location is OFF"}</p>
            <p className="text-xs text-slate-500">
              {online ? `Customers can see you move in real time · ${listingsCount} service${listingsCount === 1 ? "" : "s"} live` : "Go online to start sharing your GPS location"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-3">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <CheckCircle2 size={16} className="text-green-600" />
            <p className="text-lg font-extrabold mt-1">12</p>
            <p className="text-[10px] text-slate-400 leading-tight">Jobs Completed Today</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <TrendingUp size={16} style={{ color: NAVY }} />
            <p className="text-lg font-extrabold mt-1">₹3,450</p>
            <p className="text-[10px] text-slate-400 leading-tight">Today's Earnings</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <Star size={16} className="text-amber-500" />
            <p className="text-lg font-extrabold mt-1">4.9</p>
            <p className="text-[10px] text-slate-400 leading-tight">Current Rating</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 mb-2">
          <p className="font-bold text-slate-800">Pending Requests</p>
          <button onClick={onOpenListings} className="text-xs font-semibold" style={{ color: NAVY }}>View All ({jobs.length})</button>
        </div>
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400">No pending requests right now.</div>
        ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {jobs.map((j) => (
            <div key={j.id} className="bg-white rounded-xl shadow-sm p-2.5 w-52 flex-shrink-0">
              <ServiceImage icon={j.icon} className="w-full h-20 rounded-lg" iconSize={26} />
              <p className="font-bold text-sm mt-2 text-slate-800">{j.title}</p>
              <p className="text-xs text-slate-500">{j.price} • {j.tag}</p>
              <p className="text-[10px] text-slate-400">{j.loc}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => respondJob(j.id, true)} className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold active:opacity-80" style={{ background: NAVY }}>Accept</button>
                <button onClick={() => respondJob(j.id, false)} className="flex-1 py-1.5 rounded-lg text-xs font-bold border active:opacity-80" style={{ borderColor: "#DC2626", color: "#DC2626" }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
        )}

        <div className="flex items-center justify-between mt-5 mb-2">
          <p className="font-bold text-slate-800">Activity & Hours</p>
          <button onClick={() => notify("Weekly report downloading…")} className="text-xs font-semibold" style={{ color: NAVY }}>Download Report</button>
        </div>
        <div className="rounded-xl text-white p-3.5 text-center mb-2" style={{ background: NAVY }}>
          <p className="font-extrabold text-sm">WEEKLY TOTAL: 38h 45m</p>
          <p className="text-xs text-white/80">42 Tasks Completed</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {days.map((d) => (
            <div key={d.d} className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-800">{d.d}</p>
                  <p className="text-xs text-slate-400">{d.tasks}</p>
                </div>
                <button onClick={() => notify(`${d.d.split(",")[0]}: ${d.tasks}`)} className="text-xs font-bold" style={{ color: NAVY }}>VIEW DETAILS</button>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: NAVY }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- app shell ---------- */

export default function App() {
  const [mode, setMode] = useState("login"); // login | customer | provider
  const [lang, setLang] = useState("English");
  const [tab, setTab] = useState("find");
  const [worker, setWorker] = useState<any>(null);
  const [justBooked, setJustBooked] = useState<any>(null);
  const [providerTab, setProviderTab] = useState("dashboard");
  const [online, setOnline] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customerProfile, setCustomerProfile] = useState({ name: "Aditi Sharma", phone: "+91 98765 43210" });
  const [dataLoaded, setDataLoaded] = useState(true);
  const [toast, setToast] = useState("");
  const providerName = "Jim Caldwell";

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const addListing = (l: any) => {
    setListings((prev) => [...prev, l]);
    setProviderTab("listings");
  };
  const removeListing = (i: number) => {
    setListings((prev) => prev.filter((_, idx) => idx !== i));
  };
  const toggleOnline = (v: boolean) => { setOnline(v); };
  const saveProfile = (p: any) => { setCustomerProfile(p); notify("Profile saved"); };
  const createBooking = (w: any) => {
    const booking = { id: `${Date.now()}`, worker: w, status: "Pending Confirmation", rating: 0, createdAt: new Date().toISOString() };
    setBookings((prev) => [...prev, booking]);
    setJustBooked(w);
  };
  const markBookingComplete = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Completed" } : b)));
  };
  const rateBooking = (id: string, rating: number) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, rating } : b)));
    notify("Rating submitted — thanks!");
  };

  const providerTabs = [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
    { key: "listings", label: "My Jobs", icon: Briefcase },
    { key: "post", label: "Post", icon: Plus },
    { key: "settings", label: "Profile", icon: User },
  ];

  const customerTabs = [
    { key: "find", label: "Find Service", icon: Search },
    { key: "map", label: "Nearby", icon: MapPin },
    { key: "bookings", label: "My Bookings", icon: Calendar },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "profile", label: "Profile", icon: User },
  ];

  let screen: React.ReactNode;

  if (!dataLoaded) {
    screen = (
      <div className="h-full flex flex-col items-center justify-center gap-3" style={{ background: SKY }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg animate-pulse" style={{ background: NAVY }}>
          <HomeIcon color="white" size={26} />
        </div>
        <p className="text-sm font-semibold" style={{ color: NAVY }}>Loading Neighborly Trust…</p>
      </div>
    );
  } else if (mode === "login") {
    screen = (
      <CustomerLogin
        lang={lang}
        setLang={setLang}
        onLogin={() => { setMode("customer"); setTab("find"); }}
        goProvider={() => setMode("provider-login")}
        notify={notify}
      />
    );
  } else if (mode === "provider-login") {
    screen = <ProviderLogin onLogin={() => setMode("provider")} goCustomer={() => setMode("login")} notify={notify} />;
  } else if (mode === "provider") {
    if (providerTab === "dashboard") {
      screen = (
        <ProviderDashboard
          onOpenSettings={() => setProviderTab("settings")}
          profileImg={providerName}
          online={online}
          setOnline={toggleOnline}
          listingsCount={listings.length}
          notify={notify}
          onOpenListings={() => setProviderTab("listings")}
        />
      );
    } else if (providerTab === "listings") {
      screen = (
        <MyListings
          listings={listings}
          online={online}
          onRemove={removeListing}
          onAdd={() => setProviderTab("post")}
        />
      );
    } else if (providerTab === "post") {
      screen = (
        <PostService
          onBack={() => setProviderTab("listings")}
          onPost={addListing}
        />
      );
    } else {
      screen = (
        <Settings
          profile={{ name: providerName, phone: "+91 90000 11122" }}
          onSaveProfile={() => notify("Provider profile editing coming soon")}
          onLogout={() => setMode("login")}
          onOpenBookings={() => setProviderTab("listings")}
        />
      );
    }
  } else if (mode === "customer") {
    if (worker && !justBooked) {
      screen = (
        <WorkerProfile
          worker={worker}
          profileImg={customerProfile.name}
          onBack={() => setWorker(null)}
          onBook={() => createBooking(worker)}
          notify={notify}
        />
      );
    } else if (justBooked) {
      screen = (
        <BookingConfirm
          worker={justBooked}
          onDone={() => { setJustBooked(null); setWorker(null); setTab("bookings"); }}
        />
      );
    } else if (tab === "find") {
      screen = <FindServices profileImg={customerProfile.name} onOpenWorker={setWorker} onOpenProfile={() => setTab("profile")} />;
    } else if (tab === "map") {
      screen = <MapNearby profileImg={customerProfile.name} onOpenWorker={setWorker} onOpenProfile={() => setTab("profile")} notify={notify} />;
    } else if (tab === "bookings") {
      screen = <MyBookings bookings={bookings} onMarkComplete={markBookingComplete} onRate={rateBooking} />;
    } else if (tab === "messages") {
      screen = (
        <div className="h-full flex flex-col bg-white">
          <TopBar title="Messages" />
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <MessageSquare size={40} className="mx-auto text-slate-300" />
              <p className="text-slate-400 mt-3 text-sm">No conversations yet.<br />Message a worker after booking.</p>
            </div>
          </div>
        </div>
      );
    } else {
      screen = (
        <Settings
          profile={customerProfile}
          onSaveProfile={saveProfile}
          onLogout={() => setMode("login")}
          onOpenBookings={() => setTab("bookings")}
        />
      );
    }
  }

  const showCustomerNav = dataLoaded && mode === "customer" && !worker && !justBooked;
  const showProviderNav = dataLoaded && mode === "provider";

  return (
    <div className="w-full h-screen flex items-center justify-center bg-slate-200 font-sans">
      <div className="w-full max-w-sm h-full sm:h-[820px] sm:rounded-[2rem] overflow-hidden shadow-2xl bg-white flex flex-col relative border-8 border-slate-900">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{screen}</div>
        {showCustomerNav && (
          <BottomNav tabs={customerTabs} active={tab === "profile" ? "profile" : tab} onChange={(k) => setTab(k)} />
        )}
        {showProviderNav && (
          <BottomNav tabs={providerTabs} active={providerTab} onChange={setProviderTab} />
        )}
        <Toast message={toast} />
      </div>
    </div>
  );
}
