# Gymli — Full Rebuild Prompt

Paste everything below into a fresh Claude Code / Claude design session to build
this app from scratch. It covers every feature the previous build had (member
side and admin side), the data model, and specific lessons learned from the
first build that should not be repeated.

---

## Product summary

Gymli is a member-engagement Progressive Web App for a gym. Members get a
branded, installable app with check-in, class/trainer booking, gamification,
an AI workout coach, gym-wide announcements, and a "Gym Buddy" matching
feature to find a training partner. Gym staff get an admin dashboard to run
the day-to-day: manage classes, approve trainer session requests, post
notices, and configure gym settings.

The long-term business goal is to sell this to multiple independent gyms,
white-labeled per gym (their own name, colors, and logo), priced as a
monthly SaaS subscription. Build it as a genuinely multi-tenant app from the
start — see "Architecture decision" below.

---

## Tech stack

- **Next.js (App Router) + TypeScript**, React Server/Client Components as
  appropriate.
- **Firebase**: Firebase Auth (email/password) for authentication, Firestore
  for all data, no other Firebase products needed.
- **Tailwind CSS + shadcn/ui** for components. Radix primitives under the
  hood (accordion, dialog, popover, tabs, etc. — pull these in as needed
  rather than building custom primitives).
- **react-hook-form + zod** for every form.
- **PWA**: installable, works offline for static content, but see the PWA
  pitfalls below before picking a library/config.
- **date-fns** for date formatting, **lucide-react** for icons,
  **recharts** for the admin analytics charts.
- An LLM (Gemini via Genkit, or swap for Claude via the Anthropic API — your
  call) for the AI coach feature, called server-side only, never from the
  client.
- Deploy target: assume a static/SSR host without a long-lived Node server
  you control (e.g. Netlify or Vercel) — do **not** assume Cloud Functions
  or any other Firebase Admin-privileged server component are available
  unless you specifically set up and verify Application Default Credentials
  work in that deployment. If they don't, every "server-trusted write"
  pattern below has to become a client-side write guarded by Firestore
  rules instead (documented per-feature below).

---

## Architecture decision: multi-tenant from day one (recommended)

The previous build started single-gym and there was no clean path to retrofit
multi-tenancy later without a real migration. Don't repeat that. Build the
data model with a `gymId` on every tenant-scoped document from the start:

- `gyms/{gymId}` — one document per gym (name, branding colors, logo URL,
  address/geofence, capacity thresholds, contact info). This replaces what
  would otherwise be a single global settings doc.
- Every other tenant-scoped collection is either path-prefixed under
  `gyms/{gymId}/...` or carries an explicit `gymId` field with Firestore
  rules and queries filtering on it. Pick path-prefixing — it lets Firestore
  security rules check the path segment directly instead of reading each
  document's contents, and it makes tenant data physically easy to reason
  about.
- `users/{uid}` gets a `gymId` field, set at signup from whichever gym's
  signup link/subdomain the member used.
- Resolve "which gym is this" from the request's subdomain or a path prefix
  (e.g. `ironworks.gymli.app` or `gymli.app/ironworks`), not from user
  selection.
- Branding is data, not code: each gym's colors/logo are stored on its
  `gyms/{gymId}` doc and injected as CSS custom properties at runtime (the
  color system should be built as CSS variables from the start specifically
  so this works — see Design & Branding below). Generate the PWA manifest
  per-tenant (name, icons) via a dynamic route handler so each gym's
  "installed app" has its own name and icon on a member's home screen — a
  single static `manifest.json` doesn't support this.
- If you'd rather ship single-gym first and add multi-tenancy later, that's
  a legitimate choice too, but say so explicitly to whoever's building this
  — don't let it happen by default the way it did last time.

---

## Lessons from the first build — do these differently

1. **Never hardcode the Firebase project config.** Read it from environment
   variables from the very first commit, not "when we need a second
   environment." This bit us later when multi-tenancy came up.
2. **Set up `firebase.json` and a real deploy pipeline for Firestore rules**
   (`firebase deploy --only firestore:rules`) wired into CI, or at minimum
   documented clearly in the README with exact steps. The first build had no
   `firebase.json` at all — rules only existed by being hand-pasted into the
   Firebase console, which silently drifted out of sync with the repo
   multiple times and caused real, confusing permission-denied bugs in
   production that took a long debugging cycle to catch, because there was
   no way to tell "the code is right but the deployed rules are stale"
   from "the code is wrong" without asking the person testing it to check.
