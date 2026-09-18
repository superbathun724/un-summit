# YOUTH LEADER

A casual click game. What a tap does depends on your city: a high-emission city cuts emissions, a coastal city builds its shield, and some do both. Either way a tap earns coins, and coins can only be spent on another city. Ads turn coins into real money.

Built by SeYeon, MinChae, JiHun — Hyundai Chungun High School, Ulsan, for the 2026 World Tsunami Awareness Day High School Summit.

## City data (placeholder)

Each city's role (high-emission / disaster-risk / both), its starting daily tonnes and its
population are **placeholders**. They have not been replaced with published figures yet.
When they are, record the source and the year here:

| field | source to use | year |
|---|---|---|
| `role`, `base` | Greenhouse Gas Inventory and Research Center (local government emissions) | — |
| `role` (risk) | Ministry of the Interior and Safety disaster statistics | — |
| `pop` | KOSIS resident registration | — |

`pop` is carried but not scored. The ranking is a per-player average, so population cancels
out; the field exists so that adding "what share of this city turned up" later is a formula
change rather than a data migration. See `HANDOVER.md` §6.

## Run locally
Open `index.html` in a browser. No build step.

## Deploy to GitHub Pages
1. Create a repo named `youth-leader` (or anything) and push this folder to `main`.
2. Repo → Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save.
3. Wait ~1 min. URL: `https://<username>.github.io/youth-leader/`
   (Name the repo `<username>.github.io` if you want the root URL.)

`.nojekyll` is included so Pages serves the files as-is.

### 4. Set the site URL (required once)

`og:url` and `og:image` in `index.html` are absolute and ship with a placeholder
(`https://example.github.io/youth-leader/`). Replace it with the real Pages address in both.
Until you do, the link pastes into KakaoTalk, Slack or Discord as a bare URL with no title,
no description and no picture — which is the whole point of sharing one link.

`npm test` checks that the two tags agree with each other. It cannot check that the address
is right, so paste the deployed link into a chat with yourself once and look at it.

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
