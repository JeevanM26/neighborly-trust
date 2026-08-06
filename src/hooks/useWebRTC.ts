import { useState, useEffect, useRef } from 'react';
import { getClient } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type CallStatus = 'idle' | 'ringing' | 'calling' | 'connected';

export function useWebRTC(userId: string) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [incomingCall, setIncomingCall] = useState<{ callerId: string, callerName: string, roomId: string } | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    if (!userId) return;
    const client = getClient();
    const personalChannel = client.channel(`user_${userId}`);
    
    personalChannel
      .on('broadcast', { event: 'incoming_call' }, (payload) => {
        if (callStatus === 'idle') {
          setIncomingCall({
            callerId: payload.payload.callerId,
            callerName: payload.payload.callerName,
            roomId: payload.payload.roomId
          });
          setCallStatus('ringing');
        } else {
          client.channel(payload.payload.roomId).send({
            type: 'broadcast',
            event: 'call_busy',
            payload: {}
          });
        }
      })
      .subscribe();

    return () => {
      personalChannel.unsubscribe();
    };
  }, [userId, callStatus]);

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (channel.current) {
      channel.current.unsubscribe();
      channel.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setCallStatus('idle');
    setIncomingCall(null);
    setActiveRoomId(null);
    setRemoteStream(null);
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      return stream;
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Microphone access is required for calls.');
      return null;
    }
  };

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection(pcConfig);
    peerConnection.current = pc;

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channel.current) {
        channel.current.send({
          type: 'broadcast',
          event: 'ice_candidate',
          payload: { candidate: event.candidate, senderId: userId }
        });
      }
    };
    
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
      }
    };

    return pc;
  };

  const joinRoom = (roomId: string) => {
    const client = getClient();
    const room = client.channel(roomId);
    channel.current = room;

    room
      .on('broadcast', { event: 'offer' }, async (payload) => {
        if (payload.payload.senderId === userId) return;
        const pc = peerConnection.current || setupPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        room.send({
          type: 'broadcast',
          event: 'answer',
          payload: { answer, senderId: userId }
        });
        setCallStatus('connected');
      })
      .on('broadcast', { event: 'answer' }, async (payload) => {
        if (payload.payload.senderId === userId) return;
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
          setCallStatus('connected');
        }
      })
      .on('broadcast', { event: 'ice_candidate' }, async (payload) => {
        if (payload.payload.senderId === userId) return;
        if (peerConnection.current && payload.payload.candidate) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        }
      })
      .on('broadcast', { event: 'joined' }, async (payload) => {
        if (payload.payload.senderId !== userId) {
          const pc = setupPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          room.send({
            type: 'broadcast',
            event: 'offer',
            payload: { offer, senderId: userId }
          });
        }
      })
      .on('broadcast', { event: 'call_ended' }, () => {
        cleanup();
      })
      .on('broadcast', { event: 'call_declined' }, () => {
        alert('Call was declined');
        cleanup();
      })
      .on('broadcast', { event: 'call_busy' }, () => {
        alert('User is on another call');
        cleanup();
      })
      .subscribe();
  };

  const startCall = async (targetUserId: string, targetName: string, callerName: string) => {
    const stream = await startLocalStream();
    if (!stream) return;

    setCallStatus('calling');
    const roomId = `call_${userId}_${targetUserId}_${Date.now()}`;
    setActiveRoomId(roomId);
    
    joinRoom(roomId);

    const client = getClient();
    client.channel(`user_${targetUserId}`).send({
      type: 'broadcast',
      event: 'incoming_call',
      payload: { callerId: userId, callerName, roomId }
    });
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    const stream = await startLocalStream();
    if (!stream) return;

    setActiveRoomId(incomingCall.roomId);
    joinRoom(incomingCall.roomId);
    
    setupPeerConnection(); 
    
    channel.current?.send({
      type: 'broadcast',
      event: 'joined',
      payload: { senderId: userId }
    });
    
    setCallStatus('connected');
  };

  const declineCall = () => {
    if (incomingCall) {
      const client = getClient();
      client.channel(incomingCall.roomId).send({
        type: 'broadcast',
        event: 'call_declined',
        payload: {}
      });
      cleanup();
    }
  };

  const endCall = () => {
    if (channel.current) {
      channel.current.send({
        type: 'broadcast',
        event: 'call_ended',
        payload: {}
      });
    }
    cleanup();
  };

  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error('Audio play error', e));
    }
  }, [remoteStream, callStatus]);

  return {
    callStatus,
    incomingCall,
    remoteStream,
    startCall,
    answerCall,
    declineCall,
    endCall,
    audioRef
  };
}
