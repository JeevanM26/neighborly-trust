'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ChevronLeft, Search, Zap, Wrench, Hammer, Home as HomeIcon, Bell,
  User, Star, ShieldCheck, Phone, MessageSquare, MapPin, Calendar,
  Globe, Volume2, Mic, LogOut, CheckCircle2, Clock, TrendingUp,
  Briefcase, Lock, CreditCard, Plus, Navigation, Trash2, IndianRupee
} from 'lucide-react';
import { calculateCommission, formatINR, sortProvidersByDistanceAndFeatured, distanceKm, formatDistance } from '../lib/commission';
import { ProviderProfile, Booking } from '../lib/types';
import { supabase } from '../lib/supabase';

// Dynamically import InteractiveMap without SSR for Leaflet compatibility
const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), { ssr: false });

const NAVY = "#0B3D66";
const NAVY_DEEP = "#072A4A";
const SKY = "#EAF2FB";
const GOLD = "#F5A623";

const CATEGORIES = [
  { name: "Electrician", icon: Zap },
  { name: "Plumber", icon: Wrench },
  { name: "Carpenter", icon: Hammer },
  { name: "Home Clean", icon: HomeIcon },
];

const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 }; // Shivamogga, Karnataka

const INITIAL_WORKERS: ProviderProfile[] = [
  {
    id: "1", name: "Jim Caldwell", role: "Master Electrician", category: "Electrician", rating: 4.9, reviews_count: 124,
    lat: 13.9381, lng: 75.5745, is_online: true, hourly_rate: 350, description: "Reliable electrical work for homes and farms.",
    featured: true, tags: ["Licensed", "Insured", "20+ Yrs Exp."],
    about: "Reliable electrical work for homes and farms. I specialize in residential wiring, panel upgrades, and barn lighting — from historic farmhouses to modern setups.",
    area: "Serving Shivamogga & Surrounding Areas",
  },
  {
    id: "2", name: "Sarah Jenkins", role: "Plumbing Specialist", category: "Plumber", rating: 4.8, reviews_count: 89,
    lat: 13.9142, lng: 75.5812, is_online: true, hourly_rate: 400, description: "Fast, honest plumbing repairs.",
    featured: true, tags: ["Licensed", "Insured", "10+ Yrs Exp."],
    about: "Fast, honest plumbing repairs — leaks, pipe fitting, borewell connections, and tank installs, done right the first time.",
    area: "Serving Green Valley & Surrounding Areas",
  },
  {
    id: "3", name: "Robert Evans", role: "Master Carpenter", category: "Carpenter", rating: 5.0, reviews_count: 215,
    lat: 13.9335, lng: 75.5622, is_online: true, hourly_rate: 300, description: "Custom furniture and general woodwork repairs.",
    featured: false, tags: ["Licensed", "Insured", "25+ Yrs Exp."],
    about: "Custom furniture, door and window fitting, and general woodwork repairs — built to last a generation.",
    area: "Serving Central Market & Surrounding Areas",
  },
  {
    id: "4", name: "Meena Kulkarni", role: "Home Cleaning Expert", category: "Home Clean", rating: 4.7, reviews_count: 63,
    lat: 13.9218, lng: 75.5758, is_online: true, hourly_rate: 250, description: "Deep cleaning and sanitizing for homes.",
    featured: false, tags: ["Verified", "Eco-Friendly", "5+ Yrs Exp."],
    about: "Deep cleaning, dusting, and sanitizing for homes and small offices. Bring my own eco-friendly supplies on request.",
    area: "Serving Green Valley & Surrounding Areas",
  },
];

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return a.village || a.town || a.suburb || a.county || a.city || data.display_name?.split(",")[0] || null;
  } catch (e) {
    return null;
  }
}

