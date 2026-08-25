import { describe, it, expect } from "vitest";
import { extractAnswerText, toContents } from "./gemini";

const payload = (parts) => ({ candidates: [{ content: { parts } }] });

describe("extractAnswerText", () => {
  it("drops reasoning parts flagged thought:true", () => {
    // Regression guard: this model streams ~20 scratchpad chunks before the
    // answer. Rendering them dumps its monologue into the chat bubble.
    const json = payload([
      { text: "Count: Hello (1), nice (2)... let me reconsider", thought: true },
      { text: "Hello, nice to meet you." },
    ]);
    expect(extractAnswerText(json)).toBe("Hello, nice to meet you.");
  });

  it("returns empty string when the chunk is reasoning only", () => {
    expect(extractAnswerText(payload([{ text: "thinking…", thought: true }]))).toBe("");
  });

  it("joins multiple answer parts", () => {
    expect(extractAnswerText(payload([{ text: "Hello, " }, { text: "world." }]))).toBe(
      "Hello, world."
    );
  });

  it("survives keep-alive and malformed payloads", () => {
    expect(extractAnswerText({})).toBe("");
    expect(extractAnswerText(null)).toBe("");
    expect(extractAnswerText(payload([{}]))).toBe("");
  });
});

describe("toContents", () => {
  it("maps assistant turns to the model role the API expects", () => {
    const contents = toContents([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "who are you?" },
    ]);
    expect(contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
  });

  it("prepends the persona to the first turn only", () => {
    // Gemma rejects systemInstruction, so the persona rides on turn one.
    const contents = toContents([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
    expect(contents[0].parts[0].text).toContain("friendly, concise assistant");
    expect(contents[0].parts[0].text).toContain("hi");
    expect(contents[1].parts[0].text).toBe("hello");
  });
});
