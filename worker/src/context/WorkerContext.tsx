'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  WorkerProfile, BookingRequest, WorkerSkill, WorkerSettings,
  ToastState, EarningsSummary, COMMISSION_RATE,
} from '../lib/types';
import {
  fetchWorkerBookings, setWorkerOnline, respondToBooking,
  completeBooking, updateWorkerSkills, subscribeToBookings, isConfigured,
} from '../lib/supabase';

// ─── Context Shape ─────────────────────────────────────────
interface WorkerContextType {
  worker: WorkerProfile | null;
  isLoggedIn: boolean;
  isNewWorker: boolean;
  loginWorker: (phone: string, name: string) => void;
  completeOnboarding: (skills: WorkerSkill[]) => void;
  logoutWorker: () => void;

  isOnline: boolean;
  toggleOnline: () => Promise<void>;

  bookings: BookingRequest[];
  pendingBookings: BookingRequest[];
  activeBookings: BookingRequest[];
  completedBookings: BookingRequest[];
  isLoading: boolean;
  refreshBookings: () => Promise<void>;
  acceptBooking: (id: string) => Promise<void>;
  declineBooking: (id: string) => Promise<void>;
  finishJob: (id: string) => Promise<void>;

  earnings: EarningsSummary;
  earningsPeriod: 'today' | 'week' | 'month';
  setEarningsPeriod: (p: 'today' | 'week' | 'month') => void;

  updateSkills: (skills: WorkerSkill[]) => Promise<void>;

  settings: WorkerSettings;
  setLanguage: (lang: WorkerSettings['language']) => void;
  toggleSound: () => void;

  toast: ToastState | null;
  showToast: (msg: string, type?: ToastState['type']) => void;
  dismissToast: () => void;
}

const WorkerContext = createContext<WorkerContextType | null>(null);
export const useWorker = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorker must be inside WorkerProvider');
  return ctx;
};

// ─── Earnings Calculator ───────────────────────────────────
function calcEarnings(bookings: BookingRequest[], period: 'today' | 'week' | 'month'): EarningsSummary {
  const now = new Date();
  const start = new Date();
  if (period === 'today') start.setHours(0, 0, 0, 0);
  else if (period === 'week') start.setDate(now.getDate() - 7);
  else start.setMonth(now.getMonth() - 1);

  const filtered = bookings.filter(b =>
    b.status === 'completed' && new Date(b.created_at) >= start
  );

  const gross = filtered.reduce((s, b) => s + b.total_amount, 0);
  const commission = filtered.reduce((s, b) => s + b.commission_amount, 0);

  const bySkill: Record<string, { amount: number; count: number }> = {};
  filtered.forEach(b => {
    const key = b.service_type;
    if (!bySkill[key]) bySkill[key] = { amount: 0, count: 0 };
    bySkill[key].amount += b.net_amount;
    bySkill[key].count += 1;
  });

  return {
    gross,
    commission,
    net: gross - commission,
    jobs_count: filtered.length,
    period,
    by_skill: Object.entries(bySkill).map(([category, v]) => ({ category, ...v })),
  };
}

