import { useState } from "react";

/**
 * The first thing a visitor sees. Leads with the brand promise rather than a
 * generic greeting bubble.
 */
export default function EmptyState({ brand }) {
  const [faceBroken, setFaceBroken] = useState(false);
  const face = brand.chatbot?.face || brand.chatbot?.avatar;

  return (
    <div className="empty">
      {face && !faceBroken && (
        <img
          className="empty-face"
          src={face}
          alt=""
          onError={() => setFaceBroken(true)}
        />
      )}
      <p className="empty-slogan">{brand.slogan}</p>
      <p className="empty-hint">Ask anything to get started.</p>
    </div>
  );
}