3. **Be very careful with any PWA plugin that generates a service worker
   with an "offline fallback" feature** (e.g. `@ducanh2912/next-pwa`'s
   `fallbacks` option). In the first build, that specific option generated
   broken JavaScript in the compiled service worker — it downleveled
   `async`/`await` into a call to a helper function (`_async_to_generator`)
   that was never actually bundled anywhere, so the helper was undefined at
   runtime. The result: **every single fetch the service worker intercepted
   threw an uncaught `ReferenceError` and came back as a network error** —
   this silently broke page navigation and Firestore writes site-wide in
   production for an unknown stretch of time before anyone noticed, because
   it only manifested for users who already had the service worker
   installed, not in local dev/prod testing. If you use a PWA plugin with an
   auto-generated service worker, actually open the built `sw.js` after your
   first production build and grep it for any reference to a helper
   function that isn't defined in the same file — don't just trust that the
   plugin's default config is safe. Consider whether you need an
   auto-generated offline fallback at all, versus a simpler, hand-written
   service worker you can actually read and reason about.
4. **Don't leave duplicate/stray config files lying around.** The first
   build accumulated a stale, duplicate `next.config.ts` inside `src/` (not
   the real one Next.js actually reads, which lives at the project root)
   that nobody noticed for a long time — it just sat there generating a
   confusing duplicate error in every typecheck run.
5. **Collect all profile fields at signup, not progressively.** The first
   build initially only collected name/email/password at signup and added
   fitness goals, bio, and feature opt-ins to the profile page after the
   fact — members who signed up early had incomplete profiles and some
   features (like Gym Buddy) silently didn't work well for them until they
   visited their profile page. Design the signup form with every field the
   app actually needs from day one.
6. **Any hydration-sensitive state (a store read during render that can
   differ between server and client) must go through `useSyncExternalStore`
   with an explicit `getServerSnapshot`, not `useState` seeded from a
   module-level mutable variable.** The shadcn/ui toast component's default
   implementation uses exactly this unsafe pattern (a `let memoryState`
   module singleton read via `useState(memoryState)`) — fix it before it
   ships, don't wait for a hydration bug to surface it. More generally:
   anything that reads `window`, `document`, `localStorage`, or a mutable
   module-level variable must be gated behind `useEffect` (or
   `useSyncExternalStore`) with a value that's provably identical on the
   server and the client's first render — never read those directly in a
   component body.
7. **Never use the Pages Router `next/head` component inside an App Router
   project.** It's not supported there — `<head>` content in App Router is
   either JSX in the root layout or the `metadata` export. This was found
   as leftover/incorrect code in the first build's auth layout and is worth
   explicitly avoiding this time.

---

## Data model

Design real TypeScript interfaces for all of these (adjust names/shape as
needed, but cover the same information):

- `gyms/{gymId}` (or a single `config/gym` doc if going single-tenant):
  name, address, logo/branding, lat/long, geofence radius (meters),
  capacity thresholds (low/moderate/packed), promotional tags, general
  notice text, offer expiry date.
- `users/{uid}`: firstName, lastName, username, email, role
  (`user`/`admin`), fitnessGoals, bio, leaderboardOptIn, buddyOptIn,
  autoPresenceEnabled, gymId (if multi-tenant), createdAt.
- `classes/{classId}`: name, day, time, capacity.
- `trainers/{trainerId}`: name, specialties, availability, avatar.
- `classSlots/{classId}_{date}`: per-occurrence capacity/waitlist tracking
  for a recurring class (confirmedCount, waitlistOrder).
- `classBookings/{id}`: userId, classId, slotId, status
  (`confirmed`/`waitlisted`/`cancelled`), waitlistPosition.
- `trainerBookings/{id}`: userId, trainerId, status
  (`pending`/`accepted`/`declined`).
- `userPresence/{uid}`: isActive, lastSeen, lastCheckInAt — drives the live
  occupancy count.
- `checkIns/{id}` + an hourly rollup doc: source (`geo`/`manual`), dayOfWeek,
  hourOfDay — drives the "busiest times" chart.
- `gymVisits/{uid}_{date}`: one doc per member per calendar day, deterministic
  ID for idempotency — the source of truth for streaks.
- `gamification/{uid}`: currentStreakDays, longestStreakDays, totalVisits,
  visitsThisMonth, monthKey.
