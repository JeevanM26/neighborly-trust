// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { useWorker } from '../../context/WorkerContext';
import { SKILL_CATEGORIES, WorkerSkill } from '../../lib/types';
import { Star, Check, Edit3, IndianRupee, LogOut, ChevronRight, Bell, Volume2, Globe, Shield } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

export default function WorkerProfileScreen() {
  const { worker, updateSkills, logoutWorker, settings, setLanguage, toggleSound, showToast } = useWorker();
  const [editingSkills, setEditingSkills] = useState(false);
  const [draftSkills, setDraftSkills] = useState<WorkerSkill[]>(worker?.skills ?? []);
  const [saving, setSaving] = useState(false);

  if (!worker) return null;

  const EMOJI: Record<string, string> = { Electrician:'⚡', Plumber:'🔧', Carpenter:'🪚', 'Home Clean':'🧹', Painter:'🎨', 'Pest Control':'🐛' };

  const handleSaveSkills = async () => {
    setSaving(true);
    await updateSkills(draftSkills);
    setEditingSkills(false);
    setSaving(false);
    showToast('Skills saved successfully!');
  };

  const toggleDraftSkill = (cat: string) => {
    setDraftSkills(prev => {
      const existing = prev.find(s => s.category === cat);
      if (existing) {
        return prev.map(s => s.category === cat ? { ...s, is_active: !s.is_active } : s);
      }
      const meta = SKILL_CATEGORIES.find(s => s.key === cat)!;
      return [...prev, { category: cat as any, hourly_rate: meta.default_rate, is_active: true, jobs_count: 0 }];
    });
  };

  const updateDraftRate = (cat: string, rate: number) => {
    setDraftSkills(prev => prev.map(s => s.category === cat ? { ...s, hourly_rate: rate } : s));
  };

  return (
    <div style={{ background: '#F0FDF4', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #065F46 0%, #059669 100%)', padding: '20px 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white', flexShrink: 0 }}>
            {worker.full_name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 3px', letterSpacing: '-0.3px' }}>{worker.full_name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 6px', fontWeight: 500 }}>+91 {worker.phone}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 9px' }}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{worker.rating.toFixed(1)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 9px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{worker.total_jobs} jobs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 9px' }}>
                <Shield size={12} color="#FCD34D" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Skills Section */}
        <div style={{ background: 'white', borderRadius: 20, padding: '18px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #D1FAE5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>My Skills & Rates</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, margin: 0 }}>Tap Edit to add/remove skills</p>
            </div>
            {!editingSkills ? (
              <button onClick={() => { setDraftSkills(worker.skills); setEditingSkills(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}>
                <Edit3 size={13} color="#059669" /><span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Edit</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditingSkills(false)} style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', fontSize: 12, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveSkills} disabled={saving} style={{ padding: '7px 12px', border: 'none', borderRadius: 10, background: '#059669', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {saving ? 'Saving…' : <><Check size={12} /> Save</>}
                </button>
              </div>
            )}
          </div>

          {!editingSkills ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(worker.skills.length > 0 ? worker.skills : []).map(skill => (
                <div key={skill.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{EMOJI[skill.category] ?? '🔧'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: skill.is_active ? '#0F172A' : '#94A3B8' }}>{skill.category}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{skill.jobs_count} jobs done</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>₹{skill.hourly_rate}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>per hour</div>
                  </div>
                </div>
              ))}
              {worker.skills.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>No skills added yet. Tap Edit to add.</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SKILL_CATEGORIES.map(cat => {
                const draft = draftSkills.find(s => s.category === cat.key);
                const active = draft?.is_active !== false && !!draft;
                return (
                  <div key={cat.key} style={{ border: `2px solid ${active ? '#A7F3D0' : '#E2E8F0'}`, borderRadius: 12, padding: '10px 12px', background: active ? '#F0FDF4' : '#F8FAFC', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button onClick={() => toggleDraftSkill(cat.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${active ? '#059669' : '#CBD5E1'}`, background: active ? '#059669' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          {active && <Check size={12} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#0F172A' : '#94A3B8' }}>{cat.label}</span>
                      </button>
                      {active && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid #A7F3D0', borderRadius: 8, padding: '5px 10px' }}>
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>₹</span>
                          <input type="number" value={draft?.hourly_rate ?? cat.default_rate}
                            onChange={e => updateDraftRate(cat.key, Number(e.target.value))}
                            style={{ width: 52, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 900, color: '#065F46', outline: 'none', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}
                            min={100} max={5000} />
                          <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500 }}>/hr</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #F8FAFC' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Settings</h3>
          </div>
          {[
            { icon: Volume2, label: 'Sound notifications', value: settings.sounds ? 'On' : 'Off', onPress: toggleSound, color: '#059669' },
          ].map(({ icon: Icon, label, value, onPress, color }) => (
            <button key={label} onClick={onPress} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #F8FAFC' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', flex: 1, textAlign: 'left' }}>{label}</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{value}</span>
              <ChevronRight size={16} color="#CBD5E1" style={{ marginLeft: 6 }} />
            </button>
          ))}

          {/* Language */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Globe size={16} color="#059669" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Language</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setLanguage(lang.code as any)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${settings.language === lang.code ? '#059669' : '#E2E8F0'}`, background: settings.language === lang.code ? '#ECFDF5' : 'white', fontSize: 12, fontWeight: settings.language === lang.code ? 800 : 500, color: settings.language === lang.code ? '#059669' : '#64748B', cursor: 'pointer' }}>
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={() => { if (confirm('Are you sure you want to logout?')) logoutWorker(); }}
          style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1.5px solid #FECACA', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={16} color="#EF4444" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Logout</span>
        </button>

        <p style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E1', fontWeight: 500, marginTop: 16 }}>
          Neighborly Trust Worker Portal v1.0 · Protected under DPDP Act 2023
        </p>
      </div>
    </div>
  );
}

