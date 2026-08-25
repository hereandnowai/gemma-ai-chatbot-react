import { useEffect, useRef, useState } from "react";
import { streamChat, MODEL, API_KEY } from "./lib/gemini";
import Message from "./components/Message";
import Composer from "./components/Composer";
import "./App.css";

const GREETING = {
  role: "assistant",
  content: "Hi! I'm running on Google AI Studio. Ask me anything.",
};

export default function App() {
  const [messages, setMessages] = useState([GREETING]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(API_KEY ? "" : "Missing VITE_GEMINI_API_KEY — see the README.");
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  // Keep the newest message in view as it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(text) {
    const history = [...messages.slice(1), { role: "user", content: text }];
    setMessages([messages[0], ...history, { role: "assistant", content: "" }]);
    setError("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let received = false;

    try {
      await streamChat(
        history,
        (chunk) => {
          received = true;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      // Drop the placeholder if the model returned nothing at all. That happens
      // when the token budget was fully spent on reasoning before any answer.
      if (!received) {
        setMessages((prev) => prev.slice(0, -1));
        setError((e) => e || "The model returned an empty reply — try rephrasing.");
      }
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function reset() {
    stop();
    setMessages([GREETING]);
    setError("");
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="dot" />
          <h1>Caramel AI</h1>
        </div>
        <div className="header-right">
          <code className="model">{MODEL}</code>
          <button className="ghost" onClick={reset} disabled={messages.length === 1}>
            New chat
          </button>
        </div>
      </header>

      <main className="thread" ref={scrollRef}>
        {messages.map((m, i) => (
          <Message
            key={i}
            role={m.role}
            content={m.content}
            pending={isStreaming && i === messages.length - 1 && !m.content}
          />
        ))}
        {error && <div className="error">{error}</div>}
      </main>

      <Composer onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}