/** Continuous real-time GPS tracking using navigator.geolocation.watchPosition */
function useUserLocation() {
  const [loc, setLoc] = useState(DEFAULT_LOCATION);
  const [status, setStatus] = useState<"loading" | "granted" | "denied">("loading");
  const [placeName, setPlaceName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLoc(DEFAULT_LOCATION);
      setStatus("denied");
      return;
    }

    setStatus("loading");

    const watchId = navigator.geolocation.watchPosition(
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { loc, status, placeName };
}

function LocationBanner({ status, placeName }: { status: string; placeName: string | null }) {
  if (status === "granted") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold mt-2 text-emerald-700">
        <Navigation size={13} className="animate-pulse text-emerald-600" />
        {placeName ? `Live GPS active near ${placeName}` : "Live GPS active"}
      </div>
    );
  }
  if (status === "loading") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold mt-2 text-slate-400">
        <Navigation size={13} className="animate-pulse" /> Connecting live GPS…
      </div>
    );
  }
  return (
    <div className="w-full flex items-center gap-2 rounded-lg mt-2 px-3 py-2 text-xs font-semibold bg-amber-100 text-amber-900">
      <Navigation size={13} className="flex-shrink-0" />
      <span className="flex-1 text-left">Location off — showing Shivamogga area. Enable GPS for live tracking.</span>
    </div>
  );
}

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

