import { describe, it, expect, vi } from "vitest";
import {
  loadBranding,
  toSocialLinks,
  applyBrandColors,
  applyFavicon,
  FALLBACK_BRAND,
} from "./branding";

const ok = (body) => ({ ok: true, json: async () => body });

describe("loadBranding", () => {
  it("reads branding.json relative to BASE_URL, not from the site root", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ brand: { slogan: "AI is Good" } }));
    await loadBranding(fetchImpl);
    const url = fetchImpl.mock.calls[0][0];
    // A bare '/branding.json' works in dev and 404s on GitHub Pages.
    expect(url).toBe(`${import.meta.env.BASE_URL}branding.json`);
  });

  it("returns the brand when the file loads", async () => {
    const brand = await loadBranding(
      vi.fn().mockResolvedValue(ok({ brand: { organizationName: "HERE AND NOW AI" } }))
    );
    expect(brand.organizationName).toBe("HERE AND NOW AI");
  });

  it("fills gaps from the fallback so a partial file still renders", async () => {
    const brand = await loadBranding(
      vi.fn().mockResolvedValue(ok({ brand: { colors: { primary: "#123456" } } }))
    );
    expect(brand.colors.primary).toBe("#123456");
    expect(brand.colors.secondary).toBe(FALLBACK_BRAND.colors.secondary);
    expect(brand.slogan).toBe(FALLBACK_BRAND.slogan);
  });

  it("falls back on a 404 instead of throwing", async () => {
    const brand = await loadBranding(vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(brand).toEqual(FALLBACK_BRAND);
  });

  it("falls back when the network call rejects", async () => {
    const brand = await loadBranding(vi.fn().mockRejectedValue(new Error("offline")));
    expect(brand).toEqual(FALLBACK_BRAND);
  });

  it("falls back when the JSON is malformed", async () => {
    const brand = await loadBranding(
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("bad json");
        },
      })
    );
    expect(brand).toEqual(FALLBACK_BRAND);
  });

  it("falls back when brand is a string rather than an object", async () => {
    // TC_008 — guards against spreading a non-object.
    const brand = await loadBranding(vi.fn().mockResolvedValue(ok({ brand: "HERE AND NOW AI" })));
    expect(brand).toEqual(FALLBACK_BRAND);
  });

  it("falls back when the file is valid JSON but has no brand key", async () => {
    const brand = await loadBranding(vi.fn().mockResolvedValue(ok({ nope: true })));
    expect(brand).toEqual(FALLBACK_BRAND);
  });
});

describe("toSocialLinks", () => {
  it("labels known networks and preserves order", () => {
    const links = toSocialLinks({ linkedin: "https://a", x: "https://b" });
    expect(links).toEqual([
      { key: "linkedin", url: "https://a", label: "LinkedIn" },
      { key: "x", url: "https://b", label: "X" },
    ]);
  });

  it("labels an unknown network with its raw key rather than dropping it", () => {
    // TC_012
    const links = toSocialLinks({ mastodon: "https://mastodon.social/@hereandnowai" });
    expect(links).toEqual([
      { key: "mastodon", url: "https://mastodon.social/@hereandnowai", label: "mastodon" },
    ]);
  });

  it("drops empty entries and tolerates a missing object", () => {
    expect(toSocialLinks({ blog: "", github: "https://g" })).toHaveLength(1);
    expect(toSocialLinks()).toEqual([]);
  });
});

describe("applyBrandColors", () => {
  it("publishes colours as CSS custom properties", () => {
    const root = document.createElement("div");
    applyBrandColors({ primary: "#FFDF00", secondary: "#004040" }, root);
    expect(root.style.getPropertyValue("--brand-primary")).toBe("#FFDF00");
    expect(root.style.getPropertyValue("--brand-secondary")).toBe("#004040");
  });

  it("leaves existing values alone when colours are absent", () => {
    const root = document.createElement("div");
    root.style.setProperty("--brand-primary", "#000000");
    applyBrandColors({}, root);
    expect(root.style.getPropertyValue("--brand-primary")).toBe("#000000");
  });
});

describe("applyFavicon", () => {
  it("creates the link element when the page has none", () => {
    const doc = document.implementation.createHTMLDocument();
    applyFavicon("https://example.com/icon.png", doc);
    expect(doc.querySelector("link[rel='icon']").href).toBe("https://example.com/icon.png");
  });

  it("does nothing when branding supplies no favicon", () => {
    const doc = document.implementation.createHTMLDocument();
    applyFavicon("", doc);
    expect(doc.querySelector("link[rel='icon']")).toBeNull();
  });
});

describe("fallback diagnostics", () => {
  it("warns on the console so a silent fallback is still discoverable", async () => {
    // A silent failure is right for users and dangerous for us — nobody finds
    // out branding broke. See "Risk-Based Insights" in the test-case doc.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await loadBranding(vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
