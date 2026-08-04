'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp, calcDistance } from '../../context/AppContext';
import { Provider, SERVICE_CATEGORIES } from '../../lib/types';
import { Search, MapPin, Star, Navigation, RefreshCw, Mic, MicOff, Filter, CheckCircle2, ShieldCheck, Sparkles, X, Volume2, VolumeX, MessageSquareText } from 'lucide-react';

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
          ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}66)`
          : 'linear-gradient(145deg, #1E293B, #0F172A)',
        border: `2px solid ${active ? cat.color : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
        boxShadow: active
          ? `0 0 20px ${cat.color}44, 0 8px 24px rgba(0,0,0,0.3)`
          : '0 4px 16px rgba(0,0,0,0.25)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}>
        {icons[cat.key] ?? cat.emoji}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: active ? '#F8FAFC' : 'rgba(255,255,255,0.7)',
        textAlign: 'center', lineHeight: 1.3,
        letterSpacing: '0.1px',
      }}>
        {cat.label}
      </span>
    </button>
  );
}

// ─── Provider Card ─────────────────────────────────────────
function ProviderCard({ provider, onSelect, onAudioClick }: {
  provider: Provider;
  onSelect: () => void;
  onAudioClick: (e: React.MouseEvent) => void;
}) {
  const cat = SERVICE_CATEGORIES.find(c => c.key === provider.category);

  return (
    <button
      onClick={onSelect}
      style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: 18,
        padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        width: '100%', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image Banner */}
      <div style={{
        width: '100%', height: 104, background: cat?.bg ?? '#F0F7FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42,
        position: 'relative', overflow: 'hidden',
      }}>
        {provider.avatar_url ? (
          <img src={provider.avatar_url} alt={provider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span>{cat?.emoji ?? '🔧'}</span>
        )}
        {provider.featured && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: '#92400E', fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Sparkles size={10} color="#92400E" /> TOP PRO
          </div>
        )}

        {/* Audio Listen Icon Button */}
        <button
          onClick={onAudioClick}
          title="Listen worker details"
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          <Volume2 size={14} color="#0B3D66" />
        </button>

        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: provider.is_online ? 'rgba(16,185,129,0.92)' : 'rgba(100,116,139,0.8)',
          fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
          color: 'white', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(6px)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
          {provider.is_online ? 'Available' : 'Offline'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {provider.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, background: '#FEF3C7', padding: '2px 6px', borderRadius: 12 }}>
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#92400E' }}>{provider.rating.toFixed(1)}</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {provider.description || `${provider.category} Specialist`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 11, fontWeight: 600 }}>
            <MapPin size={12} color="#0B3D66" />
            <span>{provider.distanceKm != null ? `${provider.distanceKm.toFixed(1)} km` : 'Nearby'}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#0B3D66' }}>
            ₹{provider.hourly_rate}<span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8' }}>/hr</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton ──────────────────────────────────────────────
function ProviderSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
      <div className="skeleton" style={{ height: 104, borderRadius: 0 }} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
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
  const [quickFilter, setQuickFilter] = useState<'all' | 'topRated' | 'available' | 'budget'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sample Spoken Voice Queries for Emulator & Test Simulation (Gramin Seva Fallback)
  const SAMPLE_VOICE_QUERIES = [
    "Plumber chahiye paani leak ho raha hai",
    "Water pipe leaking electrician near me",
    "mujhe bijli wala chahiye (Electrician)",
    "सफाई वाली चाहिए (House Cleaner)",
    "राजमिस्त्री चाहिए (Mason for wall repair)",
    "ट्रैक्टर मैकेनिक (Tractor Mechanic repair)"
  ];

  // Natural Problem Keyword Dictionary
  const DIALECT_MAP: Record<string, string[]> = {
    'Electrician': [
      'electrician', 'बिजली', 'करंट', 'फ्यूज', 'लाइट', 'तार', 'current', 'wire', 'light',
      'spark', 'electric', 'short circuit', 'mcb', 'switch', 'wiring', 'socket', 'bulb',
      'fan', 'पंखा', 'बत्ती', 'मिस्त्री', 'light fuse'
    ],
    'Plumber': [
      'plumber', 'नल', 'पानी', 'पाइप', 'लीकेज', 'टंकी', 'प्लंबर', 'पानी टपक', 'water',
      'pipe', 'leak', 'leakage', 'water leakage', 'water leak', 'tap', 'drain', 'sewage',
      'flush', 'basin', 'shower', 'समरसिबल', 'बोरवेल', 'pipe burst', 'tap leak'
    ],
    'Carpenter': [
      'carpenter', 'लकड़ी', 'दरवाजा', 'खिड़की', 'बढ़ई', 'फर्नीचर', 'मिस्त्री', 'wood',
      'door', 'furniture', 'table', 'chair', 'bed', 'lock', 'handle', 'cupboard',
      'ताला', 'चौखट', 'door repair', 'table repair'
    ],
    'Home Clean': [
      'home clean', 'clean', 'सफाई', 'झाड़ू', 'पोछा', 'कचरा', 'धोना', 'सफाई वाली',
      'maid', 'sweep', 'mop', 'wash', 'dusting', 'house clean', 'deep clean', 'cook', 'kitchen'
    ],
    'Painter': [
      'painter', 'paint', 'पेंट', 'रंग', 'पुताई', 'दीवार', 'color', 'wall', 'lime', 'distemper', 'varnish'
    ],
    'Pest Control': [
      'pest', 'कीड़ा', 'कॉकरोच', 'दीमक', 'पेस्ट', 'cockroach', 'termite', 'bugs', 'rat', 'mosquito'
    ]
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

  // TextToSpeech (TTS) Audio Confirmation Engine
  const speakText = (text: String) => {
    if (!isTtsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.toString());
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

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
      setShowSimulatedModal(true);
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
        showToast('🎙️ Listening... Speak now (e.g. Electrician, Plumber, Water Leak)', 'info');
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
        if (event.error === 'not-allowed' || event.error === 'no-speech') {
          setShowSimulatedModal(true);
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
      setShowSimulatedModal(true);
    }
  };

  const executeSimulatedVoiceQuery = (sample: string) => {
    setShowSimulatedModal(false);
    setQuery(sample);
    const detected = matchDialectCategory(sample);
    if (detected) {
      setActiveCategory(detected);
      showToast(`🎙️ Recognized: "${sample}" ➔ ${detected} category selected`, 'success');
    } else {
      showToast(`🎙️ Recognized: "${sample}"`, 'info');
    }
  };

  const filteredProviders = useMemo(() => {
    let list = providers.map(p => ({
      ...p,
      distanceKm: calcDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
    }));

    if (activeCategory) list = list.filter(p => p.category === activeCategory);

    if (quickFilter === 'topRated') list = list.filter(p => p.rating >= 4.8);
    if (quickFilter === 'available') list = list.filter(p => p.is_online);
    if (quickFilter === 'budget') list = list.filter(p => p.hourly_rate <= 350);

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
  }, [providers, userLocation, activeCategory, quickFilter, query]);

  // Announce results when query updates
  useEffect(() => {
    if (query.trim()) {
      const msg = `Found ${filteredProviders.length} specialists for ${query}`;
      speakText(msg);
    }
  }, [query, filteredProviders.length]);

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
        background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 50%, #092C4A 100%)',
        padding: '24px 20px 28px',
        boxShadow: '0 8px 30px rgba(4,27,48,0.25)',
      }}>
        {/* Top Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.3px' }}>
              {greeting},
            </p>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              {firstName} 👋
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '4px 0 0', fontWeight: 500 }}>
              Verified specialists, minutes away.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              title={isTtsEnabled ? "Disable Voice Feedback" : "Enable Voice Feedback"}
              style={{
                background: isTtsEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1.5px solid ${isTtsEnabled ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isTtsEnabled ? <Volume2 size={16} color="#34D399" /> : <VolumeX size={16} color="white" />}
            </button>

            <button
              onClick={requestLocation}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: locationStatus === 'granted' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                border: `1.5px solid ${locationStatus === 'granted' ? '#10B981' : '#F59E0B'}`,
                borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
                color: locationStatus === 'granted' ? '#34D399' : '#FCD34D',
              }}
            >
              <Navigation size={12} color={locationStatus === 'granted' ? '#34D399' : '#FCD34D'} />
              <span style={{ fontSize: 11, fontWeight: 800 }}>
                {locationStatus === 'granted' ? 'Live GPS' : 'Enable GPS'}
              </span>
            </button>
          </div>
        </div>

        {/* Real-time Search Input Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', borderRadius: 16, padding: '14px 18px',
          boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 6px 24px rgba(0,0,0,0.25)',
          transition: 'all 0.3s ease',
        }}>
          <Search size={18} color="#0B3D66" strokeWidth={2.5} />
          <input
            type="text"
            placeholder={isListening ? "Listening... speak now..." : "Search 'water leak', 'electrician', 'light fuse'…"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 22, height: 22, cursor: 'pointer', fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          )}

          {/* Test Voice Queries Shortcut Button */}
          <button
            type="button"
            onClick={() => setShowSimulatedModal(true)}
            title="Sample Spoken Voice Queries"
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: 10, padding: '8px 10px',
              cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#0B3D66',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <MessageSquareText size={14} color="#0B3D66" />
            <span>Test Voice</span>
          </button>

          {/* Voice Search Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            title={isListening ? "Listening... Click to stop" : "Voice Search"}
            style={{
              background: isListening ? '#EF4444' : '#0B3D66',
              border: 'none',
              borderRadius: 10,
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
            }}
          >
            {isListening ? (
              <MicOff size={16} color="white" />
            ) : (
              <Mic size={16} color="white" />
            )}
          </button>
        </div>

        {/* Listening Active Banner */}
        {isListening && (
          <div style={{
            marginTop: 12,
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#F87171',
            fontSize: 12,
            fontWeight: 700,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
            🎙️ Listening... Speak now (e.g. "Electrician", "Water Leak", "Light Fuse")
          </div>
        )}
      </div>

      {/* ── All Services Category Grid ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0B1929 0%, #0F172A 100%)',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', margin: 0, letterSpacing: '-0.3px' }}>
              All Services
            </h3>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '3px 0 0', fontWeight: 500 }}>
              Tap to filter by specialisation
            </p>
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}
            >
              Clear Filter ✕
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

      {/* ── Quick Refinement Pills ── */}
      <div style={{ background: 'white', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { key: 'all', label: 'All', icon: Filter },
          { key: 'topRated', label: '⭐ Top Rated (4.8+)', icon: Star },
          { key: 'available', label: '🟢 Available Now', icon: CheckCircle2 },
          { key: 'budget', label: '💰 Under ₹350/hr', icon: Sparkles },
        ].map(pill => (
          <button
            key={pill.key}
            onClick={() => setQuickFilter(pill.key as any)}
            style={{
              background: quickFilter === pill.key ? '#0B3D66' : '#F1F5F9',
              color: quickFilter === pill.key ? 'white' : '#475569',
              border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 12,
              fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── Providers Catalog ── */}
      <div style={{ background: '#F0F7FF', padding: '20px 16px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>
              {activeCategory ? `${activeCategory}s Near You` : 'Specialists Near You'}
            </h3>
            {!isLoading && (
              <p style={{ fontSize: 11, color: '#64748B', margin: '3px 0 0', fontWeight: 600 }}>
                {filteredProviders.length} verified specialists available
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 12, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
          >
            <RefreshCw size={12} color="#0B3D66" style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0B3D66' }}>Refresh</span>
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {isLoading ? (
            <><ProviderSkeleton /><ProviderSkeleton /><ProviderSkeleton /><ProviderSkeleton /></>
          ) : filteredProviders.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #CBD5E1' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>No specialists matched your search</p>
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                {query ? `No results for "${query}". Try searching "electrician", "plumber", or clearing filters.` : 'Providers are joining your area soon!'}
              </p>
            </div>
          ) : (
            filteredProviders.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                onSelect={() => onSelectProvider(p)}
                onAudioClick={(e) => {
                  e.stopPropagation();
                  speakText(`${p.name}, ${p.category} specialist, ₹${p.hourly_rate} per hour, rating ${p.rating.toFixed(1)} stars`);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Simulated Voice Test Modal ── */}
      {showSimulatedModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(4,27,48,0.7)',
          backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: 24, width: '100%',
            maxWidth: 380, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                🎙️ Test Voice Queries
              </h3>
              <button onClick={() => setShowSimulatedModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>
              Tap any sample spoken phrase below to test problem-phrase keyword parsing in real-time:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SAMPLE_VOICE_QUERIES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => executeSimulatedVoiceQuery(sample)}
                  style={{
                    background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14,
                    padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700,
                    color: '#065F46', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  🗣️ "{sample}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
