'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile, Provider, Booking, AppSettings, LanguageCode, ToastState,
  DEFAULT_LOCATION, OWNER_PHONES,
} from '../lib/types';
import { fetchProviders, fetchCustomerBookings, createBooking, upsertProfile, isConfigured, getClient, subscribeToProviders, subscribeToBookingStatus } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallOverlay } from '../components/CallOverlay';

// ─── i18n (inline minimal — key phrases only) ─────────────
export const T: Record<string, Record<string, string>> = {
  en: {
    findService:    'Find a Service',
    nearbyWorkers:  'Verified Specialists Near You',
    myBookings:     'My Bookings',
    profile:        'My Profile',
    bookNow:        'Book Now',
    bookingSuccess: 'Booking Confirmed!',
    loading:        'Loading…',
    noProviders:    'No specialists found in your area yet.',
    noBookings:     'No bookings yet. Book your first service!',
  },
  kn: {
    findService:    'ಸೇವೆ ಹುಡುಕಿ',
    nearbyWorkers:  'ನಿಮ್ಮ ಬಳಿ ಪರಿಶೀಲಿತ ತಜ್ಞರು',
    myBookings:     'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು',
    profile:        'ನನ್ನ ಪ್ರೊಫೈಲ್',
    bookNow:        'ಈಗ ಬುಕ್ ಮಾಡಿ',
    bookingSuccess: 'ಬುಕಿಂಗ್ ದೃಢಪಡಿಸಲಾಗಿದೆ!',
    loading:        'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    noProviders:    'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಇನ್ನೂ ಯಾವ ತಜ್ಞರೂ ಇಲ್ಲ.',
    noBookings:     'ಇನ್ನೂ ಬುಕಿಂಗ್ ಇಲ್ಲ. ಮೊದಲ ಸೇವೆ ಬುಕ್ ಮಾಡಿ!',
  },
  hi: {
    findService:    'सेवा खोजें',
    nearbyWorkers:  'आपके पास सत्यापित विशेषज्ञ',
    myBookings:     'मेरी बुकिंग',
    profile:        'मेरी प्रोफाइल',
    bookNow:        'अभी बुक करें',
    bookingSuccess: 'बुकिंग पुष्टि!',
    loading:        'लोड हो रहा है…',
    noProviders:    'आपके क्षेत्र में अभी कोई विशेषज्ञ नहीं है।',
    noBookings:     'अभी कोई बुकिंग नहीं। पहली सेवा बुक करें!',
  },
};

function t(key: string, lang: LanguageCode): string {
  return T[lang]?.[key] ?? T['en'][key] ?? key;
}

// ─── Haversine Distance ────────────────────────────────────
export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Context Shape ─────────────────────────────────────────
interface AppContextType {
  // Auth
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  loginUser: (phone: string, name: string, authUserId: string) => void;
  logoutUser: () => void;

  // Data
  providers: Provider[];
  bookings: Booking[];
  isLoading: boolean;
  refreshProviders: () => Promise<void>;
  refreshBookings: () => Promise<void>;

  // Actions
  bookProvider: (provider: Provider, notes?: string) => Promise<void>;
  addWorkerProfile: (newProvider: Provider) => void;
  updateBookingStatus: (bookingId: string, status: 'pending' | 'accepted' | 'completed' | 'declined') => void;

  // Settings
  settings: AppSettings;
  setLanguage: (lang: LanguageCode) => void;
  toggleSounds: () => void;
  toggleVoice: () => void;

  // UI
  toast: ToastState | null;
  showToast: (message: string, type?: ToastState['type']) => void;
  dismissToast: () => void;

  // Util
  translate: (key: string) => string;

  // Location
  userLocation: { lat: number; lng: number };
  locationStatus: 'loading' | 'granted' | 'denied';
  requestLocation: () => void;
  webrtc: ReturnType<typeof useWebRTC>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Auth ──
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ── Data ──
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Settings ──
  const [settings, setSettings] = useState<AppSettings>({ language: 'en', sounds: true, voice: false });
  
