import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Provider, Booking, BookingStatus } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Lazy singleton — avoids "supabaseUrl is required" crash during SSG when
// env vars are absent at build time.
let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (!isConfigured()) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

export function isConfigured(): boolean {
  return (
    SUPABASE_URL.length > 0 &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_KEY.length > 0 &&
    !SUPABASE_KEY.includes('placeholder')
  );
}

// ─── Fetch all providers ──────────────────────────────────
export async function fetchProviders(): Promise<Provider[]> {
  if (!isConfigured()) return [];
  try {
    const client = getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('provider_profiles')
      .select(`
        id, category, description, hourly_rate,
        avg_rating, reviews_count, is_online, lat, lng, featured,
        profiles!inner ( full_name, phone, avatar_url )
      `)
      .order('featured', { ascending: false });

    if (error || !data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.profiles?.full_name ?? 'Service Provider',
      category: row.category,
      description: row.description ?? '',
      hourly_rate: Number(row.hourly_rate) || 350,
      rating: Number(row.avg_rating) || 5.0,
      reviews_count: row.reviews_count || 0,
      is_online: !!row.is_online,
      lat: Number(row.lat),
      lng: Number(row.lng),
      featured: !!row.featured,
      avatar_url: row.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.profiles?.full_name ?? row.id}`,
      phone: row.profiles?.phone,
    }));
  } catch {
    return [];
  }
}

// ─── Fetch bookings for a customer ───────────────────────
export async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  if (!isConfigured() || !customerId) return [];
  try {
    const client = getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('bookings')
      .select(`
        id, customer_id, provider_id, service_type, status,
        total_amount, commission_amount, address_notes, created_at,
        provider_profiles!inner (
          profiles!inner ( full_name, avatar_url ),
          category
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((b: any) => ({
      id: b.id,
      customer_id: b.customer_id,
      provider_id: b.provider_id,
      provider_name: b.provider_profiles?.profiles?.full_name ?? 'Provider',
      provider_category: b.provider_profiles?.category ?? b.service_type,
      provider_avatar: b.provider_profiles?.profiles?.avatar_url,
      service_type: b.service_type,
      status: b.status as BookingStatus,
      total_amount: Number(b.total_amount),
      commission_amount: Number(b.commission_amount),
      address_notes: b.address_notes,
      created_at: b.created_at,
    }));
  } catch {
    return [];
  }
}

// ─── Create booking ───────────────────────────────────────
export async function createBooking(params: {
  customerId: string;
  providerId: string;
  serviceType: string;
  totalAmount: number;
  notes?: string;
}): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client
      .from('bookings')
      .insert({
        customer_id: params.customerId,
        provider_id: params.providerId,
        service_type: params.serviceType,
        total_amount: params.totalAmount,
        commission_amount: Math.round(params.totalAmount * 0.08),
        address_notes: params.notes ?? '',
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Upsert customer profile ──────────────────────────────
export async function upsertProfile(profile: {
  id: string;
  full_name: string;
  phone: string;
  language: string;
  consent_given: boolean;
}): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const client = getClient();
    if (!client) return false;
    const { error } = await client
      .from('profiles')
      .upsert({ ...profile, role: 'customer', updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}

// ─── Real-time: provider online status changes ─────────────
export function subscribeToProviders(
  onChange: (updatedRow: Partial<Provider> & { id: string }) => void
): ReturnType<ReturnType<typeof getClient>['channel']> | null {
  const client = getClient();
  if (!client) return null;

  return client
    .channel('provider_profiles_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'provider_profiles' },
      (payload) => {
        const row = payload.new as any;
        if (!row?.id) return;
        onChange({
          id: row.id,
          is_online: !!row.is_online,
          hourly_rate: Number(row.hourly_rate),
          category: row.category,
          lat: Number(row.lat),
          lng: Number(row.lng),
          featured: !!row.featured,
        });
      }
    )
    .subscribe();
}

// ─── Real-time: booking status updates ────────────────────
export function subscribeToBookingStatus(
  customerId: string,
  onUpdate: (bookingId: string, status: string) => void
): ReturnType<ReturnType<typeof getClient>['channel']> | null {
  const client = getClient();
  if (!client || !customerId) return null;

  return client
    .channel(`bookings_customer_${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (row?.id && row?.status) {
          onUpdate(row.id, row.status);
        }
      }
    )
    .subscribe();
}
