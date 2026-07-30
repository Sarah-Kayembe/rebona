import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, screenings, responses, achievements } from "@/lib/db/schema";
import { scoreScreening, type Answers } from "@/lib/screening/scoring";
import { POINTS_PER_SCREENING, QUESTIONS } from "@/lib/screening/questions";

/**
 * Scoring happens here, not on the client. The client sends raw answers and
 * gets back a result it cannot influence, which keeps one source of truth and
 * means the scoring rules can change without shipping new frontend code.
 */

const DAY = 86_400_000;

function nextStreak(last: Date | null, current: number): number {
  if (!last) return 1;
  const gap = Date.now() - last.getTime();
  if (gap < DAY) return current;
  if (gap > 120 * DAY) return 1;
  return current + 1;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { anonId, locale, age, sex, region, answers } = body as {
      anonId: string;
      locale: "en" | "tn";
      age: number;
      sex: "female" | "male" | "prefer_not_to_say";
      region: string | null;
      answers: Answers;
    };

    if (!anonId || !answers) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const result = scoreScreening(answers, { age, sex });

    const [user] = await db
      .insert(users)
      .values({ anonId, age, sex, region, locale })
      .onConflictDoUpdate({
        target: users.anonId,
        set: { age, sex, region, locale },
      })
      .returning();

    const streak = nextStreak(user.lastScreeningAt, user.currentStreak);

    const [screening] = await db
      .insert(screenings)
      .values({
        userId: user.id,
        locale,
        riskTier: result.tier,
        riskScore: result.score,
        pointsAwarded: POINTS_PER_SCREENING,
        completedAt: new Date(),
      })
      .returning();

    const rows = Object.entries(answers)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([questionId, value]) => ({
        screeningId: screening.id,
        questionId,
        value,
      }));

    if (rows.length > 0) await db.insert(responses).values(rows);

    const totalPoints = user.totalPoints + POINTS_PER_SCREENING;

    await db
      .update(users)
      .set({
        totalPoints,
        currentStreak: streak,
        longestStreak: Math.max(user.longestStreak, streak),
        lastScreeningAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const past = await db
      .select({ id: screenings.id })
      .from(screenings)
      .where(eq(screenings.userId, user.id));

    const optionalIds = QUESTIONS.filter((q) => q.optional).map((q) => q.id);
    const earned: string[] = ["first_screening"];
    if (optionalIds.every((id) => answers[id] !== undefined))
      earned.push("full_profile");
    if (past.length >= 3) earned.push("three_screenings");
    if (streak >= 4) earned.push("month_streak");

    const inserted = await db
      .insert(achievements)
      .values(earned.map((badgeKey) => ({ userId: user.id, badgeKey })))
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({
      screeningId: screening.id,
      score: result.score,
      tier: result.tier,
      contributions: result.contributions,
      bmi: result.bmi,
      urgent: result.urgent,
      urgentReasonKeys: result.urgentReasonKeys,
      points: POINTS_PER_SCREENING,
      totalPoints,
      streak,
      newBadges: inserted.map((a) => a.badgeKey),
    });
  } catch (err) {
    console.error("screening save failed", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}