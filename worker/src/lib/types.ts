// ============================================================
// NEIGHBORLY TRUST WORKER — Domain Types
// ============================================================

export type JobStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'cancelled';
export type BookingStatus = JobStatus;
export type ServiceCategory = 'Electrician' | 'Plumber' | 'Carpenter' | 'Home Clean';

export const SKILL_CATEGORIES = ['Electrician', 'Plumber', 'Carpenter', 'Home Clean', 'Painter', 'Pest Control'];

export interface WorkerSkill {
  category: string;
  is_active: boolean;
  jobs_count: number;
  hourly_rate: number;
  key?: string;
  emoji?: string;
  label?: string;
  description?: string;
  bg?: string;
  default_rate?: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  full_name: string;
  phone: string;
  category: ServiceCategory | string;
  hourly_rate: number;
  avg_rating: number;
  rating: number;
  reviews_count: number;
  total_jobs: number;
  is_online: boolean;
  lat: number;
  lng: number;
  avatar_url: string;
  skills: WorkerSkill[];
}

export interface IncomingJob {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  address_notes: string;
  distance_km: number;
  total_amount: number;
  commission_amount: number; // 8% platform fee
  net_earnings: number;      // 92% to provider
  net_amount?: number;       // Alias for net_earnings
  expires_at?: string;
  status: JobStatus;
  created_at: string;
}

export type BookingRequest = IncomingJob;

export interface PayoutSummary {
  gross_earnings: number;
  platform_commission: number; // 8%
  net_payout: number;          // 92%
  completed_jobs_count: number;
  pending_payout_amount: number;
}

export interface PayoutRecord {
  id: string;
  job_id: string;
  customer_name: string;
  service_type: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  date: string;
  status: 'paid' | 'pending';
}

export const PLATFORM_COMMISSION_RATE = 0.08; // 8% commission rate
export const COMMISSION_RATE = PLATFORM_COMMISSION_RATE;

export function calculateNetEarnings(gross: number): { gross: number; commission: number; net: number } {
  const commission = Math.round(gross * PLATFORM_COMMISSION_RATE * 100) / 100;
  const net = Math.round((gross - commission) * 100) / 100;
  return { gross, commission, net };
}
