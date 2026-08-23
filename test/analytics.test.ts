import { describe, it, expect } from "vitest";

describe("Analytics & Spike Detection Logic", () => {
  function computeSpike(currentCount: number, baselineAverage: number) {
    let changePercent = 0;
    if (baselineAverage > 0) {
      changePercent = Number((((currentCount - baselineAverage) / baselineAverage) * 100).toFixed(1));
    } else if (currentCount > 0) {
      changePercent = currentCount * 100;
    }

    const isSpike = changePercent >= 100 && currentCount >= 3;
    return { changePercent, isSpike };
  }

  it("should flag a spike when volume surges by >= 100% and meets minimum sample threshold", () => {
    // 14 mentions vs 4.0 baseline avg -> +250% surge
    const result = computeSpike(14, 4.0);
    expect(result.changePercent).toBe(250.0);
    expect(result.isSpike).toBe(true);
  });

  it("should not flag small sample anomalies as spikes (e.g. 1 vs 0.2)", () => {
    // 2 mentions vs 0.5 baseline -> +300% surge but sample count < 3
    const result = computeSpike(2, 0.5);
    expect(result.isSpike).toBe(false);
  });

  it("should not flag normal volume fluctuations (< 100% increase)", () => {
    // 6 mentions vs 5.0 baseline -> +20% surge
    const result = computeSpike(6, 5.0);
    expect(result.changePercent).toBe(20.0);
    expect(result.isSpike).toBe(false);
  });
});
