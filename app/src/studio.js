// Neon Coast Cover Studio — the editor.
//
// One render function draws the whole cover at any size, so the live
// preview and the exported PNG are the same drawing: the preview is just
// a small render, the export is the same render at 1080 or 1920 pixels.
// Photos stay on the user's machine the whole time; nothing is uploaded.

import { LAYOUTS, layoutById, panelRects } from "./layouts.js";
import { GRADES, gradeById, applyGrade, applyGrain, applyVignette } from "./grades.js";
import { drawTitleBlock } from "./lettering.js";

export const EXPORT_SIZES = [
  { id: "square", label: "1080 × 1080", w: 1080, h: 1080 },
  { id: "portrait", label: "1080 × 1350", w: 1080, h: 1350 },
  { id: "wide", label: "1920 × 1080", w: 1920, h: 1080 },
];

const SAMPLES = [
  { id: "boulevard", name: "Boulevard sunset", src: "samples/boulevard.jpg" },
  { id: "pier", name: "Pier at dusk", src: "samples/pier.jpg" },
];

// One panel's photo settings: which photo fills it, how far it is zoomed
// and where it sits. Offsets are fractions of the panel size.
function freshPanel(photoId) {
  return { photo: photoId, zoom: 1, ox: 0, oy: 0, fit: "fill" };
}

const state = {
  layout: "trio",
  grade: "sunset",
  grain: true,
  vignette: true,
  size: "square",
  title: "Neon Coast",
  subtitle: "where the sun never sets",
  tagline: "A cover story",
  photos: [], // { id, name, img }
  panels: [], // one entry per panel of the current layout
  selected: 0,
};

function ensurePanels() {
  const layout = layoutById(state.layout);
  const count = layout.panels(1, 1).length;
  const firstPhoto = state.photos[0] ? state.photos[0].id : null;
  while (state.panels.length < count) {
    // Spread the photos across the panels at first, so a fresh layout
    // already looks like a finished poster.
    const pick = state.photos[state.panels.length % Math.max(1, state.photos.length)];
    state.panels.push(freshPanel(pick ? pick.id : firstPhoto));
  }
  state.panels.length = count;
  if (state.selected >= count) state.selected = 0;
}

function photoById(id) {
  return state.photos.find((p) => p.id === id) || null;
}

// --- drawing ---------------------------------------------------------------

