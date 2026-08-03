import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { WorkerProfile, BookingRequest, WorkerSkill, COMMISSION_RATE } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let _client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('placeholder') &&
         SUPABASE_KEY.length > 0 && !SUPABASE_KEY.includes('placeholder');
}

export function getClient(): SupabaseClient | null {
  if (!isConfigured()) return null;
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return _client;
}

// ─── Fetch worker profile from Supabase ───────────────────
export async function fetchWorkerProfile(phone: string): Promise<WorkerProfile | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('provider_profiles')
      .select(`
        id, is_online, avg_rating, reviews_count,
        profiles!inner ( full_name, phone, avatar_url ),
        provider_skills ( category, hourly_rate, is_active, jobs_count )
      `)
      .eq('profiles.phone', phone)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      full_name: (data as any).profiles?.full_name ?? '',
      phone,
      language: 'en',
      avatar_url: (data as any).profiles?.avatar_url,
      is_online: !!data.is_online,
      rating: Number(data.avg_rating) || 5.0,
      reviews_count: data.reviews_count || 0,
      total_jobs: 0,
      consent_given: true,
      skills: ((data as any).provider_skills ?? []).map((s: any) => ({
        category: s.category,
        hourly_rate: Number(s.hourly_rate),
        is_active: s.is_active !== false,
        jobs_count: s.jobs_count || 0,
      })),
    };
  } catch { return null; }
}

// ─── Create / onboard a new worker ────────────────────────
export async function createWorkerProfile(params: {
  phone: string;
  name: string;
  skills: WorkerSkill[];
}): Promise<string | null> {
  const client = getClient();
  if (!client) return `local_${params.phone}`;
  try {
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .upsert({ phone: params.phone, full_name: params.name, role: 'provider', updated_at: new Date().toISOString() })
      .select('id').single();
    if (profileErr) return null;

    await client.from('provider_profiles').upsert({
      id: profile.id, is_online: false, avg_rating: 5.0, reviews_count: 0,
      lat: 13.9299, lng: 75.5681,
    });

    for (const skill of params.skills) {
      await client.from('provider_skills').upsert({
        provider_id: profile.id,
        category: skill.category,
        hourly_rate: skill.hourly_rate,
        is_active: true,
        jobs_count: 0,
      });
    }
    return profile.id;
  } catch { return null; }
}

// ─── Toggle online status ─────────────────────────────────
export async function setWorkerOnline(workerId: string, online: boolean): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client.from('provider_profiles').update({ is_online: online }).eq('id', workerId);
}

// ─── Fetch pending bookings for worker ────────────────────
export async function fetchWorkerBookings(workerId: string): Promise<BookingRequest[]> {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('bookings')
      .select(`
        id, customer_id, service_type, status, total_amount, commission_amount,
        address_notes, created_at,
        profiles!customer_id ( full_name, phone )
      `)
      .eq('provider_id', workerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((b: any) => ({
      id: b.id,
      customer_id: b.customer_id,
      customer_name: b.profiles?.full_name ?? 'Customer',
      customer_phone: b.profiles?.phone,
      service_type: b.service_type,
      address_notes: b.address_notes,
      total_amount: Number(b.total_amount),
      commission_amount: Number(b.commission_amount),
      net_amount: Number(b.total_amount) - Number(b.commission_amount),
      status: b.status,
      created_at: b.created_at,
      expires_at: new Date(new Date(b.created_at).getTime() + 90_000).toISOString(),
    }));
  } catch { return []; }
}

// ─── Accept / Decline booking ─────────────────────────────
export async function respondToBooking(bookingId: string, accept: boolean): Promise<boolean> {
  const client = getClient();
  if (!client) return true; // optimistic for demo
  try {
    const { error } = await client.from('bookings')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', bookingId);
    return !error;
  } catch { return false; }
}

// ─── Complete a booking ───────────────────────────────────
export async function completeBooking(bookingId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    const { error } = await client.from('bookings')
      .update({ status: 'completed' }).eq('id', bookingId);
    return !error;
  } catch { return false; }
}

// ─── Update worker skills ─────────────────────────────────
export async function updateWorkerSkills(workerId: string, skills: WorkerSkill[]): Promise<boolean> {
  const client = getClient();
  if (!client) return true;
  try {
    for (const skill of skills) {
      await client.from('provider_skills').upsert({
        provider_id: workerId,
        category: skill.category,
        hourly_rate: skill.hourly_rate,
        is_active: skill.is_active,
      });
    }
    return true;
  } catch { return false; }
}

// ─── Supabase real-time subscription for new bookings ────
export function subscribeToBookings(
  workerId: string,
  onNew: (booking: BookingRequest) => void
): RealtimeChannel | null {
  const client = getClient();
  if (!client) return null;

  return client
    .channel(`bookings:${workerId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bookings',
      filter: `provider_id=eq.${workerId}`,
    }, (payload) => {
      const b = payload.new as any;
      onNew({
        id: b.id,
        customer_id: b.customer_id,
        customer_name: 'New Customer',
        service_type: b.service_type,
        address_notes: b.address_notes,
        total_amount: Number(b.total_amount),
        commission_amount: Number(b.commission_amount),
        net_amount: Number(b.total_amount) * (1 - COMMISSION_RATE),
        status: 'pending',
        created_at: b.created_at,
        expires_at: new Date(new Date(b.created_at).getTime() + 90_000).toISOString(),
      });
    })
    .subscribe();
}
