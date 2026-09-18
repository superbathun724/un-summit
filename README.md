# YOUTH LEADER

A casual click game. What a tap does depends on your city: a high-emission city cuts emissions, a coastal city builds its shield, and some do both. Either way a tap earns coins, and coins can only be spent on another city. Ads turn coins into real money.

Built by SeYeon, MinChae, JiHun — Hyundai Chungun High School, Ulsan, for the 2026 World Tsunami Awareness Day High School Summit.

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

## Run locally
Open `index.html` in a browser. No build step.

## Deploy to GitHub Pages
This repo already pushes to `github.com/superbathun724/un-summit`.

1. Push `main`.
2. Repo → Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save.
   The repo has to be **public** for Pages on a free account.
3. Wait ~1 min. The link is `https://superbathun724.github.io/un-summit/`

`.nojekyll` is included so Pages serves the files as-is.

### 4. Check the share card

`og:url` and `og:image` in `index.html` are already set to this repo's Pages address:

    https://superbathun724.github.io/un-summit/

If the repo is renamed or moved, change both. `npm test` checks that the two agree with each
other — it cannot check that the address is reachable, so once Pages is live, paste the link
into a chat with yourself and look at it. A title, a description and a picture should appear.
If the link shows as a bare URL, the address in those two tags is wrong.

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
