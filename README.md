# Nudge Together

A checklist web app for breaking big goals into small, dated steps — and keeping
each other accountable with friends.

**Stack:** React + Vite (frontend) · Supabase (login + Postgres database) · GitHub Pages (free hosting)

## Features (v1)

- Sign up / log in with email + password and a display name
- Create, edit, delete tasks with a **name**, **category** (Personal / School / Work),
  optional **priority** (color dot: red / amber / green) and optional **due date**
- Checkbox to mark complete; filter by category; hide/show finished tasks
- In-app reminder banner for tasks due today or in the next 2 days
- Friends: send requests by email (private lookup, emails aren't listed), accept/decline, remove
- "Show friends' tasks" switch + dropdown to view a friend's tasks (read-only) with a progress bar
- Mochi the cat: wanders the screen, eats a treat for every finished task, and gets sleepier or happier based on tasks done in the last 24 hours (tap for stats, 🐾 to hide)
- Live sync across devices (check a task on your phone, it updates on your laptop)
- Mobile-friendly layout, dark mode

## 1. Set up Supabase (one time, ~10 min)

1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), click **Run**.
3. Copy the **Project URL** (the **Connect** button or **Project Settings → Data API**) and the
   **Publishable key** (`sb_publishable_…`, under **Project Settings → API Keys**).
   **Never use the Secret key in this app** — it bypasses all security rules.
   (Already ran an older `schema.sql` that had usernames? Also run `supabase/migrations/002_display_name_only.sql`.)
4. (Optional, makes testing easier) **Authentication → Providers → Email**: turn off
   "Confirm email" so new accounts can log in immediately.
5. **Authentication → URL Configuration**: set Site URL to
   `https://<your-github-username>.github.io/nudge-together/` and add `http://localhost:5173` to redirect URLs.

## 2. Run it on your computer

Requires [Node.js 20+](https://nodejs.org).

```bash
npm install
cp .env.example .env.local   # then paste your URL + publishable key into .env.local
npm run dev
```

Open the URL it prints (usually <http://localhost:5173/nudge-together/>).
To try it on your phone, run `npm run dev -- --host` and open the "Network" URL on the same Wi-Fi.

## 3. Deploy to GitHub Pages

1. Push this project to a GitHub repo named **nudge-together**
   (if you use a different name, change `base` in `vite.config.js` to match).
2. Repo **Settings → Secrets and variables → Actions → New repository secret**: add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the Publishable key goes in this one).
3. Repo **Settings → Pages → Source: GitHub Actions**.
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes to
   `https://<your-github-username>.github.io/nudge-together/`.

On iPhone/iPad: open the site in Safari → Share → **Add to Home Screen** for an app-like icon.

## How it's built

| Piece | File | What it does |
|---|---|---|
| Database + security | `supabase/schema.sql` | Tables for profiles, tasks, friendships. Row Level Security means you can only change your own tasks, and only accepted friends can read them. |
| Login | `src/components/Auth.jsx` | Email/password sign up & log in via Supabase Auth |
| Home screen | `src/components/Home.jsx` | Loads your tasks, live sync, friend toggle/dropdown |
| Tasks | `TaskForm.jsx`, `TaskList.jsx`, `TaskItem.jsx`, `PriorityPicker.jsx` | Add / filter / check off / edit / delete |
| Reminders | `Reminders.jsx` | Banner for tasks due within 2 days |
| Friends | `Friends.jsx`, `FriendView.jsx` | Requests and read-only friend task view |

**Why is the publishable (anon) key OK to put in the browser?** It only identifies the project. What
each user may read or write is enforced inside the database by the RLS policies in
`schema.sql`, using the logged-in user's ID.

## Out of scope for v1

Phone widget, automatic task breakdown, recurring tasks, overdue alerts, push/email notifications.
