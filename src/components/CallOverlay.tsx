import React from 'react';
import { Phone, PhoneOff, PhoneCall } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

export function CallOverlay({ webrtc }: { webrtc: ReturnType<typeof useWebRTC> }) {
  const { callStatus, incomingCall, answerCall, declineCall, endCall, audioRef } = webrtc;

  if (callStatus === 'idle') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,23,42,0.95)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', backdropFilter: 'blur(10px)'
    }}>
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <div style={{
        width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        border: '2px solid rgba(255,255,255,0.2)'
      }}>
        <PhoneCall size={40} color="#38BDF8" className={callStatus === 'ringing' || callStatus === 'calling' ? 'pulse-anim' : ''} />
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        {incomingCall ? incomingCall.callerName : 'Neighborly Trust Call'}
      </h2>
      
      <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 40 }}>
        {callStatus === 'calling' && 'Calling...'}
        {callStatus === 'ringing' && 'Incoming Call...'}
        {callStatus === 'connected' && 'Call Connected'}
      </p>

      <div style={{ display: 'flex', gap: 20 }}>
        {callStatus === 'ringing' && (
          <>
            <button onClick={declineCall} style={{
              width: 64, height: 64, borderRadius: 32, background: '#EF4444', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
            }}>
              <PhoneOff size={28} color="white" />
            </button>
            <button onClick={answerCall} style={{
              width: 64, height: 64, borderRadius: 32, background: '#10B981', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
            }}>
              <Phone size={28} color="white" />
            </button>
          </>
        )}

        {(callStatus === 'calling' || callStatus === 'connected') && (
          <button onClick={endCall} style={{
            width: 64, height: 64, borderRadius: 32, background: '#EF4444', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
          }}>
            <PhoneOff size={28} color="white" />
          </button>
        )}
      </div>

      <style>{`
        .pulse-anim {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
