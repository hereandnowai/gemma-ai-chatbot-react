import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Composer from "./Composer";

function setup(props = {}) {
  const onSend = vi.fn();
  render(<Composer onSend={onSend} onStop={vi.fn()} isStreaming={false} {...props} />);
  return { onSend, user: userEvent.setup() };
}

describe("Composer", () => {
  it("sends on Enter", async () => {
    const { onSend, user } = setup();
    await user.type(screen.getByPlaceholderText(/send a message/i), "hello{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("inserts a newline on Shift+Enter instead of sending", async () => {
    const { onSend, user } = setup();
    const box = screen.getByPlaceholderText(/send a message/i);
    await user.type(box, "line one{Shift>}{Enter}{/Shift}line two");
    expect(onSend).not.toHaveBeenCalled();
    expect(box).toHaveValue("line one\nline two");
  });

  it("ignores whitespace-only input", async () => {
    const { onSend, user } = setup();
    await user.type(screen.getByPlaceholderText(/send a message/i), "   {Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("offers Stop instead of Send while streaming", () => {
    setup({ isStreaming: true });
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send$/i })).not.toBeInTheDocument();
  });
});
