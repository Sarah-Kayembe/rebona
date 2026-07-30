import {
  QUESTIONS,
  RISK_TIERS,
  URGENT_REFERRAL_RULES,
  type Question,
} from "./questions";

/**
 * Risk scoring.
 *
 * Deliberately rule-based rather than learned. The weights come from published
 * NCD risk factor guidance, every point is traceable to a specific answer, and
 * the whole thing is explainable to a person in one screen. A model here would
 * be less accurate on this input, impossible to justify to a clinician, and
 * would need training data that does not exist for this population.
 *
 * Every function below is pure. No database, no fetch, no clock. That is what
 * makes the test suite meaningful.
 */

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

export type RiskTier = "low" | "moderate" | "high";

export interface Contribution {
  questionId: string;
  points: number;
  /** i18n key explaining why these points were added, shown on the results screen. */
  reasonKey: string;
}

export interface ScoreResult {
  score: number;
  tier: RiskTier;
  contributions: Contribution[];
  bmi: number | null;
  /** True when an answer warrants prompt clinical contact regardless of tier. */
  urgent: boolean;
  urgentReasonKeys: string[];
}

export interface Demographics {
  age?: number | null;
  sex?: string | null;
}

const NONE_KEYS = new Set(["none", "never"]);

function ageContribution(age: number | null | undefined): Contribution | null {
  if (age == null) return null;
  let points = 0;
  if (age >= 60) points = 3;
  else if (age >= 50) points = 2;
  else if (age >= 40) points = 1;
  if (points === 0) return null;
  return { questionId: "age", points, reasonKey: "reason.age" };
}

export function computeBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined
): number | null {
  if (!heightCm || !weightKg) return null;
  if (heightCm < 100 || heightCm > 230) return null;
  if (weightKg < 25 || weightKg > 250) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

function bmiContribution(bmi: number | null): Contribution | null {
  if (bmi == null) return null;
  let points = 0;
  if (bmi >= 35) points = 4;
  else if (bmi >= 30) points = 3;
  else if (bmi >= 25) points = 2;
  if (points === 0) return null;
  return { questionId: "bmi", points, reasonKey: "reason.bmi" };
}

function scoreSingle(q: Question, value: AnswerValue): number {
  if (typeof value !== "string" || !q.options) return 0;
  return q.options.find((o) => o.key === value)?.points ?? 0;
}

/**
 * A "none" selection wins outright. Without this, a person who taps "none"
 * alongside a real condition scores as though both were true.
 */
function scoreMulti(q: Question, value: AnswerValue): number {
  if (!Array.isArray(value) || !q.options) return 0;
  if (value.some((v) => NONE_KEYS.has(v))) return 0;
  return value.reduce((sum, key) => {
    return sum + (q.options!.find((o) => o.key === key)?.points ?? 0);
  }, 0);
}

function scoreNumeric(q: Question, value: AnswerValue): number {
  if (typeof value !== "number" || !q.ranges) return 0;
  const band = q.ranges.find((r) => value >= r.min && value <= r.max);
  return band?.points ?? 0;
}

function isVisible(q: Question, answers: Answers): boolean {
  if (!q.dependsOn) return true;
  const { questionId, equals, notEquals } = q.dependsOn;
  const actual = answers[questionId];
  if (notEquals !== undefined) return actual !== notEquals;
  return actual === equals;
}

export function tierFor(score: number): RiskTier {
  let tier: RiskTier = "low";
  for (const t of RISK_TIERS) {
    if (score >= t.min) tier = t.tier;
  }
  return tier;
}

function urgentFlags(answers: Answers): string[] {
  const reasons: string[] = [];

  const systolic = answers["bp_systolic"];
  if (
    typeof systolic === "number" &&
    systolic >= URGENT_REFERRAL_RULES.systolicAtOrAbove
  ) {
    reasons.push("urgent.systolic");
  }

  const symptoms = answers["symptoms_recent"];
  if (Array.isArray(symptoms)) {
    const real = symptoms.filter((s) => !NONE_KEYS.has(s));
    if (real.length >= 3) reasons.push("urgent.symptom_cluster");
  }

  return reasons;
}

export function scoreScreening(
  answers: Answers,
  demographics: Demographics = {}
): ScoreResult {
  const contributions: Contribution[] = [];

  for (const q of QUESTIONS) {
    if (!isVisible(q, answers)) continue;
    const value = answers[q.id];
    if (value === undefined || value === null || value === "") continue;

    let points = 0;
    if (q.type === "single") points = scoreSingle(q, value);
    else if (q.type === "multi") points = scoreMulti(q, value);
    else points = scoreNumeric(q, value);

    if (points > 0) {
      contributions.push({
        questionId: q.id,
        points,
        reasonKey: `reason.${q.id}`,
      });
    }
  }

  const bmi = computeBmi(
    answers["height_cm"] as number | undefined,
    answers["weight_kg"] as number | undefined
  );

  const derived = [ageContribution(demographics.age), bmiContribution(bmi)];
  for (const c of derived) if (c) contributions.push(c);

  const score = contributions.reduce((sum, c) => sum + c.points, 0);
  const urgentReasonKeys = urgentFlags(answers);

  return {
    score,
    tier: tierFor(score),
    contributions: contributions.sort((a, b) => b.points - a.points),
    bmi,
    urgent: urgentReasonKeys.length > 0,
    urgentReasonKeys,
  };
}

/**
 * Completeness, shown as the progress bar and used to decide whether a result
 * is worth displaying at all. Optional questions are excluded from the
 * denominator so skipping measurements does not read as an unfinished form.
 */
export function completeness(answers: Answers): {
  answered: number;
  total: number;
  ratio: number;
} {
  const required = QUESTIONS.filter(
    (q) => !q.optional && isVisible(q, answers)
  );
  const answered = required.filter((q) => {
    const v = answers[q.id];
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;
  return {
    answered,
    total: required.length,
    ratio: required.length === 0 ? 0 : answered / required.length,
  };
}
