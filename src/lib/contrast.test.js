import { describe, it, expect } from "vitest";

/** WCAG 2.1 relative luminance. */
function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Mirrors the tokens in src/index.css and src/App.css.
const PAIRS = [
  ["slogan on teal header", "#FFDF00", "#004040"],
  ["header text on teal", "#e6f2f0", "#004040"],
  ["user bubble text on brand yellow", "#052020", "#FFDF00"],
  ["send button text on brand yellow", "#052020", "#FFDF00"],
  ["assistant bubble text", "#e6f2f0", "#0e2a2a"],
  ["muted text on panel", "#86a5a2", "#0b2222"],
  ["footer link hover on panel", "#FFDF00", "#0b2222"],
  ["error text on background", "#ff6b5e", "#061616"],
];

// TC_029
describe("WCAG AA contrast", () => {
  it.each(PAIRS)("%s meets 4.5:1 for body text", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("sanity-checks the ratio calculation against known values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});
