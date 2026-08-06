'use client';
import React from 'react';
import { useWorker } from '../../context/WorkerContext';
import { Power, MapPin, Star, ShieldCheck, CheckCircle2, Clock, DollarSign, ChevronRight, Phone } from 'lucide-react';

export default function WorkerDashboard({
  onNavigateTab
}: {
  onNavigateTab: (tab: 'jobs' | 'earnings') => void;
}) {
  const { worker, jobs, payoutSummary, toggleOnlineStatus, acceptJob, declineJob, completeJob, webrtc } = useWorker();

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const activeJobs = jobs.filter(j => j.status === 'accepted');

  return (
    <div style={{ paddingBottom: 80 }} className="fade-in">
      {/* Header Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)',
        color: 'white', padding: '24px 20px', borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 30px rgba(4,27,48,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={worker.avatar_url}
              alt={worker.name}
              style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #F59E0B', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{worker.name}</h2>
                <ShieldCheck size={18} color="#F59E0B" />
              </div>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '2px 0 0' }}>{worker.category} • ₹{worker.hourly_rate}/hr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{worker.avg_rating}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>({worker.reviews_count} reviews)</span>
              </div>
            </div>
          </div>

          {/* Online Toggle Button */}
          <button
            onClick={toggleOnlineStatus}
            style={{
              background: worker.is_online ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              border: `1.5px solid ${worker.is_online ? '#10B981' : '#EF4444'}`,
              borderRadius: 30, padding: '8px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: worker.is_online ? '#34D399' : '#FCA5A5',
              transition: 'all 0.2s ease',
            }}
          >
            <Power size={16} />
            <span style={{ fontSize: 12, fontWeight: 800 }}>{worker.is_online ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20,
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
          borderRadius: 16, padding: 12, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{pendingJobs.length}</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>{activeJobs.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Earnings</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#34D399' }}>₹{payoutSummary.net_payout}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Pending Requests Alert */}
        {pendingJobs.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderRadius: 16, padding: 16, marginBottom: 20,
            border: '1px solid #F59E0B', boxShadow: '0 4px 15px rgba(245,158,11,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#B45309" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#78350F' }}>New Booking Request!</span>
              </div>
              <span style={{ fontSize: 10, background: '#B45309', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                {pendingJobs[0].distance_km} km away
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>{pendingJobs[0].customer_name}</p>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color="#B45309" /> {pendingJobs[0].address_notes}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => acceptJob(pendingJobs[0].id)}
                style={{
                  flex: 1, background: '#10B981', color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Accept Job (₹{pendingJobs[0].net_earnings} Net)
              </button>
              <button
                onClick={() => declineJob(pendingJobs[0].id)}
                style={{
                  background: '#EF4444', color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Active Jobs */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#0B3D66" />
            Active Service Orders ({activeJobs.length})
          </h3>
          {activeJobs.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 16, padding: 24, textAlign: 'center',
              border: '1.5px dashed #CBD5E1', color: '#64748B', fontSize: 13
            }}>
              No active jobs right now. Toggle ONLINE to receive local customer requests!
            </div>
          ) : (
            activeJobs.map(job => (
              <div
                key={job.id}
                style={{
                  background: 'white', borderRadius: 16, padding: 16, marginBottom: 12,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{job.customer_name}</span>
                  <button
                    onClick={() => webrtc.startCall(job.customer_id, job.customer_name, worker.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, background: '#E0F2FE', color: '#0369A1',
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <Phone size={14} /> Call Customer
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color="#0B3D66" /> {job.address_notes}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <div>
                    <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Gross / Net Payout</span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      ₹{job.total_amount} <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>(₹{job.net_earnings} net)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => completeJob(job.id)}
                    style={{
                      background: '#0B3D66', color: 'white', border: 'none', borderRadius: 10,
                      padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Net Payout Banner */}
        <div
          onClick={() => onNavigateTab('earnings')}
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white', borderRadius: 16, padding: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 25px rgba(15,23,42,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(52,211,153,0.2)', width: 44, height: 44, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={24} color="#34D399" />
            </div>
            <div>
              <span style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Weekly Ledger</span>
              <div style={{ fontSize: 16, fontWeight: 800 }}>₹{payoutSummary.net_payout} <span style={{ fontSize: 11, opacity: 0.6 }}>(8% fee auto-deducted)</span></div>
            </div>
          </div>
          <ChevronRight size={20} opacity={0.6} />
        </div>
      </div>
    </div>
  );
}
