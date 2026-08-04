'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp, calcDistance } from '../../context/AppContext';
import { Provider, SERVICE_CATEGORIES } from '../../lib/types';
import { Search, MapPin, Star, Navigation, RefreshCw, ChevronRight, Zap, Mic, MicOff } from 'lucide-react';

// ─── Service Category Card (Rapido-inspired, dark glass) ───
function ServiceCard({ cat, active, onToggle }: {
  cat: typeof SERVICE_CATEGORIES[0];
  active: boolean;
  onToggle: () => void;
}) {
  const icons: Record<string, string> = {
    'Electrician': '⚡',
    'Plumber':     '🔧',
    'Carpenter':   '🪚',
    'Home Clean':  '🧹',
    'Painter':     '🎨',
    'Pest Control':'🐛',
  };

  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: active
          ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}44)`
          : 'linear-gradient(145deg, #1E293B, #0F172A)',
        border: `2px solid ${active ? cat.color : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30,
        boxShadow: active
          ? `0 0 0 3px ${cat.color}22, 0 8px 24px rgba(0,0,0,0.3)`
          : '0 4px 16px rgba(0,0,0,0.25)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: active ? 'scale(1.07)' : 'scale(1)',
      }}>
        {icons[cat.key] ?? cat.emoji}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: active ? '#F8FAFC' : 'rgba(255,255,255,0.65)',
        textAlign: 'center', lineHeight: 1.3,
        letterSpacing: '0.1px',
      }}>
        {cat.label}
      </span>
    </button>
  );
}

