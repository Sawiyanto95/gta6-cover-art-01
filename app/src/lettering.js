// Caption lettering: the big poster title, the script subtitle and the
// small tagline, drawn on the cover canvas over a dark scrim so the words
// stay readable on any photo.
//
// The title is set in Anton, a heavy condensed display face, in white
// with a dark outline and a hard offset shadow — the look of a poster
// title you can read from across the street. The subtitle is Pacifico,
// a loose script face, in a warm yellow. The tagline is small tracked-out
// capitals. All three shrink to fit the cover width instead of clipping.

// The title block's vertical rhythm: the title sits lowest, the script
// subtitle floats just above it, and the tagline caps the block. Keeping
// the measurements in one place means the preview and the export agree
// on where every line lands.
const TITLE_FONT = "Anton";
const SCRIPT_FONT = "Pacifico";

function fitFont(ctx, text, maxWidth, startPx, family, weight = "") {
  let px = startPx;
  while (px > 18) {
    ctx.font = `${weight} ${px}px ${family}, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

// Split a title into at most two lines that each fit the cover width.
function wrapTitle(ctx, text, maxWidth, startPx) {
  ctx.font = `${startPx}px ${TITLE_FONT}, sans-serif`;
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text];
  // Grow the first line word by word until the next word would overflow.
  let first = words[0];
  let i = 1;
  while (i < words.length) {
    const trial = first + " " + words[i];
    ctx.font = `${startPx}px ${TITLE_FONT}, sans-serif`;
    if (ctx.measureText(trial).width > maxWidth) break;
    first = trial;
    i += 1;
  }
  return [first, words.slice(i).join(" ")];
}

// Draw one line of the title with a dark outline and a hard shadow.
// Letters are drawn one at a time so the tracking stays even.
function drawTitleLine(ctx, line, cx, y, px, tracking) {
  ctx.font = `${px}px ${TITLE_FONT}, sans-serif`;
  const widths = [...line].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (line.length - 1);
  let x = cx - total / 2;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, px * 0.09);
  ctx.strokeStyle = "rgba(20, 4, 24, 0.92)";
  // Hard offset shadow first, then the stroked white letters on top.
  for (let pass = 0; pass < 2; pass++) {
    let pxCursor = x;
    ctx.fillStyle = pass === 0 ? "rgba(20, 4, 24, 0.85)" : "#ffffff";
    ctx.strokeStyle = pass === 0 ? "rgba(20, 4, 24, 0.0)" : "rgba(20, 4, 24, 0.92)";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const dx = pass === 0 ? px * 0.045 : 0;
      const dy = pass === 0 ? px * 0.05 : 0;
      if (pass === 1) ctx.strokeText(ch, pxCursor + dx, y + dy);
      ctx.fillText(ch, pxCursor + dx, y + dy);
      pxCursor += widths[i] + tracking;
    }
  }
}

export function drawTitleBlock(ctx, width, height, caption) {
  const title = (caption.title || "").trim().toUpperCase();
  const subtitle = (caption.subtitle || "").trim();
  const tagline = (caption.tagline || "").trim().toUpperCase();
  if (!title && !subtitle && !tagline) return;

  const pad = width * 0.045;
  const maxWidth = width - pad * 2;

  // Measure the block from the bottom up: tagline, subtitle, title.
  let titlePx = Math.round(width * 0.115);
  const lines = title ? wrapTitle(ctx, title, maxWidth, titlePx) : [];
  if (lines.length > 0) {
    const longest = lines.reduce((a, b) => (a.length > b.length ? a : b));
    titlePx = fitFont(ctx, longest, maxWidth, titlePx, TITLE_FONT);
  }
  const titleHeight = lines.length * titlePx * 1.02;
  const subPx = Math.round(width * 0.042);
  const tagPx = Math.round(width * 0.024);
  const gap = height * 0.012;
  const blockH =
    titleHeight + (subtitle ? subPx * 1.5 + gap : 0) + (tagline ? tagPx * 1.8 + gap : 0);

  // Dark scrim rising from the bottom so the letters sit on something.
  const scrimTop = height - blockH - pad * 1.6;
  const scrim = ctx.createLinearGradient(0, scrimTop, 0, height);
  scrim.addColorStop(0, "rgba(8, 2, 14, 0)");
  scrim.addColorStop(0.45, "rgba(8, 2, 14, 0.62)");
  scrim.addColorStop(1, "rgba(8, 2, 14, 0.88)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, scrimTop, width, height - scrimTop);

  let y = height - pad;
  if (tagline) {
    ctx.font = `600 ${tagPx}px system-ui, sans-serif`;
    // Tracked-out capitals, drawn with manual spacing.
    const track = tagPx * 0.32;
    const tw = [...tagline].reduce((a, ch) => a + ctx.measureText(ch).width, 0)
      + track * (tagline.length - 1);
    let tx = pad + (maxWidth - tw) / 2;
    ctx.fillStyle = "#ffd166";
    ctx.textBaseline = "alphabetic";
    for (const ch of tagline) {
      ctx.fillText(ch, tx, y);
      tx += ctx.measureText(ch).width + track;
    }
    y -= tagPx * 1.8 + gap;
  }
  if (subtitle) {
    const subFit = fitFont(ctx, subtitle, maxWidth, subPx, SCRIPT_FONT);
    ctx.font = `${subFit}px ${SCRIPT_FONT}, cursive`;
    ctx.fillStyle = "#ffe9a8";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(255, 90, 160, 0.8)";
    ctx.shadowBlur = subFit * 0.45;
    const sw = ctx.measureText(subtitle).width;
    ctx.fillText(subtitle, pad + (maxWidth - sw) / 2, y);
    ctx.shadowBlur = 0;
    y -= subFit * 1.5 + gap;
  }
  if (lines.length > 0) {
    const tracking = titlePx * 0.02;
    // Draw from the bottom line up so the first line ends at y.
    for (let i = lines.length - 1; i >= 0; i--) {
      drawTitleLine(ctx, lines[i], width / 2, y, titlePx, tracking);
      y -= titlePx * 1.02;
    }
  }
}
