import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const localeEnum = pgEnum("locale", ["en", "tn"]);
export const sexEnum = pgEnum("sex", ["female", "male", "prefer_not_to_say"]);
export const riskTierEnum = pgEnum("risk_tier", ["low", "moderate", "high"]);

/**
 * Guest-first. No name, no email, no phone.
 * `anonId` is a client-generated UUID held in localStorage, which is the only
 * thing linking a device to its screening history. Nothing here identifies a
 * person, which keeps the surface small if this is ever deployed for real.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonId: text("anon_id").notNull(),
    age: integer("age"),
    sex: sexEnum("sex"),
    region: text("region"),
    locale: localeEnum("locale").notNull().default("en"),
    totalPoints: integer("total_points").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastScreeningAt: timestamp("last_screening_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    anonIdIdx: uniqueIndex("users_anon_id_idx").on(t.anonId),
  })
);

/**
 * One row per screening attempt. `completedAt` stays null for abandoned runs,
 * which is worth keeping rather than deleting: drop-off by question is the
 * most useful thing this table can tell you later.
 */
export const screenings = pgTable(
  "screenings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    riskTier: riskTierEnum("risk_tier"),
    riskScore: integer("risk_score"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("screenings_user_idx").on(t.userId, t.startedAt),
  })
);

/**
 * `value` is jsonb because single-select stores a string, multi-select an
 * array, and numeric a number. Storing the raw answer rather than the derived
 * points means scoring rules can change without invalidating old screenings.
 */
export const responses = pgTable(
  "responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    screeningId: uuid("screening_id")
      .notNull()
      .references(() => screenings.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    value: jsonb("value").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    screeningIdx: index("responses_screening_idx").on(t.screeningId),
    uniquePerScreening: uniqueIndex("responses_unique_idx").on(
      t.screeningId,
      t.questionId
    ),
  })
);

/**
 * Badge definitions live in code, not here. This table only records that a
 * given user earned a given badge key, so adding badges never needs a migration.
 */
export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeKey: text("badge_key").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniquePerUser: uniqueIndex("achievements_unique_idx").on(
      t.userId,
      t.badgeKey
    ),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Screening = typeof screenings.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
