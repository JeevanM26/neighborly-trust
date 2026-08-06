// @ts-nocheck
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { SKILL_CATEGORIES, WorkerSkill } from '../../lib/types';
import { sendOtp, generateOtp } from '../../lib/sms';
import { ShieldCheck, ChevronLeft, Smartphone, MessageSquare, Check, ChevronRight, IndianRupee } from 'lucide-react';

type Step = 'phone' | 'otp' | 'skills' | 'rates';

export default function WorkerLoginScreen() {
  const { loginWorker, completeOnboarding, isNewWorker, showToast } = useWorker();
  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpMethod, setOtpMethod] = useState<'sms' | 'screen'>('screen');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [rates, setRates] = useState<Record<string, number>>({});
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (isNewWorker) setStep('skills');
  }, [isNewWorker]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Init default rates
  useEffect(() => {
    const defaults: Record<string, number> = {};
    SKILL_CATEGORIES.forEach(s => { defaults[s.key] = s.default_rate; });
    setRates(defaults);
  }, []);

  const handleSendOtp = async () => {
    setError('');
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanName) { setError('Please enter your full name.'); return; }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) { setError('Enter a valid 10-digit Indian mobile number.'); return; }
    // Bypass OTP verification specifically for primary super owner (7975182162)
    if (cleanPhone === '7975182162') {
      setLoading(false);
      showToast('Bypassing OTP for Primary Owner (7975182162)', 'info');
      loginWorker(cleanPhone, cleanName || 'Primary Owner');
      return;
    }

    setLoading(true);
    const code = generateOtp();
    setGeneratedOtp(code);
    try {
      const result = await sendOtp(cleanPhone, code);
      if (result.ok) {
        setOtpMethod(result.method);
        if (result.method === 'screen') showToast(`Your OTP: ${code}`, 'info');
      } else {
        setOtpMethod('screen');
        showToast(`Your OTP: ${code}`, 'info');
      }
    } catch {
      setOtpMethod('screen');
      showToast(`Your OTP: ${code}`, 'info');
    }
    setLoading(false);
    setStep('otp');
    setCountdown(30);
    setOtp(['', '', '', '']);
    setTimeout(() => otpRefs[0].current?.focus(), 100);
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 3) otpRefs[idx + 1].current?.focus();
    if (next.every(d => d) && next.join('').length === 4) verifyOtp(next.join(''));
  };

  const verifyOtp = (code?: string) => {
    const entered = code ?? otp.join('');
    if (entered.length < 4) { setError('Enter all 4 digits.'); return; }
    if (entered !== generatedOtp) { setError('Incorrect OTP. Try again.'); return; }
    setError('');
    loginWorker(phone.replace(/\D/g, ''), name.trim());
  };

  const handleCompleteOnboarding = () => {
    if (selectedSkills.size === 0) { showToast('Select at least one skill.', 'error'); return; }
    const skills: WorkerSkill[] = Array.from(selectedSkills).map(cat => ({
      category: cat as any,
      hourly_rate: rates[cat] || SKILL_CATEGORIES.find(s => s.key === cat)?.default_rate || 300,
      is_active: true,
      jobs_count: 0,
    }));
    completeOnboarding(skills);
  };

  // ── Phone Step ──────────────────────────────────────────
  if (step === 'phone') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '52px 24px 36px', textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: 22, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', backdropFilter: 'blur(10px)' }}>
          <ShieldCheck size={38} color="#FCD34D" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: '0 0 6px' }}>Worker Portal</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>Neighborly Trust — Partner App</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, fontWeight: 400 }}>Accept jobs • Track earnings • Grow your business</p>
      </div>

      <div style={{ padding: '28px 20px 40px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #D1FAE5' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#065F46', marginBottom: 6, letterSpacing: '-0.3px' }}>Get started</h2>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 20 }}>Enter your details to continue.</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#F8FAFC', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mobile Number</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ padding: '13px 14px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>🇮🇳 +91</div>
              <input type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#F8FAFC' }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <div onClick={() => setConsent(!consent)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${consent ? '#059669' : '#CBD5E1'}`, background: consent ? '#059669' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.15s ease' }}>
              {consent && <Check size={12} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
              I agree to the <strong style={{ color: '#059669' }}>Terms of Service</strong> and <strong style={{ color: '#059669' }}>Privacy Policy</strong>. I understand 8% commission applies per booking.
            </span>
          </label>

          {error && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>{error}</p>}

          <button onClick={handleSendOtp} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, background: loading ? '#94A3B8' : 'linear-gradient(135deg, #059669, #065F46)', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '-0.2px', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
            {loading ? 'Sending code…' : 'Continue →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20, lineHeight: 1.6 }}>
          By continuing, you agree to our Terms of Service.<br />Protected under DPDP Act 2023.
        </p>
      </div>
    </div>
  );

  // ── OTP Step ────────────────────────────────────────────
  if (step === 'otp') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '40px 24px 28px' }}>
        <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>Verify your number</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          {otpMethod === 'sms' ? `Code sent to +91 ${phone}` : 'Check the notification above ↑'}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: otpMethod === 'sms' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${otpMethod === 'sms' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 20, padding: '5px 12px' }}>
          {otpMethod === 'sms'
            ? <><Smartphone size={12} color="#6EE7B7" /><span style={{ fontSize: 11, fontWeight: 700, color: '#6EE7B7' }}>Sent via SMS</span></>
            : <><MessageSquare size={12} color="#FCD34D" /><span style={{ fontSize: 11, fontWeight: 700, color: '#FCD34D' }}>Demo mode — check notification</span></>
          }
        </div>
      </div>

      <div style={{ padding: '28px 24px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '28px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #D1FAE5' }}>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 20 }}>Enter the 4-digit verification code</p>

          {otpMethod === 'screen' && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: '0 0 2px' }}>Demo Mode</p>
                <p style={{ fontSize: 11, color: '#B45309', margin: 0, fontWeight: 500 }}>OTP shown in the notification. Add Fast2SMS API key for real SMS.</p>
              </div>
            </div>
          )}

          <div className="otp-group" style={{ marginBottom: 20 }}>
            {otp.map((digit, idx) => (
              <input key={idx} ref={otpRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpChange(e.target.value, idx)}
                onKeyDown={e => { if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus(); }}
                className={`otp-box${digit ? ' filled' : ''}`} />
            ))}
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 14 }}>{error}</p>}

          <button onClick={() => verifyOtp()} disabled={otp.join('').length < 4} style={{ width: '100%', padding: '15px', borderRadius: 14, background: otp.join('').length < 4 ? '#E2E8F0' : 'linear-gradient(135deg, #059669, #065F46)', color: otp.join('').length < 4 ? '#94A3B8' : 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: otp.join('').length === 4 ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
            Verify & Continue →
          </button>

          {countdown > 0 ? (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 16, fontWeight: 500 }}>Resend in {countdown}s</p>
          ) : (
            <button onClick={handleSendOtp} style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: 12, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', marginTop: 16, fontWeight: 700, padding: '8px' }}>
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Skill Selection Step ─────────────────────────────────
  if (step === 'skills') return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '36px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Step 1 of 2</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>Your Skills</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Select all services you can offer</p>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛠️</div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{ width: '50%', height: '100%', background: '#FCD34D', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 14 }}>
          Tap to select • {selectedSkills.size} selected
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SKILL_CATEGORIES.map(skill => {
            const selected = selectedSkills.has(skill.key);
            return (
              <button key={skill.key} onClick={() => {
                setSelectedSkills(prev => {
                  const next = new Set(prev);
                  if (next.has(skill.key)) next.delete(skill.key);
                  else next.add(skill.key);
                  return next;
                });
              }} className={`skill-pill${selected ? ' selected' : ''}`} style={{ width: '100%', textAlign: 'left' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: selected ? skill.bg : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, transition: 'all 0.2s ease' }}>
                  {skill.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#065F46' : '#334155' }}>{skill.label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>{skill.description}</div>
                  <div style={{ fontSize: 11, color: selected ? '#059669' : '#CBD5E1', fontWeight: 700, marginTop: 2 }}>₹{skill.default_rate}/hr default</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? '#059669' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}>
                  {selected ? <Check size={14} color="white" strokeWidth={3} /> : <span style={{ fontSize: 14, color: '#94A3B8' }}>+</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={() => { if (selectedSkills.size === 0) { showToast('Select at least one skill', 'error'); return; } setStep('rates'); }}
          disabled={selectedSkills.size === 0}
          style={{ width: '100%', marginTop: 24, padding: '16px', borderRadius: 14, background: selectedSkills.size === 0 ? '#E2E8F0' : 'linear-gradient(135deg, #059669, #065F46)', color: selectedSkills.size === 0 ? '#94A3B8' : 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: selectedSkills.size > 0 ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
          Set Your Rates <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  // ── Rates Step ───────────────────────────────────────────
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0FDF4' }}>
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '36px 24px 24px' }}>
        <button onClick={() => setStep('skills')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 12, padding: 0 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>Step 2 of 2</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px' }}>Set Your Rates</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Price per hour for each skill</p>
        <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{ width: '100%', height: '100%', background: '#FCD34D', borderRadius: 2 }} />
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <p style={{ fontSize: 12, color: '#065F46', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
            You keep <strong>92%</strong> of each booking. Platform takes 8% commission. Set competitive rates to get more jobs.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from(selectedSkills).map(skillKey => {
            const meta = SKILL_CATEGORIES.find(s => s.key === skillKey)!;
            return (
              <div key={skillKey} style={{ background: 'white', borderRadius: 16, padding: '16px', border: '1px solid #D1FAE5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{meta.emoji}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>per hour</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '2px solid #A7F3D0', borderRadius: 12, padding: '8px 12px' }}>
                    <IndianRupee size={14} color="#059669" strokeWidth={2.5} />
                    <input type="number" value={rates[skillKey] || meta.default_rate}
                      onChange={e => setRates(r => ({ ...r, [skillKey]: Number(e.target.value) }))}
                      style={{ width: 60, border: 'none', background: 'transparent', fontSize: 16, fontWeight: 900, color: '#065F46', outline: 'none', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}
                      min={100} max={5000} />
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                  <span>You earn: ₹{Math.round((rates[skillKey] || meta.default_rate) * 0.92)}/hr</span>
                  <span>Commission: ₹{Math.round((rates[skillKey] || meta.default_rate) * 0.08)}/hr</span>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleCompleteOnboarding}
          style={{ width: '100%', marginTop: 24, padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, #059669, #065F46)', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)', letterSpacing: '-0.2px' }}>
          Start Taking Bookings 🚀
        </button>
      </div>
    </div>
  );
}

