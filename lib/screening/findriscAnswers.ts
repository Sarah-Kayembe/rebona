import type { FamilyDiabetes, FindriscInput } from "./findrisc";
import { computeBmi, type Answers } from "./scoring";

const yesNo = (value: unknown): boolean | null =>
  value === "yes" ? true : value === "no" ? false : null;

/**
 * Turn screening answers and onboarding details into FINDRISC inputs.
 * Anything not answered comes back as null, which scoreFindrisc treats as
 * "not enough to score yet".
 */
export function findriscInputFromAnswers(
  answers: Answers,
  demographics: { age?: number | null; sex?: string | null }
): FindriscInput {
  const sex =
    demographics.sex === "female" || demographics.sex === "male"
      ? demographics.sex
      : answers["findrisc_waist_ranges"] === "female" ||
          answers["findrisc_waist_ranges"] === "male"
        ? (answers["findrisc_waist_ranges"] as "female" | "male")
        : null;

  const waist = answers["findrisc_waist_cm"];
  const family = answers["findrisc_family_diabetes"];

  return {
    age: demographics.age ?? null,
    sex,
    bmi: computeBmi(
      answers["height_cm"] as number | undefined,
      answers["weight_kg"] as number | undefined
    ),
    waistCm: typeof waist === "number" ? waist : null,
    activeDaily: yesNo(answers["findrisc_active_daily"]),
    fruitVegDaily: yesNo(answers["findrisc_fruit_daily"]),
    bpMedication: yesNo(answers["findrisc_bp_meds"]),
    highGlucoseEver: yesNo(answers["findrisc_high_glucose"]),
    familyDiabetes:
      family === "none" || family === "extended" || family === "immediate"
        ? (family as FamilyDiabetes)
        : null,
  };
}
