'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp, calcDistance } from '../../context/AppContext';
import { Provider, SERVICE_CATEGORIES } from '../../lib/types';
import { Search, MapPin, Star, Navigation, RefreshCw, Mic, MicOff, Filter, CheckCircle2, ShieldCheck, Sparkles, X, Volume2, VolumeX, MessageSquareText, Globe } from 'lucide-react';

// ─── Preset Quick Chips (Blinkit category tags from graminseva.zip) ───
const PRESET_TRIGGER_CHIPS = [
  { label: '⚡ Light repair', fullTrigger: 'Light is not working' },
  { label: '🚰 Water leakage', fullTrigger: 'Water tap leaking' },
  { label: '🧹 Cleaning maid', fullTrigger: 'House cleaning helper needed' },
  { label: '🔧 Motor pump', fullTrigger: 'Borewell motor pump repair' },
  { label: '🔨 Carpenter', fullTrigger: 'Door lock repair carpenter' },
  { label: '🎨 Wall painting', fullTrigger: 'Wall paint color work' },
];

// ─── Supported Languages (from graminseva.zip Language.kt) ───
const LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en-IN', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
];

// ─── Service Category Card ───
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

// ─── Provider Card ───
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

// ─── Home Screen ───
export default function HomeScreen({ onSelectProvider }: { onSelectProvider: (p: Provider) => void }) {
  const { providers, isLoading, userLocation, locationStatus, requestLocation, user, refreshProviders, showToast } = useApp();
  const [queryText, setQueryText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<'all' | 'topRated' | 'available' | 'budget'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES[0]);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Exact parseQueryToCategory algorithm from VoiceAssistant.kt in graminseva.zip
  function parseQueryToCategory(query: string): string | null {
    const lower = query.toLowerCase();
    if (
      lower.includes("light") || lower.includes("fan") || lower.includes("electric") ||
      lower.includes("wiring") || lower.includes("switch") || lower.includes("mcb") ||
      lower.includes("लाइट") || lower.includes("बिजली") || lower.includes("पंखा") ||
      lower.includes("बत्ती") || lower.includes("மின்சாரம்") || lower.includes("కరెంట్") ||
      lower.includes("fuse") || lower.includes("spark") || lower.includes("short circuit")
    ) {
      return "Electrician";
    }

    if (
      lower.includes("water") || lower.includes("tap") || lower.includes("leak") ||
      lower.includes("pipe") || lower.includes("plumb") || lower.includes("tank") ||
      lower.includes("नल") || lower.includes("पानी") || lower.includes("पाइप") ||
      lower.includes("தண்ணீர்") || lower.includes("నీరు") || lower.includes("sewage") ||
      lower.includes("flush") || lower.includes("drain") || lower.includes("pipe burst")
    ) {
      return "Plumber";
    }

    if (
      lower.includes("clean") || lower.includes("cook") || lower.includes("house") ||
      lower.includes("helper") || lower.includes("maid") || lower.includes("dish") ||
      lower.includes("सफाई") || lower.includes("खाना") || lower.includes("झाडू") ||
      lower.includes("சமையல்") || lower.includes("వంట") || lower.includes("sweep") || lower.includes("mop")
    ) {
      return "Home Clean";
    }

    if (
      lower.includes("wood") || lower.includes("door") || lower.includes("lock") ||
      lower.includes("carpent") || lower.includes("bed") || lower.includes("furniture") ||
      lower.includes("लकड़ी") || lower.includes("दरवाजा") || lower.includes("ताला") ||
      lower.includes("மரவேலை") || lower.includes("చెక్క") || lower.includes("chair") || lower.includes("table")
    ) {
      return "Carpenter";
    }

    if (
      lower.includes("paint") || lower.includes("color") || lower.includes("wall") ||
      lower.includes("lime") || lower.includes("रंग") || lower.includes("पेंट") ||
      lower.includes("पुताई") || lower.includes("வர்ணம்") || lower.includes("రంగు")
    ) {
      return "Painter";
    }

    if (
      lower.includes("pest") || lower.includes("cockroach") || lower.includes("termite") ||
      lower.includes("bugs") || lower.includes("rat") || lower.includes("दीमक") || lower.includes("कीड़ा")
    ) {
      return "Pest Control";
    }

    return null;
  }

  // Speak prompt using SpeechSynthesis
  const speakText = (text: string) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.lang = currentLanguage.code;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const handleVoiceSubmit = (text: string) => {
    setQueryText(text);
    const matchedCategory = parseQueryToCategory(text);
    if (matchedCategory) {
      setActiveCategory(matchedCategory);
      speakText(`Searching nearby ${matchedCategory} specialists for ${text}`);
      showToast(`🎙️ Intent Recognized: ${matchedCategory} category selected`, 'success');
    } else {
      speakText(`Showing search results for ${text}`);
    }
  };

  const toggleVoiceMic = () => {
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech Recognition API is not supported on this browser/device. Try Google Chrome or Android WebView.', 'error');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage.code;

      recognition.onstart = () => {
        setIsRecording(true);
        speakText("Speak now");
        showToast('🎙️ Listening... Speak your issue now', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQueryText(transcript);
        const matched = parseQueryToCategory(transcript);
        if (matched) {
          setActiveCategory(matched);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone permission denied. Please grant audio permission in site/app settings.', 'error');
        } else if (event.error === 'no-speech') {
          showToast('No speech detected. Please tap microphone and try again.', 'info');
        } else {
          showToast(`Speech error: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start voice mic:', err);
      setIsRecording(false);
      showToast(`Unable to start microphone: ${err?.message || 'Permission or state error'}`, 'error');
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

    if (queryText.trim()) {
      const q = queryText.toLowerCase();
      const detectedCategory = parseQueryToCategory(q);
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
  }, [providers, userLocation, activeCategory, quickFilter, queryText]);

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

      {/* ── Top Bar (GraminTopBar style from graminseva.zip) ── */}
      <div style={{
        background: 'linear-gradient(160deg, #041B30 0%, #0B3D66 50%, #092C4A 100%)',
        padding: '20px 20px 24px', boxShadow: '0 8px 30px rgba(4,27,48,0.25)',
      }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>
              {greeting},
            </p>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
              {firstName} 👋
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Audio Voice Toggle Button */}
            <button
              onClick={() => {
                setIsAudioEnabled(!isAudioEnabled);
                showToast(isAudioEnabled ? "Audio voice feedback muted" : "Audio voice assistance enabled", "info");
              }}
              title={isAudioEnabled ? "Mute Voice Assistance" : "Enable Voice Assistance"}
              style={{
                background: isAudioEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1.5px solid ${isAudioEnabled ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isAudioEnabled ? <Volume2 size={16} color="#34D399" /> : <VolumeX size={16} color="white" />}
            </button>

            {/* Language Selector Button */}
            <button
              onClick={() => setShowLanguagePicker(true)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '5px 10px', color: 'white', fontSize: 11,
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.native}</span>
            </button>
          </div>
        </div>

        {/* VoiceSearchBar (from VoiceSearchBar.kt in graminseva.zip) */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '12px 16px',
          boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 6px 24px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s ease'
        }}>
          <Search size={18} color="#0B3D66" strokeWidth={2.5} />
          <input
            type="text"
            placeholder={isRecording ? "Listening... Speak your issue..." : "Search 'electrician', 'plumber'..."}
            value={queryText}
            onChange={e => {
              setQueryText(e.target.value);
              const matched = parseQueryToCategory(e.target.value);
              if (matched) setActiveCategory(matched);
            }}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none'
            }}
          />
          {queryText && (
            <button onClick={() => { setQueryText(''); setActiveCategory(null); }} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 22, height: 22, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          )}

          {/* Voice Microphone Pill Button */}
          <button
            onClick={toggleVoiceMic}
            title={isRecording ? "Stop Recording" : "Voice Search"}
            style={{
              background: isRecording ? '#EF4444' : '#0B3D66',
              border: 'none', borderRadius: 10, width: 36, height: 36,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isRecording ? '0 0 15px rgba(239,68,68,0.7)' : 'none'
            }}
          >
            {isRecording ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
          </button>
        </div>

        {/* Animated Voice Recording Active State */}
        {isRecording && (
          <div style={{
            marginTop: 10, padding: '10px 14px', background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#F87171' }}>
              🎙️ Recording... Speak your issue
            </span>
            <button
              onClick={() => handleVoiceSubmit("Light is not working electrician required")}
              style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Simulate Input
            </button>
          </div>
        )}

        {/* Preset Quick Chips Row (Blinkit category tags from VoiceSearchBar.kt) */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 12, scrollbarWidth: 'none' }}>
          {PRESET_TRIGGER_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleVoiceSubmit(chip.fullTrigger)}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '6px 12px', color: 'white', fontSize: 11,
                fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Chips Row ── */}
      <div style={{ background: '#0F172A', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
            All Services
          </h3>
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
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
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>
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
                {queryText ? `No results for "${queryText}". Try searching "electrician", "plumber", or clearing filters.` : 'Providers are joining your area soon!'}
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
                  speakText(`${p.name}, ${p.category} specialist, rate rupees ${p.hourly_rate} per hour, rating ${p.rating.toFixed(1)} stars`);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Language Selector Dialog (from LanguageSelectorDialog.kt in graminseva.zip) ── */}
      {showLanguagePicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,27,48,0.7)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>🌐 Choose Language / भाषा चुनें</h3>
              <button onClick={() => setShowLanguagePicker(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLanguage(lang);
                    setShowLanguagePicker(false);
                    showToast(`Language set to ${lang.name} (${lang.native})`, 'success');
                  }}
                  style={{
                    background: currentLanguage.code === lang.code ? '#0B3D66' : '#F8FAFC',
                    color: currentLanguage.code === lang.code ? 'white' : '#0F172A',
                    border: `1.5px solid ${currentLanguage.code === lang.code ? '#0B3D66' : '#E2E8F0'}`,
                    borderRadius: 14, padding: '12px 14px', textAlign: 'left',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  <span style={{ fontSize: 18 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontSize: 12 }}>{lang.native}</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{lang.name}</div>
                  </div>
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
