// @ts-nocheck
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { Mic, MicOff, Volume2, Search, X, Sparkles, Check, ChevronDown, Star, Phone, MapPin } from 'lucide-react';

interface LanguageLocale {
  code: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  prompt: string;
  listeningText: string;
}

const LANGUAGES: LanguageLocale[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳', prompt: 'बोलिए या काम का नाम खोजिए...', listeningText: 'सुन रहे हैं... बोलिए' },
  { code: 'en-IN', name: 'English', nativeName: 'English', flagEmoji: '🇮🇳', prompt: 'Speak or search for service...', listeningText: 'Listening... Speak now' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flagEmoji: '🇮🇳', prompt: 'మాట్లాడండి లేదా వెతకండి...', listeningText: 'వింటున్నాము... మాట్లాడండి' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flagEmoji: '🇮🇳', prompt: 'பேசுங்கள் அல்லது தேடுங்கள்...', listeningText: 'கேட்கிறது... பேசுங்கள்' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flagEmoji: '🇮🇳', prompt: 'ಮಾತನಾಡಿ ಅಥವಾ ಹುಡುಕಿ...', listeningText: 'ಕೇಳುತ್ತಿದ್ದೇವೆ... ಮಾತನಾಡಿ' },
];

const QUICK_CHIPS = [
  { label: 'Electrician', emoji: '⚡', category: 'Electrician' },
  { label: 'Plumber', emoji: '🚰', category: 'Plumber' },
  { label: 'Carpenter', emoji: '🪚', category: 'Carpenter' },
  { label: 'Cleaning', emoji: '🧹', category: 'Home Clean' },
  { label: 'Painter', emoji: '🎨', category: 'Painter' },
  { label: 'Pest Control', emoji: '🐛', category: 'Pest Control' },
];

const WORKER_DATA = [
  { id: 'w1', name: 'Ramesh Kumar', skill: 'Electrician', skillHindi: 'बिजली मिस्त्री', rate: 400, rating: 4.9, reviews: 38, location: 'Rampur, Sector 4', phone: '9876543210', emoji: '⚡' },
  { id: 'w2', name: 'Suresh Verma', skill: 'Plumber', skillHindi: 'प्लंबर', rate: 350, rating: 4.8, reviews: 29, location: 'Indiranagar, Block B', phone: '9812345678', emoji: '🔧' },
  { id: 'w3', name: 'Mahesh Chandra', skill: 'Carpenter', skillHindi: 'बढ़ई', rate: 380, rating: 4.7, reviews: 19, location: 'Gandhi Nagar', phone: '9988776655', emoji: '🪚' },
  { id: 'w4', name: 'Anita Devi', skill: 'Home Clean', skillHindi: 'घर की सफाई', rate: 280, rating: 5.0, reviews: 45, location: 'Main Road, Market', phone: '9765432109', emoji: '🧹' },
  { id: 'w5', name: 'Vikram Singh', skill: 'Painter', skillHindi: 'पेंटर', rate: 350, rating: 4.6, reviews: 15, location: 'Subhash Chowk', phone: '9654321098', emoji: '🎨' },
  { id: 'w6', name: 'Rajesh Sharma', skill: 'Pest Control', skillHindi: 'पेस्ट कंट्रोल', rate: 450, rating: 4.9, reviews: 22, location: 'Station Road', phone: '9543210987', emoji: '🐛' },
];

