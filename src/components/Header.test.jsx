import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import Header from "./Header";
import { FALLBACK_BRAND } from "../lib/branding";

const brand = {
  ...FALLBACK_BRAND,
  organizationName: "HERE AND NOW AI",
  slogan: "AI is Good",
  logo: { title: "https://example.com/logo.png", favicon: "" },
};

describe("Header", () => {
  it("renders the slogan from branding", () => {
    render(<Header brand={brand} onReset={vi.fn()} canReset={false} />);
    expect(screen.getByText("AI is Good")).toBeInTheDocument();
    expect(screen.queryByText("HERE AND NOW AI")).not.toBeInTheDocument();
  });

  it("shows the brand logo with the organisation as alt text", () => {
    render(<Header brand={brand} onReset={vi.fn()} canReset={false} />);
    expect(screen.getByAltText("HERE AND NOW AI")).toHaveAttribute(
      "src",
      "https://example.com/logo.png"
    );
  });

  it("shows the organisation name when the remote logo fails to load", () => {
    render(<Header brand={brand} onReset={vi.fn()} canReset={false} />);
    fireEvent.error(screen.getByAltText("HERE AND NOW AI"));
    expect(screen.queryByAltText("HERE AND NOW AI")).not.toBeInTheDocument();
    expect(screen.getByText("HERE AND NOW AI")).toBeInTheDocument();
  });

  it("disables New chat when there is nothing to reset", () => {
    render(<Header brand={brand} onReset={vi.fn()} canReset={false} />);
    expect(screen.getByRole("button", { name: /new chat/i })).toBeDisabled();
  });
});
