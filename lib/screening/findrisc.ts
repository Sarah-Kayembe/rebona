/**
 * FINDRISC, the Finnish Diabetes Risk Score.
 *
 * A validated questionnaire that estimates the chance of developing type 2
 * diabetes in the next 10 years from eight answers. Points and bands follow
 * the published instrument exactly:
 *
 *   Lindström J, Tuomilehto J. The Diabetes Risk Score: a practical tool to
 *   predict type 2 diabetes risk. Diabetes Care. 2003;26(3):725-731.
 *   https://doi.org/10.2337/diacare.26.3.725
 *
 * Unlike the lifestyle score in scoring.ts, these weights are not ours to
 * tune. Change them only to match the published form.
 *
 * It was developed in Finland. Studies in other populations, including
 * African ones, find it still separates higher and lower risk but less
 * precisely, so results are shown as an estimate, never a diagnosis.
 */

export type FamilyDiabetes = "none" | "extended" | "immediate";

export interface FindriscInput {
  age: number | null;
  sex: "female" | "male" | null;
  bmi: number | null;
  waistCm: number | null;
  /** At least 30 minutes of physical activity every day, at work or in leisure. */
  activeDaily: boolean | null;
  /** Eats vegetables, fruit or berries every day. */
  fruitVegDaily: boolean | null;
  /** Has ever taken blood pressure medication regularly. */
  bpMedication: boolean | null;
  /** Has ever been told their blood glucose was high (check-up, illness, pregnancy). */
  highGlucoseEver: boolean | null;
  /** extended = grandparent, aunt, uncle or first cousin; immediate = parent, sibling or child. */
  familyDiabetes: FamilyDiabetes | null;
}

export type FindriscBand = "low" | "slightly_elevated" | "moderate" | "high" | "very_high";

export interface FindriscResult {
  score: number;
  band: FindriscBand;
  /** Published estimate: about 1 in N people with this score develop type 2 diabetes within 10 years. */
  oneIn: number;
  points: Record<keyof Omit<FindriscInput, "sex">, number>;
}

export const FINDRISC_MAX = 26;

/** Score bands from the published form, inclusive lower bounds. */
export const FINDRISC_BANDS: { band: FindriscBand; min: number; oneIn: number }[] = [
  { band: "low", min: 0, oneIn: 100 },
  { band: "slightly_elevated", min: 7, oneIn: 25 },
  { band: "moderate", min: 12, oneIn: 6 },
  { band: "high", min: 15, oneIn: 3 },
  { band: "very_high", min: 21, oneIn: 2 },
];

export function agePoints(age: number): number {
  if (age >= 65) return 4;
  if (age >= 55) return 3;
  if (age >= 45) return 2;
  return 0;
}

export function bmiPoints(bmi: number): number {
  if (bmi >= 30) return 3;
  if (bmi >= 25) return 1;
  return 0;
}

export function waistPoints(waistCm: number, sex: "female" | "male"): number {
  const [lower, upper] = sex === "male" ? [94, 102] : [80, 88];
  if (waistCm > upper) return 4;
  if (waistCm >= lower) return 3;
  return 0;
}

export function bandFor(score: number): (typeof FINDRISC_BANDS)[number] {
  let found = FINDRISC_BANDS[0];
  for (const b of FINDRISC_BANDS) if (score >= b.min) found = b;
  return found;
}

/** Which answers are still needed before a score can be given. */
export function missingFindriscAnswers(input: FindriscInput): (keyof FindriscInput)[] {
  return (Object.keys(input) as (keyof FindriscInput)[]).filter((k) => input[k] === null);
}

/**
 * The FINDRISC score, or null if any answer is missing. A partial score
 * would read lower than the person's real risk, so none is given.
 */
export function scoreFindrisc(input: FindriscInput): FindriscResult | null {
  if (missingFindriscAnswers(input).length > 0) return null;
  const i = input as { [K in keyof FindriscInput]: NonNullable<FindriscInput[K]> };

  const points = {
    age: agePoints(i.age),
    bmi: bmiPoints(i.bmi),
    waistCm: waistPoints(i.waistCm, i.sex),
    activeDaily: i.activeDaily ? 0 : 2,
    fruitVegDaily: i.fruitVegDaily ? 0 : 1,
    bpMedication: i.bpMedication ? 2 : 0,
    highGlucoseEver: i.highGlucoseEver ? 5 : 0,
    familyDiabetes: { none: 0, extended: 3, immediate: 5 }[i.familyDiabetes],
  };

  const score = Object.values(points).reduce((a, b) => a + b, 0);
  const { band, oneIn } = bandFor(score);
  return { score, band, oneIn, points };
}
