# CLAUDE.md — project rules for Claude Code

Read HANDOVER.md first. It has the full context and the decisions already made. Do not re-open decided questions unless asked.

## What this is
YOUTH LEADER: a static click game deployed on GitHub Pages, live at
https://superbathun724.github.io/un-summit/ . Pilot = Korean cities. Global = countries
(data already in COUNTRIES_GLOBAL).

## Constraints
- Keep it a single static site that works on GitHub Pages (no server required for the pilot). If a backend becomes necessary (real rankings, real geo-IP, anti-cheat), put it behind a clear flag and keep the static fallback working.
- Mobile first, ~380px wide. Must work on a phone browser from a single link.
- No login, no names, no GPS. Country/city from IP (server) or user choice (static). Random device ID in localStorage only.
- No chat features. Ever.
- English UI. Short sentences. Do not add marketing copy.
- Do not name real countries as "polluters" in UI text. Roles are "high-emission / disaster-risk / both", and must be sourced from public data before the app says they are. `DATA_SOURCED` in app.js gates that claim; a test keeps the flag and the wording together.
- No copyrighted characters, brand logos, or licensed assets.

## Style
- Match the presentation: blue 0F4C9C on near-white F8FAFC, light-blue blobs E4ECF5, Poppins for headings if available.
- Keep the smog-clearing city scene. It is the one thing people remember.

## Before you change a number
Several constants carry the argument the presentation makes, not just game balance:
`SAFE`, `SELF_MAX`, `SHIELD_DECAY`, `DEF_PER_PCT`, `SKY_FUND`, `DUTY`/`RELIEF`, `AWAY_SHARE`.
Read HANDOVER.md §5 before touching them, and check with the user.

## Workflow
- Three files, no build step: `index.html` (markup), `styles.css`, `app.js` (everything else).
  `app.js` is a classic script, not a module — the lists use inline `onclick` handlers.
  Keep it that way unless there is a reason, and say what the reason was.
- Run `npm test` before committing. It is a regression net, not a substitute for looking.
- After every change: open the page, tap 30 times, buy an upgrade, send coins, check the
  ranking tab. Fix before committing. If you cannot open a browser, take headless screenshots
  (HANDOVER.md §0 has the exact recipe) and say plainly that a real phone has not seen it.
- Commit messages in English, one line, imperative.
