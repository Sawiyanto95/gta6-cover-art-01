// Neon Coast Cover Studio — the entry program.
//
// It hands the app in: copies app/ and screenshots/ from this repository
// into the output directory and writes dossier.json there with
// buildDossier from vendor/makefun-app.ts. Outside the grader the
// MAKEFUN_OUTPUT_DIR environment variable stands in for /output.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = resolve(import.meta.dirname);
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

const appDir = join(root, "app");
const shotsDir = join(root, "screenshots");

if (!existsSync(appDir)) {
  throw new Error(`main.ts: no app/ directory at ${appDir}`);
}
if (!existsSync(shotsDir)) {
  throw new Error(`main.ts: no screenshots/ directory at ${shotsDir}`);
}

// Start from a clean output directory so a stale file from an earlier
// run can never ride along into the entry.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(appDir, join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

// The gate's caps for this bounty: the dossier text cap is 160 KiB, at
// most 4 screenshots of 256 KiB each, and app/ is at most 993 entries
// and 48 MiB with no path longer than 1,000 bytes.
// The output is deterministic on purpose: the same repository always
// writes the same files, because buildDossier writes no timestamps and
// the copy is a plain file-for-file copy. Run main.ts twice and the two
// output trees should match byte for byte.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`main.ts: wrote ${outDir} (dossier.json ${dossier.length} bytes)`);