  // ── WebRTC ──
  const webrtc = useWebRTC(user?.id || '');

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('nt_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch {}

    // ── Restore session from Supabase auth (source of truth) ──
    const client = getClient();
    if (client) {
      // Check for existing session
      client.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const savedUser = localStorage.getItem('nt_user');
          if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch {}
          }
        }
        setIsAuthLoading(false);
      }).catch(err => {
        console.error("Auth error:", err);
        setIsAuthLoading(false);
      });

      // Listen for auth state changes (login / logout / token refresh)
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setBookings([]);
          localStorage.removeItem('nt_user');
        }
        setIsAuthLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  // ── Toast ──
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Location ──
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  // ── Persist user + settings ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('nt_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('nt_settings', JSON.stringify(settings));
  }, [settings]);

  // ── Request GPS ──
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  // ── Fetch providers ──
  const refreshProviders = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchProviders();
    if (data.length > 0) setProviders(data);
    setIsLoading(false);
  }, []);

  // ── Fetch bookings ──
  const refreshBookings = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchCustomerBookings(user.id);
    setBookings(data);
  }, [user?.id]);

  useEffect(() => { refreshProviders(); }, [refreshProviders]);
  useEffect(() => { if (user) refreshBookings(); }, [user, refreshBookings]);


  // ── Toast ──
  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now().toString(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  // ── Real-time: provider online status ────────────────────
  // When a worker taps "Go Online" in the worker app, this fires and
  // patches the provider list in-place — no full re-fetch needed.
  useEffect(() => {
    if (!isConfigured()) return;
    const channel = subscribeToProviders((updated) => {
      setProviders(prev => {
        const exists = prev.some(p => p.id === updated.id);
        if (!exists) { refreshProviders(); return prev; }
        return prev.map(p => p.id === updated.id ? { ...p, ...updated } : p);
      });
    });
    return () => { channel?.unsubscribe(); };
  }, [refreshProviders]);

  // ── Real-time: booking status updates ────────────────────
  // When the worker accepts/declines the booking, the customer sees it instantly.
  useEffect(() => {
    if (!isConfigured() || !user?.id) return;
    const channel = subscribeToBookingStatus(user.id, (bookingId, status) => {
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: status as any } : b)
      );
      if (status === 'accepted') {
        showToast('✅ Your worker is on the way!', 'success');
        try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#10B981', '#0B3D66'] }); } catch {}
      } else if (status === 'completed') {
        showToast('🎉 Job completed! Please rate your worker.', 'success');
      } else if (status === 'declined') {
        showToast('Worker declined. Please try another specialist.', 'error');
      }
    });
    return () => { channel?.unsubscribe(); };
  }, [user?.id, showToast]);

  // ── Auth ──
  const loginUser = useCallback((phone: string, name: string, authUserId: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const isOwner = OWNER_PHONES.includes(cleanPhone);
    const profile: UserProfile = {
      id: authUserId,
      full_name: name,
      phone: cleanPhone,
      role: isOwner ? 'owner' : 'customer',
      language: settings.language,
      consent_given: true,
    };
    setUser(profile);
    localStorage.setItem('nt_user', JSON.stringify(profile));
    showToast(`Welcome, ${name.split(' ')[0]}! 👋`);

    // Persist to Supabase profiles table
    upsertProfile({
      id: authUserId,
      full_name: name,
      phone: cleanPhone,
      language: settings.language,
      consent_given: true,
    }).catch(() => { /* non-blocking */ });
  }, [settings.language, showToast]);

  const logoutUser = useCallback(() => {
    setUser(null);
    setBookings([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nt_user');
    }
    // Sign out from Supabase so the session is invalidated server-side.
    // Without this, getSession() on next reload restores the old session.
    const client = getClient();
    if (client) {
      client.auth.signOut().catch(() => { /* non-blocking */ });
    }
  }, []);

  // ── Book a provider ──
  const bookProvider = useCallback(async (provider: Provider, notes?: string) => {
    if (!user) return;

    const tempId = `tmp_${Date.now()}`;
    const tempBooking: Booking = {
      id: tempId,
      customer_id: user.id,
      provider_id: provider.id,
      provider_name: provider.name,
      provider_category: provider.category,
      provider_avatar: provider.avatar_url,
      service_type: provider.category,
      status: 'pending',
      total_amount: provider.hourly_rate,
      commission_amount: Math.round(provider.hourly_rate * 0.08),
      address_notes: notes,
      created_at: new Date().toISOString(),
    };

    setBookings(prev => [tempBooking, ...prev]);

    // Async Supabase insert
    if (isConfigured()) {
      const realId = await createBooking({
        customerId: user.id,
        providerId: provider.id,
        serviceType: provider.category,
        totalAmount: provider.hourly_rate,
        notes,
      });
      if (realId) {
        setBookings(prev => prev.map(b => b.id === tempId ? { ...b, id: realId } : b));
      } else {
        // Insert failed — remove the optimistic temp booking and notify user.
        setBookings(prev => prev.filter(b => b.id !== tempId));
        showToast('Booking failed. Please try again.', 'error');
        return;
      }
    }

    // Celebrate
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#0B3D66', '#F59E0B', '#10B981'] });
    } catch { /* ignore */ }

    showToast(T[settings.language]?.bookingSuccess ?? 'Booking Confirmed! 🎉', 'success');
  }, [user, settings.language, showToast]);

  // ── Add Worker Profile (Post Job) ──
  const addWorkerProfile = useCallback((newProvider: Provider) => {
    setProviders(prev => [newProvider, ...prev]);
  }, []);

  // ── Update Booking Status ──
  const updateBookingStatus = useCallback((bookingId: string, status: 'pending' | 'accepted' | 'completed' | 'declined') => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    showToast(`Job status updated to ${status.toUpperCase()}!`, 'info');
  }, [showToast]);

  // ── Settings ──
  const setLanguage = useCallback((lang: LanguageCode) => {
    setSettings(s => ({ ...s, language: lang }));
  }, []);

  const toggleSounds = useCallback(() => {
    setSettings(s => ({ ...s, sounds: !s.sounds }));
  }, []);

  const toggleVoice = useCallback(() => {
    setSettings(s => ({ ...s, voice: !s.voice }));
  }, []);

  const translate = useCallback((key: string) => t(key, settings.language), [settings.language]);

  return (
    <AppContext.Provider value={{
      user, isLoggedIn: !!user, isAuthLoading, loginUser, logoutUser,
      providers, bookings, isLoading, refreshProviders, refreshBookings,
      bookProvider, addWorkerProfile, updateBookingStatus,
      settings, setLanguage, toggleSounds, toggleVoice,
      toast, showToast, dismissToast,
      translate,
      userLocation, locationStatus, requestLocation,
      webrtc,
    }}>
      {children}
      <CallOverlay webrtc={webrtc} />
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
