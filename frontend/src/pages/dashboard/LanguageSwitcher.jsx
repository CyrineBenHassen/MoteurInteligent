import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
  { code: "fr", label: "Français", flag: "🇫🇷", short: "FR" },
  { code: "ar", label: "العربية", flag: "🇩🇿", short: "AR", rtl: true },
];

function GlobeIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2.5 2.5-4 5.5-4 9s1.5 6.5 4 9" />
      <path d="M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9" />
      <path d="M3 12h18" />
      <path d="M3.6 8h16.8M3.6 16h16.8" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function LanguageSwitcher({ lang = "en", setLang, theme = "dark" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isDark = theme !== "light";
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8, cursor: "pointer",
          background: open
            ? isDark ? "rgba(99,102,241,.15)" : "rgba(99,102,241,.08)"
            : isDark ? "rgba(99,102,241,.08)" : "rgba(255,255,255,.9)",
          border: `1px solid ${isDark ? "rgba(99,102,241,.3)" : "rgba(0,0,0,.12)"}`,
          color: isDark ? "#a5b4fc" : "#6366f1",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
          boxShadow: open ? `0 0 0 3px rgba(99,102,241,.12)` : "none",
        }}
      >
        <GlobeIcon size={14} color={isDark ? "#a5b4fc" : "#6366f1"} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
          {current.short}
        </span>
        <ChevronIcon open={open} />
      </button>

{open && (
  <div style={{
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    background: isDark ? "#0d1526" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)"}`,
    borderRadius: 12, padding: 4,
    boxShadow: isDark
      ? "0 12px 40px rgba(0,0,0,.5)"
      : "0 4px 20px rgba(0,0,0,.1)",
    zIndex: 9999, minWidth: 155,
    animation: "dFadeUp .18s ease both",
  }}>
    {LANGUAGES.map(l => {
  const isActive = l.code === lang;
  return (
    <button
      key={l.code}
      onClick={() => { setLang(l.code); setOpen(false); }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "8px 10px", borderRadius: 8,
        background: isActive ? isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)" : "transparent",
        border: "none",
        cursor: "pointer", fontFamily: "inherit",
        textAlign: "left", transition: "background .15s",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Code coloré */}
      <span style={{
        fontSize: 10, fontWeight: 800,
        width: 24, textAlign: "center", flexShrink: 0,
        color: isActive ? "#c9a227" : "#6366f1",
        letterSpacing: ".5px",
      }}>
        {l.short}
      </span>

      <span style={{
        fontSize: 12, fontWeight: isActive ? 700 : 500,
        color: isActive
          ? isDark ? "#e2e8f0" : "#0f172a"
          : isDark ? "#64748b" : "#94a3b8",
        flex: 1,
      }}>
        {l.label}
      </span>

      {isActive && (
        <svg width="12" height="12" fill="none" stroke="#c9a227" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )}
    </button>
  );
})}
  </div>
)}
    </div>
  );
}