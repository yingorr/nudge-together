# Design decisions

Why Nudge Together is built the way it is. Each entry: what we chose, why, and
what we gave up. Newest decisions are added at the bottom of their section.

## Scope and goals

**A small app for friends, not a public product.** "Done" for v1 means a usable app
for a few friends, hosted for free. That rules out paid domains, app-store releases
and paid services, and it keeps every choice below on the simple side.

**A website instead of a phone app.** The group uses a MacBook, an iPad, a Windows
PC and iPhones. One mobile-friendly website covers all of them with one codebase
and needs no App Store review. On iPhone it can be added to the home screen.
*Given up:* a home-screen widget and real push notifications (both out of scope for v1).

**Break tasks down by hand.** Automatic task breakdown was moved out of scope; users
write small, dated steps themselves. It keeps v1 buildable in the time available.

## Tech stack

**React + Vite.** A common, well-documented way to build an interactive page, and
fast to develop with. Plain JavaScript (no TypeScript) to keep it approachable.

**Supabase for login and the database.** It gives login, a real Postgres database,
row-level security and live updates in one free service, and the browser can talk to
it directly, so there's no server of our own to write, host or pay for.
*Alternatives considered:* Firebase (similar, but a document database instead of SQL)
or building our own backend (more to learn and host).

**GitHub Pages for hosting.** Free, and the site publishes automatically on every
push to `main` through a GitHub Actions workflow.

## Security

**The publishable key is in the browser; the secret key never is.** The publishable
key only identifies the project. What each person can read or change is enforced
inside the database by Row Level Security (RLS) policies tied to the logged-in user:
you can change only your own tasks, only accepted friends can read them, and only
accepted friends can nudge you. The secret key bypasses all of that, so it must
never go in the app or in GitHub.

**Friends are found by exact email, through a private lookup.** Usernames were
dropped in favor of display names. To add a friend you type their email; a database
function returns one match for that exact address and nothing else, so nobody can
browse a list of users or their emails.

## Database

**One migration file per change.** The schema lives in timestamped files in
`supabase/migrations/`, applied in order. Supabase records which ones ran, so each
runs exactly once. This keeps a history of what changed and when, and it's the
standard workflow for real projects. *Given up:* seeing the whole schema in one
file. (We briefly tried a single re-runnable file and switched back.)

**Every task needs a due date.** The app is about getting things done on a timeline;
an undated task tends to sit forever. Making it required (in the form and the
database) also keeps the date sections simple.

**Explicit table permissions.** Newer Supabase projects don't automatically let
logged-in users reach new tables, so each migration grants access explicitly. RLS
still decides which rows a person can see.

## Task list

**Date sections instead of one long list.** Overdue, Today, This week (the next 7
days, so it's never empty on a Saturday) and Next week & after. Each can be collapsed,
and the app remembers that per device.

**Finished tasks get their own view.** The Done button switches the whole list to
finished tasks instead of mixing them in, so the to-do list stays focused.

**Same-day tasks are sorted by priority.** Within a due date: high, medium, low,
then no priority, so the most important thing is on top.

**Counts, not lists, in the reminder banner.** The banner shows how many tasks are in
each section ("2 overdue · 1 due today · 3 this week…"). It's a quick summary; the
sections below have the details.

**Overdue is shown, not alerted.** Past-due tasks get a red Overdue tag, maroon date
text and a filter. Everything is in-app; there are no emails or push notifications.

**Words for the next few days, dates after that.** "Due today", "Due tomorrow" and
"Due in 2 days" are shown in maroon; further-out tasks show the date.

**Priority and time needed are optional.** Only the name, category and due date are
required, so adding a task stays fast. Priority shows as a short color bar beside the
title; time needed shows as a quarter, half or full circle.

**No browser pop-ups.** Deleting a task happens right away with an Undo bar, which is
quicker than an "are you sure?" box and still protects against mistakes. Removing a
friend or declining a request asks inline ("Remove? Yes / No").

## Look and feel

**Sage & Cream theme with light and dark modes.** Picked from several mockups. The
app follows the device's appearance setting. Priority colors were softened so they
don't overpower the calm palette, and colors are checked for readable contrast.

**Labeled form fields.** iPhones show an empty date box with no hint text, so every
field (Category, Due date, Priority, Time needed) has a visible label.

**Built for phones first.** Touch targets are at least 44px, dropdowns use 16px text
so iPhones don't zoom in, and layouts wrap on narrow screens.

## Goals

**A goal is a list of ordinary tasks.** Steps are tasks with a goal and an order, so
they work everywhere tasks do: date sections, reminders, filters, feeding 宝宝, and
friends can see and nudge the current step. A goal just groups them.

**One step at a time in My tasks.** Only the current step has a due date and appears
in your list; the rest wait in the Goals tab. A big goal never floods your to-do list,
which is the point of breaking it down. Because of this, waiting steps are the one
case where a task may have no due date (enforced by a database rule).

**The next step is scheduled when you finish one.** You pick the first step's date;
every later step has its own number of **days** (a quick step can be 1, a big one 5).
Finishing (or removing) the current step gives the next one a due date that many days
after today, so the plan adapts to your real pace instead of fixed dates going overdue.
This replaced an earlier single gap for the whole goal, which didn't fit steps of
different sizes. Scheduling is done by the app,
using your local date, so "today" matches your time zone. *Later:* smarter
auto-scheduling (for example, spreading steps toward a goal deadline).

**Goals have their own tab.** It keeps My tasks focused on what's due now; the Goals
tab shows the whole plan and progress. Steps are just a name and use the goal's
category, to keep setting up a goal quick.

## Friends and nudges

**Friends' tasks are read-only.** You can see a friend's progress but never change
their tasks. That's enforced in the database, not just hidden in the app.

**Nudges replace the checkmark on friends' tasks.** The checkmark did nothing there,
so that spot became the way to check in: a speech bubble ("How's it going?") on
unfinished tasks and a heart bubble ("Nice work!") on finished ones. Messages are
preset, which keeps them short, friendly and safe from misuse. After you nudge, the
button shows a dot for 24 hours, but you can still send another.

**Nudges are in-app and live.** They appear at the top of your friend's page as soon
as you send them, through Supabase's live updates. No emails or push notifications.

## 宝宝 the cat

**A small pet as motivation.** Finishing a task feeds 宝宝 a treat. Its mood comes from
tasks finished in the last 24 hours (sleepy, content or happy), worked out from the
saved tasks, so it's the same on every device. It's optional: the paw button hides it.

**Original pixel art.** The cat, bed, cat tree and icons were drawn for this app in
the style of references, not copied from them.

**It never covers your tasks.** On wide screens 宝宝 stays in the empty space beside
the task list and passes behind it. On phones it has its own strip at the bottom, and
the page leaves room for it. It respects the "reduce motion" setting.
