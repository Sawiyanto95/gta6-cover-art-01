// Colour grades: the sunset and neon looks painted over the photos.
//
// A grade is a pair of gradient washes plus a tint, all drawn on the
// cover canvas with blend modes after the photos are in place. Nothing
// here touches the original photo files: the grade only lives on the
// exported cover, so switching grades is instant and free.

export const GRADES = [
  {
    id: "sunset",
    name: "Vice Sunset",
    hint: "Warm orange melting into pink",
    sky: ["rgba(255, 122, 26, 0.34)", "rgba(255, 45, 120, 0.30)"],
    wash: "rgba(255, 140, 60, 0.10)",
    shadow: "rgba(40, 8, 60, 0.22)",
  },
  {
    id: "neon",
    name: "Neon Night",
    hint: "Magenta and cyan street glow",
    sky: ["rgba(255, 0, 160, 0.30)", "rgba(0, 220, 255, 0.30)"],
    wash: "rgba(120, 0, 255, 0.10)",
    shadow: "rgba(4, 8, 40, 0.26)",
  },
  {
    id: "golden",
    name: "Golden Hour",
    hint: "Soft honey light, gentle contrast",
    sky: ["rgba(255, 190, 60, 0.30)", "rgba(255, 120, 40, 0.22)"],
    wash: "rgba(255, 200, 110, 0.12)",
    shadow: "rgba(60, 30, 0, 0.14)",
  },
  {
    id: "teal",
    name: "Teal Coast",
    hint: "Cool sea teal over warm sand",
    sky: ["rgba(0, 190, 200, 0.30)", "rgba(255, 150, 60, 0.22)"],
    wash: "rgba(0, 160, 180, 0.08)",
    shadow: "rgba(0, 30, 44, 0.22)",
  },
  {
    id: "mono",
    name: "After Dark",
    hint: "Moody near-black with a hot edge",
    sky: ["rgba(255, 80, 40, 0.26)", "rgba(10, 10, 30, 0.30)"],
    wash: "rgba(0, 0, 0, 0.06)",
    shadow: "rgba(0, 0, 0, 0.30)",
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// The grade names in picker order, for the editor's keyboard shortcuts
// and for any future "next grade" button.
export function gradeNames() {
  return GRADES.map((g) => g.name);
}

// Paint a grade over the whole cover. The diagonal wash gives the
// sunset its direction, the shadow wash deepens the bottom where the
// title sits, and the flat tint warms or cools everything at once.
export function applyGrade(ctx, width, height, grade) {
  const diag = ctx.createLinearGradient(0, 0, width, height);
  diag.addColorStop(0, grade.sky[0]);
  diag.addColorStop(1, grade.sky[1]);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = diag;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const down = ctx.createLinearGradient(0, 0, 0, height);
  down.addColorStop(0, "rgba(0,0,0,0)");
  down.addColorStop(1, grade.shadow);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = down;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Film grain: a scatter of faint light and dark specks. The pattern is
// drawn on a small offscreen tile and stamped across the cover so it
// costs almost nothing even at 1920 px wide.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement("canvas");
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext("2d");
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.random() * 255;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 26;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return tile;
}

export function applyGrain(ctx, width, height) {
  const tile = getGrainTile();
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.55;
  const pattern = ctx.createPattern(tile, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// A soft dark edge that pulls the eye to the middle of the poster.
export function applyVignette(ctx, width, height) {
  const r = Math.hypot(width, height) / 2;
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, r * 0.45,
    width / 2, height / 2, r
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
