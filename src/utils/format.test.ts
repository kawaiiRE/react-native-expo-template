import { describe, expect, it } from 'vitest';

import { formatCount, formatPercent } from './format';

describe('format helpers', () => {
  it('pluralizes counts', () => {
    expect(formatCount(1, 'item')).toBe('1 item');
    expect(formatCount(2, 'item')).toBe('2 items');
  });

  it('bounds percentages', () => {
    expect(formatPercent(-1)).toBe('0%');
    expect(formatPercent(61.6)).toBe('62%');
    expect(formatPercent(101)).toBe('100%');
  });
});