- `personalRecords/{uid}/records/{id}`: exercise, value, unit (kg/lb), date.
- `userBadges/{uid}/earned/{badgeId}`: earnedAt. Badge catalog is a static
  list (first visit, 5/25/100 visits, 7/30-day streak, first PR, 5 PRs —
  add more as wanted).
- `leaderboard/{monthKey}/entries/{uid}`: opt-in only, visits this period +
  streak, for the monthly gym-wide leaderboard.
- `notices/{id}`: title, body, authorName, createdAt — admin-posted,
  member-readable.
- `workoutLogs/{uid}/logs/{id}` and `bodyMetrics/{uid}/entries/{id}`: manual
  entry, with a `source` field (`manual`/future integration types) so a
  native wrapper or OAuth import could write the same shape later without a
  schema change.
- `workoutPlans/{uid}/plans/{id}`: AI-generated weekly plans, persisted so
  they survive reload.
- `users/{uid}/notifications/{id}`: type, title, body, createdAt, readAt.
- `buddySwipes/{fromUid}_{toUid}`: fromUserId, toUserId, action
  (`like`/`pass`), createdAt — deterministic ID.
- `buddyMatches/{matchId}` (matchId = the two uids sorted and joined) +
  `buddyMatches/{matchId}/messages/{id}`: the Gym Buddy 1:1 chat.

---

## Member-facing features (user side)

### Auth & onboarding
- Sign up (email/password) collecting **everything up front**: first/last
  name, username, email, password, fitness goals, a short bio, a
  leaderboard opt-in checkbox, a Gym Buddy opt-in checkbox, terms
  acceptance.
- Log in / log out. Redirect logged-in users away from login/signup;
  redirect logged-out users away from authenticated routes.
- A public marketing/landing page at the root route for logged-out
  visitors, explaining the product and (if applicable) showing pricing —
  logged-in users should redirect straight into the app instead of seeing
  it.

