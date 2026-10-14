import { describe, expect, it } from "vitest";
import { QUESTIONS, RISK_TIERS } from "./questions";
import {
  completeness,
  computeBmi,
  scoreScreening,
  tierFor,
  type Answers,
} from "./scoring";

// A person with no risk factors at all.
const healthy: Answers = {
  tobacco_current: "no",
  tobacco_past: "never",
  alcohol_frequency: "never",
  diet_fruit_veg: "five_plus",
  diet_salt: "never",
  diet_processed: "rarely",
  activity_days: "five_plus",
  activity_sitting: "under_four",
  history_family: ["none"],
  history_diagnosed: ["none"],
  symptoms_recent: ["none"],
};

describe("question bank", () => {
  it("gives every question a unique id", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never reuses an option key within a question", () => {
    for (const q of QUESTIONS) {
      const keys = (q.options ?? []).map((o) => o.key);
      expect(new Set(keys).size, q.id).toBe(keys.length);
    }
  });

  it("covers every allowed number with exactly one scoring band", () => {
    for (const q of QUESTIONS.filter((q) => q.ranges)) {
      for (let v = q.min!; v <= q.max!; v++) {
        const bands = q.ranges!.filter((r) => v >= r.min && v <= r.max);
        expect(bands.length, `${q.id}=${v}`).toBe(1);
      }
    }
  });
});

describe("scoreScreening", () => {
  it("scores a person with no risk factors as zero and low risk", () => {
    const result = scoreScreening(healthy, { age: 25 });
    expect(result.score).toBe(0);
    expect(result.tier).toBe("low");
    expect(result.contributions).toEqual([]);
    expect(result.urgent).toBe(false);
  });

  it("adds the points of each risky answer and explains every one", () => {
    const result = scoreScreening(
      { ...healthy, tobacco_current: "yes", tobacco_frequency: "daily", diet_salt: "always" },
      { age: 25 }
    );
    // 4 for smoking, 4 for smoking daily, 3 for always adding salt
    expect(result.score).toBe(11);
    expect(result.tier).toBe("moderate");
    expect(result.contributions.map((c) => c.questionId).sort()).toEqual(
      ["diet_salt", "tobacco_current", "tobacco_frequency"]
    );
    expect(result.contributions[0].points).toBeGreaterThanOrEqual(
      result.contributions.at(-1)!.points
    );
  });

  it("ignores answers to follow-up questions that should be hidden", () => {
    // tobacco_frequency only applies to current smokers.
    const result = scoreScreening({ ...healthy, tobacco_frequency: "daily" });
    expect(result.score).toBe(0);
  });

  it("lets 'none' win over anything else picked with it", () => {
    const result = scoreScreening({ ...healthy, history_family: ["none", "diabetes"] });
    expect(result.score).toBe(0);
  });

  it("adds every family history condition picked", () => {
    const result = scoreScreening({ ...healthy, history_family: ["diabetes", "stroke"] });
    expect(result.score).toBe(4);
  });

  it("adds points for age bands from onboarding", () => {
    expect(scoreScreening(healthy, { age: 39 }).score).toBe(0);
    expect(scoreScreening(healthy, { age: 40 }).score).toBe(1);
    expect(scoreScreening(healthy, { age: 50 }).score).toBe(2);
    expect(scoreScreening(healthy, { age: 60 }).score).toBe(3);
  });

  it("adds BMI points when height and weight are given", () => {
    const result = scoreScreening({ ...healthy, height_cm: 170, weight_kg: 90 });
    expect(result.bmi).toBe(31.1);
    expect(result.score).toBe(3);
  });

  it("scores blood pressure by band", () => {
    expect(scoreScreening({ ...healthy, bp_systolic: 118 }).score).toBe(0);
    expect(scoreScreening({ ...healthy, bp_systolic: 135 }).score).toBe(2);
    expect(scoreScreening({ ...healthy, bp_systolic: 150 }).score).toBe(4);
  });

  it("flags a systolic reading of 180 or more as urgent whatever the score", () => {
    const result = scoreScreening({ ...healthy, bp_systolic: 180 });
    expect(result.urgent).toBe(true);
    expect(result.urgentReasonKeys).toContain("urgent.systolic");
  });

  it("flags three or more warning symptoms as urgent", () => {
    const two = scoreScreening({ ...healthy, symptoms_recent: ["blurred_vision", "numbness"] });
    const three = scoreScreening({
      ...healthy,
      symptoms_recent: ["blurred_vision", "numbness", "slow_healing"],
    });
    expect(two.urgent).toBe(false);
    expect(three.urgent).toBe(true);
    expect(three.urgentReasonKeys).toContain("urgent.symptom_cluster");
  });

  it("reaches high risk for someone with several serious risk factors", () => {
    const result = scoreScreening(
      {
        ...healthy,
        tobacco_current: "yes",
        tobacco_frequency: "daily",
        history_diagnosed: ["hypertension", "high_cholesterol"],
        activity_days: "none",
      },
      { age: 62 }
    );
    expect(result.score).toBe(4 + 4 + 4 + 3 + 3 + 3);
    expect(result.tier).toBe("high");
  });
});

describe("tierFor", () => {
  it("uses the inclusive lower bound of each tier", () => {
    for (const t of RISK_TIERS) expect(tierFor(t.min)).toBe(t.tier);
    expect(tierFor(9)).toBe("low");
    expect(tierFor(19)).toBe("moderate");
  });
});

describe("computeBmi", () => {
  it("rounds to one decimal place", () => {
    expect(computeBmi(180, 75)).toBe(23.1);
  });

  it("ignores missing or impossible measurements", () => {
    expect(computeBmi(null, 70)).toBeNull();
    expect(computeBmi(170, undefined)).toBeNull();
    expect(computeBmi(50, 70)).toBeNull();
    expect(computeBmi(170, 400)).toBeNull();
  });
});

describe("completeness", () => {
  it("counts only required questions that apply to this person", () => {
    const { answered, total, ratio } = completeness(healthy);
    expect(answered).toBe(total);
    expect(ratio).toBe(1);
  });

  it("treats an empty multi-select as unanswered", () => {
    const { answered, total } = completeness({ ...healthy, symptoms_recent: [] });
    expect(answered).toBe(total - 1);
  });

  it("does not count skipped optional measurements against the person", () => {
    const withMeasurements = completeness({ ...healthy, bp_systolic: 120 });
    expect(withMeasurements.total).toBe(completeness(healthy).total);
  });
});

describe("heavy drinking", () => {
  it("counts toward the score for people who drink", () => {
    const result = scoreScreening({
      ...healthy,
      alcohol_frequency: "weekly",
      alcohol_heavy: "often",
    });
    // 2 for drinking weekly, 3 for often drinking heavily
    expect(result.score).toBe(5);
  });
});
