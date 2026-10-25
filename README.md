# Ludo PWA

Ludo for 1–4 players (pass-and-play + AI) as an offline-first Progressive Web App with light and dark themes.
Vite + React + TypeScript + Tailwind v4, `vite-plugin-pwa` (Workbox), Vitest. No backend, no runtime network calls.

## File tree

```
├─ index.html · vite.config.ts · tsconfig.json · vercel.json · pwa-assets.config.ts
├─ public/                 icon.svg + PNG icons (192, 512, maskable 512, 64, 180, favicon.ico)
└─ src/
   ├─ main.tsx · App.tsx · index.css · vite-env.d.ts
   ├─ lib/
   │  ├─ storage.ts · sound.ts
   │  └─ ludo/
   │     ├─ rules.ts      pure rules engine + the single RulesConfig object (no React)
   │     ├─ ai.ts         move scoring, easy/medium/hard
   │     ├─ setup.ts      seats from the setup form · log.ts · geometry.ts · theme.ts
   │     └─ rules.test.ts · ai.test.ts
   ├─ hooks/  useGameController.ts (turn flow, animation, AI loop, persistence) · usePwa.ts (install prompt) · useTheme.ts (light/dark)
   └─ components/ Board · PieceShape (pawns) · ThemeToggle · Dice · SetupScreen · GameScreen · HandoffScreen · EndScreen · SettingsPanel · PwaPrompts
```

## Local development

```bash
npm install
npm run dev          # http://localhost:5173 (service worker is disabled in dev)
npm test             # Vitest: rules engine + AI
npm run typecheck
npm run build        # type-checks, builds to dist/ and generates sw.js + manifest
npm run preview      # serve the production build (service worker active) at http://localhost:4173
npm run icons        # optional: regenerate PNG icons from public/icon.svg
```

## Deploy to Vercel

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel: **Add New → Project**, import the repository.
3. Vercel detects Vite automatically: Build Command `npm run build`, Output Directory `dist`. Change nothing.
4. Click **Deploy**. (CLI alternative: `npm i -g vercel && vercel --prod`.)

`vercel.json` only sets `no-cache` headers on `sw.js`, `index.html` and the manifest so updates are picked up promptly.

## Verify offline mode

1. `npm run build && npm run preview` (or open your Vercel URL), then open Chrome DevTools.
2. **Application → Service Workers**: `sw.js` should be *activated and running*. **Application → Cache Storage** should list a `workbox-precache-…` cache holding the JS, CSS, HTML and icons.
3. Reload once so the page is controlled by the worker. A "Ready to play offline" toast appears the first time.
4. **Network** tab → set throttling to **Offline** (or tick *Offline* under Service Workers), then reload. The app must load, and a full game must be playable.
5. Close the tab, reopen it offline: an unfinished game appears under **Resume** (state is in `localStorage`).
6. **Lighthouse** (Application → or the Lighthouse tab): run the *Accessibility* and *Progressive Web App / installability* checks.
7. Update flow: deploy a change, reopen the app. A "New version available, reload?" toast appears; **Reload** activates the new worker.

## Rules implemented (Ludo)

Four seats (yellow, blue, red, green) play clockwise with one die and 4 pawns each, starting in the corner yard. A **6** brings a
pawn out onto your start square. A 6 grants another roll; so does capturing a pawn and bringing a pawn home. Rolling three
sixes in a row forfeits the turn. Pawns travel 51 squares of the 52-square ring, then up their 5-square home column and must
reach the home triangle with an **exact** roll. Landing on a single opponent on a normal square sends it back to its yard.
Start squares and star squares (★) are safe. Two or more same-colour pawns on one square form a double that cannot be captured.
A legal move is mandatory; if none exists the turn passes. Play can continue after the first finisher to rank 2nd and 3rd.

## Rule choices you can change

All in **`DEFAULT_RULES`** at the top of `src/lib/ludo/rules.ts`:

| Option | Default | Meaning |
| --- | --- | --- |
| `exitRolls` | `[6]` | dice values that leave the yard |
| `forcedExit` | `false` | if true, an exit roll must be used to leave the yard when possible |
| `extraRollEnabled` / `extraRollOn` | `true` / `[6]` | extra roll on these values (also a Settings toggle) |
| `captureGivesRoll` | `true` | extra roll after a capture |
| `goalGivesRoll` | `true` | extra roll after getting a pawn home |
| `maxConsecutiveSixes` | `3` | three sixes in a row forfeit the turn (`0` = off) |
| `doublesProtected` | `true` | a double cannot be captured; opponents cannot land on it |
| `blockadesBlockPassing` | `false` | a double also stops opponents from passing |
| `continueRanking` | `true` | keep playing for 2nd/3rd place |
| `safeSquares` | start + star squares | 0-indexed outer track |
| `entrySquares` | 8, 21, 34, 47 | start square per colour |

## Table view and dice

The board is shown as a tilted 3D table by default (Settings -> Board view -> Flat for top-down). The perspective is calculated in
`src/lib/ludo/view.ts` (with tests) and baked into plain 2D vector shapes, with no CSS 3D transform, so the board stays
crisp in every browser (CSS-transformed SVG is rasterised and looks soft in Firefox). Dragging uses the inverse of the same math. The die is a real CSS 3D cube that is
thrown in from the rolling player's side, bounces and settles on the board (`src/components/Die3D.tsx`). With reduced motion
or animation speed "Off", the throw is skipped.

## Themes

Light, dark, or match-device: use the sun/moon button in the header or the Theme setting. The choice is saved, and the
board, pawns and UI all adapt (the board uses CSS variables, defined in `src/index.css`).