// ─── Provider Card ─────────────────────────────────────────
function ProviderCard({ provider, onSelect }: { provider: Provider; onSelect: () => void }) {
  const cat = SERVICE_CATEGORIES.find(c => c.key === provider.category);

  return (
    <button
      onClick={onSelect}
      style={{
        background: 'white', border: '1px solid #F1F5F9', borderRadius: 16,
        padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        width: '100%', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image Banner */}
      <div style={{
        width: '100%', height: 96, background: cat?.bg ?? '#F0F7FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
        position: 'relative', overflow: 'hidden',
      }}>
        {provider.avatar_url ? (
          <img src={provider.avatar_url} alt={provider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span>{cat?.emoji ?? '🔧'}</span>
        )}
        {provider.featured && (
          <div style={{ position: 'absolute', top: 7, left: 7, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: '#92400E', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, letterSpacing: '0.3px' }}>
            ⭐ TOP
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 7, right: 7,
          background: provider.is_online ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.7)',
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          color: 'white', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />
          {provider.is_online ? 'Available' : 'Offline'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '11px 13px 13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {provider.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Star size={10} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E' }}>{provider.rating.toFixed(1)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94A3B8', fontSize: 10, fontWeight: 500 }}>
            <MapPin size={10} />
            <span>{provider.distanceKm != null ? `${provider.distanceKm.toFixed(1)} km` : 'Nearby'}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0B3D66' }}>
            ₹{provider.hourly_rate}<span style={{ fontSize: 9, fontWeight: 400, color: '#CBD5E1' }}>/hr</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton ──────────────────────────────────────────────
function ProviderSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
      <div className="skeleton" style={{ height: 96, borderRadius: 0 }} />
      <div style={{ padding: '11px 13px 13px' }}>
        <div className="skeleton" style={{ height: 12, width: '65%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '45%' }} />
      </div>
    </div>
  );
}

// ─── Home Screen ───────────────────────────────────────────
export default function HomeScreen({ onSelectProvider }: { onSelectProvider: (p: Provider) => void }) {
  const { providers, isLoading, userLocation, locationStatus, requestLocation, user, refreshProviders, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceSearch = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.', 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ Listening... Speak now (e.g. Electrician, Plumber, Light, Leak)', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQuery(transcript);

        const detected = matchDialectCategory(transcript);
        if (detected) {
          setActiveCategory(detected);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Please allow mic access in your browser site settings.', 'error');
        } else if (event.error === 'no-speech') {
          showToast('No speech detected. Please tap mic and speak again.', 'info');
        } else {
          showToast(`Voice error: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start voice search:', err);
      setIsListening(false);
      showToast('Unable to launch microphone.', 'error');
    }
  };

const DIALECT_MAP: Record<string, string[]> = {
  'Electrician': ['electrician', 'बिजली', 'करंट', 'फ्यूज', 'लाइट', 'तार', 'current', 'wire', 'light', 'spark', 'electric'],
  'Plumber': ['plumber', 'नल', 'पानी', 'पाइप', 'लीकेज', 'टंकी', 'प्लंबर', 'पानी टपक', 'water', 'pipe', 'leak', 'tap'],
  'Carpenter': ['carpenter', 'लकड़ी', 'दरवाजा', 'खिड़की', 'बढ़ई', 'फर्नीचर', 'मिस्त्री', 'wood', 'door', 'furniture', 'table', 'chair'],
  'Home Clean': ['home clean', 'clean', 'सफाई', 'झाड़ू', 'पोछा', 'कचरा', 'धोना', 'सफाई वाली', 'maid', 'sweep', 'mop', 'wash'],
  'Painter': ['painter', 'paint', 'पेंट', 'रंग', 'पुताई', 'दीवार', 'color', 'wall'],
  'Pest Control': ['pest', 'कीड़ा', 'कॉकरोच', 'दीमक', 'पेस्ट', 'cockroach', 'termite', 'bugs']
};

function matchDialectCategory(q: string): string | null {
  const lower = q.toLowerCase();
  for (const [category, keywords] of Object.entries(DIALECT_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return null;
}

  const filteredProviders = useMemo(() => {
    let list = providers.map(p => ({
      ...p,
      distanceKm: calcDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
    }));
    if (activeCategory) list = list.filter(p => p.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      const detectedCategory = matchDialectCategory(q);
      const distMatch = q.match(/(\d+)\s*km/);
      const maxDist = distMatch ? parseFloat(distMatch[1]) : null;

      list = list.filter(p => {
        if (maxDist !== null && p.distanceKm > maxDist) return false;
        if (detectedCategory && p.category.toLowerCase() === detectedCategory.toLowerCase()) {
          return true;
        }
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      });
    }
    return list
      .filter(p => !p.is_blacklisted)
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      });
  }, [providers, userLocation, activeCategory, query]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProviders();
    setIsRefreshing(false);
  };

  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div style={{ background: '#F0F7FF', minHeight: '100%' }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 100%)',
        padding: '20px 20px 24px',
      }}>
        {/* Top Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.3px' }}>
              {greeting},
            </p>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.4px' }}>
              {firstName} 👋
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
              Expert help, minutes away.
            </p>
          </div>
          <button
            onClick={requestLocation}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: locationStatus === 'granted' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              border: `1px solid ${locationStatus === 'granted' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
            }}
          >
            <Navigation size={11} color={locationStatus === 'granted' ? '#6EE7B7' : '#FCD34D'} />
            <span style={{ fontSize: 10, fontWeight: 700, color: locationStatus === 'granted' ? '#6EE7B7' : '#FCD34D' }}>
              {locationStatus === 'granted' ? 'Live GPS' : 'Enable GPS'}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', borderRadius: 14, padding: '13px 16px',
          boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 4px 24px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }}>
          <Search size={16} color="#94A3B8" strokeWidth={2.5} />
          <input
            type="text"
            placeholder={isListening ? "Listening... speak now..." : "Search electrician, plumber, cleaner…"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 13, fontWeight: 500, color: '#0F172A', outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, width: 20, height: 20, cursor: 'pointer', fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ×
            </button>
          )}

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            title={isListening ? "Listening... Click to stop" : "Voice Search"}
            style={{
              background: isListening ? '#EF4444' : '#F1F5F9',
              border: 'none',
              borderRadius: 8,
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {isListening ? (
              <MicOff size={16} color="white" />
            ) : (
              <Mic size={16} color="#64748B" />
            )}
          </button>
        </div>

        {isListening && (
          <div style={{
            marginTop: 10,
            padding: '8px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#F87171',
            fontSize: 11,
            fontWeight: 600,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
            Listening... Speak now (e.g. "Electrician", "Plumber")
          </div>
        )}
      </div>

      {/* ── All Services Grid ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0B1929 0%, #0F172A 100%)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', margin: 0, letterSpacing: '-0.3px' }}>
              All Services
            </h3>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0', fontWeight: 500 }}>
              Tap to filter by specialisation
            </p>
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}
            >
              Clear ✕
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {SERVICE_CATEGORIES.map(cat => (
            <ServiceCard
              key={cat.key}
              cat={cat}
              active={activeCategory === cat.key}
              onToggle={() => setActiveCategory(prev => prev === cat.key ? null : cat.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Providers Section ── */}
      <div style={{ background: '#F0F7FF', padding: '20px 16px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>
              {activeCategory ? `${activeCategory}s Near You` : 'Specialists Near You'}
            </h3>
            {!isLoading && (
              <p style={{ fontSize: 10, color: '#94A3B8', margin: '3px 0 0', fontWeight: 500 }}>
                {filteredProviders.length} verified · sorted by distance
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <RefreshCw size={12} color="#64748B" style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>Refresh</span>
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {isLoading ? (
            <><ProviderSkeleton /><ProviderSkeleton /><ProviderSkeleton /><ProviderSkeleton /></>
          ) : filteredProviders.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#334155', marginBottom: 4 }}>No specialists found</p>
              <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                {query ? 'Try a different search term.' : 'Providers are joining your area soon!'}
              </p>
            </div>
          ) : (
            filteredProviders.map(p => (
              <ProviderCard key={p.id} provider={p} onSelect={() => onSelectProvider(p)} />
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