// ─── Provider ─────────────────────────────────────────────
export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('nt_worker') ?? 'null'); } catch { return null; }
  });
  const [isNewWorker, setIsNewWorker] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [settings, setSettings] = useState<WorkerSettings>(() => {
    if (typeof window === 'undefined') return { language: 'en', sounds: true, notifications: true };
    try { return JSON.parse(localStorage.getItem('nt_worker_settings') ?? 'null') ?? { language: 'en', sounds: true, notifications: true }; }
    catch { return { language: 'en', sounds: true, notifications: true }; }
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRef = useRef<any>(null);

  // Persist
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nt_worker', JSON.stringify(worker));
    if (worker) setIsOnline(worker.is_online);
  }, [worker]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nt_worker_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast
  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now().toString(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  // Bookings
  const refreshBookings = useCallback(async () => {
    if (!worker) return;
    setIsLoading(true);
    const data = await fetchWorkerBookings(worker.id);
    if (data.length > 0) {
      setBookings(data);
    } else if (bookings.length === 0) {
      // Seed initial demo data for smooth offline/local testing
      const now = Date.now();
      setBookings([
        {
          id: 'bk_demo_101',
          customer_id: 'cust_901',
          customer_name: 'Rajesh Sharma',
          customer_phone: '9876543210',
          service_type: worker.skills[0]?.category || 'Electrician',
          address_notes: 'Flat 402, Sunshine Apartments, MG Road',
          total_amount: 450,
          commission_amount: 36,
          net_amount: 414,
          status: 'pending',
          created_at: new Date(now).toISOString(),
          expires_at: new Date(now + 85_000).toISOString(),
        },
        {
          id: 'bk_demo_102',
          customer_id: 'cust_902',
          customer_name: 'Priya Nair',
          customer_phone: '9812345678',
          service_type: worker.skills[0]?.category || 'Electrician',
          address_notes: 'House #12, 4th Cross, Indiranagar',
          total_amount: 500,
          commission_amount: 40,
          net_amount: 460,
          status: 'accepted',
          created_at: new Date(now - 3600_000).toISOString(),
        },
        {
          id: 'bk_demo_103',
          customer_id: 'cust_903',
          customer_name: 'Amit Patel',
          customer_phone: '9988776655',
          service_type: worker.skills[0]?.category || 'Electrician',
          address_notes: 'Villa 8, Green Glen Layout, Bellandur',
          total_amount: 600,
          commission_amount: 48,
          net_amount: 552,
          status: 'completed',
          created_at: new Date(now - 7200_000).toISOString(),
        }
      ]);
    }
    setIsLoading(false);
  }, [worker, bookings.length]);

  useEffect(() => {
    if (!worker) return;
    refreshBookings();

    // Real-time subscription
    const channel = subscribeToBookings(worker.id, (newBooking) => {
      setBookings(prev => [newBooking, ...prev]);
      showToast(`🔔 New ${newBooking.service_type} booking! ₹${newBooking.net_amount} net`, 'info');
      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Booking!', {
          body: `${newBooking.service_type} — ₹${newBooking.net_amount} net earnings`,
          icon: '/icon-192.png',
        });
      }
    });
    realtimeRef.current = channel;
    return () => { channel?.unsubscribe(); };
  }, [worker, refreshBookings, showToast]);

  // Auth
  const loginWorker = useCallback((phone: string, name: string) => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('nt_worker') : null;
    const existing = stored ? JSON.parse(stored) : null;

    if (existing && existing.phone === phone) {
      setWorker(existing);
      showToast(`Welcome back, ${name.split(' ')[0]}! 👋`);
    } else {
      // New worker — needs onboarding
      setWorker({
        id: `worker_${phone}`,
        full_name: name,
        phone,
        language: 'en',
        is_online: false,
        rating: 5.0,
        reviews_count: 0,
        total_jobs: 0,
        consent_given: true,
        skills: [],
      });
      setIsNewWorker(true);
    }
  }, [showToast]);

  const completeOnboarding = useCallback((skills: WorkerSkill[]) => {
    setWorker(prev => prev ? { ...prev, skills } : null);
    setIsNewWorker(false);
    showToast('Profile created! You\'re ready to take bookings 🎉');
  }, [showToast]);

  const logoutWorker = useCallback(() => {
    realtimeRef.current?.unsubscribe();
    setWorker(null);
    setBookings([]);
    setIsOnline(false);
    if (typeof window !== 'undefined') localStorage.removeItem('nt_worker');
  }, []);

  // Online toggle
  const toggleOnline = useCallback(async () => {
    if (!worker) return;
    const next = !isOnline;
    setIsOnline(next);
    setWorker(prev => prev ? { ...prev, is_online: next } : null);
    await setWorkerOnline(worker.id, next);
    showToast(next ? 'You\'re online — ready for bookings! ✅' : 'You\'re offline', next ? 'success' : 'info');
    // Request notification permission when going online
    if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isOnline, worker, showToast]);

  // Booking actions
  const acceptBooking = useCallback(async (id: string) => {
    await respondToBooking(id, true);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' } : b));
    showToast('Booking accepted! Contact the customer. 📞');
  }, [showToast]);

  const declineBooking = useCallback(async (id: string) => {
    await respondToBooking(id, false);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'declined' } : b));
    showToast('Booking declined.', 'info');
  }, [showToast]);

  const finishJob = useCallback(async (id: string) => {
    await completeBooking(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
    showToast('Job marked complete! Earnings updated. 💰', 'success');
  }, [showToast]);

  const updateSkillsFn = useCallback(async (skills: WorkerSkill[]) => {
    if (!worker) return;
    await updateWorkerSkills(worker.id, skills);
    setWorker(prev => prev ? { ...prev, skills } : null);
    showToast('Skills updated!');
  }, [worker, showToast]);

  // Settings
  const setLanguage = (lang: WorkerSettings['language']) =>
    setSettings(s => ({ ...s, language: lang }));
  const toggleSound = () =>
    setSettings(s => ({ ...s, sounds: !s.sounds }));

  // Derived
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'in_progress');
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'declined' || b.status === 'cancelled');
  const earnings = calcEarnings(bookings, earningsPeriod);

  return (
    <WorkerContext.Provider value={{
      worker, isLoggedIn: !!worker && !isNewWorker, isNewWorker,
      loginWorker, completeOnboarding, logoutWorker,
      isOnline, toggleOnline,
      bookings, pendingBookings, activeBookings, completedBookings,
      isLoading, refreshBookings,
      acceptBooking, declineBooking, finishJob,
      earnings, earningsPeriod, setEarningsPeriod,
      updateSkills: updateSkillsFn,
      settings, setLanguage, toggleSound,
      toast, showToast, dismissToast,
    }}>
      {children}
    </WorkerContext.Provider>
  );
};
