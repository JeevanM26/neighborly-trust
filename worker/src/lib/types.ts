// ============================================================
// NEIGHBORLY TRUST — Worker App Domain Types
// ============================================================

export type LanguageCode = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa';

export type ServiceCategory =
  | 'Electrician'
  | 'Plumber'
  | 'Carpenter'
  | 'Home Clean'
  | 'Painter'
  | 'Pest Control';

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'cancelled';

// ─── Worker Profile ────────────────────────────────────────
export interface WorkerProfile {
  id: string;
  full_name: string;
  phone: string;
  language: LanguageCode;
  avatar_url?: string;
  is_online: boolean;
  rating: number;
  reviews_count: number;
  total_jobs: number;
  consent_given: boolean;
  // Multi-skill: array of skills with individual rates
  skills: WorkerSkill[];
}

// ─── Worker Skill (one per category) ──────────────────────
export interface WorkerSkill {
  category: ServiceCategory;
  hourly_rate: number;    // ₹ per hour for this specific skill
  is_active: boolean;     // worker can temporarily disable a skill
  jobs_count: number;     // jobs done in this category
}

// ─── Booking (from customer side) ─────────────────────────
export interface BookingRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  service_type: ServiceCategory | string;
  address_notes?: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;       // total - commission
  status: BookingStatus;
  created_at: string;
  // time left to respond (90s from creation)
  expires_at?: string;
}

// ─── Earnings Summary ─────────────────────────────────────
export interface EarningsSummary {
  gross: number;
  commission: number;
  net: number;
  jobs_count: number;
  period: 'today' | 'week' | 'month';
  by_skill: { category: string; amount: number; count: number }[];
}

// ─── App Settings ─────────────────────────────────────────
export interface WorkerSettings {
  language: LanguageCode;
  sounds: boolean;
  notifications: boolean;
}

// ─── Toast ────────────────────────────────────────────────
export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Service Category Meta ─────────────────────────────────
export const SKILL_CATEGORIES: {
  key: ServiceCategory;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  description: string;
  default_rate: number;
}[] = [
  { key: 'Electrician',  label: 'Electrician',  emoji: '⚡', color: '#B45309', bg: '#FEF3C7', description: 'Wiring, repairs, installations',   default_rate: 400 },
  { key: 'Plumber',      label: 'Plumber',      emoji: '🔧', color: '#0369A1', bg: '#E0F2FE', description: 'Pipes, faucets, drainage',          default_rate: 350 },
  { key: 'Carpenter',    label: 'Carpenter',    emoji: '🪚', color: '#C2410C', bg: '#FFEDD5', description: 'Furniture, woodwork, doors',        default_rate: 380 },
  { key: 'Home Clean',   label: 'Home Clean',   emoji: '🧹', color: '#15803D', bg: '#DCFCE7', description: 'Deep cleaning, housekeeping',      default_rate: 280 },
  { key: 'Painter',      label: 'Painter',      emoji: '🎨', color: '#6D28D9', bg: '#EDE9FE', description: 'Interior & exterior painting',     default_rate: 350 },
  { key: 'Pest Control', label: 'Pest Control', emoji: '🐛', color: '#065F46', bg: '#ECFDF5', description: 'Fumigation & prevention',          default_rate: 450 },
];

// ─── Owner Config ─────────────────────────────────────────
export const PRIMARY_SUPER_OWNER = '7975182162';
export const OWNER_PHONES: string[] = ['7975182162', '8867269712'];
export const COMMISSION_RATE = 0.08; // 8%

// ─── Default Location ─────────────────────────────────────
export const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 };
