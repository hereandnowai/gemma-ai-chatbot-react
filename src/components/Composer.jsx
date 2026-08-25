import { useRef, useState } from "react";

export default function Composer({ onSend, onStop, isStreaming }) {
  const [text, setText] = useState("");
  const taRef = useRef(null);

  function submit(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setText("");
    if (taRef.current) taRef.current.style.height = "auto";
  }

  function onKeyDown(e) {
    // Enter sends, Shift+Enter makes a new line.
    if (e.key === "Enter" && !e.shiftKey) submit(e);
  }

  function grow(e) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={taRef}
        rows={1}
        value={text}
        onChange={grow}
        onKeyDown={onKeyDown}
        placeholder="Send a message…"
      />
      {isStreaming ? (
        <button type="button" className="send stop" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button type="submit" className="send" disabled={!text.trim()}>
          Send
        </button>
      )}
    </form>
  );
}
