'use client';
import React, { useState } from 'react';
import { WorkerProvider, useWorker } from '../context/WorkerContext';
import WorkerDashboard from '../components/screens/WorkerDashboard';
import IncomingJobsScreen from '../components/screens/IncomingJobsScreen';
import EarningsScreen from '../components/screens/EarningsScreen';
import { Home, Briefcase, DollarSign, Bell } from 'lucide-react';

type Tab = 'dashboard' | 'jobs' | 'earnings';

function Toast() {
  const { toast } = useWorker();
  if (!toast) return null;

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: '#0F172A', color: 'white', padding: '12px 20px',
      borderRadius: 30, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease-out'
    }}>
      <Bell size={16} color="#F59E0B" />
      <span>{toast}</span>
    </div>
  );
}

function MainContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { jobs } = useWorker();

  const pendingCount = jobs.filter(j => j.status === 'pending').length;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', position: 'relative' }}>
      <Toast />

      {activeTab === 'dashboard' && <WorkerDashboard onNavigateTab={setActiveTab} />}
      {activeTab === 'jobs' && <IncomingJobsScreen onBack={() => setActiveTab('dashboard')} />}
      {activeTab === 'earnings' && <EarningsScreen onBack={() => setActiveTab('dashboard')} />}

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, background: 'white', borderTop: '1px solid #E2E8F0',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '8px 0', zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 4,
            color: activeTab === 'dashboard' ? '#0B3D66' : '#94A3B8'
          }}
        >
          <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
          <span style={{ fontSize: 11, fontWeight: activeTab === 'dashboard' ? 800 : 500 }}>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative',
            color: activeTab === 'jobs' ? '#0B3D66' : '#94A3B8'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Briefcase size={20} strokeWidth={activeTab === 'jobs' ? 2.5 : 1.8} />
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -6, background: '#EF4444', color: 'white',
                fontSize: 9, fontWeight: 900, borderRadius: '50%', width: 14, height: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {pendingCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: activeTab === 'jobs' ? 800 : 500 }}>Jobs</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 4,
            color: activeTab === 'earnings' ? '#0B3D66' : '#94A3B8'
          }}
        >
          <DollarSign size={20} strokeWidth={activeTab === 'earnings' ? 2.5 : 1.8} />
          <span style={{ fontSize: 11, fontWeight: activeTab === 'earnings' ? 800 : 500 }}>Earnings</span>
        </button>
      </nav>
    </div>
  );
}

export default function WorkerApp() {
  return (
    <WorkerProvider>
      <MainContent />
    </WorkerProvider>
  );
}