// Draw one photo into one panel, honouring its zoom, pan and fit mode.
function drawPhotoInto(ctx, rect, img, panel) {
  const pw = rect.w;
  const ph = rect.h;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = panel.fit === "fit"
    ? Math.min(pw / iw, ph / ih)
    : Math.max(pw / iw, ph / ih);
  const scale = base * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (pw - dw) / 2 + panel.ox * pw;
  const dy = rect.y + (ph - dh) / 2 + panel.oy * ph;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel.fit === "fit") {
    ctx.fillStyle = "#12060f";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// The whole cover, at any pixel size. Preview and export both call this.
export function renderCover(ctx, width, height, s = state) {
  const layout = layoutById(s.layout);
  const rects = panelRects(layout, width, height, Math.max(2, Math.round(width / 220)));
  ctx.fillStyle = "#0d0510";
  ctx.fillRect(0, 0, width, height);
  rects.forEach((rect, i) => {
    const panel = s.panels[i] || freshPanel(null);
    const photo = panel.photo ? photoById(panel.photo) : null;
    if (photo && photo.img) {
      drawPhotoInto(ctx, rect, photo.img, panel);
    } else {
      // An empty panel is a dark placeholder with a dashed frame, so the
      // layout still reads while the user picks photos.
      ctx.fillStyle = "#1c0f22";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = Math.max(1, width / 700);
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${Math.max(12, Math.round(width / 45))}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add a photo", rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
  });
  // A thin white frame between the panels, poster style.
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(2, Math.round(width / 540));
  rects.forEach((r) => ctx.strokeRect(r.x, r.y, r.w, r.h));
  applyGrade(ctx, width, height, gradeById(s.grade));
  if (s.grain) applyGrain(ctx, width, height);
  if (s.vignette) applyVignette(ctx, width, height);
  drawTitleBlock(ctx, width, height, {
    title: s.title,
    subtitle: s.subtitle,
    tagline: s.tagline,
  });
}

// --- preview ---------------------------------------------------------------

const stage = document.getElementById("stage");
const stageCtx = stage.getContext("2d");

function sizeForPreview() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
  // Small enough that the whole cover and the export buttons fit on a
  // laptop screen without scrolling, big enough to judge the lettering.
  const maxSide = 620;
  const scale = Math.min(1, maxSide / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

export function renderPreview() {
  ensurePanels();
  const { w, h } = sizeForPreview();
  if (stage.width !== w || stage.height !== h) {
    stage.width = w;
    stage.height = h;
  }
  renderCover(stageCtx, w, h);
  drawSelection();
  syncPanelControls();
}

// Outline the selected panel on the preview so the user can see which
// panel the sliders and the photo picker are about.
function drawSelection() {
  const layout = layoutById(state.layout);
  const rects = panelRects(layout, stage.width, stage.height, Math.max(2, Math.round(stage.width / 220)));
  const r = rects[state.selected];
  if (!r) return;
  stageCtx.save();
  stageCtx.strokeStyle = "#ff2e88";
  stageCtx.lineWidth = 3;
  stageCtx.setLineDash([12, 6]);
  stageCtx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  stageCtx.setLineDash([]);
  stageCtx.fillStyle = "#ff2e88";
  stageCtx.font = "bold 13px system-ui, sans-serif";
  stageCtx.textAlign = "left";
  stageCtx.textBaseline = "top";
  stageCtx.fillText(`Panel ${state.selected + 1}`, r.x + 10, r.y + 10);
  stageCtx.restore();
}

// --- export ----------------------------------------------------------------

// Download the cover in all three post sizes at once, one file each.
// The renders are cheap enough to run back to back, and it saves the
// user three clicks when they want the whole set.
export async function exportAllSizes() {
  for (const size of EXPORT_SIZES) {
    await exportCover(size.id);
    await new Promise((r) => setTimeout(r, 250));
  }
}

export function exportCover(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  renderCover(off.getContext("2d"), size.w, size.h);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(blob);
    }, "image/png");
  });
}

// Same render, handed back as a data URL so automated shots can save it.
export function exportDataURL(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  renderCover(off.getContext("2d"), size.w, size.h);
  return off.toDataURL("image/png");
}

// --- photos ----------------------------------------------------------------

function addPhoto(fileOrSrc, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const photo = {
        id: "p" + Math.random().toString(36).slice(2, 9),
        name: name || "Photo",
        img,
      };
      state.photos.push(photo);
      // Empty panels take the new photo; otherwise the first panel does
      // not, so an upload never wipes a layout the user already set.
      ensurePanels();
      state.panels.forEach((p) => {
        if (!p.photo) p.photo = photo.id;
      });
      renderPhotoStrip();
      renderPreview();
      resolve(photo);
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    if (typeof fileOrSrc === "string") img.src = fileOrSrc;
    else img.src = URL.createObjectURL(fileOrSrc);
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    if (state.photos.some((p) => p.id === s.id)) continue;
    try {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = s.src;
      });
      state.photos.push({ id: s.id, name: s.name, img });
    } catch (e) {
      // A missing sample just means that slot stays empty; the app
      // still works with the user's own uploads.
    }
  }
  ensurePanels();
  renderPhotoStrip();
  renderPreview();
}

// --- controls --------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function renderPhotoStrip() {
  const strip = $("photo-strip");
  strip.innerHTML = "";
  state.photos.forEach((photo) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb";
    btn.title = photo.name + " — click to put it in the selected panel";
    const img = document.createElement("img");
    img.src = photo.img.src;
    img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener("click", () => {
      ensurePanels();
      state.panels[state.selected].photo = photo.id;
      renderPreview();
    });
    strip.appendChild(btn);
  });
  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = state.photos.length
    ? "Click a thumbnail to fill the selected panel with it."
    : "Add a photo or try a sample below.";
  strip.appendChild(hint);
}

