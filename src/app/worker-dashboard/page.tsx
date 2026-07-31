'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  CheckCircle2,
  Star,
  Clock,
  Radio,
  MapPin,
  Check,
  X,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

export default function WorkerDashboardPage() {
  const { workers, bookings, t, toggleWorkerOnlineStatus, updateBookingStatus } = useApp();

  // Primary active worker profile (Jim Caldwell)
  const currentWorker = workers.find((w) => w.id === 'worker-1') || workers[0];
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const completedBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'accepted');

  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalINR, 3450);
  const totalJobs = completedBookings.length + 10; // pre-seeded + completed

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Header Profile Summary */}
      <div className="flex items-center justify-between bg-blue-900 text-white p-4 rounded-3xl shadow-md border border-blue-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg text-amber-300">
            JC
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">{currentWorker.fullName}</h2>
            <p className="text-xs text-blue-200">{currentWorker.tradeCategory} • Verified Pro</p>
          </div>
        </div>

        <span className="text-[11px] bg-blue-800 text-blue-100 font-bold px-3 py-1 rounded-full border border-blue-700">
          Worker Portal
        </span>
      </div>

      {/* Availability Status Toggle Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio
              className={`w-4 h-4 ${
                currentWorker.isOnline ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-900">
              {currentWorker.isOnline ? t('online') : t('offline')}
            </span>
          </div>

          {/* Interactive Toggle Switch */}
          <button
            onClick={() => toggleWorkerOnlineStatus(currentWorker.id)}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
              currentWorker.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                currentWorker.isOnline ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug">
          {t('workerStatusHeading')}
        </p>
      </div>

      {/* 3-Card Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Today's Earnings */}
        <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200/80 text-center space-y-1">
          <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
            <DollarSign className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">{t('todaysEarnings')}</span>
          <span className="text-sm font-black text-blue-900 block">₹{totalEarnings}</span>
        </div>

        {/* Jobs Completed */}
        <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/80 text-center space-y-1">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">{t('jobsCompleted')}</span>
          <span className="text-sm font-black text-emerald-900 block">{totalJobs}</span>
        </div>

        {/* Current Rating */}
        <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 text-center space-y-1">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">{t('currentRating')}</span>
          <span className="text-sm font-black text-amber-900 block">{currentWorker.rating.toFixed(1)} ★</span>
        </div>
      </div>

      {/* Live Pending Job Requests Feed */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-blue-800" />
            <span>{t('pendingRequestsHeading')}</span>
          </h3>
          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
            {pendingBookings.length} pending
          </span>
        </div>

        {pendingBookings.length > 0 ? (
          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 border-2 border-blue-600/30 shadow-md space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {booking.serviceType}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{booking.customerName}</h4>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.distanceKm} km away • Requested at {booking.createdAt}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      ₹{booking.totalINR}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Payout Ready
                    </span>
                  </div>
                </div>

                {/* Accept / Decline Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'declined')}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('declineBtn')}</span>
                  </button>

                  <button
                    onClick={() => updateBookingStatus(booking.id, 'accepted')}
                    className="py-2.5 px-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>{t('acceptJobBtn')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 space-y-2">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No pending job requests right now.</p>
          </div>
        )}
      </div>

      {/* Weekly Hours Logged Footer Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-800 text-blue-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">{t('weeklyHours')}</h4>
            <p className="text-[10px] text-slate-400">Current Week Log</p>
          </div>
        </div>
        <span className="text-base font-black text-amber-400 tracking-tight">38h 45m</span>
      </div>
    </div>
  );
}
