import { describe, expect, it } from "vitest";
import { QUESTIONS, visibleQuestions } from "./questions";

const ids = (answers: Record<string, unknown>) =>
  visibleQuestions(answers).map((q) => q.id);

describe("visibleQuestions", () => {
  it("asks how often someone smokes only if they smoke now", () => {
    expect(ids({ tobacco_current: "yes" })).toContain("tobacco_frequency");
    expect(ids({ tobacco_current: "yes" })).not.toContain("tobacco_past");
    expect(ids({ tobacco_current: "no" })).toContain("tobacco_past");
    expect(ids({ tobacco_current: "no" })).not.toContain("tobacco_frequency");
  });

  // Regression: this question used notEquals, which visibleQuestions ignored,
  // so it was never shown and heavy drinking never counted toward the score.
  it("asks about heavy drinking for anyone who drinks", () => {
    expect(ids({ alcohol_frequency: "weekly" })).toContain("alcohol_heavy");
    expect(ids({ alcohol_frequency: "daily" })).toContain("alcohol_heavy");
  });

  it("skips the heavy drinking question for people who never drink", () => {
    expect(ids({ alcohol_frequency: "never" })).not.toContain("alcohol_heavy");
  });

  it("shows 15 lifestyle and 6 diabetes questions to a current smoker who drinks", () => {
    const shown = visibleQuestions(
      { tobacco_current: "yes", alcohol_frequency: "weekly" },
      { sex: "female" }
    );
    expect(shown.filter((q) => q.section !== "diabetes")).toHaveLength(15);
    expect(shown.filter((q) => q.section === "diabetes")).toHaveLength(6);
  });

  it("always shows questions without conditions", () => {
    const unconditional = QUESTIONS.filter((q) => !q.dependsOn && !q.onlyForSex).map(
      (q) => q.id
    );
    for (const id of unconditional) expect(ids({})).toContain(id);
  });
});
