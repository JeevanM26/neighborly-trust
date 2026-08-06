import { describe, it, expect } from 'vitest';
import { calculateNetEarnings, PLATFORM_COMMISSION_RATE } from '../lib/types';

describe('Worker Commission & Net Payout Calculator', () => {
  it('calculates 8% commission and 92% net earnings correctly', () => {
    const result = calculateNetEarnings(1000);
    expect(result.gross).toBe(1000);
    expect(result.commission).toBe(80);
    expect(result.net).toBe(920);
  });

  it('handles custom amounts with exact precision', () => {
    const result = calculateNetEarnings(350);
    expect(result.commission).toBe(28);
    expect(result.net).toBe(322);
  });

  it('enforces 8% constant commission rate across all trades', () => {
    expect(PLATFORM_COMMISSION_RATE).toBe(0.08);
  });
});
