// Panel geometry for the cover layouts.
//
// Every layout is a function of the cover size: it hands back a list of
// panels, each one a rectangle in fractions of the cover (x, y, w, h all
// between 0 and 1). The renderer turns those fractions into pixels, so the
// same layout works for a square post, a portrait post and a wide banner.
// The title block is drawn over the bottom of the cover afterwards, so the
// panels always fill the whole frame edge to edge.

export const LAYOUTS = [
  {
    id: "full",
    name: "Full Bleed",
    hint: "One photo, edge to edge",
    panels(w, h) {
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    },
  },
  {
    id: "duo",
    name: "Duo Split",
    hint: "Two photos side by side",
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.5, h: 1 },
        { x: 0.5, y: 0, w: 0.5, h: 1 },
      ];
    },
  },
  {
    id: "trio",
    name: "Trio",
    hint: "Hero on top, two below",
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 1, h: 0.62 },
        { x: 0, y: 0.62, w: 0.5, h: 0.38 },
        { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
      ];
    },
  },
  {
    id: "quad",
    name: "Quad Grid",
    hint: "Four equal panels",
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ];
    },
  },
  {
    id: "hero3",
    name: "Hero + 3",
    hint: "Big panel left, three stacked right",
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.62, h: 1 },
        { x: 0.62, y: 0, w: 0.38, h: 1 / 3 },
        { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3 },
        { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3 },
      ];
    },
  },
];

// How many panels a layout has — the editor uses this to size its
// per-panel settings when the user switches layouts.
export function layoutPanelCount(layout) {
  return layout.panels(1, 1).length;
}

// Look a layout up by id; fall back to the first one so a bad id never
// leaves the cover without panels.
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Turn a layout's fractional panels into pixel rectangles for a cover of
// this size, leaving a thin gutter between neighbours so the panels read
// as separate shots on the poster.
export function panelRects(layout, width, height, gutter = 6) {
  const raw = layout.panels(width, height);
  return raw.map((p) => {
    const x = Math.round(p.x * width);
    const y = Math.round(p.y * height);
    const w = Math.round(p.w * width);
    const h = Math.round(p.h * height);
    // Shrink each panel by half a gutter on every side that touches a
    // neighbour; panels on the outer edge keep the full bleed.
    const left = p.x > 0 ? gutter / 2 : 0;
    const top = p.y > 0 ? gutter / 2 : 0;
    const right = p.x + p.w < 1 ? gutter / 2 : 0;
    const bottom = p.y + p.h < 1 ? gutter / 2 : 0;
    return {
      x: x + left,
      y: y + top,
      w: w - left - right,
      h: h - top - bottom,
    };
  });
}
