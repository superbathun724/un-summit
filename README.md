# YOUTH LEADER

A casual click game. What a tap does depends on your city: a high-emission city cuts emissions, a coastal city builds its shield, and some do both. Either way a tap earns coins, and coins can only be spent on another city. Ads turn coins into real money.

Built by SeYeon, MinChae, JiHun — Hyundai Chungun High School, Ulsan, for the 2026 World Tsunami Awareness Day High School Summit.

**Live: <https://un-summit.pages.dev/>**

## Run locally

Open `index.html` in a browser. No build step. The page loads `styles.css` and `app.js`
next to it, so keep the three together.

## Deploy (Cloudflare Pages)

Cloudflare Pages, Git-connected, production branch `main`, served at the link above.
Pushing to `main` deploys. Other branches get preview addresses. GitHub Pages is off.

If the Pages project is ever renamed, `og:url` and `og:image` in `index.html` must be changed
to match. `npm test` derives the expected address from `name` in `wrangler.toml` and fails if
they disagree — a rename (`un_summit` → `un-summit`) already broke every shared link once.

No code change, no Functions, no D1 yet. `wrangler.toml` holds the config:

```toml
name = "un-summit"
compatibility_date = "2026-10-01"
pages_build_output_dir = "."
```

**Connect the repo (once, in the dashboard — it has to be Git-connected from the start).**
A project made with `wrangler pages deploy` is a Direct Upload project and can never be switched
to Git later, so do not create it from the CLI.

1. dash.cloudflare.com → Workers & Pages → Create → Pages → **Connect to Git**.
2. Authorize the Cloudflare GitHub app for `superbathun724/un-summit` only.
3. Project name `un-summit` (must match `name` above). Production branch `main`.
4. Framework preset **None**. Build command **empty**. Output directory `.` (the dashboard
   reads it from `wrangler.toml` and greys the field out).
5. Save and Deploy. The address is <https://un-summit.pages.dev>. If a name is taken,
   Cloudflare adds a suffix — use the address it shows, and change `name` to match.

**Check after a deploy.** Pick a city, tap 30 times, buy an upgrade, send coins, open Ranking.
Progress from the old github.io address does not carry over — localStorage is per address.

**Run it locally the way Pages serves it** (optional):

```
npx wrangler pages dev
```
Then open <http://localhost:8788>.

**Notes.** The whole repo root is published (`HANDOVER.md`, `test/` included).
Pages runs `npm install` because `package.json` exists; it only pulls the test harness and does
not affect the site. Set `SKIP_DEPENDENCY_INSTALL=1` in the project's environment variables to skip it.

## Check the share card after a deploy


`npm test` cannot tell whether the address is reachable. Paste the link into a chat with
yourself and look: a title, a description and a picture should appear. If it shows as a bare
URL, the two `og:` tags are wrong. KakaoTalk caches hard — add `?v=2` to force a refetch.

## City data (placeholder)


Each city's role (high-emission / disaster-risk / both), its starting daily tonnes and its
population are **placeholders**. `DATA_SOURCED` in `app.js` is `false` and the first screen
says so in plain words. Do not flip it until the table below has years in it — `npm test`
checks that the flag and what the app claims agree.

| field | where it comes from | year |
|---|---|---|
| `role`, `base` | 온실가스종합정보센터 (GIR), 지역 온실가스 인벤토리 | — |
| `role` (risk side) | 행정안전부 재해연보, 태풍·호우·해일 피해 이력 | — |
| `pop` | 행정안전부 주민등록 인구통계 | — |

**Where to actually get them.** These are all behind query screens, not files you can link to,
so someone has to sit down with them once:

- Emissions — <https://www.gir.go.kr> → 온실가스 통계 → 국가·지역 온실가스 통계. Gives 시·도 level,
  which covers Seoul, Incheon, Daegu, Ulsan, Busan and Jeju directly. Pohang, Yeosu, Gangneung,
  Sokcho, Tongyeong and Mokpo are 기초자치단체 and need the 기초지자체 inventory or the city's own
  기후변화대응계획, which each city publishes.
- Risk — 행정안전부 재해연보 (annual PDF/statistics), or the World Risk Index if a city has no
  usable series.
- Population — <https://jumin.mois.go.kr> → 행정구역별 인구, pick the month, export.

**Turning numbers into `base`.** `base` is not tonnes, it is the size of one player's day on a
shared scale: `Math.min(DAY_CAP, base)` is how many tonnes a day of tapping cuts. Keep the
*ratios* between cities honest and pick a scale that leaves the biggest city at roughly 900,
so the smog depth (which reads `base / DAY_CAP`) still tells a fishing town from a refinery
city. Write the conversion you used here when you do it.

`pop` is carried but not scored. The ranking is a per-player average, so population cancels
out; the field exists so that adding "what share of this city turned up" later is a formula
change rather than a data migration. See `HANDOVER.md` §6.

## Tests (optional, dev only)

```
npm install
npm test
```
Headless regression checks. The app needs none of this — see `test/README.md`.

## Files


| file | what it is |
|---|---|
| `index.html` | markup, and the head tags a shared link depends on |
| `styles.css` | styles |
| `app.js` | all the logic. A classic script, not a module — inline `onclick` handlers depend on that |
| `icon.svg`, `icon-180/192/512.png` | favicon, iOS home screen, Android home screen |
| `og.png` | the 1200×630 picture a chat app shows for the link |
| `manifest.webmanifest` | lets a phone add the game to its home screen |
| `.nojekyll` | makes Pages serve the files as-is |

See `HANDOVER.md` for the full context, decisions, and to-do list.
