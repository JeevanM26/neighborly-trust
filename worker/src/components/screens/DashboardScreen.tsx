'use client';
import React, { useState, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { format } from 'date-fns';
import { Zap, Bell, Star, TrendingUp, Clock, CheckCircle, IndianRupee, RefreshCw, ChevronRight, Briefcase } from 'lucide-react';

export default function DashboardScreen({ onGoToRequests, onGoToJobs }: {
  onGoToRequests: () => void;
  onGoToJobs: () => void;
}) {
  const { worker, isOnline, toggleOnline, pendingBookings, activeBookings, earnings, isLoading, refreshBookings } = useWorker();
  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    await toggleOnline();
    setToggling(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = worker?.full_name?.split(' ')[0] ?? 'Partner';

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%', paddingBottom: 80 }}>

      {/* ── Hero Header ── */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.3px' }}>{greeting},</p>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>{firstName} 👷</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
              {format(currentTime, 'EEEE, d MMM · h:mm a')}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={16} color="white" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ── Big Online Toggle ── */}
        <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: '-0.2px' }}>
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
                {isOnline ? 'You\'re visible to customers' : 'Tap to start accepting bookings'}
              </p>
            </div>
            <button
              className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
              onClick={handleToggle}
              disabled={toggling}
              style={{ opacity: toggling ? 0.7 : 1 }}
              aria-label="Toggle online status"
            >
              <div className="toggle-knob" />
            </button>
          </div>

          {pendingBookings.length > 0 && (
            <button onClick={onGoToRequests} style={{ marginTop: 12, width: '100%', background: 'rgba(252,211,77,0.15)', border: '1px solid rgba(252,211,77,0.4)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: '#FCD34D', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={12} color="#065F46" />
                </div>
                <span style={{ color: '#FCD34D', fontSize: 13, fontWeight: 800 }}>{pendingBookings.length} booking request{pendingBookings.length > 1 ? 's' : ''} waiting!</span>
              </div>
              <ChevronRight size={16} color="#FCD34D" />
            </button>
          )}
        </div>
      </div>

      {/* ── Today's Stats ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: "Today's Earnings", value: `₹${earnings.net.toLocaleString('en-IN')}`, sub: `${earnings.jobs_count} jobs`, icon: IndianRupee, color: '#059669', bg: '#ECFDF5', iconColor: '#059669' },
            { label: 'Active Jobs', value: activeBookings.length, sub: 'in progress', icon: Briefcase, color: '#0B3D66', bg: '#EFF6FF', iconColor: '#3B82F6' },
            { label: 'Your Rating', value: worker?.rating?.toFixed(1) ?? '5.0', sub: `${worker?.reviews_count ?? 0} reviews`, icon: Star, color: '#92400E', bg: '#FEF3C7', iconColor: '#F59E0B' },
            { label: 'Total Jobs', value: worker?.total_jobs ?? 0, sub: 'completed', icon: CheckCircle, color: '#065F46', bg: '#ECFDF5', iconColor: '#10B981' },
          ].map(({ label, value, sub, icon: Icon, color, bg, iconColor }) => (
            <div key={label} style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={18} color={iconColor} strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Your Skills ── */}
      {worker?.skills && worker.skills.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.2px' }}>Your Active Skills</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {worker.skills.filter(s => s.is_active).map(skill => (
              <div key={skill.category} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #D1FAE5', borderRadius: 20, padding: '6px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 14 }}>{['Electrician','Plumber','Carpenter','Home Clean','Painter','Pest Control'].includes(skill.category) ? ['⚡','🔧','🪚','🧹','🎨','🐛'][['Electrician','Plumber','Carpenter','Home Clean','Painter','Pest Control'].indexOf(skill.category)] : '🔧'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>{skill.category}</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8' }}>₹{skill.hourly_rate}/hr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Jobs ── */}
      {activeBookings.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Active Jobs</h3>
            <button onClick={onGoToJobs} style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {activeBookings.slice(0, 2).map(b => (
            <div key={b.id} style={{ background: 'white', borderRadius: 16, padding: '14px', border: '1px solid #D1FAE5', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{b.customer_name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{b.service_type}</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '4px 10px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Active</span>
                </div>
              </div>
              {b.address_notes && <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0', fontWeight: 500, background: '#F8FAFC', borderRadius: 8, padding: '6px 10px' }}>📍 {b.address_notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty / Offline State ── */}
      {!isOnline && activeBookings.length === 0 && pendingBookings.length === 0 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>😴</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginBottom: 6 }}>You're offline</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, lineHeight: 1.6 }}>Toggle the switch above to start receiving bookings from customers near you.</p>
        </div>
      )}
    </div>
  );
}
