const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemma-4-31b-it";
export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Gemma models on the Google AI Studio API do not accept `systemInstruction`,
// so the persona is prepended to the first user turn instead.
const SYSTEM_PROMPT =
  "You are a friendly, concise assistant. Answer clearly and keep replies short unless asked for detail.";

export function toContents(messages) {
  return messages.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: i === 0 ? `${SYSTEM_PROMPT}\n\n${m.content}` : m.content }],
  }));
}

/**
 * Pulls the answer text out of one streamed SSE payload.
 *
 * This model streams its reasoning as parts flagged `thought: true`. Those are
 * internal scratchpad — rendering them dumps the model's entire monologue into
 * the chat bubble, so only unflagged parts count as the answer.
 */
export function extractAnswerText(json) {
  return (
    json?.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("") ?? ""
  );
}

/**
 * Streams a reply from Google AI Studio.
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages full chat history
 * @param {(chunk: string) => void} onChunk called with each new piece of text
 * @param {AbortSignal} signal lets the caller stop mid-stream
 */
export async function streamChat(messages, onChunk, signal) {
  if (!API_KEY) {
    throw new Error(
      "No API key found. Copy .env.example to .env and set VITE_GEMINI_API_KEY, then restart the dev server."
    );
  }

  const res = await fetch(
    `${API_BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: toContents(messages),
        // Reasoning tokens count against this budget too, and this model thinks
        // at length — a small cap gets spent on thoughts and truncates the answer.
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let message = `${res.status} ${res.statusText}`;
    try {
      message = JSON.parse(detail).error?.message || message;
    } catch {
      /* not JSON — keep the status line */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // last line may be a partial event

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const text = extractAnswerText(JSON.parse(payload));
        if (text) onChunk(text);
      } catch {
        /* ignore a malformed keep-alive event */
      }
    }
  }
}
