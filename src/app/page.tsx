'use client';
import React, { useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Provider } from '../lib/types';

// Screens
import LoginScreen from '../components/screens/LoginScreen';
import HomeScreen from '../components/screens/HomeScreen';
import MapScreen from '../components/screens/MapScreen';
import BookingsScreen from '../components/screens/BookingsScreen';
import WorkerScreen from '../components/screens/WorkerScreen';
import ProfileScreen from '../components/screens/ProfileScreen';
import OwnerPanel from '../components/screens/OwnerPanel';
import ProviderDetail from '../components/screens/ProviderDetail';

// Icons (lucide-react)
import { Home, Map, BookOpen, Briefcase, User, ShieldCheck } from 'lucide-react';

// ─── Toast ─────────────────────────────────────────────────
function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;
  const icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container" onClick={dismissToast} style={{ cursor: 'pointer' }}>
      <div className={`toast toast-${toast.type}`}>
        <span style={{ fontSize: 16 }}>{icons[toast.type]}</span>
        <span style={{ flex: 1 }}>{toast.message}</span>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ─────────────────────────────────────
type Tab = 'home' | 'map' | 'bookings' | 'worker' | 'profile';

const NAV_ITEMS: { key: Tab; label: string; icon: any; activeIcon?: any }[] = [
  { key: 'home',     label: 'Home',     icon: Home      },
  { key: 'map',      label: 'Map',      icon: Map       },
  { key: 'bookings', label: 'Bookings', icon: BookOpen  },
  { key: 'worker',   label: 'Worker',   icon: Briefcase },
  { key: 'profile',  label: 'Profile',  icon: User      },
];

function BottomNav({ active, onChange, pendingCount }: {
  active: Tab;
  onChange: (t: Tab) => void;
  pendingCount: number;
}) {
  return (
    <nav
      className="bottom-nav"
      style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          className={`nav-item${active === item.key ? ' active' : ''}`}
          onClick={() => onChange(item.key)}
          aria-current={active === item.key ? 'page' : undefined}
        >
          <div style={{ position: 'relative' }}>
            <item.icon
              size={22}
              strokeWidth={active === item.key ? 2.5 : 1.8}
            />
            {item.key === 'bookings' && pendingCount > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                background: '#EF4444', color: 'white', borderRadius: '50%',
                width: 14, height: 14, fontSize: 8, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white',
              }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </div>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: active === item.key ? 700 : 500 }}>
            {item.label}
          </span>
          <div className="nav-item-dot" />
        </button>
      ))}
    </nav>
  );
}

// ─── Main App (authenticated shell) ───────────────────────
function AuthenticatedApp() {
  const { bookings, user } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const handleSelectProvider = (p: Provider) => {
    setSelectedProvider(p);
  };

  const handleBack = () => {
    setSelectedProvider(null);
  };

  const handleBooked = () => {
    setSelectedProvider(null);
    setTab('bookings');
  };

  // If provider detail is open, show it full-screen
  if (selectedProvider) {
    return (
      <>
        <div className="screen" style={{ flex: 1, overflow: 'hidden' }}>
          <ProviderDetail
            provider={selectedProvider}
            onBack={handleBack}
            onBooked={handleBooked}
          />
        </div>
        <Toast />
      </>
    );
  }

  // Owner panel
  if (showOwnerPanel) {
    return (
      <>
        <div className="screen" style={{ flex: 1, overflow: 'hidden' }}>
          <OwnerPanel onClose={() => setShowOwnerPanel(false)} />
        </div>
        <Toast />
      </>
    );
  }

  return (
    <>
      <Toast />

      {/* Screens */}
      <div className="screen" hidden={tab !== 'home'}>
        <HomeScreen onSelectProvider={handleSelectProvider} />
      </div>

      <div className="screen" hidden={tab !== 'map'}>
        <MapScreen onSelectProvider={handleSelectProvider} />
      </div>

      <div className="screen" hidden={tab !== 'bookings'}>
        <BookingsScreen />
      </div>

      <div className="screen" hidden={tab !== 'worker'}>
        <WorkerScreen onJobPosted={() => setTab('home')} />
      </div>

      <div className="screen" hidden={tab !== 'profile'}>
        {/* Owner panel entry button */}
        {user?.role === 'owner' && tab === 'profile' && !showOwnerPanel && (
          <div style={{
            position: 'fixed', bottom: 80, right: 16, zIndex: 50,
          }}>
            <button
              onClick={() => setShowOwnerPanel(true)}
              style={{
                background: 'linear-gradient(135deg, #041B30, #0B3D66)',
                border: '2px solid rgba(245,158,11,0.4)',
                borderRadius: 20, padding: '10px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(11,61,102,0.4)',
              }}
            >
              <ShieldCheck size={16} color="#F59E0B" />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>Owner Panel</span>
            </button>
          </div>
        )}
        <ProfileScreen />
      </div>

      <BottomNav
        active={tab}
        onChange={setTab}
        pendingCount={pendingCount}
      />
    </>
  );
}

// ─── Root ──────────────────────────────────────────────────
function AppContent() {
  const { isLoggedIn } = useApp();

  return (
    <>
      {!isLoggedIn ? (
        <div className="screen" style={{ flex: 1 }}>
          <LoginScreen />
        </div>
      ) : (
        <AuthenticatedApp />
      )}
    </>
  );
}

// ─── Export with Provider ──────────────────────────────────
export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
