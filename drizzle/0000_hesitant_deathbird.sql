CREATE TYPE "public"."locale" AS ENUM('en', 'tn');--> statement-breakpoint
CREATE TYPE "public"."risk_tier" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('female', 'male', 'prefer_not_to_say');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_key" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"value" jsonb NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screenings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"risk_tier" "risk_tier",
	"risk_score" integer,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anon_id" text NOT NULL,
	"age" integer,
	"sex" "sex",
	"region" text,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_screening_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_unique_idx" ON "achievements" USING btree ("user_id","badge_key");--> statement-breakpoint
CREATE INDEX "responses_screening_idx" ON "responses" USING btree ("screening_id");--> statement-breakpoint
CREATE UNIQUE INDEX "responses_unique_idx" ON "responses" USING btree ("screening_id","question_id");--> statement-breakpoint
CREATE INDEX "screenings_user_idx" ON "screenings" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_anon_id_idx" ON "users" USING btree ("anon_id");