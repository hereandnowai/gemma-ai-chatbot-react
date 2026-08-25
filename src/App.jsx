import { useEffect, useRef, useState } from "react";
import { streamChat, API_KEY } from "./lib/gemini";
import {
  loadBranding,
  applyBrandColors,
  applyFavicon,
  applyMetaDescription,
  FALLBACK_BRAND,
} from "./lib/branding";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Message from "./components/Message";
import EmptyState from "./components/EmptyState";
import Composer from "./components/Composer";
import "./App.css";

export default function App() {
  const [brand, setBrand] = useState(FALLBACK_BRAND);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(
    API_KEY ? "" : "Missing VITE_GEMINI_API_KEY — see the README."
  );
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  // Branding drives colours and the favicon, so apply it as soon as it lands.
  useEffect(() => {
    let cancelled = false;
    loadBranding().then((b) => {
      if (cancelled) return;
      setBrand(b);
      applyBrandColors(b.colors);
      applyFavicon(b.logo?.favicon);
      if (b.organizationName) {
        document.title = `${b.organizationName} — Chatbot`;
        applyMetaDescription(
          [b.organizationName, b.slogan].filter(Boolean).join(" — ")
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the newest message in view as it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(text) {
    const history = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
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
    setMessages([]);
    setError("");
  }

  return (
    <div className="app">
      <Header
        brand={brand}
        onReset={reset}
        canReset={messages.length > 0 && !isStreaming}
      />

      <main className="thread" ref={scrollRef}>
        {messages.length === 0 && !error && <EmptyState brand={brand} />}

        {messages.map((m, i) => (
          <Message
            key={i}
            role={m.role}
            content={m.content}
            avatar={brand.chatbot?.avatar}
            pending={isStreaming && i === messages.length - 1 && !m.content}
          />
        ))}

        {error && <div className="error">{error}</div>}
      </main>

      <Composer onSend={send} onStop={stop} isStreaming={isStreaming} />
      <Footer brand={brand} />
    </div>
  );
}
