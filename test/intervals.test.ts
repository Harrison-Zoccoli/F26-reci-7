import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// Smaller endpoint first, so every interval has start <= end.
// Small range so intervals actually overlap, touch, and cross 10 / go negative.
const endpoint = fc.integer({ min: -15, max: 25 });
const interval: fc.Arbitrary<Interval> = fc
  .tuple(endpoint, endpoint)
  .map(([a, b]): Interval => (a <= b ? [a, b] : [b, a]));
const intervalList = fc.array(interval, { maxLength: 6 });

// Already sorted, and each next interval starts at least 1 past the previous end.
const disjointList: fc.Arbitrary<Interval[]> = fc
  .array(fc.tuple(fc.integer({ min: 1, max: 6 }), fc.integer({ min: 0, max: 6 })), { maxLength: 5 })
  .map(pieces => {
    const out: Interval[] = [];
    let cursor = 0;
    for (const [gap, length] of pieces) {
      const start = cursor + gap;
      out.push([start, start + length]);
      cursor = start + length;
    }
    return out;
  });

function covers(xs: readonly Interval[], p: number): boolean {
  return xs.some(([start, end]) => start <= p && p <= end);
}

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. The output is sorted and neighbors don't overlap or touch.
  it('returns sorted intervals that do not overlap or touch', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i < out.length; i++) {
          expect(out[i][0]).toBeLessThanOrEqual(out[i][1]);
          if (i > 0) expect(out[i - 1][1]).toBeLessThan(out[i][0]);
        }
      }),
    );
  });

  // Pattern: invariant. The input array and its intervals are left alone.
  it('does not modify the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = xs.map(([s, e]): Interval => [s, e]);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });

  // Pattern: differential. A point is covered by the input exactly when the output covers it.
  it('covers exactly the same points as the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const points = xs.flatMap(([s, e]) => [s, e, (s + e) / 2, e + 0.5]);
        for (const p of points) {
          expect(covers(out, p)).toBe(covers(xs, p));
        }
      }),
    );
  });

  // Pattern: metamorphic. Order does not matter.
  it('reversing the input does not change the output', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs].reverse())).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: algebraic. Merging an already merged list changes nothing.
  it('merging twice is the same as merging once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. Intervals that already don't overlap or touch come back unchanged.
  it('leaves already separate intervals unchanged', () => {
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
});
