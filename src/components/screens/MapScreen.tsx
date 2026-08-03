'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, calcDistance } from '../../context/AppContext';
import { Provider, SERVICE_CATEGORIES } from '../../lib/types';
import { Navigation, MapPin, Layers } from 'lucide-react';

interface MapScreenProps {
  onSelectProvider: (p: Provider) => void;
}

// ─── Provider Pin on Map ───────────────────────────────────
function ProviderPill({ provider, onClick }: { provider: Provider; onClick: () => void }) {
  const cat = SERVICE_CATEGORIES.find(c => c.key === provider.category);
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', transform: 'translate(-50%, -100%)',
        background: provider.is_online ? '#0B3D66' : '#64748B',
        color: 'white', borderRadius: 20, padding: '6px 12px 6px 8px',
        fontSize: 12, fontWeight: 700, border: '2px solid white',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 3px 12px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      <span style={{ fontSize: 14 }}>{cat?.emoji ?? '🔧'}</span>
      {provider.name.split(' ')[0]}
      {/* Pointer */}
      <div style={{
        position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `8px solid ${provider.is_online ? '#0B3D66' : '#64748B'}`,
      }} />
    </button>
  );
}

// ─── Map Screen ───────────────────────────────────────────
export default function MapScreen({ onSelectProvider }: MapScreenProps) {
  const { providers, userLocation, locationStatus, requestLocation } = useApp();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const filters = ['All', ...SERVICE_CATEGORIES.map(c => c.key)];

  const visibleProviders = useMemo(() => {
    return providers
      .filter(p => activeFilter === 'All' || p.category === activeFilter)
      .map(p => ({
        ...p,
        distanceKm: calcDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }));
  }, [providers, activeFilter, userLocation]);

  // ── Load Leaflet ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) { setLeafletLoaded(true); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Init Map ──
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#0B3D66;border:3px solid white;box-shadow:0 0 0 4px rgba(11,61,102,0.2);"></div>`,
      className: '', iconSize: [18, 18], iconAnchor: [9, 9],
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup('Your location');
  }, [leafletLoaded, userLocation]);

  // ── Update Provider Markers ──
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visibleProviders.forEach(provider => {
      const cat = SERVICE_CATEGORIES.find(c => c.key === provider.category);
      const icon = L.divIcon({
        html: `
          <div style="
            background:${provider.is_online ? '#0B3D66' : '#64748B'};
            color:white;border-radius:20px;padding:5px 10px 5px 7px;
            font-size:11px;font-weight:700;border:2px solid white;
            display:flex;align-items:center;gap:4px;
            box-shadow:0 3px 10px rgba(0,0,0,0.2);white-space:nowrap;
            position:relative;
          ">
            <span style="font-size:13px">${cat?.emoji ?? '🔧'}</span>
            ${provider.name.split(' ')[0]}
            <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
              width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
              border-top:7px solid ${provider.is_online ? '#0B3D66' : '#64748B'}"></div>
          </div>
        `,
        className: '',
        iconAnchor: [50, 34],
      });

      const marker = L.marker([provider.lat, provider.lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => setSelectedProvider(provider));

      markersRef.current.push(marker);
    });
  }, [visibleProviders, leafletLoaded]);

  const cat = selectedProvider ? SERVICE_CATEGORIES.find(c => c.key === selectedProvider.category) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '16px 20px 12px', borderBottom: '1px solid #F1F5F9', zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
            Specialists Near You
          </h2>
          <button
            onClick={requestLocation}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: locationStatus === 'granted' ? '#DCFCE7' : '#FEF3C7', border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer' }}
          >
            <Navigation size={12} color={locationStatus === 'granted' ? '#15803D' : '#92400E'} />
            <span style={{ fontSize: 11, fontWeight: 700, color: locationStatus === 'granted' ? '#15803D' : '#92400E' }}>
              {locationStatus === 'granted' ? 'Live GPS' : 'Enable GPS'}
            </span>
          </button>
        </div>

        {/* Category filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {filters.map(f => {
            const fc = SERVICE_CATEGORIES.find(c => c.key === f);
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                  background: activeFilter === f ? '#0B3D66' : '#F1F5F9',
                  border: 'none', color: activeFilter === f ? 'white' : '#475569',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                }}
              >
                {fc ? `${fc.emoji} ${fc.label}` : f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {!leafletLoaded && (
          <div style={{
            position: 'absolute', inset: 0, background: '#F0F7FF',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <div style={{ width: 40, height: 40, border: '3px solid #0B3D66', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Loading map…</p>
          </div>
        )}

        {/* Provider count badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          background: 'white', borderRadius: 20, padding: '6px 14px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
            {visibleProviders.filter(p => p.is_online).length} available
          </span>
        </div>
      </div>

      {/* Selected Provider Sheet */}
      {selectedProvider && (
        <div style={{
          background: 'white', padding: '16px', borderTop: '1px solid #F1F5F9',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', background: cat?.bg ?? '#F0F7FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedProvider.avatar_url ? (
                <img src={selectedProvider.avatar_url} alt={selectedProvider.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 26 }}>{cat?.emoji}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                {selectedProvider.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                <span>{cat?.emoji} {selectedProvider.category}</span>
                <span>·</span>
                <span>⭐ {selectedProvider.rating.toFixed(1)}</span>
                <span>·</span>
                <span>{selectedProvider.distanceKm?.toFixed(1)} km</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedProvider(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontWeight: 600 }}
              >
                ✕
              </button>
              <button
                onClick={() => { onSelectProvider(selectedProvider); setSelectedProvider(null); }}
                style={{
                  background: '#0B3D66', border: 'none', borderRadius: 10, padding: '8px 16px',
                  cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 800,
                }}
              >
                View →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; border-radius: 10px !important; overflow: hidden; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { font-size: 18px !important; color: #0F172A !important; background: white !important; border: none !important; }
      `}</style>
    </div>
  );
}
