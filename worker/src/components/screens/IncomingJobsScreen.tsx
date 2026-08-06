// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { JobStatus } from '../../lib/types';
import { MapPin, Phone, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';

export default function IncomingJobsScreen({ onBack }: { onBack: () => void }) {
  const { jobs, acceptJob, declineJob, completeJob } = useWorker();
  const [filter, setFilter] = useState<'all' | JobStatus>('all');

  const filteredJobs = jobs.filter(j => filter === 'all' || j.status === filter);

  return (
    <div style={{ paddingBottom: 80 }} className="fade-in">
      <div style={{
        background: '#041B30', color: 'white', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Jobs & Requests</h2>
      </div>

      <div style={{ padding: 16 }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }}>
          {(['all', 'pending', 'accepted', 'completed', 'declined'] as const).map(statusKey => (
            <button
              key={statusKey}
              onClick={() => setFilter(statusKey)}
              style={{
                background: filter === statusKey ? '#0B3D66' : 'white',
                color: filter === statusKey ? 'white' : '#64748B',
                border: filter === statusKey ? '1px solid #0B3D66' : '1px solid #CBD5E1',
                borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap'
              }}
            >
              {statusKey}
            </button>
          ))}
        </div>

        {/* Job Cards */}
        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B', fontSize: 13 }}>
            No jobs found for this filter category.
          </div>
        ) : (
          filteredJobs.map(job => (
            <div
              key={job.id}
              style={{
                background: 'white', borderRadius: 16, padding: 16, marginBottom: 12,
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{job.customer_name}</span>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 10,
                  background: job.status === 'completed' ? '#DCFCE7' : job.status === 'accepted' ? '#E0F2FE' : job.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                  color: job.status === 'completed' ? '#15803D' : job.status === 'accepted' ? '#0369A1' : job.status === 'pending' ? '#B45309' : '#B91C1C',
                  textTransform: 'uppercase'
                }}>
                  {job.status}
                </span>
              </div>

              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color="#0B3D66" /> {job.address_notes} ({job.distance_km} km)
              </p>

              <div style={{
                background: '#F8FAFC', borderRadius: 10, padding: 10, display: 'flex',
                justify: 'space-between', alignItems: 'center', marginBottom: 12
              }}>
                <div>
                  <span style={{ fontSize: 10, color: '#64748B' }}>Total Customer Bill</span>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>₹{job.total_amount}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: '#EF4444' }}>8% Platform Fee</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>-₹{job.commission_amount}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, color: '#10B981' }}>Your Net Earnings</span>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#10B981' }}>₹{job.net_earnings}</div>
                </div>
              </div>

              {job.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => acceptJob(job.id)}
                    style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineJob(job.id)}
                    style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Decline
                  </button>
                </div>
              )}

              {job.status === 'accepted' && (
                <button
                  onClick={() => completeJob(job.id)}
                  style={{ width: '100%', background: '#0B3D66', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Mark Service Completed
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

