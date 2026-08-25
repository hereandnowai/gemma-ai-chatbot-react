import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";
import { FALLBACK_BRAND } from "../lib/branding";

const brand = {
  ...FALLBACK_BRAND,
  website: "https://hereandnowai.com",
  email: "info@hereandnowai.com",
  mobile: "+91 996 296 1000",
  socialMedia: {
    linkedin: "https://www.linkedin.com/company/hereandnowai/",
    github: "https://github.com/hereandnowai",
  },
};

describe("Footer", () => {
  // TC_024 — Security
  it("gives every external link rel=noreferrer so it cannot reach window.opener", () => {
    render(<Footer brand={brand} />);
    const external = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("target") === "_blank");

    expect(external.length).toBeGreaterThan(0);
    for (const a of external) {
      expect(a.getAttribute("rel") ?? "").toContain("noreferrer");
    }
  });

  // TC_025 — Security
  it("refuses to render a javascript: URL as a live link", () => {
    render(<Footer brand={{ ...brand, socialMedia: { blog: "javascript:alert(1)" } }} />);
    for (const a of screen.getAllByRole("link")) {
      expect(a.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    }
  });

  // TC_025 — the safe schemes must still work
  it("keeps http and https links intact", () => {
    render(<Footer brand={brand} />);
    expect(screen.getByText("GitHub")).toHaveAttribute(
      "href",
      "https://github.com/hereandnowai"
    );
  });

  it("renders the contact phone number from branding", () => {
    render(<Footer brand={brand} />);
    expect(screen.getByText("+91 996 296 1000")).toBeInTheDocument();
  });

  it("omits the phone number when branding does not supply one", () => {
    render(<Footer brand={{ ...brand, mobile: "" }} />);
    expect(screen.queryByText(/\+91/)).not.toBeInTheDocument();
  });
});
