import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, screenings, achievements } from "@/lib/db/schema";

export async function GET(req: Request) {
  try {
    const anonId = new URL(req.url).searchParams.get("anonId");
    if (!anonId) {
      return NextResponse.json({ error: "missing anonId" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.anonId, anonId))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        screenings: [],
        badges: [],
        totalPoints: 0,
        currentStreak: 0,
      });
    }

    const rows = await db
      .select({
        id: screenings.id,
        riskTier: screenings.riskTier,
        riskScore: screenings.riskScore,
        completedAt: screenings.completedAt,
      })
      .from(screenings)
      .where(eq(screenings.userId, user.id))
      .orderBy(desc(screenings.completedAt))
      .limit(50);

    const badges = await db
      .select({ badgeKey: achievements.badgeKey })
      .from(achievements)
      .where(eq(achievements.userId, user.id));

    return NextResponse.json({
      screenings: rows.filter((r) => r.completedAt !== null),
      badges: badges.map((b) => b.badgeKey),
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
    });
  } catch (err) {
    console.error("history fetch failed", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}