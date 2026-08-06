'use client';
import React from 'react';
import { useWorker } from '../../context/WorkerContext';
import { DollarSign, ShieldAlert, ArrowLeft, CheckCircle } from 'lucide-react';

export default function EarningsScreen({ onBack }: { onBack: () => void }) {
  const { payoutSummary, payouts } = useWorker();

  return (
    <div style={{ paddingBottom: 80 }} className="fade-in">
      <div style={{
        background: '#041B30', color: 'white', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Earnings & Weekly Ledger</h2>
      </div>

      <div style={{ padding: 16 }}>
        {/* Ledger Summary Box */}
        <div style={{
          background: 'linear-gradient(135deg, #0B3D66 0%, #041B30 100%)',
          color: 'white', borderRadius: 20, padding: 20, marginBottom: 20,
          boxShadow: '0 10px 25px rgba(11,61,102,0.3)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Net Earnings</span>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#34D399', margin: '4px 0 16px' }}>
            ₹{payoutSummary.net_payout.toFixed(2)}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14
          }}>
            <div>
              <span style={{ fontSize: 10, opacity: 0.7 }}>Gross Customer Bills</span>
              <div style={{ fontSize: 16, fontWeight: 800 }}>₹{payoutSummary.gross_earnings.toFixed(2)}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, color: '#FCA5A5' }}>Platform Fee (8%)</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FCA5A5' }}>-₹{payoutSummary.platform_commission.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{
          background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 12,
          padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <ShieldAlert size={20} color="#1D4ED8" />
          <p style={{ fontSize: 12, color: '#1E40AF', margin: 0, lineHeight: 1.4 }}>
            Payouts are deposited directly to your registered UPI/Bank Account every Monday. Neighborly Trust takes a flat 8% fee to cover platform security & customer matching.
          </p>
        </div>

        {/* Transaction History */}
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Completed Job Transactions</h3>
        {payouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#64748B', fontSize: 13 }}>
            No completed jobs yet. Complete jobs to start building your ledger!
          </div>
        ) : (
          payouts.map(rec => (
            <div
              key={rec.id}
              style={{
                background: 'white', borderRadius: 14, padding: 14, marginBottom: 10,
                border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{rec.customer_name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{rec.service_type} • {rec.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#10B981' }}>+₹{rec.net_amount}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Gross ₹{rec.gross_amount} (-₹{rec.commission_amount} fee)</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
