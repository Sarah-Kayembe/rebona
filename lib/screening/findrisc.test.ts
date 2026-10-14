import { describe, expect, it } from "vitest";
import {
  FINDRISC_MAX,
  agePoints,
  bandFor,
  bmiPoints,
  missingFindriscAnswers,
  scoreFindrisc,
  waistPoints,
  type FindriscInput,
} from "./findrisc";

// Expected values below come from the published FINDRISC form
// (Lindström & Tuomilehto, Diabetes Care 2003).

const lowestRisk: FindriscInput = {
  age: 30,
  sex: "female",
  bmi: 22,
  waistCm: 70,
  activeDaily: true,
  fruitVegDaily: true,
  bpMedication: false,
  highGlucoseEver: false,
  familyDiabetes: "none",
};

describe("FINDRISC item points", () => {
  it("scores age as under 45, 45-54, 55-64 and 65+", () => {
    expect([44, 45, 54, 55, 64, 65, 80].map(agePoints)).toEqual([0, 2, 2, 3, 3, 4, 4]);
  });

  it("scores BMI as under 25, 25-30 and over 30", () => {
    expect([24.9, 25, 29.9, 30, 41].map(bmiPoints)).toEqual([0, 1, 1, 3, 3]);
  });

  it("uses the male waist cut-offs of 94 and 102 cm", () => {
    expect([93, 94, 102, 103].map((w) => waistPoints(w, "male"))).toEqual([0, 3, 3, 4]);
  });

  it("uses the female waist cut-offs of 80 and 88 cm", () => {
    expect([79, 80, 88, 89].map((w) => waistPoints(w, "female"))).toEqual([0, 3, 3, 4]);
  });
});

describe("FINDRISC bands", () => {
  it("matches the published score ranges and risk estimates", () => {
    const cases: [number, string, number][] = [
      [0, "low", 100],
      [6, "low", 100],
      [7, "slightly_elevated", 25],
      [11, "slightly_elevated", 25],
      [12, "moderate", 6],
      [14, "moderate", 6],
      [15, "high", 3],
      [20, "high", 3],
      [21, "very_high", 2],
      [26, "very_high", 2],
    ];
    for (const [score, band, oneIn] of cases) {
      expect(bandFor(score), `score ${score}`).toMatchObject({ band, oneIn });
    }
  });
});

describe("scoreFindrisc", () => {
  it("scores the lowest-risk answers as 0", () => {
    expect(scoreFindrisc(lowestRisk)).toMatchObject({ score: 0, band: "low" });
  });

  it("reaches the published maximum of 26 with every risk factor", () => {
    const result = scoreFindrisc({
      age: 70,
      sex: "male",
      bmi: 33,
      waistCm: 110,
      activeDaily: false,
      fruitVegDaily: false,
      bpMedication: true,
      highGlucoseEver: true,
      familyDiabetes: "immediate",
    });
    expect(result?.score).toBe(FINDRISC_MAX);
    expect(result?.band).toBe("very_high");
  });

  it("adds each item's points for a worked example", () => {
    // 58 (3) + BMI 27 (1) + woman, waist 85 cm (3) + not active daily (2)
    // + fruit daily (0) + no BP meds (0) + never high glucose (0)
    // + aunt with diabetes (3) = 12, moderate
    const result = scoreFindrisc({
      ...lowestRisk,
      age: 58,
      bmi: 27,
      waistCm: 85,
      activeDaily: false,
      familyDiabetes: "extended",
    });
    expect(result?.score).toBe(12);
    expect(result?.band).toBe("moderate");
    expect(result?.points).toEqual({
      age: 3,
      bmi: 1,
      waistCm: 3,
      activeDaily: 2,
      fruitVegDaily: 0,
      bpMedication: 0,
      highGlucoseEver: 0,
      familyDiabetes: 3,
    });
  });

  it("gives 5 points for past high blood glucose and for a parent, sibling or child with diabetes", () => {
    expect(scoreFindrisc({ ...lowestRisk, highGlucoseEver: true })?.score).toBe(5);
    expect(scoreFindrisc({ ...lowestRisk, familyDiabetes: "immediate" })?.score).toBe(5);
  });

  it("gives no score until every answer is in", () => {
    const partial = { ...lowestRisk, waistCm: null, sex: null };
    expect(scoreFindrisc(partial)).toBeNull();
    expect(missingFindriscAnswers(partial).sort()).toEqual(["sex", "waistCm"]);
  });
});
