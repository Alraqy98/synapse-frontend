# Synapse YC Demo Video (Remotion)

Code-rendered demo video for Synapse, built with Remotion (React + TypeScript).

## Terminology (from Synapse codebase)

- **Learning states:** `DECLINING` | `STABLE` | `IMPROVING` | `INSUFFICIENT_DATA` (from `GET /api/learning/state`; `overall.state`, `concept_breakdown`, `primary_risk`, `prescription`).
- **File processing:** `render_state.status` and `render_state.ocr_status` (terminal: `completed` / `partial` / `failed`). Pipeline: rendering pages → OCR; files viewable while processing; polling every 4s for readiness.
- **Source attribution:** File title + page numbers (e.g. `Cardiology_Week3.pdf · Page 7`); "Explain All" for every MCQ option; high-yield explanations.

## Setup

```bash
cd synapse-demo
npm install
```

## Preview

```bash
npm run preview
# or
npx remotion preview src/index.tsx
```

## Render to MP4

1920×1080, 30fps, H.264, ~120 seconds:

```bash
npx remotion render src/index.tsx SynapseDemo out/synapse-demo.mp4 --codec h264
```

Or use the npm script:

```bash
npm run render
```

Output: `out/synapse-demo.mp4`.

## Brand

- Background: `#0D0F12`
- Primary: `#2DD4BF` (teal)
- Fonts: Inter (UI), Syne (titles)
- Logo: `public/logo.png`

## Scenes

1. **Hook (0–5s)** — “Medical students spend 40% of study time fighting their tools.”
2. **Intro (5–12s)** — Logo + SYNAPSE + tagline
3. **File upload (12–25s)** — Drag-drop, Converting to PDF / Rendering pages / OCR as status chips
4. **Astra (25–42s)** — Slide + “why” + typewriter response
5. **Generate (42–60s)** — MCQ, flashcard flip, summary; source chips
6. **Learning modal (60–80s)** — DECLINING / STABLE / IMPROVING cards, decay, reinforce
7. **Traction (80–95s)** — Count-up stats + YC S25
8. **CTA (95–120s)** — Logo, trysynapse.com, fade to black