function buildLayoutPicker() {
  const wrap = $("layout-picker");
  LAYOUTS.forEach((layout) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layout-btn";
    btn.dataset.layout = layout.id;
    // A tiny live sketch of the layout, drawn with plain divs.
    const sketch = document.createElement("span");
    sketch.className = "sketch sketch-" + layout.id;
    layout.panels(1, 1).forEach(() => {
      const cell = document.createElement("i");
      sketch.appendChild(cell);
    });
    const label = document.createElement("span");
    label.textContent = layout.name;
    btn.append(sketch, label);
    btn.title = layout.hint;
    btn.addEventListener("click", () => {
      state.layout = layout.id;
      state.selected = 0;
      document.querySelectorAll(".layout-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.layout === layout.id));
      renderPreview();
    });
    wrap.appendChild(btn);
  });
  wrap.querySelector('[data-layout="trio"]').classList.add("active");
}

function buildGradePicker() {
  const wrap = $("grade-picker");
  GRADES.forEach((grade) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "grade-btn";
    btn.dataset.grade = grade.id;
    btn.style.background = `linear-gradient(135deg, ${grade.sky[0].replace(/[\d.]+\)$/, "0.95)")}, ${grade.sky[1].replace(/[\d.]+\)$/, "0.95)")})`;
    btn.textContent = grade.name;
    btn.title = grade.hint;
    btn.addEventListener("click", () => {
      state.grade = grade.id;
      document.querySelectorAll(".grade-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.grade === grade.id));
      renderPreview();
    });
    wrap.appendChild(btn);
  });
  wrap.querySelector('[data-grade="sunset"]').classList.add("active");
}

function buildSizePicker() {
  const wrap = $("size-picker");
  EXPORT_SIZES.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-btn";
    btn.dataset.size = size.id;
    btn.textContent = size.label;
    btn.addEventListener("click", () => {
      state.size = size.id;
      document.querySelectorAll(".size-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.size === size.id));
      renderPreview();
    });
    wrap.appendChild(btn);
  });
  wrap.querySelector('[data-size="square"]').classList.add("active");
}

function syncPanelControls() {
  ensurePanels();
  const panel = state.panels[state.selected];
  if (!panel) return;
  $("panel-label").textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  const sel = $("panel-photo");
  sel.innerHTML = "";
  state.photos.forEach((photo) => {
    const opt = document.createElement("option");
    opt.value = photo.id;
    opt.textContent = photo.name;
    if (photo.id === panel.photo) opt.selected = true;
    sel.appendChild(opt);
  });
  $("zoom").value = panel.zoom;
  $("zoom-val").textContent = Math.round(panel.zoom * 100) + "%";
  $("fit-toggle").checked = panel.fit === "fit";
}

