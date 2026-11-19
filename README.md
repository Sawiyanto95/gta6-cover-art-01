# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Sawiyanto95/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Sawiyanto95/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA 6-style
cover art: a multi-panel poster with bold display lettering and a neon
sunset grade, exported as a PNG to share.

## How it works

1. Add photos — upload your own, drag and drop them onto the preview, or
   try the two built-in sample scenes (a boulevard at sunset and a pier
   at dusk, both drawn procedurally for this studio).
2. Pick a layout — Full Bleed, Duo Split, Trio, Quad Grid, or Hero + 3.
   One photo can fill several panels.
3. Shape each panel — click a panel to select it, drag to pan the photo,
   scroll or use the slider to zoom, switch between fill and fit.
4. Write the caption — a big Anton title, a Pacifico script subtitle and
   a small tagline, all updating live on the preview.
5. Pick a colour grade — Vice Sunset, Neon Night, Golden Hour, Teal Coast
   or After Dark — plus film grain and a vignette.
6. Export a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Running it

Serve `app/` with any static server, for example:

```
cd app && python3 -m http.server 8080
```

then open http://localhost:8080. No network requests: every font, script
and sample image is a file under `app/`, and your photos never leave
your machine.

## Files

- `app/index.html` — the editor page
- `app/style.css` — dark UI with neon accents
- `app/src/studio.js` — editor state, preview and export
- `app/src/layouts.js` — the five panel layouts
- `app/src/grades.js` — colour grades, grain and vignette
- `app/src/lettering.js` — the title block drawing
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
- `app/samples/` — two procedural sunset scenes made for this studio
- `main.ts` — copies `app/` and `screenshots/` to the output directory
  and writes `dossier.json` with `buildDossier`

## License

MIT. All artwork and code in this repository is original.

## A note on the samples

The two sample scenes are procedural drawings, not photographs: gradients,
building silhouettes, palm shapes and a pier, all drawn in code. They exist
so the studio is usable in one click, and so the screenshots show the app
working without anyone's real photo.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bc76ffwb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
