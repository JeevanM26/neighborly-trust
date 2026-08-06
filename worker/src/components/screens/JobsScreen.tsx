// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { format } from 'date-fns';
import { BookingRequest, BookingStatus } from '../../lib/types';
import { MapPin, Phone, Check, Clock, X, Briefcase } from 'lucide-react';

const STATUS_META: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: '#92400E', bg: '#FEF3C7' },
  accepted:    { label: 'Accepted',    color: '#065F46', bg: '#ECFDF5' },
  in_progress: { label: 'In Progress', color: '#1E40AF', bg: '#DBEAFE' },
  completed:   { label: 'Completed',   color: '#065F46', bg: '#D1FAE5' },
  declined:    { label: 'Declined',    color: '#7F1D1D', bg: '#FEE2E2' },
  cancelled:   { label: 'Cancelled',  color: '#475569', bg: '#F1F5F9' },
};

const EMOJI: Record<string, string> = { Electrician:'⚡', Plumber:'🔧', Carpenter:'🪚', 'Home Clean':'🧹', Painter:'🎨', 'Pest Control':'🐛' };

function JobCard({ booking, onFinish }: { booking: BookingRequest; onFinish?: () => void }) {
  const meta = STATUS_META[booking.status] ?? STATUS_META.pending;
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #F1F5F9', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {EMOJI[booking.service_type] ?? '🔧'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{booking.customer_name}</div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{booking.service_type}</div>
          </div>
        </div>
        <div style={{ background: meta.bg, borderRadius: 20, padding: '4px 10px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{meta.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Earned</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>₹{booking.net_amount}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Date</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{format(new Date(booking.created_at), 'd MMM, h:mm a')}</div>
          </div>
        </div>
        {booking.status === 'accepted' && onFinish && (
          <button onClick={onFinish} style={{ background: 'linear-gradient(135deg, #059669, #065F46)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="white" /><span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Done</span>
          </button>
        )}
      </div>
      {booking.address_notes && (
        <div style={{ display: 'flex', gap: 5, marginTop: 8, alignItems: 'flex-start' }}>
          <MapPin size={11} color="#94A3B8" style={{ marginTop: 2 }} />
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{booking.address_notes}</span>
        </div>
      )}
    </div>
  );
}

export default function JobsScreen() {
  const { bookings, activeBookings, completedBookings, finishJob } = useWorker();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const tabs = [
    { key: 'active' as const, label: 'Active', count: activeBookings.length },
    { key: 'completed' as const, label: 'History', count: completedBookings.length },
  ];

  const list = tab === 'active' ? activeBookings : completedBookings;

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 0' }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>My Jobs</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 16px', fontWeight: 500 }}>
          {bookings.length} total bookings
        </p>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, gap: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t.key ? 'white' : 'transparent', fontWeight: 800, fontSize: 12, color: tab === t.key ? '#059669' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t.label}
              {t.count > 0 && (
                <div style={{ background: tab === t.key ? '#059669' : 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 900, color: 'white' }}>{t.count}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{tab === 'active' ? '📋' : '🏆'}</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
              {tab === 'active' ? 'No active jobs' : 'No completed jobs yet'}
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
              {tab === 'active' ? 'Accept a request from the Requests tab to get started.' : 'Completed jobs will appear here with earnings.'}
            </p>
          </div>
        ) : (
          list.map(b => <JobCard key={b.id} booking={b} onFinish={b.status === 'accepted' ? () => finishJob(b.id) : undefined} />)
        )}
      </div>
    </div>
  );
}

