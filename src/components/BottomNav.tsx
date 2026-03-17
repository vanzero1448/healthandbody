import { useState, useRef, useCallback } from "react";
import "./BottomNav.css";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddText?: () => void;
  onAddPhoto?: () => void;
}

const TABS = [
  {
    id: "food",
    label: "Еда",
    labelActive: "Питание",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: "fitness",
    label: "Фитнес",
    labelActive: "Фитнес",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <rect x="2" y="8.5" width="4" height="7" rx="1" />
        <rect x="18" y="8.5" width="4" height="7" rx="1" />
      </svg>
    ),
  },
] as const;

type TabId = "food" | "fitness";

export function BottomNav({
  activeTab,
  setActiveTab,
  onAddText,
  onAddPhoto,
}: BottomNavProps) {
  const [blobState, setBlobState] = useState<string>(
    activeTab === "fitness" ? "at-right" : "",
  );
  const [hoveredTab, setHoveredTab] = useState<TabId | null>(null);
  const [plusPressed, setPlusPressed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  const spawnRipple = (cx: number, cy: number) => {
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "nav-ripple";
    el.style.left = `${cx - rect.left}px`;
    el.style.top = `${cy - rect.top}px`;
    pillRef.current.appendChild(el);
    setTimeout(() => el.remove(), 600);
  };

  const handleTabClick = useCallback(
    (tab: TabId, e: React.MouseEvent) => {
      if (tab === activeTab) return;
      if (tab === "food") {
        setBlobState("stretch-right");
        setTimeout(() => setBlobState(""), 130);
      } else {
        setBlobState("stretch-left");
        setTimeout(() => setBlobState("at-right"), 130);
      }
      setActiveTab(tab);
      spawnRipple(e.clientX, e.clientY);
    },
    [activeTab, setActiveTab],
  );

  const activeIdx = TABS.findIndex((t) => t.id === activeTab);

  const handleMenuAction = (kind: "text" | "photo") => {
    setPlusOpen(false);
    if (kind === "text") onAddText?.();
    if (kind === "photo") onAddPhoto?.();
  };

  return (
    <>
      {plusOpen && (
        <button
          className="plus-scrim"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setPlusOpen(false)}
        />
      )}
      <div className="bottom-nav">
      {/* PILL */}
      <div className="pill" ref={pillRef}>
        <div className="pill-shimmer" />
        <div className={`pill-blob ${blobState}`} />
        <div className="pill-tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`pill-tab ${isActive ? "active" : ""} ${isHovered && !isActive ? "hovered" : ""}`}
                onClick={(e) => handleTabClick(tab.id, e)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                onTouchStart={() => setHoveredTab(tab.id)}
                onTouchEnd={() => setHoveredTab(null)}
              >
                <span className="pill-tab-icon">{tab.icon}</span>
                <span className="pill-tab-label">
                  {(isActive ? tab.labelActive : tab.label)
                    .split("")
                    .map((ch, i) => (
                      <span
                        key={i}
                        className="pill-tab-char"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        {ch}
                      </span>
                    ))}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="pill-glow"
          style={{ left: activeIdx === 0 ? "12%" : "62%" }}
        />
      </div>

      {/* PLUS BUTTON */}
      <div className="plus-wrap">
        <div className={`plus-menu ${plusOpen ? "open" : ""}`}>
          <span className="plus-menu-cloud" aria-hidden="true" />
          <button
            className="plus-menu-item"
            type="button"
            onClick={() => handleMenuAction("text")}
          >
            <span className="plus-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M13.5 4.5l6 6-8.6 8.6a2 2 0 0 1-1 .55l-4.1.85.85-4.1a2 2 0 0 1 .55-1L13.5 4.5z"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 5.5l6 6"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="plus-menu-text">Калории вручную</span>
          </button>
          <button
            className="plus-menu-item"
            type="button"
            onClick={() => handleMenuAction("photo")}
          >
            <span className="plus-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M7 7l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3z"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3.2"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
            <span className="plus-menu-text">Калории по фото</span>
          </button>
        </div>
        <button
          className={`plus-btn ${plusPressed ? "pressed" : ""} ${plusOpen ? "open" : ""}`}
          onPointerDown={() => setPlusPressed(true)}
          onPointerUp={() => {
            setPlusPressed(false);
            setPlusOpen((prev) => !prev);
          }}
          onPointerLeave={() => setPlusPressed(false)}
          aria-label="Добавить"
          aria-expanded={plusOpen}
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
    </>
  );
}
