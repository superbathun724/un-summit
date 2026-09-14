# CLAUDE.md — project rules for Claude Code

Read HANDOVER.md first. It has the full context and the decisions already made. Do not re-open decided questions unless asked.

## What this is
YOUTH LEADER: a single-file static click game (index.html) deployed on GitHub Pages. Pilot = Korean cities. Global = countries (data already in COUNTRIES_GLOBAL).

## Constraints
- Keep it a single static site that works on GitHub Pages (no server required for the pilot). If a backend becomes necessary (real rankings, real geo-IP, anti-cheat), put it behind a clear flag and keep the static fallback working.
- Mobile first, ~380px wide. Must work on a phone browser from a single link.
- No login, no names, no GPS. Country/city from IP (server) or user choice (static). Random device ID in localStorage only.
- No chat features. Ever.
- English UI. Short sentences. Do not add marketing copy.
- Do not name real countries as "polluters" in UI text. Roles are "high-emission / disaster-risk / both", sourced from public data.
- No copyrighted characters, brand logos, or licensed assets.

## Style
- Match the presentation: blue 0F4C9C on near-white F8FAFC, light-blue blobs E4ECF5, Poppins for headings if available.
- Keep the smog-clearing city scene. It is the one thing people remember.

## Workflow
- Edit index.html directly. Keep it under ~800 lines; split into files only if it becomes necessary.
- After every change: open index.html, tap 30 times, buy an upgrade, send coins, check the ranking tab. Fix before committing.
- Commit messages in English, one line, imperative.