function bindControls() {
  $("upload").addEventListener("change", (e) => {
    [...e.target.files].forEach((f) => addPhoto(f, f.name));
    e.target.value = "";
  });

  // Drag and drop anywhere over the preview.
  const drop = $("dropzone");
  ["dragover", "dragenter"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => {
    [...e.dataTransfer.files]
      .filter((f) => f.type.startsWith("image/"))
      .forEach((f) => addPhoto(f, f.name));
  });

  $("sample-btn").addEventListener("click", loadSamples);

  $("title").addEventListener("input", (e) => { state.title = e.target.value; renderPreview(); });
  $("subtitle").addEventListener("input", (e) => { state.subtitle = e.target.value; renderPreview(); });
  $("tagline").addEventListener("input", (e) => { state.tagline = e.target.value; renderPreview(); });

  $("panel-photo").addEventListener("change", (e) => {
    state.panels[state.selected].photo = e.target.value;
    renderPreview();
  });
  $("zoom").addEventListener("input", (e) => {
    state.panels[state.selected].zoom = parseFloat(e.target.value);
    renderPreview();
  });
  $("fit-toggle").addEventListener("change", (e) => {
    state.panels[state.selected].fit = e.target.checked ? "fit" : "fill";
    renderPreview();
  });
  $("reset-panel").addEventListener("click", () => {
    const first = state.photos[0] ? state.photos[0].id : null;
    state.panels[state.selected] = freshPanel(first);
    renderPreview();
  });

  $("grain").addEventListener("change", (e) => { state.grain = e.target.checked; renderPreview(); });
  $("vignette").addEventListener("change", (e) => { state.vignette = e.target.checked; renderPreview(); });

  document.querySelectorAll(".export-btn").forEach((btn) => {
    btn.addEventListener("click", () => exportCover(btn.dataset.size));
  });

  // Click a panel to select it, drag to pan its photo, wheel to zoom.
  let drag = null;
  function panelAt(x, y) {
    const r = stage.getBoundingClientRect();
    const px = (x - r.left) * (stage.width / r.width);
    const py = (y - r.top) * (stage.height / r.height);
    const layout = layoutById(state.layout);
    const rects = panelRects(layout, stage.width, stage.height, Math.max(2, Math.round(stage.width / 220)));
    const i = rects.findIndex((rc) => px >= rc.x && px < rc.x + rc.w && py >= rc.y && py < rc.y + rc.h);
    return { index: i, px, py, rect: rects[i] };
  }
  stage.addEventListener("pointerdown", (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (hit.index < 0) return;
    state.selected = hit.index;
    drag = { x: hit.px, y: hit.py, ox: state.panels[hit.index].ox, oy: state.panels[hit.index].oy };
    stage.setPointerCapture(e.pointerId);
    renderPreview();
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const hit = panelAt(e.clientX, e.clientY);
    const panel = state.panels[state.selected];
    const rect = panelRects(layoutById(state.layout), stage.width, stage.height)[state.selected];
    if (!rect) return;
    panel.ox = drag.ox + (hit.px - drag.x) / rect.w;
    panel.oy = drag.oy + (hit.py - drag.y) / rect.h;
    // Keep the photo from sliding clean off its panel.
    panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
    panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
    renderPreview();
  });
  stage.addEventListener("pointerup", () => { drag = null; });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const hit = panelAt(e.clientX, e.clientY);
    const i = hit.index >= 0 ? hit.index : state.selected;
    const panel = state.panels[i];
    panel.zoom = Math.max(0.5, Math.min(4, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    state.selected = i;
    renderPreview();
  }, { passive: false });
}

// --- boot ------------------------------------------------------------------

// The fonts have to be ready before the first render, or the title falls
// back to a plain sans and the preview lies about the export.
async function boot() {
  buildLayoutPicker();
  buildGradePicker();
  buildSizePicker();
  bindControls();
  try {
    await Promise.all([
      document.fonts.load('64px Anton'),
      document.fonts.load('32px Pacifico'),
    ]);
  } catch (e) {
    // If a font file fails, the canvas still draws with the fallback.
  }
  await loadSamples();
  renderPreview();
}

// A small handle for automated screenshots: load samples, set the cover
// up and hand back an exported PNG as a data URL.
window.__studio = {
  state,
  renderPreview,
  exportDataURL,
  loadSamples,
  setCaption(title, subtitle, tagline) {
    if (title !== undefined) { state.title = title; $("title").value = title; }
    if (subtitle !== undefined) { state.subtitle = subtitle; $("subtitle").value = subtitle; }
    if (tagline !== undefined) { state.tagline = tagline; $("tagline").value = tagline; }
    renderPreview();
  },
  setLayout(id) {
    state.layout = id;
    state.selected = 0;
    document.querySelectorAll(".layout-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.layout === id));
    renderPreview();
  },
  setGrade(id) {
    state.grade = id;
    document.querySelectorAll(".grade-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.grade === id));
    renderPreview();
  },
  setSize(id) {
    state.size = id;
    document.querySelectorAll(".size-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.size === id));
    renderPreview();
  },
  exportAllSizes,
  ready() {
    return state.photos.length > 0 && document.fonts.check('64px Anton');
  },
};

boot();
