import { describe, expect, it } from "vitest";
import { scoreFindrisc } from "./findrisc";
import { findriscInputFromAnswers } from "./findriscAnswers";
import { visibleQuestions } from "./questions";
import { scoreScreening, completeness, type Answers } from "./scoring";

const diabetesAnswers: Answers = {
  height_cm: 160,
  weight_kg: 70, // BMI 27.3
  findrisc_waist_cm: 85,
  findrisc_active_daily: "no",
  findrisc_fruit_daily: "yes",
  findrisc_bp_meds: "no",
  findrisc_high_glucose: "no",
  findrisc_family_diabetes: "extended",
};

describe("findriscInputFromAnswers", () => {
  it("builds a complete FINDRISC input from the screening", () => {
    const input = findriscInputFromAnswers(diabetesAnswers, { age: 58, sex: "female" });
    expect(input).toEqual({
      age: 58,
      sex: "female",
      bmi: 27.3,
      waistCm: 85,
      activeDaily: false,
      fruitVegDaily: true,
      bpMedication: false,
      highGlucoseEver: false,
      familyDiabetes: "extended",
    });
    // Same worked example as the FINDRISC tests: 3 + 1 + 3 + 2 + 0 + 0 + 0 + 3
    expect(scoreFindrisc(input)?.score).toBe(12);
  });

  it("uses the chosen waist ranges when sex was not shared", () => {
    const input = findriscInputFromAnswers(
      { ...diabetesAnswers, findrisc_waist_ranges: "male" },
      { age: 58, sex: "prefer_not_to_say" }
    );
    expect(input.sex).toBe("male");
  });

  it("leaves skipped answers empty so no score is given", () => {
    const { findrisc_waist_cm: _skipped, ...rest } = diabetesAnswers;
    void _skipped;
    const input = findriscInputFromAnswers(rest, { age: 58, sex: "female" });
    expect(input.waistCm).toBeNull();
    expect(scoreFindrisc(input)).toBeNull();
  });
});

describe("diabetes questions in the screening", () => {
  it("asks for waist ranges only when sex was not shared", () => {
    const ids = (sex: string) => visibleQuestions({}, { sex }).map((q) => q.id);
    expect(ids("prefer_not_to_say")).toContain("findrisc_waist_ranges");
    expect(ids("female")).not.toContain("findrisc_waist_ranges");
    expect(ids("male")).not.toContain("findrisc_waist_ranges");
  });

  it("does not change the lifestyle score", () => {
    const base = scoreScreening({}, { age: 30, sex: "female" }).score;
    const withDiabetes = scoreScreening(
      { ...diabetesAnswers, findrisc_bp_meds: "yes", findrisc_high_glucose: "yes" },
      { age: 30, sex: "female" }
    );
    // Only the BMI from height and weight counts in the lifestyle score.
    expect(withDiabetes.score).toBe(base + 2);
  });

  it("counts the waist ranges question toward completeness only when it is asked", () => {
    const female = completeness({}, { sex: "female" }).total;
    const unshared = completeness({}, { sex: "prefer_not_to_say" }).total;
    expect(unshared).toBe(female + 1);
  });
});
