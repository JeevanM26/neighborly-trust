'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TradeCategory } from '../../lib/types';
import { MapBanner } from '../../components/MapBanner';
import { WorkerCard } from '../../components/WorkerCard';
import { Search, Sparkles, Filter } from 'lucide-react';

const TRADE_CATEGORIES: TradeCategory[] = [
  'All Trades',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painting/Repairs',
];

export default function HomePage() {
  const { workers, t } = useApp();
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory>('All Trades');

  const filteredWorkers = workers.filter((w) => {
    if (selectedTrade === 'All Trades') return true;
    return w.tradeCategory === selectedTrade;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Interactive Map Header Banner */}
      <MapBanner />

      {/* Main Feed Container */}
      <div className="px-4 space-y-4">
        {/* Horizontal Category Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-blue-800" />
              <span>Select Service Trade</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {filteredWorkers.length} available
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            {TRADE_CATEGORIES.map((trade) => {
              const isActive = selectedTrade === trade;
              return (
                <button
                  key={trade}
                  onClick={() => setSelectedTrade(trade)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-blue-800 text-white border-blue-800 shadow-md scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {trade === 'All Trades' ? t('allTrades') : trade}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Verified Local Specialists</span>
          </h2>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ● Live Updates
          </span>
        </div>

        {/* Specialists Feed */}
        {filteredWorkers.length > 0 ? (
          <div className="space-y-3">
            {filteredWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">{t('noWorkersFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
