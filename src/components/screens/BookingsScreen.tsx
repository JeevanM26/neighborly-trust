'use client';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../lib/types';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, CalendarDays, Phone } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; emoji: string }> = {
  pending:   { label: 'Pending',   color: '#92400E', bg: '#FEF3C7', icon: Clock,         emoji: '⏳' },
  accepted:  { label: 'Accepted',  color: '#1D4ED8', bg: '#DBEAFE', icon: AlertCircle,   emoji: '✅' },
  completed: { label: 'Completed', color: '#15803D', bg: '#DCFCE7', icon: CheckCircle,   emoji: '🎉' },
  declined:  { label: 'Declined',  color: '#DC2626', bg: '#FEE2E2', icon: XCircle,       emoji: '❌' },
};

function BookingCard({ booking }: { booking: Booking }) {
  const { user, webrtc } = useApp();
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  const formattedDate = (() => {
    try {
      const d = new Date(booking.created_at);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  })();

  const formattedTime = (() => {
    try {
      const d = new Date(booking.created_at);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
  })();

  return (
    <div style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Status bar */}
      <div style={{ height: 4, background: status.bg }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
              background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {booking.provider_avatar ? (
                <img src={booking.provider_avatar} alt={booking.provider_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 22 }}>🔧</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                {booking.provider_name}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                {booking.provider_category}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: status.bg, padding: '4px 10px', borderRadius: 20,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12 }}>{status.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: '#F1F5F9', margin: '0 0 10px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>
            <CalendarDays size={11} />
            <span>{formattedDate} · {formattedTime}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0B3D66' }}>
            ₹{booking.total_amount}
          </div>
        </div>

        {booking.address_notes && (
          <div style={{ marginTop: 8, background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#64748B', fontWeight: 500 }}>
            📍 {booking.address_notes}
          </div>
        )}

        {booking.status === 'accepted' && (
          <div style={{ marginTop: 12 }}>
            <button 
              onClick={(e) => { e.currentTarget.blur(); webrtc.startCall(booking.provider_id, booking.provider_name, user?.full_name || 'Customer'); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#F0FDF4', border: '1px solid #A7F3D0', color: '#059669',
                padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, width: '100%', cursor: 'pointer'
              }}
            >
              <Phone size={14} /> In-App Call Worker
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyBookings() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#334155', marginBottom: 8, letterSpacing: '-0.2px' }}>
        No bookings yet
      </h3>
      <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, lineHeight: 1.5 }}>
        Book your first verified specialist<br />from the Home tab!
      </p>
    </div>
  );
}

export default function BookingsScreen() {
  const { bookings, refreshBookings, isLoading } = useApp();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { refreshBookings(); }, [refreshBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };

  const active = bookings.filter(b => b.status === 'pending' || b.status === 'accepted');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'declined');
  const shown = tab === 'active' ? active : past;

  return (
    <div style={{ background: '#F0F7FF', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>
            My Bookings
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={16} color="white" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 }}>
          {([['active', 'Active'], ['past', 'Past']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === key ? 'white' : 'transparent',
                color: tab === key ? '#0B3D66' : 'rgba(255,255,255,0.7)',
                fontSize: 13, fontWeight: 800, transition: 'all 0.15s ease',
              }}
            >
              {label} {key === 'active' ? (active.length > 0 ? `(${active.length})` : '') : past.length > 0 ? `(${past.length})` : ''}
            </button>
          ))}
        </div>

        <div style={{ height: 16 }} />
      </div>

      {/* List */}
      <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <>
            {[1, 2].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="skeleton" style={{ height: 44, width: 44, borderRadius: 12, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '40%' }} />
              </div>
            ))}
          </>
        ) : shown.length === 0 && !isLoading ? (
          <EmptyBookings />
        ) : (
          shown.map(b => <BookingCard key={b.id} booking={b} />)
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
