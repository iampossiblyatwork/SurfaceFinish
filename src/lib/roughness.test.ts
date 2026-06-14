import { describe, it, expect } from "vitest";
import {
  computeParameters,
  centerProfile,
  materialRatioCurve,
  type Profile,
} from "./roughness";
import { generateProfile } from "./profile";
import { nearestGrade, fromMicrons, toMicrons } from "./grades";
import { FINISHES } from "../data/finishes";

/** Build a pure sine profile of amplitude A over `cycles` full periods. */
function sineProfile(amplitude: number, cycles: number, n = 4000): Profile {
  const z = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    z[i] = amplitude * Math.sin((i / n) * Math.PI * 2 * cycles);
  }
  return { z, dx: 1 };
}

describe("computeParameters on a pure sine wave", () => {
  const A = 3;
  const p = computeParameters(sineProfile(A, 10));

  it("Ra of a sine equals 2A/pi", () => {
    expect(p.Ra).toBeCloseTo((2 * A) / Math.PI, 2);
  });

  it("Rq of a sine equals A/sqrt(2)", () => {
    expect(p.Rq).toBeCloseTo(A / Math.SQRT2, 2);
  });

  it("Rp and Rv equal the amplitude", () => {
    expect(p.Rp).toBeCloseTo(A, 2);
    expect(p.Rv).toBeCloseTo(A, 2);
    expect(p.Rt).toBeCloseTo(2 * A, 2);
  });

  it("skewness of a symmetric sine is ~0", () => {
    expect(Math.abs(p.Rsk)).toBeLessThan(0.05);
  });

  it("kurtosis of a sine is ~1.5", () => {
    expect(p.Rku).toBeCloseTo(1.5, 1);
  });
});

describe("centerProfile", () => {
  it("removes the mean", () => {
    const c = centerProfile([1, 2, 3, 4]);
    const mean = c.reduce((a, b) => a + b, 0) / c.length;
    expect(mean).toBeCloseTo(0, 10);
  });
});

describe("generateProfile scaling", () => {
  it("produces a profile whose Ra matches the target", () => {
    const target = 1.6;
    const profile = generateProfile(
      target,
      {
        periodicWeight: 1,
        periodicCycles: 40,
        noiseWeight: 0.5,
        noiseSmoothing: 4,
      },
      12345,
    );
    const measured = computeParameters(profile).Ra;
    expect(measured).toBeCloseTo(target, 4);
  });

  it("is deterministic for a given seed", () => {
    const params = {
      periodicWeight: 1,
      periodicCycles: 20,
      noiseWeight: 0.5,
      noiseSmoothing: 3,
    };
    const a = generateProfile(0.8, params, 99);
    const b = generateProfile(0.8, params, 99);
    expect(a.z).toEqual(b.z);
  });
});

describe("materialRatioCurve", () => {
  it("starts near 0% material at the highest peak and reaches 100%", () => {
    const curve = materialRatioCurve(sineProfile(2, 10));
    expect(curve[0].mr).toBeLessThan(5);
    expect(curve[curve.length - 1].mr).toBeCloseTo(100, 0);
  });
});

describe("every finish in the dictionary", () => {
  it("generates a finite trace whose Ra matches its default, with finite parameters", () => {
    for (const finish of FINISHES) {
      const profile = generateProfile(finish.defaultRa, finish.genParams, 7);
      const p = computeParameters(profile);
      expect(p.Ra).toBeCloseTo(finish.defaultRa, 3);
      for (const value of Object.values(p)) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(finish.defaultRa).toBeGreaterThanOrEqual(finish.raMin);
      expect(finish.defaultRa).toBeLessThanOrEqual(finish.raMax);
    }
  });
});

describe("grades", () => {
  it("maps Ra values to the nearest ISO N-grade", () => {
    expect(nearestGrade(0.8).grade).toBe("N6");
    expect(nearestGrade(1.6).grade).toBe("N7");
    expect(nearestGrade(0.05).grade).toBe("N2");
  });

  it("round-trips µm <-> µin", () => {
    const original = 1.6;
    const asUin = fromMicrons(original, "uin");
    expect(toMicrons(asUin, "uin")).toBeCloseTo(original, 6);
  });
});
