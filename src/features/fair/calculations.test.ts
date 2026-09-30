import { describe, expect, it } from 'vitest';
import { calculateFairDistribution } from './calculations';
import { DEFAULT_REGIONS } from './constants';

describe('FAIR engine parity', () => {
  it('matches the legacy FAIR output for WS 2026/27', () => {
    const result = calculateFairDistribution(DEFAULT_REGIONS);
    const expected = [
      ['Osttirol', 12.863677072071573, 5634.572348654898],
      ['3 Zinnen Dolomites', 43.49475920380607, 15076.04965282739],
      ["Cortina d'Ampezzo", 1.1375314639503877, 1877.3016511060341],
      ['Comelico', 1.4632665287818907, 2248.650417297863],
      ['Gsiesertal / Welsberg / Taisten', 13.354881674133367, 6358.07847988619],
      ['Antholzertal', 10.37088229701418, 5399.233821266296],
      ['Ahrntal / Sand in Taufers', 6.125993246105032, 3483.5519883543134],
      ['Seiser Alm / Val Gardena', 11.1890085141375, 4922.561640607015],
    ] as const;

    expect(result).toHaveLength(expected.length);
    result.forEach((row, index) => {
      expect(row.name).toBe(expected[index][0]);
      expect(row.score).toBeCloseTo(expected[index][1], 10);
      expect(row.varFee).toBeCloseTo(expected[index][2], 8);
    });
    expect(result.reduce((sum, row) => sum + row.varFee, 0)).toBeCloseTo(45000, 8);
    expect(result.reduce((sum, row) => sum + row.score, 0)).toBeCloseTo(100, 10);
  });

  it('keeps the legacy zero guards finite', () => {
    const zeroed = DEFAULT_REGIONS.map(r => ({ ...r, PN: 0, SW: 0, KP: 0, SA: 0 }));
    const result = calculateFairDistribution(zeroed);
    result.forEach(row => {
      expect(Number.isFinite(row.score)).toBe(true);
      expect(Number.isFinite(row.varFee)).toBe(true);
    });
  });
});