### Dashboard (home)
- Live gym capacity/crowd meter (color-coded low/moderate/packed based on
  the gym's configured thresholds).
- A summary of the latest notices with a link to the full notices page.
- A "busiest times" chart (today's check-ins by hour).
- Rank/streak progress card (current streak, total visits).
- Achievements card (earned badges).
- AI coach card (latest weekly plan, or a prompt to generate one).
- Personal records table (add/edit/delete a PR: exercise, weight, unit,
  date).

### Check-in
- Automatic geolocation-based check-in (opt-in, toggleable): watches
  position, compares distance to the gym's lat/long against its geofence
  radius, checks the member in/out automatically as they enter/leave.
- Manual "Check In" button as a fallback for members who don't want
  geolocation running.
- Both write to `userPresence` and log a `checkIns` entry (for busiest-times)
  and a `gymVisits` entry (for streaks), keeping the day's first check-in
  idempotent.

### Classes
- Browse the weekly class schedule, each class showing today/upcoming
  occurrences within a reasonable booking window (e.g. 7-8 days) with live
  spots-remaining.
- Book a class; if it's at capacity, join the waitlist instead of failing.
- Cancel a booking; if there's a waitlist, automatically promote the
  earliest-waitlisted member to confirmed and notify them.

### Trainers
- Browse trainer profiles (specialties, availability).
- Request a session with a trainer; sessions start `pending` until admin
  accepts/declines.

### Notices
- A summary card on the dashboard (latest few) and a full list page (every
  notice, newest first).

### Gamification
- Streaks and total-visit counts, computed from check-in history.
- A badge catalog with real, earnable conditions (visit milestones, streak
  milestones, PR milestones).
- An opt-in monthly leaderboard (off by default), ranked by visits this
  month with streak as a tiebreaker.

### AI Coach
- Generates a personalized weekly plan from the member's stated fitness
  goals plus their real streak/visit/PR data (not generic filler) — this
  must run server-side (a route handler that verifies the caller's ID
  token), never call the LLM directly from the client.
- Persist generated plans; allow manual regeneration, reasonably rate
  limited.

### Workout log
- Manual entries for workouts (type, duration, date, notes) and body
  weight, each with a `source` field for future integration support.

### Gym Buddy
- An opt-in mutual-match feature (default off, toggleable at signup or
  later from the profile page).
- A "Discover" view: swipe/like/pass through other opted-in members one at
  a time. Each candidate's card auto-pulls their bio, fitness goals,
  current streak, total visits, personal records, and earned badges — this
  needs a Firestore rules exception letting any authenticated member read
  an opted-in member's otherwise-private stats, scoped strictly to
  `buddyOptIn: true` users.
- A mutual like creates a match, notifies both members, and unlocks a 1:1
  chat thread between them.
- A "My Matches" list, each opening its own chat thread.
- This should be reachable directly from the main navigation, not buried
  behind another feature.

### Notifications
- An in-app notification bell (unread count, list, mark-as-read) for events
  like waitlist promotions and Gym Buddy matches. Written by whichever
  client triggers the event (which may be a different user's session than
  the recipient's, e.g. someone else's cancellation freeing up a waitlist
  spot).

### Profile
- Edit name, username, fitness goals, bio.
- Toggle leaderboard visibility and Gym Buddy visibility.
- (Multi-tenant only) show which gym they belong to.

---

## Admin-facing features (admin side)

Gate the entire admin section behind `role === 'admin'` on the user's own
document, both in the UI (redirect non-admins away) and in Firestore
security rules (never trust the client-side check alone).

- **Analytics/overview dashboard**: live occupancy, total members, and
  whatever else is useful at a glance (recent signups, today's check-ins,
  etc.). Use `recharts` for any charts.
- **Notices**: post a new announcement (title + body) and see/delete
  existing ones.
- **Class bookings**: see and manage bookings across all classes,
  including the waitlist.
- **Trainer bookings**: accept or decline pending trainer session
  requests.
- **Manage classes**: full CRUD on the class schedule (name, day, time,
  capacity).
- **Gym settings**: edit the gym's name, address, geofence radius/location,
  capacity thresholds, promotional tags, general notice text, and (if
  multi-tenant) branding colors/logo.

---

## Design & branding

- Design the color system as CSS custom properties (HSL values) on
  `:root`/`.dark` from the start — primary/accent/background/foreground/etc.
  — specifically so that (a) dark mode is trivial and (b) per-tenant
  branding (if building multi-tenant) is just overriding a handful of
  variable values per gym, not a rewrite.
- Support both light and dark mode, or deliberately force one if that's
  the product decision — but make it a decision, not an accident.
- Every interactive surface (forms, buttons, cards) should come from a
  consistent component library (shadcn/ui) rather than one-off styled
  elements, for both speed and visual consistency.
- Make it genuinely mobile-first and installable as a PWA: correct
  manifest (name, icons, theme color), and both `apple-mobile-web-app-capable`
  and `mobile-web-app-capable` meta tags (don't ship only the Apple one).

---

## Non-functional requirements

- **Security**: Firestore security rules for every collection above,
  written narrowly (self-write where appropriate, admin-only where
  appropriate, the Gym Buddy opt-in visibility exception scoped exactly to
  `buddyOptIn: true`). Never allow a client to write its own `role` field.
- **No server-trusted writes unless you've verified you actually have a
  privileged server environment** (Application Default Credentials, a real
  service account) in your deployment target. If you don't, every
  "server-computed" value (streaks, badges, leaderboard entries) has to be
  an accepted client-trust tradeoff, clearly documented as such, the same
  way gym occupancy counters and class-slot capacity already have to be.
- **Accessibility**: forms need labels, buttons need accessible names,
  color contrast should pass basic checks — this wasn't a focus in the
  first build and should be from the start this time.
- **Testing before calling anything "done"**: actually run the built app in
  a browser (or with a headless browser tool) and click through the golden
  path for whatever you just built, not just `npm run build` succeeding.
  Multiple real bugs in the first build shipped despite a clean build/
  typecheck because they only manifested at runtime in an actual browser.

---

## Build sequencing suggestion

Don't try to build all of this in one pass. A reasonable phased order:

1. Auth + signup (all fields up front) + basic profile.
2. Gym data model + admin gym settings + classes/trainers CRUD.
3. Member-facing classes/trainers browsing + booking (with waitlists).
4. Check-in + live crowd meter + busiest times.
5. Gamification (streaks, badges, leaderboard) + personal records.
6. Notices (admin post, member view).
7. AI Coach.
8. Gym Buddy matching + chat.
9. Admin analytics dashboard.
10. PWA polish (manifest, service worker, install prompt) + the public
    marketing/landing page.
11. (If building multi-tenant) per-tenant branding/theming + dynamic PWA
    manifest per gym + onboarding flow for a new gym.

Each phase should end with an actual build + a real browser click-through
before moving to the next one, not just a clean `npm run build`.
