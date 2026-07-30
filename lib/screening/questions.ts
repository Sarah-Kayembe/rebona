/**
 * Screening question bank.
 *
 * Adapted from the WHO STEPwise approach to NCD risk factor surveillance
 * (STEPS), covering behavioural risk factors for hypertension, type 2 diabetes,
 * and cardiovascular disease.
 *
 * Two rules hold this file together:
 *
 * 1. No display strings. Every label is an i18n key resolved against
 *    messages/{locale}.json. Adding Setswana means adding messages/tn.json,
 *    not touching this file.
 * 2. Scoring weights live beside the options they belong to. The scoring
 *    engine sums weights and never hard-codes question ids, so tuning the
 *    instrument is a data change rather than a code change.
 *
 * This is a screening aid. It does not diagnose, and the results screen must
 * always route the person to a clinician.
 */

export type Section =
  | "tobacco"
  | "alcohol"
  | "diet"
  | "activity"
  | "history"
  | "measurements"
  | "symptoms";

export type QuestionType = "single" | "multi" | "numeric";

export interface Option {
  /** Stable identifier. Never reuse or renumber, old responses reference these. */
  key: string;
  /** Risk points contributed when selected. */
  points: number;
}

export interface Question {
  id: string;
  section: Section;
  type: QuestionType;
  /** i18n key for the question text. */
  labelKey: string;
  /** i18n key for optional helper text shown under the question. */
  helpKey?: string;
  options?: Option[];
  /** Numeric questions only. */
  min?: number;
  max?: number;
  unitKey?: string;
  /** Points applied when a numeric answer falls in a range, inclusive. */
  ranges?: { min: number; max: number; points: number }[];
  /** Skip this question unless the referenced answer matches. */
  dependsOn?: { questionId: string; equals?: string; notEquals?: string };
  /** Allow the person to move on without answering. */
  optional?: boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: "tobacco_current",
    section: "tobacco",
    type: "single",
    labelKey: "q.tobacco_current.label",
    options: [
      { key: "no", points: 0 },
      { key: "yes", points: 4 },
    ],
  },
  {
    id: "tobacco_frequency",
    section: "tobacco",
    type: "single",
    labelKey: "q.tobacco_frequency.label",
    dependsOn: { questionId: "tobacco_current", equals: "yes" },
    options: [
      { key: "occasionally", points: 1 },
      { key: "weekly", points: 2 },
      { key: "daily", points: 4 },
    ],
  },
  {
    id: "tobacco_past",
    section: "tobacco",
    type: "single",
    labelKey: "q.tobacco_past.label",
    dependsOn: { questionId: "tobacco_current", equals: "no" },
    options: [
      { key: "never", points: 0 },
      { key: "quit_over_year", points: 1 },
      { key: "quit_under_year", points: 2 },
    ],
  },
  {
    id: "alcohol_frequency",
    section: "alcohol",
    type: "single",
    labelKey: "q.alcohol_frequency.label",
    options: [
      { key: "never", points: 0 },
      { key: "monthly", points: 1 },
      { key: "weekly", points: 2 },
      { key: "daily", points: 4 },
    ],
  },
  {
    id: "alcohol_heavy",
    section: "alcohol",
    type: "single",
    labelKey: "q.alcohol_heavy.label",
    helpKey: "q.alcohol_heavy.help",
    dependsOn: { questionId: "alcohol_frequency", notEquals: "never" },
    options: [
      { key: "never", points: 0 },
      { key: "sometimes", points: 2 },
      { key: "often", points: 3 },
    ],
  },
  {
    id: "diet_fruit_veg",
    section: "diet",
    type: "single",
    labelKey: "q.diet_fruit_veg.label",
    helpKey: "q.diet_fruit_veg.help",
    options: [
      { key: "five_plus", points: 0 },
      { key: "three_four", points: 1 },
      { key: "one_two", points: 2 },
      { key: "none", points: 3 },
    ],
  },
  {
    id: "diet_salt",
    section: "diet",
    type: "single",
    labelKey: "q.diet_salt.label",
    options: [
      { key: "never", points: 0 },
      { key: "sometimes", points: 1 },
      { key: "often", points: 2 },
      { key: "always", points: 3 },
    ],
  },
  {
    id: "diet_processed",
    section: "diet",
    type: "single",
    labelKey: "q.diet_processed.label",
    options: [
      { key: "rarely", points: 0 },
      { key: "weekly", points: 1 },
      { key: "several_weekly", points: 2 },
      { key: "daily", points: 3 },
    ],
  },
  {
    id: "activity_days",
    section: "activity",
    type: "single",
    labelKey: "q.activity_days.label",
    helpKey: "q.activity_days.help",
    options: [
      { key: "five_plus", points: 0 },
      { key: "three_four", points: 1 },
      { key: "one_two", points: 2 },
      { key: "none", points: 3 },
    ],
  },
  {
    id: "activity_sitting",
    section: "activity",
    type: "single",
    labelKey: "q.activity_sitting.label",
    options: [
      { key: "under_four", points: 0 },
      { key: "four_eight", points: 1 },
      { key: "over_eight", points: 2 },
    ],
  },
  {
    id: "history_family",
    section: "history",
    type: "multi",
    labelKey: "q.history_family.label",
    helpKey: "q.history_family.help",
    options: [
      { key: "diabetes", points: 2 },
      { key: "hypertension", points: 2 },
      { key: "heart_disease", points: 2 },
      { key: "stroke", points: 2 },
      { key: "none", points: 0 },
    ],
  },
  {
    id: "history_diagnosed",
    section: "history",
    type: "multi",
    labelKey: "q.history_diagnosed.label",
    options: [
      { key: "diabetes", points: 4 },
      { key: "hypertension", points: 4 },
      { key: "high_cholesterol", points: 3 },
      { key: "none", points: 0 },
    ],
  },
  {
    id: "bp_systolic",
    section: "measurements",
    type: "numeric",
    labelKey: "q.bp_systolic.label",
    helpKey: "q.bp_systolic.help",
    unitKey: "unit.mmhg",
    min: 70,
    max: 250,
    optional: true,
    ranges: [
      { min: 70, max: 119, points: 0 },
      { min: 120, max: 129, points: 1 },
      { min: 130, max: 139, points: 2 },
      { min: 140, max: 179, points: 4 },
      { min: 180, max: 250, points: 6 },
    ],
  },
  {
    id: "height_cm",
    section: "measurements",
    type: "numeric",
    labelKey: "q.height_cm.label",
    unitKey: "unit.cm",
    min: 100,
    max: 230,
    optional: true,
  },
  {
    id: "weight_kg",
    section: "measurements",
    type: "numeric",
    labelKey: "q.weight_kg.label",
    helpKey: "q.weight_kg.help",
    unitKey: "unit.kg",
    min: 25,
    max: 250,
    optional: true,
  },
  {
    id: "symptoms_recent",
    section: "symptoms",
    type: "multi",
    labelKey: "q.symptoms_recent.label",
    helpKey: "q.symptoms_recent.help",
    options: [
      { key: "excessive_thirst", points: 2 },
      { key: "frequent_urination", points: 2 },
      { key: "blurred_vision", points: 2 },
      { key: "numbness", points: 2 },
      { key: "slow_healing", points: 2 },
      { key: "none", points: 0 },
    ],
  },
];

/**
 * Symptom answers that should escalate regardless of total score. Chest pain
 * and shortness of breath are deliberately absent from the question bank and
 * handled by a separate urgent-care prompt, because a points total is the
 * wrong instrument for anything acute.
 */
export const URGENT_REFERRAL_RULES = {
  systolicAtOrAbove: 180,
  diagnosedUntreated: ["diabetes", "hypertension"],
} as const;

/** Tier thresholds, inclusive lower bound. Tune these against the eval set. */
export const RISK_TIERS = [
  { tier: "low" as const, min: 0 },
  { tier: "moderate" as const, min: 10 },
  { tier: "high" as const, min: 20 },
];

export const POINTS_PER_SCREENING = 50;

export function visibleQuestions(
  answers: Record<string, unknown>
): Question[] {
  return QUESTIONS.filter((q) => {
    if (!q.dependsOn) return true;
    return answers[q.dependsOn.questionId] === q.dependsOn.equals;
  });
}
