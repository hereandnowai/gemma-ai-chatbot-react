/**
 * Loads the HERE AND NOW AI brand definition from public/branding.json.
 *
 * branding.json lives in public/, so it is fetched at runtime rather than
 * bundled. That means it must be requested relative to BASE_URL — a bare
 * '/branding.json' works in dev and 404s on GitHub Pages, which serves the
 * app from a subpath.
 */

// Mirrors branding.json. Used when the fetch fails so the app still renders.
export const FALLBACK_BRAND = {
  organizationName: "HERE AND NOW AI",
  website: "https://hereandnowai.com",
  email: "info@hereandnowai.com",
  mobile: "",
  slogan: "AI is Good",
  colors: { primary: "#FFDF00", secondary: "#004040" },
  logo: { title: "", favicon: "" },
  chatbot: { avatar: "", face: "" },
  socialMedia: {},
};

// Only these schemes may reach an href. React blocks javascript: URLs itself,
// but relying on framework internals for security is the wrong dependency —
// and a blocked URL still renders as a broken link.
//
// Web links only: callers render these as external sites with target="_blank",
// so mailto: and tel: would be mis-rendered. Those are built from the dedicated
// email and mobile fields instead.
const SAFE_SCHEMES = ["http:", "https:"];

/** Returns the URL if its scheme is safe to put in an href, else "". */
export function safeUrl(url) {
  if (typeof url !== "string" || url === "") return "";
  try {
    const parsed = new URL(url, "https://example.invalid");
    return SAFE_SCHEMES.includes(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}

const SOCIAL_LABELS = {
  blog: "Blog",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  github: "GitHub",
  x: "X",
  youtube: "YouTube",
};

/** Turns the socialMedia object into an ordered, renderable list. */
export function toSocialLinks(socialMedia = {}) {
  return Object.entries(socialMedia)
    .map(([key, url]) => ({ key, url: safeUrl(url), label: SOCIAL_LABELS[key] ?? key }))
    .filter((l) => l.url !== "");
}

/** Publishes brand colours as CSS custom properties so styling stays in CSS. */
export function applyBrandColors(colors = {}, root = document.documentElement) {
  if (colors.primary) root.style.setProperty("--brand-primary", colors.primary);
  if (colors.secondary) root.style.setProperty("--brand-secondary", colors.secondary);
}

/** Sets the meta description from branding, so no brand string is hardcoded. */
export function applyMetaDescription(text, doc = document) {
  if (!text) return;
  let tag = doc.querySelector("meta[name='description']");
  if (!tag) {
    tag = doc.createElement("meta");
    tag.name = "description";
    doc.head.appendChild(tag);
  }
  tag.content = text;
}

/** Swaps the favicon to the brand one, if branding.json supplies a URL. */
export function applyFavicon(href, doc = document) {
  if (!href) return;
  let link = doc.querySelector("link[rel='icon']");
  if (!link) {
    link = doc.createElement("link");
    link.rel = "icon";
    doc.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Fetches branding.json. Never throws — a missing or malformed file degrades
 * to FALLBACK_BRAND so a branding problem can't take the chatbot down.
 */
function fallback(reason) {
  // Failing silently is right for users and dangerous for us — without this,
  // nobody ever finds out branding broke.
  console.warn(`[branding] falling back to defaults: ${reason}`);
  return FALLBACK_BRAND;
}

export async function loadBranding(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${import.meta.env.BASE_URL}branding.json`);
    if (!res.ok) return fallback(`HTTP ${res.status}`);
    const json = await res.json();
    const brand = json?.brand;
    if (!brand || typeof brand !== "object") return fallback("no brand object in branding.json");
    // Merge so a partial file still yields every key the UI reads.
    return {
      ...FALLBACK_BRAND,
      ...brand,
      colors: { ...FALLBACK_BRAND.colors, ...(brand.colors ?? {}) },
      logo: { ...FALLBACK_BRAND.logo, ...(brand.logo ?? {}) },
      chatbot: { ...FALLBACK_BRAND.chatbot, ...(brand.chatbot ?? {}) },
      socialMedia: { ...(brand.socialMedia ?? {}) },
    };
  } catch (err) {
    return fallback(err?.message ?? "unknown error");
  }
}
