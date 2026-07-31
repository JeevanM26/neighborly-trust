'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Zap, Droplet, Hammer, Paintbrush, Star, MapPin, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function ServicesPage() {
  const { workers, t, quickBookWorker } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { title: 'Electrician', icon: Zap, color: 'bg-amber-50 text-amber-600 border-amber-200', count: '12 Pros' },
    { title: 'Plumber', icon: Droplet, color: 'bg-blue-50 text-blue-600 border-blue-200', count: '8 Pros' },
    { title: 'Carpentry', icon: Hammer, color: 'bg-orange-50 text-orange-600 border-orange-200', count: '15 Pros' },
    { title: 'Painting/Repairs', icon: Paintbrush, color: 'bg-purple-50 text-purple-600 border-purple-200', count: '9 Pros' },
  ];

  const searchResults = workers.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      w.fullName.toLowerCase().includes(q) ||
      w.tradeCategory.toLowerCase().includes(q) ||
      w.bio.toLowerCase().includes(q)
    );
  });

  const topRated = workers.slice(0, 3);

  return (
    <div className="p-4 space-y-5 pb-6">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Service Directory</h2>
        <p className="text-xs text-slate-500">Explore categories or search trusted local technicians</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 shadow-sm"
        />
      </div>

      {/* Search Active Results Mode */}
      {searchQuery.trim() !== '' ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700">Search Results ({searchResults.length})</h3>
          {searchResults.length > 0 ? (
            searchResults.map((worker) => (
              <div key={worker.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Image src={worker.avatarUrl} alt={worker.fullName} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{worker.fullName}</h4>
                    <p className="text-[11px] text-blue-800 font-semibold">{worker.tradeCategory}</p>
                    <span className="text-[10px] text-slate-500">₹{worker.hourlyRateINR}/hr • {worker.distanceKm} km</span>
                  </div>
                </div>
                <button
                  onClick={() => quickBookWorker(worker.id)}
                  className="py-1.5 px-3 rounded-xl bg-blue-800 text-white font-bold text-xs"
                >
                  {t('bookNowBtn')}
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              {t('noWorkersFound')}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 4-Column Category Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Browse Categories
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md transition-shadow ${cat.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold opacity-80">{cat.count}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{cat.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Verified local pros</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Rated Nearby Feature Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Top Rated Specialists Nearby</span>
              </h3>
            </div>

            <div className="space-y-3">
              {topRated.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group"
                >
                  <div className="h-28 relative bg-slate-800">
                    <Image
                      src={worker.avatarUrl}
                      alt={worker.fullName}
                      fill
                      className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    
                    {/* Distance Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{worker.distanceKm} km away</span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 text-white">
                      <h4 className="font-bold text-sm leading-none text-white">{worker.fullName}</h4>
                      <p className="text-[11px] text-blue-200 font-medium mt-0.5">{worker.tradeCategory}</p>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between bg-white">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1 text-xs text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{worker.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({worker.reviewsCount} reviews)</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">
                        ₹{worker.hourlyRateINR} <span className="text-[10px] text-slate-500 font-normal">/ hour</span>
                      </span>
                    </div>

                    <button
                      onClick={() => quickBookWorker(worker.id)}
                      className="py-2 px-4 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('bookNowBtn')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