function Avatar({ size = 36, name = "User", onClick }: { size?: number; name?: string; onClick?: () => void }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const content = (
    <div
      className="rounded-full flex items-center justify-center ring-2 ring-white shadow font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: NAVY, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
  return onClick ? (
    <button onClick={onClick} aria-label="Open profile">{content}</button>
  ) : (
    content
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

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-50 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg flex items-center gap-2" style={{ background: NAVY_DEEP, maxWidth: "90%" }}>
      <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-400" />
      <span className="truncate">{message}</span>
    </div>
  );
}

function BottomNav({ tabs, active, onChange }: { tabs: any[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="grid border-t border-slate-100 bg-white sticky bottom-0 z-20" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
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

function CustomerLogin({ onLogin, goProvider, notify }: { onLogin: (phone: string) => void; goProvider: () => void; notify: (m: string) => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const attemptLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError("Please enter your phone/email and password.");
      return;
    }
    if (!consent) {
      setError("Please check the location and phone privacy consent checkbox.");
      return;
    }
    setError("");
    onLogin(phone);
  };

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
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: NAVY }}>
            <HomeIcon color="white" size={30} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>Neighborly Trust</h1>
          <p className="text-slate-500 text-sm mt-0.5">Local reliability you can count on.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="text-lg font-bold text-center mb-4" style={{ color: NAVY_DEEP }}>Customer Login / Signup</h2>

          <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <User size={18} className="text-slate-400" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number or Email" className="w-full outline-none text-sm" />
          </label>
          <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <Lock size={18} className="text-slate-400" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full outline-none text-sm" />
          </label>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 text-xs text-slate-600">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
              />
              <span>
                <strong>Privacy Consent (DPDP Act)</strong>: I consent to share my GPS location and phone number for finding nearby verified service providers.
              </span>
            </label>
          </div>

          {error && <p className="text-xs font-semibold text-red-600 mb-3">{error}</p>}

          <button
            onClick={attemptLogin}
            className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow active:opacity-80"
            style={{ background: NAVY_DEEP }}
          >
            Continue →
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/admin" className="text-xs font-bold underline text-slate-500">
            Go to Admin Monetization Dashboard (/admin)
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProviderLogin({ onLogin, goCustomer, notify }: { onLogin: () => void; goCustomer: () => void; notify: (m: string) => void }) {
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const attemptLogin = () => {
    if (!id.trim() || !pin.trim()) {
      setError("Enter your Professional ID/Phone and PIN.");
      return;
    }
    setError("");
    onLogin();
  };

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
          <p className="text-center text-sm text-slate-500 mt-1 mb-4">Enter credentials to access your dashboard.</p>

          <label className="block text-xs font-semibold text-slate-500 mb-1">Professional ID or Phone Number</label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 mb-3">
            <CreditCard size={18} className="text-slate-400" />
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. NT-9921 or 9876543210" className="w-full outline-none text-sm bg-transparent" />
          </label>

          <label className="block text-xs font-semibold text-slate-500 mb-1">Access PIN</label>
          <label className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3">
            <Lock size={18} className="text-slate-400" />
            <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••••" type="password" className="w-full outline-none text-sm bg-transparent" />
          </label>
          {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}

          <button
            onClick={attemptLogin}
            className="w-full mt-5 py-3 rounded-xl text-white font-bold shadow active:opacity-80"
            style={{ background: NAVY_DEEP }}
          >
            Start Working →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<"login" | "provider-login" | "customer" | "provider">("login");
  const [tab, setTab] = useState("find");
  const [providerTab, setProviderTab] = useState("dashboard");
  const [selectedWorker, setSelectedWorker] = useState<ProviderProfile | null>(null);
  const [toast, setToast] = useState("");
  const [workers, setWorkers] = useState<ProviderProfile[]>(INITIAL_WORKERS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [justBooked, setJustBooked] = useState<ProviderProfile | null>(null);

  const { loc, status, placeName } = useUserLocation();

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const nearbyWorkers = sortProvidersByDistanceAndFeatured(workers, loc.lat, loc.lng);

  const handleBook = (w: ProviderProfile) => {
    const totalAmount = w.hourly_rate || 350;
    const commission = calculateCommission(totalAmount, 0.08); // 8% commission
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      customer_id: 'cust-1',
      provider_id: w.id,
      provider: w,
      service_type: w.category,
      status: 'pending',
      total_amount: totalAmount,
      commission_amount: commission,
      created_at: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setJustBooked(w);
  };

  const markComplete = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'completed' } : b))
    );
    notify('Booking completed! 8% platform commission recorded.');
  };

  const rateWorker = (bookingId: string, rating: number) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, rating } : b))
    );
    notify('Rating submitted! Thank you.');
  };

  const customerTabs = [
    { key: "find", label: "Find Service", icon: Search },
    { key: "map", label: "Nearby Map", icon: MapPin },
    { key: "bookings", label: "My Bookings", icon: Calendar },
    { key: "profile", label: "Profile", icon: User },
  ];

  const providerTabs = [
    { key: "dashboard", label: "Dashboard", icon: HomeIcon },
    { key: "listings", label: "My Jobs", icon: Briefcase },
    { key: "settings", label: "Profile", icon: User },
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-200 font-sans p-0 sm:p-4">
      <div className="w-full max-w-sm h-screen sm:h-[820px] sm:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white flex flex-col relative border-0 sm:border-8 border-slate-900">
        
        {/* APP BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {mode === "login" && (
            <CustomerLogin
              onLogin={() => setMode("customer")}
              goProvider={() => setMode("provider-login")}
              notify={notify}
            />
          )}

          {mode === "provider-login" && (
            <ProviderLogin
              onLogin={() => setMode("provider")}
              goCustomer={() => setMode("login")}
              notify={notify}
            />
          )}

          {mode === "customer" && (
            <>
              {selectedWorker && !justBooked && (
                <div className="h-full flex flex-col bg-white p-4 overflow-y-auto">
                  <button onClick={() => setSelectedWorker(null)} className="flex items-center gap-1 text-sm font-bold mb-3 text-slate-600">
                    <ChevronLeft size={20} /> Back
                  </button>
                  <div className="w-full h-44 rounded-2xl flex items-center justify-center mb-4" style={{ background: SKY }}>
                    <ShieldCheck size={50} color={NAVY} />
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900">{selectedWorker.name}</h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 inline-block w-max text-white" style={{ background: NAVY }}>
                    {selectedWorker.role}
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <Stars rating={selectedWorker.rating} />
                    <span className="text-xs text-slate-400">({selectedWorker.reviews_count}+ reviews)</span>
                  </div>

                  {selectedWorker.featured && (
                    <div className="mt-3 bg-amber-100 text-amber-900 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                      <Star size={14} className="fill-amber-600 text-amber-600" /> Featured Verified Provider
                    </div>
                  )}

                  <p className="text-sm text-slate-600 mt-4 leading-relaxed">{selectedWorker.about || selectedWorker.description}</p>
                  <p className="text-sm font-extrabold mt-3 text-slate-900">Starting Rate: {formatINR(selectedWorker.hourly_rate)}</p>

                  <button
                    onClick={() => handleBook(selectedWorker)}
                    className="w-full mt-6 py-3.5 rounded-xl text-white font-bold shadow-lg"
                    style={{ background: NAVY_DEEP }}
                  >
                    Request Booking
                  </button>
                </div>
              )}

              {justBooked && (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center" style={{ background: SKY }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-emerald-600 text-white shadow-lg">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">Booking Requested!</h2>
                  <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
                    {justBooked.name} has received your request. Commission (8%: {formatINR(calculateCommission(justBooked.hourly_rate, 0.08))}) is calculated on completion.
                  </p>
                  <button
                    onClick={() => { setJustBooked(null); setSelectedWorker(null); setTab("bookings"); }}
                    className="w-full max-w-xs mt-6 py-3.5 rounded-xl text-white font-bold shadow-md"
                    style={{ background: NAVY_DEEP }}
                  >
                    View My Bookings
                  </button>
                </div>
              )}

              {!selectedWorker && !justBooked && tab === "find" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-extrabold text-lg" style={{ color: NAVY }}>Neighborly Trust</span>
                    <Avatar size={34} name="Customer" />
                  </div>
                  <LocationBanner status={status} placeName={placeName} />

                  <h2 className="text-lg font-extrabold text-slate-900">Verified Providers Nearby</h2>

                  <div className="space-y-3">
                    {nearbyWorkers.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWorker(w)}
                        className="p-3.5 border rounded-2xl shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar size={42} name={w.name} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-slate-900">{w.name}</p>
                              {w.featured && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Star size={10} className="fill-amber-600 text-amber-600" /> Featured
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500">{w.role}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Stars rating={w.rating} />
                              <span className="text-[11px] text-slate-400">{w.distanceLabel}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-900">{formatINR(w.hourly_rate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!selectedWorker && !justBooked && tab === "map" && (
                <div className="p-4 space-y-3 h-full flex flex-col">
                  <TopBar title="Interactive Nearby Map" />
                  <LocationBanner status={status} placeName={placeName} />

                  {/* Real Interactive Leaflet OpenStreetMap Map */}
                  <div className="flex-1 min-h-[300px]">
                    <InteractiveMap
                      userLoc={loc}
                      workers={nearbyWorkers}
                      onSelectWorker={setSelectedWorker}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    Blue dot = Your Live GPS position • Gold/Navy dots = Nearby verified service providers. Tap any marker to view & book.
                  </p>
                </div>
              )}

              {!selectedWorker && !justBooked && tab === "bookings" && (
                <div className="p-4 space-y-4">
                  <TopBar title="My Bookings" />
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">No active bookings yet.</div>
                  ) : (
                    bookings.map((b) => (
                      <div key={b.id} className="p-4 border rounded-2xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">{b.provider?.name || "Provider"}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {b.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Service: {b.service_type}</p>
                        <p className="text-xs font-bold text-slate-800">Total: {formatINR(b.total_amount)} (Platform Fee 8%: {formatINR(b.commission_amount)})</p>

                        {b.status === 'pending' && (
                          <button
                            onClick={() => markComplete(b.id)}
                            className="w-full py-2 rounded-xl text-xs font-bold text-white bg-blue-900 mt-2"
                          >
                            Mark Completed
                          </button>
                        )}
                        {b.status === 'completed' && !b.rating && (
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs font-bold text-slate-600 mr-2">Rate:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => rateWorker(b.id, star)}>
                                <Star size={20} className="text-amber-400 hover:fill-amber-400" />
                              </button>
                            ))}
                          </div>
                        )}
                        {b.status === 'completed' && b.rating && (
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={14} /> You rated {b.rating} stars
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {mode === "provider" && (
            <div className="p-4 space-y-4">
              <TopBar title="Provider Dashboard" />
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Status: Online</p>
                  <p className="text-xs text-slate-500">Live GPS broadcasting to nearby customers</p>
                </div>
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 border rounded-2xl shadow-xs">
                  <p className="text-xs text-slate-400 font-medium">Completed Jobs</p>
                  <p className="text-xl font-black text-slate-900 mt-1">12</p>
                </div>
                <div className="bg-white p-4 border rounded-2xl shadow-xs">
                  <p className="text-xs text-slate-400 font-medium">Net Earnings</p>
                  <p className="text-xl font-black text-slate-900 mt-1">₹3,450</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        {mode === "customer" && !selectedWorker && !justBooked && (
          <BottomNav tabs={customerTabs} active={tab} onChange={setTab} />
        )}
        {mode === "provider" && (
          <BottomNav tabs={providerTabs} active={providerTab} onChange={setProviderTab} />
        )}

        <Toast message={toast} />
      </div>
    </div>
  );
}