export default function VoiceSearchScreen() {
  const { showToast } = useWorker();
  const [selectedLang, setSelectedLang] = useState<LanguageLocale>(LANGUAGES[0]);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          setSearchQuery(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          showToast(`Voice Error: ${event.error}`, 'error');
        };

        recognition.onend = () => {
          setIsListening(false);
          if (transcript) {
            speakText(`${transcript} के लिए परिणाम मिले हैं`);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang, transcript, showToast]);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLang.code;
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(false);
        }
      } else {
        showToast('Speech recognition not supported in this browser.', 'info');
      }
    }
  };

  // Text-To-Speech Synthesis
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang.code;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const speakWorkerDetails = (w: typeof WORKER_DATA[0]) => {
    const text = selectedLang.code.startsWith('hi')
      ? `${w.name}, ${w.skillHindi}, रेट ₹${w.rate} प्रति घंटा, रेटिंग ${w.rating} स्टार`
      : `${w.name}, ${w.skill}, Rate ₹${w.rate} per hour, Rating ${w.rating} stars`;
    speakText(text);
  };

  const filteredWorkers = WORKER_DATA.filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      w.name.toLowerCase().includes(q) ||
      w.skill.toLowerCase().includes(q) ||
      w.skillHindi.toLowerCase().includes(q) ||
      w.location.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%', paddingBottom: 80, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top Header ── */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '24px 20px 20px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Accessible Voice Search</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '2px 0 0', letterSpacing: '-0.3px' }}>बहुभाषी आवाज खोज 🎤</h1>
          </div>

          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '8px 12px', color: 'white', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
            >
              <span>{selectedLang.flagEmoji} {selectedLang.nativeName}</span>
              <ChevronDown size={14} />
            </button>

            {showLangDropdown && (
              <div style={{ position: 'absolute', top: 44, right: 0, background: 'white', borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '6px', zIndex: 100, minWidth: 150 }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLang(lang); setShowLangDropdown(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: selectedLang.code === lang.code ? '#ECFDF5' : 'transparent', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: selectedLang.code === lang.code ? 800 : 500, color: selectedLang.code === lang.code ? '#065F46' : '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span>{lang.flagEmoji}</span>
                    <span>{lang.nativeName} ({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Input & Mic Bar ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #D1FAE5' }}>
          <Search size={20} color="#94A3B8" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={selectedLang.prompt}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}
          />

          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={18} color="#94A3B8" />
            </button>
          )}

          {/* Audio Assistance Speaker Button */}
          <button
            onClick={() => speakText(selectedLang.prompt)}
            style={{ background: isSpeaking ? '#FEF3C7' : '#F1F5F9', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Read instructions aloud"
          >
            <Volume2 size={18} color={isSpeaking ? '#B45309' : '#059669'} />
          </button>

          {/* Animated Microphone Button with Pulsing Effect */}
          <button
            onClick={toggleMic}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: isListening ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #059669, #065F46)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isListening ? '0 0 0 8px rgba(239,68,68,0.25)' : '0 4px 12px rgba(5,150,105,0.3)',
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse 1.2s infinite' : 'none'
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* Listening Indicator Banner */}
        {isListening && (
          <div style={{ marginTop: 10, background: '#DCFCE7', border: '1px solid #34D399', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, animation: 'bounceIn 0.3s ease' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>{transcript || selectedLang.listeningText}</span>
          </div>
        )}
      </div>

      {/* ── Quick Chips ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', margin: '0 0 10px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Quick Services / त्वरित विकल्प</p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => { setSearchQuery(chip.category); speakText(`${chip.label} श्रेणी चुनी गई`); }}
              style={{ background: 'white', border: '1px solid #D1FAE5', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Worker Cards List ── */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>Available Workers ({filteredWorkers.length})</h3>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Show All</button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredWorkers.map(w => (
            <div key={w.id} style={{ background: 'white', borderRadius: 18, padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {w.emoji}
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>{w.name}</h4>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', margin: '2px 0 4px' }}>
                  {w.skill} ({w.skillHindi}) • {w.location}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#B45309' }}>⭐ {w.rating} ({w.reviews})</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>₹{w.rate}/hr</span>
                </div>
              </div>

              {/* Audio Playback Button on Worker Card */}
              <button
                onClick={() => speakWorkerDetails(w)}
                style={{ width: 40, height: 40, borderRadius: '50%', background: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                title="Read worker details aloud"
              >
                <Volume2 size={20} color="#059669" />
              </button>
            </div>
          ))}

          {filteredWorkers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 20 }}>
              <p style={{ fontSize: 32, margin: '0 0 10px' }}>🔍</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>No matching workers found</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Try speaking a service category like "Electrician" or "Plumber"</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

