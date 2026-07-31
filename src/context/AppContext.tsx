'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  WorkerSpecialist,
  ServiceBooking,
  AppSettings,
  LanguageCode,
  UserRole,
  TradeCategory,
  BookingStatus,
} from '../lib/types';
import { TRANSLATIONS } from '../lib/i18n';
import confetti from 'canvas-confetti';

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  user: UserProfile | null;
  workers: WorkerSpecialist[];
  bookings: ServiceBooking[];
  settings: AppSettings;
  activeToast: ToastMessage | null;
  t: (key: string) => string;
  login: (phone: string, role: UserRole) => void;
  logout: () => void;
  setLanguage: (lang: LanguageCode) => void;
  toggleWorkerOnlineStatus: (workerId: string) => void;
  quickBookWorker: (workerId: string) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  toggleAppSounds: () => void;
  toggleVoiceGuidance: () => void;
  speakText: (text: string) => void;
  closeToast: () => void;
}

const INITIAL_WORKERS: WorkerSpecialist[] = [
  {
    id: 'worker-1',
    fullName: 'Jim Caldwell',
    phone: '+91 98765 43210',
    tradeCategory: 'Electrician',
    bio: 'Master Electrician with 12+ years experience in domestic & farm wiring.',
    hourlyRateINR: 350,
    rating: 4.9,
    reviewsCount: 48,
    isOnline: true,
    distanceKm: 0.8,
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'worker-2',
    fullName: 'Sarah Jenkins',
    phone: '+91 98765 43211',
    tradeCategory: 'Plumber',
    bio: 'Plumbing Specialist for leaks, pipe fittings, solar heaters & borewell pumps.',
    hourlyRateINR: 400,
    rating: 4.9,
    reviewsCount: 36,
    isOnline: true,
    distanceKm: 1.2,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'worker-3',
    fullName: 'Ramesh Kumar',
    phone: '+91 98765 43212',
    tradeCategory: 'Carpenter',
    bio: 'Custom woodwork, roof repair, door fittings & agricultural tool handles.',
    hourlyRateINR: 300,
    rating: 4.8,
    reviewsCount: 52,
    isOnline: true,
    distanceKm: 1.5,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'worker-4',
    fullName: 'Robert Evans',
    phone: '+91 98765 43213',
    tradeCategory: 'Painting/Repairs',
    bio: 'Wall plastering, exterior waterproofing & residential painting expert.',
    hourlyRateINR: 320,
    rating: 4.7,
    reviewsCount: 29,
    isOnline: true,
    distanceKm: 2.1,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'worker-5',
    fullName: 'Arthur Miller',
    phone: '+91 98765 43214',
    tradeCategory: 'Electrician',
    bio: 'Solar panel repair, inverter setup & emergency power wiring.',
    hourlyRateINR: 380,
    rating: 4.9,
    reviewsCount: 61,
    isOnline: true,
    distanceKm: 2.5,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

const INITIAL_BOOKINGS: ServiceBooking[] = [
  {
    id: 'booking-101',
    customerId: 'cust-1',
    customerName: 'Anand Sharma',
    customerPhone: '+91 91234 56789',
    workerId: 'worker-1',
    workerName: 'Jim Caldwell',
    serviceType: 'Electrician',
    status: 'pending',
    totalINR: 350,
    distanceKm: 0.8,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'booking-100',
    customerId: 'cust-2',
    customerName: 'Priya Reddy',
    customerPhone: '+91 98765 11223',
    workerId: 'worker-1',
    workerName: 'Jim Caldwell',
    serviceType: 'Emergency Wiring Repair',
    status: 'completed',
    totalINR: 700,
    distanceKm: 1.1,
    createdAt: 'Yesterday',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nt_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [workers, setWorkers] = useState<WorkerSpecialist[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nt_workers');
      return saved ? JSON.parse(saved) : INITIAL_WORKERS;
    }
    return INITIAL_WORKERS;
  });

  const [bookings, setBookings] = useState<ServiceBooking[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nt_bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    }
    return INITIAL_BOOKINGS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nt_settings');
      return saved
        ? JSON.parse(saved)
        : { appSounds: true, voiceGuidance: false, selectedLanguage: 'en' };
    }
    return { appSounds: true, voiceGuidance: false, selectedLanguage: 'en' };
  });

  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nt_user', JSON.stringify(user));
      localStorage.setItem('nt_workers', JSON.stringify(workers));
      localStorage.setItem('nt_bookings', JSON.stringify(bookings));
      localStorage.setItem('nt_settings', JSON.stringify(settings));
    }
  }, [user, workers, bookings, settings]);

  const t = (key: string): string => {
    const lang = settings.selectedLanguage;
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const playAudioFeedback = (type: 'success' | 'click' | 'toggle') => {
    if (!settings.appSounds || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'toggle') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Audio context fallbacks silently
    }
  };

  const speakText = (text: string) => {
    if (!settings.voiceGuidance || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const login = (phone: string, role: UserRole) => {
    const isWorker = role === 'worker';
    const newUser: UserProfile = {
      id: isWorker ? 'worker-1' : 'user-999',
      fullName: isWorker ? 'Jim Caldwell' : 'Anand Sharma',
      phone: phone || '+91 98765 43210',
      role: role,
      language: settings.selectedLanguage,
      avatarUrl: isWorker
        ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setUser(newUser);
    playAudioFeedback('success');
    speakText(`Logged in successfully as ${role}`);
  };

  const logout = () => {
    setUser(null);
    playAudioFeedback('toggle');
    speakText('Logged out of Neighborly Trust');
  };

  const setLanguage = (lang: LanguageCode) => {
    setSettings((prev) => ({ ...prev, selectedLanguage: lang }));
    playAudioFeedback('click');
    const selectedObj = TRANSLATIONS[lang];
    if (selectedObj?.appTitle) {
      speakText(selectedObj.appTitle);
    }
  };

  const toggleWorkerOnlineStatus = (workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          const updated = !w.isOnline;
          speakText(`${w.fullName} is now ${updated ? 'Online' : 'Offline'}`);
          return { ...w, isOnline: updated };
        }
        return w;
      })
    );
    playAudioFeedback('toggle');
  };

  const quickBookWorker = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    const newBooking: ServiceBooking = {
      id: `booking-${Date.now().toString().slice(-4)}`,
      customerId: user?.id || 'cust-101',
      customerName: user?.fullName || 'Neighbor Customer',
      customerPhone: user?.phone || '+91 98765 00000',
      workerId: worker.id,
      workerName: worker.fullName,
      serviceType: worker.tradeCategory,
      status: 'pending',
      totalINR: worker.hourlyRateINR,
      distanceKm: worker.distanceKm,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setBookings((prev) => [newBooking, ...prev]);
    playAudioFeedback('success');

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {
      // Confetti fallback
    }

    const toastText = `${t('bookingNotification')} ${worker.fullName}`;
    setActiveToast({
      id: newBooking.id,
      title: t('bookingConfirmed'),
      description: toastText,
      type: 'success',
    });

    speakText(`${t('bookingConfirmed')}. ${toastText}`);
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    playAudioFeedback(status === 'accepted' ? 'success' : 'toggle');
    speakText(`Job ${status}`);
  };

  const toggleAppSounds = () => {
    setSettings((prev) => {
      const next = !prev.appSounds;
      return { ...prev, appSounds: next };
    });
  };

  const toggleVoiceGuidance = () => {
    setSettings((prev) => {
      const next = !prev.voiceGuidance;
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('Voice guidance screen reading enabled');
        window.speechSynthesis.speak(u);
      }
      return { ...prev, voiceGuidance: next };
    });
  };

  const closeToast = () => setActiveToast(null);

  return (
    <AppContext.Provider
      value={{
        user,
        workers,
        bookings,
        settings,
        activeToast,
        t,
        login,
        logout,
        setLanguage,
        toggleWorkerOnlineStatus,
        quickBookWorker,
        updateBookingStatus,
        toggleAppSounds,
        toggleVoiceGuidance,
        speakText,
        closeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
