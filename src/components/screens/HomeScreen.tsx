'use client';
import React, {
  useState, useEffect, useMemo, useRef, useCallback
} from 'react';
import { useApp, calcDistance } from '../../context/AppContext';
import { Provider, SERVICE_CATEGORIES } from '../../lib/types';
import { detectIntent } from '../../lib/intentEngine';
import {
  Search, MapPin, Star, RefreshCw, Mic, MicOff,
  Sparkles, X, Volume2, VolumeX,
  Clock, TrendingUp, Zap,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const SEARCH_DEBOUNCE_MS = 300;
const MAX_HISTORY_ITEMS  = 6;

const PRESET_CHIPS = [
  { label: '⚡ Light repair',   query: 'Light is not working'          },
  { label: '🚰 Water leakage',  query: 'Water tap leaking'             },
  { label: '🧹 Cleaning maid',  query: 'House cleaning helper needed'  },
  { label: '🔧 Motor pump',     query: 'Borewell motor pump repair'    },
  { label: '🪚 Carpenter',      query: 'Door lock repair carpenter'    },
  { label: '🎨 Wall painting',  query: 'Wall paint color work'         },
];

const LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi',    native: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'en-IN', name: 'English',  native: 'English',  flag: '🇺🇸' },
  { code: 'ta-IN', name: 'Tamil',    native: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu',   native: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada',  native: 'ಕನ್ನಡ',    flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi',  native: 'मराठी',    flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી',  flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali',  native: 'বাংলা',    flag: '🇮🇳' },
];

// ─────────────────────────────────────────────────────────────
// CATEGORY INTENT PARSER
// Mirrors VoiceAssistant.kt logic from graminseva.zip exactly.
// Extend keyword arrays here to add new intents.
// ─────────────────────────────────────────────────────────────
const INTENT_MAP: { category: string; keywords: string[] }[] = [
  {
    category: 'Electrician',
    keywords: [
      'light','fan','electric','wiring','switch','mcb','fuse','spark',
      'short circuit','power cut','voltage','meter','socket','plug',
      'लाइट','बिजली','पंखा','बत्ती','विद्युत','फ्यूज',
      'மின்சாரம்','கரண்ட்','కరెంట్','విద్యుత్',
    ],
  },
  {
    category: 'Plumber',
    keywords: [
      'water','tap','leak','pipe','plumb','tank','sewage','flush',
      'drain','pipe burst','toilet','basin','shower','borewell',
      'नल','पानी','पाइप','लीकेज','सीवर',
      'தண்ணீர்','குழாய்','నీరు','పైపు',
    ],
  },
  {
    category: 'Home Clean',
    keywords: [
      'clean','cook','maid','sweep','mop','helper','dish','kitchen',
      'dust','wipe','floor','laundry','सफाई','खाना','झाडू','बर्तन',
      'சமையல்','துடைக்க','వంట','శుభ్రం',
    ],
  },
  {
    category: 'Carpenter',
    keywords: [
      'wood','door','lock','carpent','bed','furniture','chair','table',
      'window','shelf','cabinet','hinge','fix chair','fix table',
      'लकड़ी','दरवाजा','ताला','अलमारी',
      'மரவேலை','கதவு','చెక్క','తలుపు',
    ],
  },
  {
    category: 'Painter',
    keywords: [
      'paint','color','colour','wall','lime','distemper','whitewash',
      'primer','polish','रंग','पेंट','पुताई',
      'வர్ணம்','రంగు',
    ],
  },
  {
    category: 'Pest Control',
    keywords: [
      'pest','cockroach','termite','bugs','rat','mice','ant','mosquito',
      'दीमक','कीड़ा','मच्छर','चूहा',
    ],
  },
];

function parseQueryToCategory(query: string): string | null {
  const lower = query.toLowerCase();
  for (const entry of INTENT_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.category;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE-STYLE VOICE SEARCH OVERLAY
// ─────────────────────────────────────────────────────────────
type VoiceState = 'listening' | 'processing' | 'done' | 'error';

function VoiceSearchOverlay({
  state,
  transcript,
  detectedCategory,
  onCancel,
}: {
  state: VoiceState;
  transcript: string;
  detectedCategory: string | null;
  onCancel: () => void;
}) {
  const BAR_DELAYS = ['0ms', '120ms', '60ms', '180ms', '90ms'];
  const BAR_COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#60A5FA', '#3B82F6'];

  const statusText =
    state === 'listening'  ? 'Listening…'      :
    state === 'processing' ? 'Processing…'      :
    state === 'error'      ? 'Tap mic to retry' : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(4,10,20,0.96)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <button
        onClick={onCancel}
        aria-label="Cancel voice search"
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={20} color="white" />
      </button>

      <p style={{
        color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 48,
      }}>
        Speak in any language
      </p>

      {/* Animated waveform bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 72, marginBottom: 40 }}>
        {BAR_DELAYS.map((delay, i) => (
          <div key={i} style={{
            width: 5, borderRadius: 3,
            background: state === 'listening' ? BAR_COLORS[i] : 'rgba(255,255,255,0.2)',
            height: state === 'listening' ? 36 : 8,
            animation: state === 'listening'
              ? `voiceBar 0.8s ease-in-out ${delay} infinite alternate`
              : 'none',
            transition: 'height 0.3s ease, background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Mic icon circle */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: state === 'error' ? 'rgba(239,68,68,0.15)' :
          state === 'listening' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)',
        border: `2px solid ${state === 'error' ? '#EF4444' :
          state === 'listening' ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        boxShadow: state === 'listening'
          ? '0 0 0 12px rgba(59,130,246,0.08), 0 0 0 24px rgba(59,130,246,0.04)'
          : 'none',
        transition: 'all 0.3s ease',
      }}>
        <Mic size={32} color={
          state === 'error' ? '#EF4444' :
          state === 'listening' ? '#60A5FA' : 'rgba(255,255,255,0.5)'
        } />
      </div>

      <p style={{ color: state === 'error' ? '#F87171' : 'rgba(255,255,255,0.6)',
        fontSize: 14, fontWeight: 600, marginBottom: 16, minHeight: 20 }}>
        {statusText}
      </p>

      {/* Live transcript */}
      <div style={{ minHeight: 56, maxWidth: 320, textAlign: 'center', padding: '0 12px' }}>
        {transcript ? (
          <p style={{
            color: 'white', fontSize: 22, fontWeight: 700,
            lineHeight: 1.4, margin: 0, animation: 'fadeInUp 0.15s ease',
          }}>
            &ldquo;{transcript}&rdquo;
          </p>
        ) : state === 'listening' ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: 0 }}>
            Try: &ldquo;light not working&rdquo; or &ldquo;पानी लीक हो रहा है&rdquo;
          </p>
        ) : null}
      </div>

      {/* Detected category badge */}
      {detectedCategory && (
        <div style={{
          marginTop: 24,
          background: 'rgba(59,130,246,0.2)',
          border: '1px solid rgba(59,130,246,0.4)',
          borderRadius: 24, padding: '8px 20px',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <p style={{ color: '#93C5FD', fontSize: 13, fontWeight: 800, margin: 0 }}>
            ✅ Matched: {detectedCategory}
          </p>
        </div>
      )}

      <p style={{
        position: 'absolute', bottom: 48,
        color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 500,
      }}>
        Tap outside to cancel
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROVIDER SKELETON
// ─────────────────────────────────────────────────────────────

function ProviderSkeleton() {
  return (
    <div style={{
      background: 'white', border: '1px solid #E2E8F0', borderRadius: 18,
      overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: '100%', height: 104,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ height: 14, borderRadius: 7, background: '#F1F5F9', marginBottom: 8, width: '70%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
        <div style={{ height: 10, borderRadius: 5, background: '#F1F5F9', marginBottom: 10, width: '90%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
        <div style={{ height: 10, borderRadius: 5, background: '#F1F5F9', width: '50%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICE CATEGORY CARD
// ─────────────────────────────────────────────────────────────
function ServiceCard({ cat, active, onToggle }: {
  cat: typeof SERVICE_CATEGORIES[0];
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Filter by ${cat.label}`}
      aria-pressed={active}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{
        width: 68, height: 68, borderRadius: 20,
        background: active
          ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}66)`
          : 'linear-gradient(145deg, #1E293B, #0F172A)',
        border: `2px solid ${active ? cat.color : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30,
        boxShadow: active
          ? `0 0 20px ${cat.color}44, 0 8px 24px rgba(0,0,0,0.3)`
          : '0 4px 16px rgba(0,0,0,0.25)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}>
        {cat.emoji}
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: active ? '#F8FAFC' : 'rgba(255,255,255,0.7)',
        textAlign: 'center', lineHeight: 1.3,
        letterSpacing: '0.1px',
      }}>
        {cat.label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PROVIDER CARD
// ─────────────────────────────────────────────────────────────
function ProviderCard({ provider, onSelect, onAudio }: {
  provider: Provider & { distanceKm: number };
  onSelect: () => void;
  onAudio: (e: React.MouseEvent) => void;
}) {
  const cat = SERVICE_CATEGORIES.find(c => c.key === provider.category);

  return (
    <button
      onClick={onSelect}
      aria-label={`Book ${provider.name} — ${provider.category}`}
      style={{
        background: 'white', border: '1px solid #E2E8F0', borderRadius: 18,
        padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        width: '100%', display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.04)';
      }}
    >
      {/* Card image / emoji area */}
      <div style={{
        width: '100%', height: 100, background: cat?.bg ?? '#F0F7FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
        position: 'relative', overflow: 'hidden',
      }}>
        {provider.avatar_url ? (
          <img
            src={provider.avatar_url}
            alt={provider.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span>{cat?.emoji ?? '🔧'}</span>
        )}

        {/* TOP PRO badge */}
        {provider.featured && (
          <div style={{
            position: 'absolute', top: 7, left: 7,
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            color: '#92400E', fontSize: 8, fontWeight: 900,
            padding: '2px 7px', borderRadius: 20, letterSpacing: '0.4px',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Sparkles size={9} color="#92400E" /> TOP PRO
          </div>
        )}

        {/* Audio button */}
        <button
          onClick={onAudio}
          title="Hear worker details"
          aria-label="Hear worker details aloud"
          style={{
            position: 'absolute', top: 7, right: 7,
            background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
            width: 26, height: 26, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          <Volume2 size={13} color="#0B3D66" />
        </button>

        {/* Online / offline badge */}
        <div style={{
          position: 'absolute', bottom: 7, right: 7,
          background: provider.is_online ? 'rgba(16,185,129,0.92)' : 'rgba(100,116,139,0.8)',
          fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
          color: 'white', display: 'flex', alignItems: 'center', gap: 3,
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />
          {provider.is_online ? 'Available' : 'Offline'}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
          <h3 style={{
            fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0,
            lineHeight: 1.3, flex: 1, paddingRight: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {provider.name}
          </h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
            background: '#FEF3C7', padding: '2px 6px', borderRadius: 12,
          }}>
            <Star size={10} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#92400E' }}>
              {provider.rating.toFixed(1)}
            </span>
          </div>
        </div>

        <p style={{
          fontSize: 10, color: '#64748B', margin: '0 0 7px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {provider.description || `${provider.category} Specialist`}
        </p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #F1F5F9', paddingTop: 7,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#475569', fontSize: 10, fontWeight: 600 }}>
            <MapPin size={11} color="#0B3D66" />
            <span>{provider.distanceKm.toFixed(1)} km</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#0B3D66' }}>
            ₹{provider.hourly_rate}
            <span style={{ fontSize: 9, fontWeight: 500, color: '#94A3B8' }}>/hr</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN HOME SCREEN
// ─────────────────────────────────────────────────────────────
export default function HomeScreen({
  onSelectProvider,
}: {
  onSelectProvider: (p: Provider) => void;
}) {
  const {
    providers, isLoading, userLocation, user,
    refreshProviders, showToast,
  } = useApp();

  // ── State ────────────────────────────────────────────────
  const [rawQuery,        setRawQuery]        = useState('');
  const [debouncedQuery,  setDebouncedQuery]  = useState('');
  const [activeCategory,  setActiveCategory]  = useState<string | null>(null);
  const [quickFilter,     setQuickFilter]     = useState<'all'|'topRated'|'available'|'budget'>('all');
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [isRecording,     setIsRecording]     = useState(false);
  const [isAudioEnabled,  setIsAudioEnabled]  = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES[0]);
  const [showLangPicker,  setShowLangPicker]  = useState(false);
  const [showHistory,     setShowHistory]     = useState(false);
  const [searchHistory,   setSearchHistory]   = useState<string[]>([]);
  const [greeting,        setGreeting]        = useState('Good day');
  const [micPulse,        setMicPulse]        = useState(false);
  const [showMicHelp,     setShowMicHelp]     = useState(false);
  // YouTube-style voice overlay
  const [voiceOverlay,    setVoiceOverlay]    = useState(false);
  const [voiceState,      setVoiceState]      = useState<VoiceState>('listening');
  const [liveTranscript,  setLiveTranscript]  = useState('');
  const [liveCategory,    setLiveCategory]    = useState<string | null>(null);

  const recognitionRef    = useRef<any>(null);
  const inputRef           = useRef<HTMLInputElement>(null);
  const debounceTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Chrome Android fix: track last interim & whether final was committed
  const lastInterimRef     = useRef<string>('');
  const finalCommittedRef  = useRef<boolean>(false);

  // ── Time-based greeting ──────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  // ── Mic pulse animation on recording ─────────────────────
  useEffect(() => {
    if (!isRecording) { setMicPulse(false); return; }
    const id = setInterval(() => setMicPulse(p => !p), 500);
    return () => clearInterval(id);
  }, [isRecording]);

  // ── Debounce typed query (300 ms) ────────────────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(rawQuery);
      // Auto-detect category while typing using intent engine
      if (rawQuery.trim()) {
        const intent = detectIntent(rawQuery);
        if (intent) setActiveCategory(intent.category);
      } else {
        // Clear auto-detected category when query is cleared
        setActiveCategory(null);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [rawQuery]);

  // ── Cleanup SpeechRecognition on unmount ─────────────────
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch {}
    };
  }, []);

  // ── Speech Synthesis TTS ─────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.lang = currentLanguage.code;
      window.speechSynthesis.speak(utt);
    } catch { /* non-fatal */ }
  }, [isAudioEnabled, currentLanguage.code]);

  // ── Close voice overlay helper ────────────────────────────
  const closeVoiceOverlay = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setVoiceOverlay(false);
    setVoiceState('listening');
    setLiveTranscript('');
    setLiveCategory(null);
    setIsRecording(false);
  }, []);

  // ── Commit a search query (voice or chip) ────────────────
  // This is the single entry point for ALL search submissions:
  // typed Enter, chip tap, voice final result, history tap.
  const commitQuery = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setRawQuery(trimmed);
    setDebouncedQuery(trimmed);

    const intent = detectIntent(trimmed);
    if (intent) {
      setActiveCategory(intent.category);
      const pct = Math.round(intent.confidence * 100);
      speakText(`Searching ${intent.category} specialists near you`);
      // High confidence → success toast. Low → info toast.
      if (intent.confidence >= 0.6) {
        showToast(`✅ ${intent.category} selected (${pct}% match)`, 'success');
      } else {
        showToast(`🔍 Possible match: ${intent.category}`, 'info');
      }
    } else {
      speakText(`Showing results for ${trimmed}`);
    }

    // Persist to search history (unique, max 6)
    setSearchHistory(prev => {
      const deduped = [trimmed, ...prev.filter(h => h !== trimmed)];
      return deduped.slice(0, MAX_HISTORY_ITEMS);
    });
    setShowHistory(false);
  }, [speakText, showToast, setLiveCategory]);

  // ── Speech Recognition ───────────────────────────────────
  // Full production mic flow:
  // 1. Check permission state via Permissions API (no dialog shown).
  // 2a. 'denied'  → show in-app help modal (Chrome remembered a past block).
  // 2b. 'prompt'  → call getUserMedia to trigger the browser permission dialog.
  // 2c. 'granted' → skip dialog, go straight to SpeechRecognition.
  // This covers the case where Chrome silently blocked mic in a previous session.
  const toggleVoiceMic = useCallback(async () => {
    if (isRecording) {
      closeVoiceOverlay();
      return;
    }

    // Open the YouTube-style overlay immediately on tap
    setVoiceOverlay(true);
    setVoiceState('listening');
    setLiveTranscript('');
    setLiveCategory(null);

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast('Voice search not supported. Please use Google Chrome.', 'error');
      return;
    }

    // ── Step 1: Check existing permission state (Permissions API) ──
    // This tells us what Chrome already knows WITHOUT showing any dialog.
    // 'denied'  = user/Chrome previously blocked mic → show help modal
    // 'granted' = already allowed → skip getUserMedia, go to recognition
    // 'prompt'  = first time → call getUserMedia to trigger the dialog
    let permState: PermissionState = 'prompt';
    try {
      if (typeof navigator !== 'undefined' && navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permState = result.state;
      }
    } catch { /* Permissions API not supported, fall through to getUserMedia */ }

    if (permState === 'denied') {
      // Chrome remembers a past block — getUserMedia will throw silently without
      // ever showing the permission dialog. Show our in-app guide instead.
      setShowMicHelp(true);
      return;
    }

    // ── Step 2: Request mic permission via getUserMedia ──────────────
    // Only reached when state is 'prompt' (first time) or 'granted'.
    // getUserMedia inside a user-gesture handler IS the correct trigger for
    // Chrome's "Allow microphone?" popup on Android.
    let micStream: MediaStream | null = null;
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('[VoiceSearch] getUserMedia denied:', permErr);
      const name = permErr?.name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        // User tapped "Deny" on the fresh dialog → show help
        setShowMicHelp(true);
      } else if (name === 'NotFoundError') {
        showToast('No microphone found on this device.', 'error');
      } else {
        showToast(`Mic error: ${permErr?.message ?? 'Unknown'}`, 'error');
      }
      return;
    }

    // ── Step 2: Start SpeechRecognition (permission is now granted) ──
    try {
      try { recognitionRef.current?.abort(); } catch {}

      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.continuous      = false;
      recognition.interimResults  = true;
      recognition.maxAlternatives = 3;
      recognition.lang            = currentLanguage.code;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceState('listening');
        speakText('Listening');
      };

      // ── Reset fallback refs for this session ──────────────
      lastInterimRef.current    = '';
      finalCommittedRef.current = false;

      recognition.onresult = (event: any) => {
        let finalText   = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const best = Array.from(result as any[])
              .reduce((a: any, b: any) => a.confidence >= b.confidence ? a : b);
            finalText += best.transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        const heard = finalText || interimText;

        // Update overlay live transcript
        setLiveTranscript(heard);
        setRawQuery(heard);

        // Show detected category inside the overlay in real-time
        if (heard) {
          const intent = detectIntent(heard);
          setLiveCategory(intent?.category ?? null);
        }

        // Store interim as fallback (Chrome Android fix)
        if (interimText) lastInterimRef.current = interimText;

        if (finalText) {
          finalCommittedRef.current = true;
          setVoiceState('processing');
          commitQuery(finalText.trim());
          // Auto-close overlay after showing matched result
          setTimeout(() => closeVoiceOverlay(), 900);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceSearch] error:', event.error);
        setIsRecording(false);
        micStream?.getTracks().forEach(t => t.stop());
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            closeVoiceOverlay();
            setShowMicHelp(true);
            break;
          case 'no-speech':
            setVoiceState('error');
            setLiveTranscript('');
            // Auto-recover: go back to listening hint after 1.5s
            setTimeout(() => {
              setVoiceState('listening');
            }, 1500);
            break;
          case 'aborted':
            closeVoiceOverlay();
            break;
          default:
            setVoiceState('error');
            setTimeout(() => closeVoiceOverlay(), 2000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        micStream?.getTracks().forEach(t => t.stop());

        // Chrome Android fallback: commit interim if no final was received
        if (!finalCommittedRef.current && lastInterimRef.current.trim()) {
          setVoiceState('processing');
          commitQuery(lastInterimRef.current.trim());
          setTimeout(() => closeVoiceOverlay(), 900);
        } else if (!finalCommittedRef.current) {
          // Nothing was heard at all
          setVoiceState('error');
          setTimeout(() => closeVoiceOverlay(), 2000);
        }
        lastInterimRef.current    = '';
        finalCommittedRef.current = false;
      };

      recognition.start();
    } catch (err: any) {
      console.error('[VoiceSearch] failed to start recognition:', err);
      setIsRecording(false);
      micStream?.getTracks().forEach(t => t.stop());
      showToast(err?.message ?? 'Could not start microphone.', 'error');
    }
  }, [isRecording, currentLanguage.code, speakText, showToast, commitQuery]);

  // ── Clear search ─────────────────────────────────────────

  const clearSearch = useCallback(() => {
    setRawQuery('');
    setDebouncedQuery('');
    setActiveCategory(null);
    setShowHistory(false);
    inputRef.current?.focus();
  }, []);

  // ── Filter + sort providers ──────────────────────────────
  const filteredProviders = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const intent = q ? detectIntent(q) : null;
    const detectedCat = intent?.category ?? null;
    const distMatch = q.match(/(\d+)\s*km/);
    const maxDist   = distMatch ? parseFloat(distMatch[1]) : null;

    let list = providers
      .filter(p => !p.is_blacklisted)
      .map(p => ({
        ...p,
        distanceKm: calcDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }));

    // Category filter (sidebar or detected from query)
    const effectiveCategory = activeCategory ?? detectedCat;
    if (effectiveCategory) {
      list = list.filter(p =>
        p.category.toLowerCase() === effectiveCategory.toLowerCase()
      );
    }

    // Quick-filter pills
    if (quickFilter === 'topRated')  list = list.filter(p => p.rating >= 4.8);
    if (quickFilter === 'available') list = list.filter(p => p.is_online);
    if (quickFilter === 'budget')    list = list.filter(p => p.hourly_rate <= 350);

    // Text search (name, category, description, tags)
    if (q && !detectedCat) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
    }

    // Distance cap
    if (maxDist !== null) {
      list = list.filter(p => p.distanceKm <= maxDist);
    }

    // Sort: featured first → by distance
    return list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
  }, [providers, userLocation, activeCategory, quickFilter, debouncedQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProviders();
    setIsRefreshing(false);
  };

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ background: '#F0F7FF', minHeight: '100%' }}>

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 50%, #092C4A 100%)',
        padding: '20px 20px 22px',
        boxShadow: '0 8px 30px rgba(4,27,48,0.25)',
      }}>

        {/* Greeting + controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600, margin: '0 0 2px' }}>
              {greeting},
            </p>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0 }}>
              {firstName} 👋
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {/* Audio toggle */}
            <button
              onClick={() => {
                setIsAudioEnabled(v => !v);
                showToast(isAudioEnabled ? 'Voice guidance off' : 'Voice guidance on', 'info');
              }}
              aria-label={isAudioEnabled ? 'Mute voice guidance' : 'Enable voice guidance'}
              style={{
                background: isAudioEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1.5px solid ${isAudioEnabled ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isAudioEnabled
                ? <Volume2 size={16} color="#34D399" />
                : <VolumeX size={16} color="rgba(255,255,255,0.5)" />}
            </button>

            {/* Language selector */}
            <button
              onClick={() => setShowLangPicker(true)}
              aria-label="Change language"
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '5px 10px', color: 'white', fontSize: 11,
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.native}</span>
            </button>
          </div>
        </div>

        {/* ── SEARCH BAR ──────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <div
            role="search"
            style={{
              background: 'white', borderRadius: 16, padding: '10px 14px',
              boxShadow: isRecording
                ? '0 0 0 2px #EF4444, 0 8px 30px rgba(239,68,68,0.25)'
                : '0 6px 24px rgba(0,0,0,0.20)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'box-shadow 0.25s ease',
            }}
          >
            <Search size={18} color="#0B3D66" strokeWidth={2.5} aria-hidden />

            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={isRecording
                ? '🎙️ Listening… speak your issue'
                : "Search 'electrician', 'water leak'…"}
              value={rawQuery}
              aria-label="Search for a service"
              onChange={e => {
                setRawQuery(e.target.value);
                setShowHistory(e.target.value === '' && searchHistory.length > 0);
              }}
              onFocus={() => {
                if (!rawQuery && searchHistory.length > 0) setShowHistory(true);
              }}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter' && rawQuery.trim()) commitQuery(rawQuery.trim());
                if (e.key === 'Escape') clearSearch();
              }}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none',
                caretColor: '#0B3D66',
              }}
            />

            {rawQuery ? (
              <button
                onClick={clearSearch}
                aria-label="Clear search"
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: 8,
                  width: 22, height: 22, cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={13} color="#64748B" />
              </button>
            ) : null}

            {/* Mic button with pulse animation */}
            <button
              onClick={toggleVoiceMic}
              aria-label={isRecording ? 'Stop recording' : 'Start voice search'}
              style={{
                background: isRecording ? '#EF4444' : '#0B3D66',
                border: 'none', borderRadius: 10, width: 36, height: 36,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isRecording
                  ? micPulse
                    ? '0 0 0 8px rgba(239,68,68,0.2), 0 0 0 16px rgba(239,68,68,0.08)'
                    : '0 0 0 4px rgba(239,68,68,0.3)'
                  : 'none',
                transition: 'box-shadow 0.3s ease, background 0.2s ease',
              }}
            >
              {isRecording
                ? <MicOff size={17} color="white" />
                : <Mic     size={17} color="white" />}
            </button>
          </div>

          {/* ── Search History Dropdown ────────────────── */}
          {showHistory && searchHistory.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'white', borderRadius: 14, zIndex: 50,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 6px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} /> Recent searches
                </span>
                <button
                  onClick={() => { setSearchHistory([]); setShowHistory(false); }}
                  style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              </div>
              {searchHistory.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { commitQuery(h); inputRef.current?.blur(); }}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '9px 14px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                    borderTop: i > 0 ? '1px solid #F8FAFC' : 'none',
                  }}
                >
                  <Clock size={13} color="#94A3B8" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{h}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recording active banner */}
        {isRecording && (
          <div style={{
            marginTop: 8, padding: '8px 14px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#EF4444',
              animation: 'micPulse 0.8s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F87171', flex: 1 }}>
              Listening… speak your issue clearly
            </span>
            <button
              onClick={() => { try { recognitionRef.current?.stop(); } catch {} setIsRecording(false); }}
              style={{ background: 'none', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', color: '#F87171', fontSize: 11, fontWeight: 800 }}
            >
              Stop
            </button>
          </div>
        )}

        {/* ── Preset Quick Chips ────────────────────── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 12, scrollbarWidth: 'none' }}>
          {PRESET_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => commitQuery(chip.query)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '5px 11px', color: 'white', fontSize: 11,
                fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SERVICE CATEGORY GRID ───────────────────────── */}
      <div style={{ background: '#0F172A', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
            All Services
          </h3>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              aria-label="Clear category filter"
              style={{
                fontSize: 11, fontWeight: 800, color: '#F59E0B',
                background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              {activeCategory} ✕
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {SERVICE_CATEGORIES.map(cat => (
            <ServiceCard
              key={cat.key}
              cat={cat}
              active={activeCategory === cat.key}
              onToggle={() => setActiveCategory(p => p === cat.key ? null : cat.key)}
            />
          ))}
        </div>
      </div>

      {/* ── QUICK FILTER PILLS ──────────────────────────── */}
      <div style={{
        background: 'white', padding: '10px 16px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {([
          { key: 'all',       label: 'All' },
          { key: 'topRated',  label: '⭐ Top Rated' },
          { key: 'available', label: '🟢 Available Now' },
          { key: 'budget',    label: '💰 Under ₹350/hr' },
        ] as const).map(pill => (
          <button
            key={pill.key}
            onClick={() => setQuickFilter(pill.key)}
            aria-pressed={quickFilter === pill.key}
            style={{
              background: quickFilter === pill.key ? '#0B3D66' : '#F1F5F9',
              color: quickFilter === pill.key ? 'white' : '#475569',
              border: 'none', borderRadius: 20, padding: '6px 14px',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── PROVIDERS CATALOG ───────────────────────────── */}
      <div style={{ background: '#F0F7FF', padding: '16px 16px 100px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0 }}>
              {activeCategory ? `${activeCategory} Specialists` : 'Specialists Near You'}
            </h3>
            {!isLoading && (
              <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>
                <TrendingUp size={11} style={{ marginRight: 4 }} />
                {filteredProviders.length} verified specialist{filteredProviders.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh providers"
            style={{
              background: 'white', border: '1px solid #CBD5E1', borderRadius: 12,
              padding: '5px 11px', cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: isRefreshing ? 0.6 : 1,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw
              size={12} color="#0B3D66"
              style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0B3D66' }}>Refresh</span>
          </button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {isLoading ? (
            <><ProviderSkeleton /><ProviderSkeleton /><ProviderSkeleton /><ProviderSkeleton /></>
          ) : filteredProviders.length === 0 ? (
            <div style={{
              gridColumn: '1/-1', textAlign: 'center',
              padding: '48px 20px', background: 'white',
              borderRadius: 20, border: '1.5px dashed #CBD5E1',
            }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
                No specialists found
              </p>
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 14 }}>
                {debouncedQuery
                  ? `No results for "${debouncedQuery}". Try "electrician", "plumber", or clear filters.`
                  : 'Providers are joining your area soon!'}
              </p>
              {(debouncedQuery || activeCategory || quickFilter !== 'all') && (
                <button
                  onClick={() => { clearSearch(); setActiveCategory(null); setQuickFilter('all'); }}
                  style={{
                    background: '#0B3D66', color: 'white', border: 'none',
                    borderRadius: 12, padding: '8px 20px', fontSize: 13,
                    fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredProviders.map(p => (
              <ProviderCard
                key={p.id}
                provider={p as Provider & { distanceKm: number }}
                onSelect={() => onSelectProvider(p)}
                onAudio={e => {
                  e.stopPropagation();
                  speakText(
                    `${p.name}, ${p.category} specialist. ` +
                    `Rate: ${p.hourly_rate} rupees per hour. ` +
                    `Rating: ${p.rating.toFixed(1)} stars. ` +
                    `Distance: ${(p as any).distanceKm?.toFixed(1)} kilometres.`
                  );
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── LANGUAGE PICKER MODAL ──────────────────────── */}
      {showLangPicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose language"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(4,27,48,0.72)',
            backdropFilter: 'blur(4px)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowLangPicker(false); }}
        >
          <div style={{ background: 'white', borderRadius: 24, padding: 22, width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                🌐 Choose Language / भाषा चुनें
              </h3>
              <button
                onClick={() => setShowLangPicker(false)}
                aria-label="Close language picker"
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLanguage(lang);
                    setShowLangPicker(false);
                    showToast(`Language: ${lang.name} (${lang.native})`, 'success');
                  }}
                  style={{
                    background: currentLanguage.code === lang.code ? '#0B3D66' : '#F8FAFC',
                    color: currentLanguage.code === lang.code ? 'white' : '#0F172A',
                    border: `1.5px solid ${currentLanguage.code === lang.code ? '#0B3D66' : '#E2E8F0'}`,
                    borderRadius: 14, padding: '10px 12px', textAlign: 'left',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontSize: 12 }}>{lang.native}</div>
                    <div style={{ fontSize: 9, opacity: 0.65 }}>{lang.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MIC HELP MODAL ────────────────────────────── */}
      {/* Shown when Chrome has previously blocked mic (no dialog would appear). */}
      {showMicHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enable microphone guide"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(4,27,48,0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 0 0',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowMicHelp(false); }}
        >
          <div style={{
            background: 'white', borderRadius: '24px 24px 0 0',
            padding: '20px 20px 36px', width: '100%', maxWidth: 480,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.25s ease',
          }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: '#CBD5E1', borderRadius: 2, margin: '0 auto 16px', display: 'block' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 28, marginBottom: 4 }}>🎙️</div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Enable Microphone
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0', fontWeight: 500 }}>
                  Chrome blocked the mic from a previous visit. Follow these steps to allow it:
                </p>
              </div>
              <button
                onClick={() => setShowMicHelp(false)}
                aria-label="Close"
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: '50%',
                  width: 30, height: 30, cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            {/* Steps */}
            {[
              {
                num: '1',
                title: 'Open Chrome Settings',
                desc: 'Tap the ⋮ three-dot menu (top right of Chrome) → Settings',
                icon: '⚙️',
              },
              {
                num: '2',
                title: 'Go to Site Settings',
                desc: 'Settings → Privacy and security → Site settings → Microphone',
                icon: '🔐',
              },
              {
                num: '3',
                title: 'Find & unblock this site',
                desc: 'Under "Blocked" — tap jeevanm26.github.io → change to Allow',
                icon: '✅',
              },
              {
                num: '4',
                title: 'Reload and tap mic again',
                desc: 'Come back here, reload the page, and tap 🎙️',
                icon: '🔄',
              },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, marginBottom: 14,
                padding: '12px 14px', background: '#F8FAFC',
                borderRadius: 14, border: '1px solid #E2E8F0',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#0B3D66', color: 'white',
                  fontSize: 14, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                    {step.icon} {step.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, lineHeight: 1.5 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => {
                  // Deep-link into Chrome's site settings for this origin
                  window.open('chrome://settings/content/microphone', '_blank');
                }}
                style={{
                  flex: 1, background: '#0B3D66', color: 'white',
                  border: 'none', borderRadius: 14, padding: '13px',
                  fontSize: 13, fontWeight: 900, cursor: 'pointer',
                }}
              >
                Open Chrome Settings →
              </button>
              <button
                onClick={() => {
                  setShowMicHelp(false);
                  // After user says they fixed it, retry immediately
                  setTimeout(() => toggleVoiceMic(), 300);
                }}
                style={{
                  background: '#F0F7FF', color: '#0B3D66',
                  border: '1.5px solid #0B3D66', borderRadius: 14, padding: '13px 16px',
                  fontSize: 13, fontWeight: 900, cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>

            {/* Android system settings note */}
            <p style={{
              textAlign: 'center', fontSize: 11, color: '#94A3B8',
              marginTop: 14, fontWeight: 500,
            }}>
              Also check: Android Settings → Apps → Chrome → Permissions → Microphone → Allow
            </p>
          </div>
        </div>
      )}

      {/* ── YOUTUBE-STYLE VOICE SEARCH OVERLAY ──────────── */}
      {voiceOverlay && (
        <VoiceSearchOverlay
          state={voiceState}
          transcript={liveTranscript}
          detectedCategory={liveCategory}
          onCancel={closeVoiceOverlay}
        />
      )}

      {/* ── Global Styles ──────────────────────────────── */}
      <style>{`
        @keyframes spin      { from { transform: rotate(0deg); }    to { transform: rotate(360deg); } }
        @keyframes shimmer   { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
        @keyframes micPulse  { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        @keyframes slideUp   { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes voiceBar  { from { height: 6px; } to { height: 52px; } }
        input[type="search"]::-webkit-search-cancel-button { display: none; }
      `}</style>
    </div>
  );
}

