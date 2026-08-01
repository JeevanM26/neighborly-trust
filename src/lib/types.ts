export type UserRole = 'customer' | 'provider';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'bn'
  | 'te'
  | 'mr'
  | 'ta'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'pa';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  language: LanguageCode;
  consent_given: boolean;
  avatar_url?: string;
  created_at?: string;
}

export const OWNER_PHONE_NUMBERS = ['7975182162', '8867269712'];

export interface ProviderProfile {
  id: string;
  name: string;
  category: string;
  role: string;
  hourly_rate: number;
  description: string;
  rating: number;
  reviews_count: number;
  is_online: boolean;
  lat: number;
  lng: number;
  featured: boolean;
  featured_until?: string | null;
  is_blacklisted?: boolean;
  distanceKm?: number;
  distanceLabel?: string;
  about?: string;
  area?: string;
  tags?: string[];
}

export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'declined';

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  provider?: ProviderProfile;
  service_type: string;
  status: BookingStatus;
  total_amount: number;
  commission_amount: number;
  rating?: number;
  created_at: string;
}

export interface Rating {
  id: string;
  booking_id: string;
  provider_id: string;
  customer_id: string;
  stars: number;
  comment?: string;
  created_at: string;
}

export interface Payout {
  id: string;
  provider_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'completed' | 'failed';
}
