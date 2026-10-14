# LinguaPath

Privacy & Help: `privacy.html` is public and linked from the student login, profile menu, and teacher page. It describes Supabase account/progress storage, local caches, teacher visibility, temporary microphone recordings, account-deletion requests, and common troubleshooting. Contact: Estebanthekillerx2@gmail.com. It uses system fonts and no JavaScript, tracking, or contact-form service. Review the notice when data handling or the contact address changes; it is a description of implemented behavior, not a legal-compliance certification.

Learning quality improvements: incorrect-answer feedback contrasts the selected answer with the correct choice and its explanation/source evidence. Corrected mistakes enter account-synced recall practice after 3 days; successful recalls return after 7, 15, then 30 days, and a missed recall returns after 1 day. Recall sessions are separate from lessons: they never move the saved lesson cursor, clear mandatory tier reviews, or award tier/daily/achievement credit. Reloading keeps answered recall schedules; unanswered recalls stay due. Existing mistakes enter scheduling when next answered, without inventing historical dates. No database migration is needed.

The teacher dashboard and CSV now show inactivity (7 days without recorded exercises), lowest skill completion (not a proficiency grade), delayed reviews due, and recurring question difficulties tracked since this release. Use “Show students needing attention” to filter. Save status explicitly warns before switching devices with unsynced changes. Resume buttons name the skill, mobile controls support larger text, and particles respond to live reduced-motion changes and pause in hidden tabs.

Run `node tests/learning-tools.cjs` and the existing regression tests. For safe browser checks, run `node tests/serve-qa.cjs` and open `http://127.0.0.1:8766/qa` or `/qa-teacher`; these use fictitious local data, not student accounts. Never use real credentials in QA fixtures.

Writing practice: all 300 lessons start with multiple-choice answers and include lesson-specific explanations and aligned optional writing prompts and examples. After checking an answer, students can continue immediately or open optional writing practice with a word counter, autosave, and save button. No draft or review checkboxes are required to continue. Original writing and latest revisions sync with each account and appear in Profile → My writing portfolio and in teacher reports. Quiz scores do not grade free writing. Existing progress is preserved. Run `node tests/writing.cjs` for task coverage, optional-writing flow, and portfolio merge checks.

Question-quality revision: 140 writing questions and 47 reading questions have revised prompts or choices. Writing Tier 3 now has 100 distinct tasks rather than 80 tasks with reordered duplicates. All 300 speaking lessons now have explicit communication goals, four complete answer choices, and specific explanations. Each tier practises 20 communication skills in five concrete contexts; advanced tasks focus on qualification, attribution, constraints, and negotiation rather than philosophical knowledge or agreement with a preferred belief. The authored source is `speaking-curriculum.cjs`; the site reads the resulting entries in `questions.json` with no extra runtime dependency. This is not an official exam-level calibration. Lesson IDs remain unchanged, and already-graded sessions keep their original question snapshot across bank updates. Run `node tests/question-quality.cjs` to check answer integrity, task coverage, stable IDs, answer-length cues, and graded-session compatibility.

LinguaPath is a lightweight English-practice website for Cambridge Linguaskill learners. It runs as a static site—there is no build step or package manager.

**Live site:** https://linguapath-english.github.io/

## Features

- Listening, Reading, Writing, and Speaking practice
- Tier progression based on correct answers
- Daily practice goal, streaks, review history, and achievements
- Daily motivational quotes and a randomized three-minute warm-up
- Light and dark themes, with a mouse-reactive particle background
- Email sign-in and cloud-synced student progress using Supabase

## Run locally

From the repository root, start a small local web server:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. A local server is recommended because the app loads its question and quote data from JSON files.

## Supabase setup

The site uses Supabase Auth and the `student_progress` table to keep each signed-in learner’s progress separate and available across devices.

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase.sql`](supabase.sql) to create the progress table and row-level security policies.
3. In `supabase-auth.js`, set `SUPABASE_URL` and `SUPABASE_KEY` to your project URL and **publishable** key.
4. Enable email sign-in in Supabase Auth. Configure the site URL and allowed redirect URLs for your deployed site (and `http://localhost:8000` for local testing). Password recovery uses the same site URL.
5. Deploy the site and test account creation, sign-in, sign-out, password recovery, and progress syncing.
6. For teacher access, after creating your teacher account, run this once in Supabase SQL Editor, replacing the email:

   ```sql
   insert into public.teacher_admins (user_id)
   select id from auth.users where lower(email) = lower('Estebanthekillerx2@gmail.com')
   on conflict (user_id) do nothing;
   ```

   Run [`teacher-delete.sql`](teacher-delete.sql) in the SQL Editor to enable the protected teacher dashboard functions on an existing project. Then open [`teacher.html`](teacher.html) and sign in with that account. The dashboard shows recent activity, supports CSV export, and can remove a student account after you type the student's email to confirm. Deleting an account removes its Supabase login and saved progress.

The publishable key is intended for browser use; database access is restricted by the row-level security policies. Never put a Supabase `service_role` or other secret key in this repository or in browser code.

## Quick checks

Run `node tests/smoke.cjs` to check save status, teacher controls, and answer feedback without touching real accounts.

Run `node tests/progress-sync.cjs` for concurrent-device saves, conflicting writes, offline reloads, retry deduplication, and reset protection. Progress saves use a persistent per-account outbox and conditional updates of the existing `student_progress` table; no additional SQL migration is needed.

## Deploy with GitHub Pages

The live site is served from the repository’s `main` branch. To publish changes, push or merge them to `main`, then check the repository’s **Settings → Pages** to confirm the Pages source is configured for the branch and root folder. GitHub Pages publishes the static files; no build command is needed.

## Project files

- `index.html` — page structure and content
- `style.css`, `liquid-navigation.css`, `achievements.css`, `ambient-background.css` — visual styles
- `script.js` — practice flow, navigation, profiles, and progress UI
- `questions.json` — exercise bank
- `quotes.json` — daily quote collection
- `achievements.js` — achievement tracking and display
- `supabase-auth.js` — Supabase authentication and cloud progress sync
- `sync-indicator.js` — visible save status and retry control
- `supabase.sql` — progress table and row-level security policies
- `teacher-delete.sql` — teacher-only progress access and account removal functions; run this in the SQL Editor after `supabase.sql`
- `teacher.html`, `teacher.js`, `teacher.css`, `teacher-upgrades.css` — protected teacher progress dashboard
