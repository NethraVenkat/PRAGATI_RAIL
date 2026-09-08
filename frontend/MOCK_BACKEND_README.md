# PRAGATI-RAIL Frontend — Self-Contained Offline Demo Mode

This `frontend/` folder now runs as a **complete, standalone application**.
`npm install && npm run dev` is all a judge/evaluator needs — no Python, no
Node/Express backend, no MongoDB.

## What changed

- **`src/mock/mockAdapter.js`** — a transparent Axios adapter installed on
  `apiClient` that intercepts every API call the app makes (auth, dashboard,
  AI optimization results, block requests, defects, GIS, stations, trains)
  and answers it with realistic, computed data. No red network errors, ever.
- **`src/mock/mockDb.js`** — a `localStorage`-backed stateful database. When
  you approve a block, submit a defect, or send something to block planning,
  it **actually persists** and updates counters/dashboards elsewhere in the
  app, just like a real backend + MongoDB would.
- **`src/mock/mlEngine.js`** — simulated Severity Classifier, Priority Score
  Engine (with SHAP-style feature breakdown) and Outcome Predictor /
  Cascading Delay Simulator, computed from the inputs you give it (not
  hardcoded), with a realistic 400–900ms "inference" delay on ML-heavy calls.
- **`src/services/apiClient.js`** — wires the mock adapter in by default.
  Flip `VITE_USE_MOCK=false` in `.env` once your real backend is deployed to
  switch this client back to live network calls against `VITE_API_BASE_URL`.
- **`src/components/common/AppShell.jsx`** — the sidebar now collapses into
  a proper Ant Design `Drawer` (hamburger menu) below 992px width instead of
  staying a fixed 250px column, and the header shows a live
  "⚡ AI Engine (Simulation Mode)" status pill.
- **`src/pages/SettingsPage.jsx`** — new "Simulation & Demo Data" tab with a
  **Reset Demo Data** button that wipes local mock state and reseeds the
  standard Indian Railways dataset.
- **`src/index.css`** — added responsive rules for tables, modals, Leaflet
  map heights, and card padding across mobile / tablet / desktop.

## Verified

- `npm install` — succeeds cleanly (238 packages).
- `npm run build` — succeeds with no errors (Vite production build).
- `npm run dev` / `vite preview` — serves and responds with HTTP 200.
- Every `.jsx`/`.js` file touched was parsed with `@babel/parser` to confirm
  valid syntax before packaging.

## What to double-check yourself

I verified the app **builds and serves** correctly, but I don't have a
browser in this environment to click through every page. Before your final
submission, please click through at minimum:

1. Log in with a demo account (`user_coa` / `rail123`).
2. Dashboard loads KPIs and the priority task table.
3. TMS/SMMS/TDMS → submit a defect → see it appear, then "Send to Block
   Planning".
4. BDMS Block Planner → approve/edit a block request.
5. AI Optimization Results page renders charts and the approved list.
6. Resize the browser (or Chrome DevTools device toolbar) to ~375px and
   ~1440px to confirm the sidebar/drawer and tables behave as expected.
7. Settings → Simulation & Demo Data → try "Reset Demo Data".

GIS map / station board / live train tracking endpoints are mocked with
plausible generated data but are the least exhaustively cross-checked
against every page's exact rendering path — give those an extra look.
