import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header";
import { FALLBACK_BRAND } from "../lib/branding";

// TC_026 — Security
describe("Header rendering safety", () => {
  it("renders branding text as text, never as markup", () => {
    const brand = {
      ...FALLBACK_BRAND,
      organizationName: "HERE AND NOW AI",
      slogan: "<img src=x onerror=alert(1)>",
      logo: { title: "", favicon: "" },
    };
    const { container } = render(<Header brand={brand} onReset={vi.fn()} canReset={false} />);

    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
