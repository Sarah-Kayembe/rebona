# ReBona

**A free, anonymous health screening that helps people understand their risk for high blood pressure, type 2 diabetes and heart disease, and know when to visit a clinic.**

[**Try it live → rebona.vercel.app**](https://rebona.vercel.app)

<table>
<tr>
<td width="33%"><img src="docs/screenshots/home.png" alt="ReBona home screen with a language toggle and a reminder that it is a screening aid, not a diagnosis"></td>
<td width="33%"><img src="docs/screenshots/screening.png" alt="A screening question asking whether the person currently smokes, with a progress bar"></td>
<td width="33%"><img src="docs/screenshots/results.png" alt="Results screen showing a risk score, body mass index, and a breakdown of which answers contributed"></td>
</tr>
<tr>
<td align="center">Start a screening</td>
<td align="center">One question at a time</td>
<td align="center">See exactly what raised your score</td>
</tr>
</table>

## Why it exists

Chronic diseases like hypertension and diabetes often build up quietly for years before anyone notices. ReBona asks a short set of everyday questions about tobacco, alcohol, diet, activity, family history and symptoms, then explains what the answers mean in plain language and points the person toward a clinic. It is a screening aid, not a diagnosis.

## What it does

- **Short, guided questionnaire.** About 14 questions adapted from the WHO STEPwise approach to chronic disease risk factor surveillance (STEPS). Follow-up questions only appear when they are relevant, and height, weight and blood pressure are optional.
- **Scoring you can explain.** Risk is calculated with transparent rules rather than a black-box model. Every point traces back to a specific answer, and the results screen shows each contribution so a person (or a clinician) can see why the score is what it is.
- **Urgent flags.** Some answers, like a very high blood pressure reading or a cluster of warning symptoms, flag the result as urgent no matter the overall score.
- **Private by design.** No name, phone number or email. A random ID stored on the device is the only link between a person and their past screenings.
- **Reasons to come back.** Points, streaks and badges for repeat screenings, plus a history page to track how answers change over time.
- **Built for more than one language.** Every piece of text runs through translation files, and the English and Setswana toggle is already in place. The Setswana translation is in progress, so the app shows English until it lands.

## How the scoring works

| Score | Result |
|---|---|
| 0 to 9 | Low risk |
| 10 to 19 | Moderate risk |
| 20 and above | High risk |

The weights sit right beside each answer option in [`lib/screening/questions.ts`](lib/screening/questions.ts), so tuning the screening is a data change rather than a code change. The scoring engine in [`lib/screening/scoring.ts`](lib/screening/scoring.ts) is made of pure functions with no database or network calls, which keeps it easy to test and reason about.

## Tech stack

Next.js · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Vercel

## Run it locally

You need Node.js 20 or newer and a PostgreSQL database.

```bash
git clone https://github.com/Sarah-Kayembe/rebona.git
cd rebona
npm install
```

Create a `.env.local` file with your database connection strings. The app uses `DATABASE_URL`, and migrations use `DIRECT_URL`. For a local database they can be the same.

```bash
DATABASE_URL=postgres://user:password@localhost:5432/rebona
DIRECT_URL=postgres://user:password@localhost:5432/rebona
```

Create the tables, then start the app.

```bash
npx drizzle-kit migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run the tests

The scoring engine has unit tests that check every rule: the points for each answer, the risk tiers, BMI, the urgent flags and which follow-up questions count.

```bash
npm test
```

## Project structure

```
app/
  page.tsx            Home screen and language toggle
  onboarding/         Age, sex and region
  screening/          The questionnaire, one question per screen
  results/            Score, breakdown and next steps
  history/            Past screenings for this device
  api/                Saves screenings and loads history
lib/
  screening/          Questions, scoring rules and session storage
  db/                 Database schema and connection
  i18n.ts             Translation lookup
messages/             Translation files
```

## What's next

- Finish the Setswana translation
- Export results in FHIR format so they could be shared with a clinic system

## A note on health information

ReBona does not diagnose any condition. Whatever the result, a visit to a clinic is the only way to know for certain.

---

Built by [Sarah Kayembe](https://github.com/Sarah-Kayembe)
