'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, IndianRupee, Star, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../../lib/commission';

interface MockFeaturedProvider {
  id: string;
  name: string;
  category: string;
  featured: boolean;
}

export default function AdminPage() {
  const [totalCommission, setTotalCommission] = useState(1280.00); // ₹1,280 collected
  const [totalBookingsCount, setTotalBookingsCount] = useState(15);
  const [providers, setProviders] = useState<MockFeaturedProvider[]>([
    { id: '1', name: 'Jim Caldwell', category: 'Electrician', featured: true },
    { id: '2', name: 'Sarah Jenkins', category: 'Plumber', featured: true },
    { id: '3', name: 'Robert Evans', category: 'Carpenter', featured: false },
    { id: '4', name: 'Meena Kulkarni', category: 'Home Clean', featured: false },
  ]);

  const toggleFeatured = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-slate-900 text-white p-5 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <Link href="/" className="p-1 hover:bg-slate-800 rounded-lg">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="text-amber-400" /> Admin Monetization Dashboard
              </h1>
              <p className="text-xs text-slate-400">Neighborly Trust Platform Commission & Featured Subscriptions</p>
            </div>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full font-bold">
            Protected Admin Route
          </span>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-sm font-semibold">Total Platform Commission (8%)</span>
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-slate-900">{formatINR(totalCommission)}</p>
            <p className="text-xs text-slate-400 mt-1">Recorded automatically across {totalBookingsCount} completed jobs</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-sm font-semibold">Active Featured Providers</span>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">
              {providers.filter((p) => p.featured).length} <span className="text-sm font-normal text-slate-400">/ {providers.length}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Providers prioritized at equal distance in search results</p>
          </div>
        </div>

        {/* Featured Provider Listing Management */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Manage Featured Listing Status</h2>
          <div className="divide-y divide-slate-100">
            {providers.map((p) => (
              <div key={p.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                  <span className="text-xs text-slate-500">{p.category}</span>
                </div>

                <div className="flex items-center space-x-3">
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-600 text-amber-600" /> Featured Active
                    </span>
                  )}

                  <button
                    onClick={() => toggleFeatured(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      p.featured
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-blue-900 text-white hover:bg-blue-950 shadow-xs'
                    }`}
                  >
                    {p.featured ? 'Disable Featured' : 'Enable Featured'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
