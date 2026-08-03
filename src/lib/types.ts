// ============================================================
// NEIGHBORLY TRUST — Domain Types (Customer App)
// ============================================================

export type UserRole = 'customer' | 'owner';

export type LanguageCode =
  | 'en' | 'hi' | 'bn' | 'te' | 'mr'
  | 'ta' | 'gu' | 'kn' | 'ml' | 'pa';

export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'declined';
export type ServiceCategory = 'Electrician' | 'Plumber' | 'Carpenter' | 'Home Clean';

// ─── User Profile ─────────────────────────────────────────
export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  language: LanguageCode;
  consent_given: boolean;
  avatar_url?: string;
}

// ─── Provider (Worker) — read from Supabase ───────────────
export interface Provider {
  id: string;
  name: string;
  category: ServiceCategory | string;
  description: string;
  hourly_rate: number;
  rating: number;
  reviews_count: number;
  is_online: boolean;
  is_blacklisted?: boolean;
  lat: number;
  lng: number;
  featured: boolean;
  featured_until?: string | null;
  avatar_url: string;
  phone?: string;
  // Computed on client
  distanceKm?: number;
  tags?: string[];
}

// ─── Booking ──────────────────────────────────────────────
export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_avatar?: string;
  service_type: string;
  status: BookingStatus;
  total_amount: number;
  commission_amount: number;
  address_notes?: string;
  created_at: string;
}

// ─── App Settings ─────────────────────────────────────────
export interface AppSettings {
  language: LanguageCode;
  sounds: boolean;
  voice: boolean;
}

// ─── Owner Config ─────────────────────────────────────────
export const PRIMARY_SUPER_OWNER = '7975182162';
export const OWNER_PHONES: string[] = ['7975182162', '8867269712'];
// Alias used in LoginScreen
export const DEFAULT_OWNER_PHONE_NUMBERS = OWNER_PHONES;

// ─── Service Categories ───────────────────────────────────
export const SERVICE_CATEGORIES: {
  key: ServiceCategory;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}[] = [
  { key: 'Electrician', label: 'Electrician', emoji: '⚡', color: '#B45309', bg: '#FEF3C7' },
  { key: 'Plumber',     label: 'Plumber',     emoji: '🔧', color: '#0369A1', bg: '#E0F2FE' },
  { key: 'Carpenter',   label: 'Carpenter',   emoji: '🪚', color: '#C2410C', bg: '#FFEDD5' },
  { key: 'Home Clean',  label: 'Home Clean',  emoji: '🧹', color: '#15803D', bg: '#DCFCE7' },
];

// ─── Toast ────────────────────────────────────────────────
export interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Default Location (Shivamogga, Karnataka) ─────────────
export const DEFAULT_LOCATION = { lat: 13.9299, lng: 75.5681 };
