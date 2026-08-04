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

  const recognitionRef = useRef<any>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const debounceTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [speakText, showToast]);

  // ── Speech Recognition ───────────────────────────────────
  // Industry-standard fix for Chrome on Android:
  // getUserMedia({audio:true}) must be called FIRST inside a user-gesture
  // handler to trigger the browser permission dialog. SpeechRecognition.start()
  // alone does NOT reliably show the mic prompt on Chrome mobile.
  const toggleVoiceMic = useCallback(async () => {
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsRecording(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast('Voice search not supported. Please use Google Chrome.', 'error');
      return;
    }

    // ── Step 1: Explicitly request mic permission via getUserMedia ──
    // This is the ONLY reliable way to trigger the Chrome Android permission
    // dialog. Without this, recognition.start() silently fails with
    // 'not-allowed' and the browser never shows the permission prompt.
    let micStream: MediaStream | null = null;
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('[VoiceSearch] getUserMedia denied:', permErr);
      if (
        permErr?.name === 'NotAllowedError' ||
        permErr?.name === 'PermissionDeniedError'
      ) {
        showToast(
          'Microphone access denied. In Chrome, tap the 🔒 lock icon in the address bar → Site settings → Microphone → Allow.',
          'error'
        );
      } else if (permErr?.name === 'NotFoundError') {
        showToast('No microphone found on this device.', 'error');
      } else {
        showToast(`Mic error: ${permErr?.message ?? 'Unknown error'}`, 'error');
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
        speakText('Listening');
        showToast('🎙️ Listening… speak your issue', 'info');
      };

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

        setRawQuery(finalText || interimText);
        if (finalText) commitQuery(finalText.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceSearch] error:', event.error);
        setIsRecording(false);
        // Release mic stream on error
        micStream?.getTracks().forEach(t => t.stop());
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            showToast(
              'Microphone blocked. Tap the 🔒 lock icon → Microphone → Allow, then reload.',
              'error'
            );
            break;
          case 'no-speech':
            showToast('No speech detected. Tap 🎙️ and try again.', 'info');
            break;
          case 'network':
            showToast('Network error during voice recognition. Check connection.', 'error');
            break;
          case 'aborted':
            break; // user-triggered stop, no toast needed
          default:
            showToast(`Voice error: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Release mic stream when recognition ends (free hardware resource)
        micStream?.getTracks().forEach(t => t.stop());
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

      {/* ── Global Styles ──────────────────────────────── */}
      <style>{`
        @keyframes spin     { from { transform: rotate(0deg); }    to { transform: rotate(360deg); } }
        @keyframes shimmer  { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
        @keyframes micPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        input[type="search"]::-webkit-search-cancel-button { display: none; }
      `}</style>
    </div>
  );
}
