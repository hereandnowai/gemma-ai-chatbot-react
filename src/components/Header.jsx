import { useState } from "react";
import { MODEL } from "../lib/gemini";

export default function Header({ brand, onReset, canReset }) {
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = brand.logo?.title && !logoBroken;

  return (
    <header className="header">
      <div className="brand">
        {showLogo ? (
          <img
            className="brand-logo"
            src={brand.logo.title}
            alt={brand.organizationName}
            onError={() => setLogoBroken(true)}
          />
        ) : (
          <span className="brand-mark" aria-hidden="true" />
        )}
        <div className="brand-text">
          {!showLogo && <span className="brand-name">{brand.organizationName}</span>}
          <span className="brand-slogan">{brand.slogan}</span>
        </div>
      </div>

      <div className="header-right">
        <code className="model">{MODEL}</code>
        <button className="ghost" onClick={onReset} disabled={!canReset}>
          New chat
        </button>
      </div>
    </header>
  );
}
