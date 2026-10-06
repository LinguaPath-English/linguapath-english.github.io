# LinguaPath

Writing practice: all 300 writing lessons include guided tasks, practice word targets, a separate knowledge check, focus examples, and self-reviewed revisions. Original drafts and latest revisions sync with each account and appear in Profile → My writing portfolio and in teacher reports. Self-review and knowledge-check scores are not teacher grades or automated assessments of free writing. Existing progress is preserved. Run `node tests/writing.cjs` for task coverage and portfolio merge checks.

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
