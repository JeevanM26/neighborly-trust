'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  WorkerProfile, IncomingJob, PayoutSummary, PayoutRecord, calculateNetEarnings
} from '../lib/types';
import confetti from 'canvas-confetti';
import { useWebRTC } from '../hooks/useWebRTC';
import { CallOverlay } from '../components/CallOverlay';

const INITIAL_WORKER: WorkerProfile = {
  id: 'wkr_7975182162',
  name: 'Ramesh K.',
  full_name: 'Ramesh K.',
  phone: '+91 9876543210',
  category: 'Electrician',
  hourly_rate: 450,
  avg_rating: 4.8,
  rating: 4.8,
  reviews_count: 124,
  total_jobs: 124,
  is_online: false,
  lat: 12.9716,
  lng: 77.5946,
  avatar_url: 'https://i.pravatar.cc/150?u=wkr_7975182162',
  skills: [
    { category: 'Electrician', is_active: true, jobs_count: 124, hourly_rate: 450 }
  ]
};

const SAMPLE_JOBS: IncomingJob[] = [
  {
    id: 'job_101',
    customer_id: 'cst_user1',
    customer_name: 'Ananya Rao',
    customer_phone: '9845012345',
    service_type: 'Electrician',
    address_notes: 'Opposite Main Bus Stand, Near Water Tank, Shivamogga',
    distance_km: 1.2,
    total_amount: 350,
    commission_amount: 28,
    net_earnings: 322,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'job_102',
    customer_id: 'cst_user2',
    customer_name: 'Suresh Gowda',
    customer_phone: '9980123456',
    service_type: 'Electrician',
    address_notes: 'Vidyanagar 2nd Cross, House #42',
    distance_km: 2.8,
    total_amount: 700,
    commission_amount: 56,
    net_earnings: 644,
    status: 'accepted',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'job_100',
    customer_id: 'cst_user3',
    customer_name: 'Priya Sharma',
    customer_phone: '9741098765',
    service_type: 'Electrician',
    address_notes: 'Vinoba Nagar, Near City Hospital',
    distance_km: 0.8,
    total_amount: 500,
    commission_amount: 40,
    net_earnings: 460,
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

interface WorkerContextType {
  worker: WorkerProfile;
  jobs: IncomingJob[];
  payouts: PayoutRecord[];
  payoutSummary: PayoutSummary;
  toggleOnlineStatus: () => void;
  acceptJob: (jobId: string) => void;
  declineJob: (jobId: string) => void;
  completeJob: (jobId: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  webrtc: ReturnType<typeof useWebRTC>;

  // Aliases for compatibility
  bookings: IncomingJob[];
  pendingBookings: IncomingJob[];
  activeBookings: IncomingJob[];
  completedBookings: IncomingJob[];
  acceptBooking: (jobId: string) => void;
  declineBooking: (jobId: string) => void;
  finishJob: (jobId: string) => void;
  refreshBookings: () => void;
  isLoading: boolean;
  isOnline: boolean;
  
  loginWorker: (phone: string, code: string) => Promise<boolean>;
  logoutWorker: () => void;
  completeOnboarding: (data: any) => Promise<void>;
  isNewWorker: boolean;
  updateSkills: (skills: any[]) => Promise<void>;
  settings: any;
  setLanguage: (lang: string) => void;
  toggleSound: () => void;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<WorkerProfile>(INITIAL_WORKER);
  const [jobs, setJobs] = useState<IncomingJob[]>(SAMPLE_JOBS);
  const [toast, setToast] = useState<string | null>(null);

  const webrtc = useWebRTC(worker.id);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleOnlineStatus = useCallback(() => {
    setWorker(prev => {
      const nextStatus = !prev.is_online;
      showToast(nextStatus ? '🟢 You are now ONLINE & visible to customers!' : '🔴 You are OFFLINE');
      return { ...prev, is_online: nextStatus };
    });
  }, [showToast]);

  const acceptJob = useCallback((jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'accepted' } : j));
    showToast('✅ Job Accepted! Customer notified.');
  }, [showToast]);

  const declineJob = useCallback((jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'declined' } : j));
    showToast('ℹ️ Job request declined.');
  }, [showToast]);

  const completeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' } : j));
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}
    showToast('🎉 Job Marked Completed! Net payout added to ledger.');
  }, [showToast]);

  // Compute payouts
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const grossEarnings = completedJobs.reduce((acc, j) => acc + j.total_amount, 0);
  const platformCommission = completedJobs.reduce((acc, j) => acc + j.commission_amount, 0);
  const netPayout = completedJobs.reduce((acc, j) => acc + j.net_earnings, 0);

  const payoutSummary: PayoutSummary = {
    gross_earnings: grossEarnings,
    platform_commission: platformCommission,
    net_payout: netPayout,
    completed_jobs_count: completedJobs.length,
    pending_payout_amount: netPayout,
  };

  const payouts: PayoutRecord[] = completedJobs.map(j => ({
    id: `pay_${j.id}`,
    job_id: j.id,
    customer_name: j.customer_name,
    service_type: j.service_type,
    gross_amount: j.total_amount,
    commission_amount: j.commission_amount,
    net_amount: j.net_earnings,
    date: new Date(j.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    status: 'pending',
  }));

  // Derived and Mock Values for compatibility
  const bookings = jobs;
  const pendingBookings = jobs.filter(j => j.status === 'pending');
  const activeBookings = jobs.filter(j => j.status === 'accepted' || j.status === 'in_progress');
  const completedBookings = jobs.filter(j => j.status === 'completed');
  
  const acceptBooking = acceptJob;
  const declineBooking = declineJob;
  const finishJob = completeJob;
  const refreshBookings = () => {};
  const isLoading = false;
  const isOnline = worker.is_online;
  
  const loginWorker = async () => true;
  const logoutWorker = () => {};
  const completeOnboarding = async () => {};
  const isNewWorker = false;
  const updateSkills = async () => {};
  const settings = { language: 'en', sound: true };
  const setLanguage = () => {};
  const toggleSound = () => {};

  return (
    <WorkerContext.Provider value={{
      worker,
      jobs,
      payouts,
      payoutSummary,
      toggleOnlineStatus,
      acceptJob,
      declineJob,
      completeJob,
      toast,
      showToast,
      webrtc,
      bookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      acceptBooking,
      declineBooking,
      finishJob,
      refreshBookings,
      isLoading,
      isOnline,
      loginWorker,
      logoutWorker,
      completeOnboarding,
      isNewWorker,
      updateSkills,
      settings,
      setLanguage,
      toggleSound
    }}>
      {children}
      <CallOverlay webrtc={webrtc} />
    </WorkerContext.Provider>
  );
};

export const useWorker = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorker must be used within WorkerProvider');
  return ctx;
};
