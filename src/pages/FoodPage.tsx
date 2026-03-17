import { useState } from "react";
import type { CSSProperties } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";
import "./FoodPage.css";

const triggerHaptic = (style: TelegramHapticStyle = "light") => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  } else if (navigator.vibrate) {
    navigator.vibrate(10);
  }
};

const WEEK_DATES = [
  { day: "Пт", date: "13" },
  { day: "Сб", date: "14" },
  { day: "Вс", date: "15" },
  { day: "Пн", date: "16" },
  { day: "Вт", date: "17" },
];

const MACROS = [
  { label: "Белки", value: 87, goal: 150, unit: "г", color: "#000000" },
  { label: "Жиры", value: 54, goal: 80, unit: "г", color: "#FF9500" },
  { label: "Углев.", value: 210, goal: 280, unit: "г", color: "#007AFF" },
];

const MEALS = [
  {
    name: "Завтрак",
    time: "08:30",
    kcal: 520,
    items: ["Овсянка с ягодами", "Яйцо варёное", "Кофе"],
  },
  {
    name: "Обед",
    time: "13:15",
    kcal: 740,
    items: ["Куриная грудка", "Гречка", "Салат"],
  },
  {
    name: "Ужин",
    time: "19:45",
    kcal: 490,
    items: ["Лосось на пару", "Брокколи"],
  },
  { name: "Перекус", time: "--:--", kcal: 0, items: [] },
];

type CounterId = "water" | "fiber" | "sodium" | "sugar";
const COUNTER_GOALS: Record<CounterId, number> = {
  water: 2500,
  fiber: 30,
  sodium: 2300,
  sugar: 50,
};
const COUNTERS = [
  {
    id: "water" as CounterId,
    label: "Вода",
    value: 1400,
    goal: COUNTER_GOALS.water,
    unit: "мл",
    icon: "💧",
    adds: [250, 500],
    colorVar: "#32ADE6",
  },
  {
    id: "fiber" as CounterId,
    label: "Клетчатка",
    value: 18,
    goal: COUNTER_GOALS.fiber,
    unit: "г",
    icon: "🌾",
    adds: [2, 5],
    colorVar: "#34C759",
  },
  {
    id: "sodium" as CounterId,
    label: "Натрий",
    value: 1840,
    goal: COUNTER_GOALS.sodium,
    unit: "мг",
    icon: "🧂",
    adds: [100, 500],
    colorVar: "#FF453A",
  },
  {
    id: "sugar" as CounterId,
    label: "Сахар",
    value: 32,
    goal: COUNTER_GOALS.sugar,
    unit: "г",
    icon: "🍬",
    adds: [5, 15],
    colorVar: "#FFCC00",
  },
];

interface RadialProgressProps {
  value: number;
  goal: number;
  color: string;
  strokeWidth?: number;
}

function RadialProgress({
  value,
  goal,
  color,
  strokeWidth = 8,
}: RadialProgressProps) {
  const size = 100;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / goal, 1);
  const dash = pct * circ;

  return (
    <div className="radial-wrapper">
      <svg viewBox={`0 0 ${size} ${size}`} className="radial-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="radial-bar"
          style={
            {
              "--dash": `${dash}`,
              "--circ": `${circ}`,
            } as CSSProperties
          }
        />
      </svg>
    </div>
  );
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 100;
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const dash = pct * circ;
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div className="calorie-hero-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="radial-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#000000"
          strokeWidth={sw}
          strokeLinecap="round"
          className="radial-bar"
          style={
            {
              "--dash": `${dash}`,
              "--circ": `${circ}`,
            } as CSSProperties
          }
        />
      </svg>
      <div className="calorie-hero-inner">
        <span className="calorie-hero-num">{consumed}</span>
        <span className="calorie-hero-label">Съедено ккал</span>
        <div className="calorie-hero-badge">{remaining} осталось</div>
      </div>
    </div>
  );
}

const EditIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

interface FoodPageProps {
  onOpenProfile?: () => void;
}

export default function FoodPage({ onOpenProfile }: FoodPageProps) {
  const [activeDate, setActiveDate] = useState("17");
  const [counters, setCounters] = useState<Record<CounterId, number>>({
    water: 1400,
    fiber: 18,
    sodium: 1840,
    sugar: 32,
  });

  const updateCounter = (id: CounterId, delta: number) => {
    triggerHaptic(id === "water" ? "medium" : "light");
    setCounters((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  };

  const handleDateClick = (date: string) => {
    triggerHaptic("soft");
    setActiveDate(date);
  };

  return (
    <div className="food-page">
      {/* ── TOP NAV ── */}
      <div
        className="top-nav animate-in"
        style={{ "--i": 0 } as CSSProperties}
      >
        <div className="streak-badge">🔥 12 дней</div>
        <div
          className="food-avatar"
          role="button"
          aria-label="Профиль"
          onClick={() => {
            triggerHaptic("light");
            onOpenProfile?.();
          }}
          style={{ cursor: onOpenProfile ? "pointer" : "default" }}
        ></div>
      </div>

      {/* ── DATES GRID ── */}
      <div
        className="dates-grid animate-in"
        style={{ "--i": 1 } as CSSProperties}
      >
        {WEEK_DATES.map((d, i) => {
          const isActive = d.date === activeDate;
          return (
            <div
              key={i}
              className={`date-item ${isActive ? "active" : ""}`}
              onClick={() => handleDateClick(d.date)}
            >
              <span className="date-day">{d.day}</span>
              <span className="date-num">{d.date}</span>
            </div>
          );
        })}
      </div>

      {/* ── HERO SECTION ── */}
      <div
        className="hero-section animate-in"
        style={{ "--i": 2 } as CSSProperties}
      >
        <CalorieRing consumed={1950} goal={2400} />

        {/* Минималистичный AI-совет */}
        <div
          className="hero-insight-pill"
          onClick={() => triggerHaptic("medium")}
        >
          <div className="insight-text-stack">
            <span className="insight-label">совет ИИ</span>
            <span className="insight-body">
              Добавьте <strong>+200г творога</strong> — мало белка
            </span>
          </div>
          <div className="insight-chevron">›</div>
        </div>
      </div>

      {/* ── MACROS ── */}
      <div
        className="section-header animate-in"
        style={{ "--i": 3 } as CSSProperties}
      >
        <span>Цели КБЖУ</span>
        <button className="btn-icon-only" onClick={() => triggerHaptic()}>
          <EditIcon />
        </button>
      </div>

      <div
        className="macros-row animate-in"
        style={{ "--i": 4 } as CSSProperties}
      >
        {MACROS.map((m) => (
          <div className="macro-item card" key={m.label}>
            <div className="macro-ring-box">
              <RadialProgress
                value={m.value}
                goal={m.goal}
                color={m.color}
                strokeWidth={9}
              />
            </div>
            <div className="macro-info">
              <span className="macro-val">
                {m.value}
                <span className="macro-unit">{m.unit}</span>
              </span>
              <span className="macro-label">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── HEALTH GRID ── */}
      <div
        className="health-grid animate-in"
        style={{ "--i": 5 } as CSSProperties}
      >
        <div className="card health-card">
          <div className="health-header">
            <span className="health-title">Вес</span>
            <button className="btn-icon-only" onClick={() => triggerHaptic()}>
              <EditIcon size={18} />
            </button>
          </div>
          <div className="health-val-group">
            <span className="health-val">
              76.4 <span className="health-unit">кг</span>
            </span>
            <span className="health-height">Рост 182 см</span>
          </div>
          <span className="health-sub">↓ 0.2 кг</span>
        </div>

        <div
          className="card health-card ai-action-card"
          onClick={() => triggerHaptic("medium")}
        >
          <div className="health-header">
            <span className="health-title">AI-Ассистент</span>
            <span className="ai-sparkle">✨</span>
          </div>
          <div className="health-val-group">
            <span className="health-val ai-ask-text">Спросить</span>
          </div>
          <span className="health-sub">Рецепты и советы</span>
        </div>
      </div>

      {/* ── MEALS ── */}
      <div
        className="section-header animate-in"
        style={{ "--i": 6 } as CSSProperties}
      >
        <span>Приемы пищи</span>
      </div>

      <div
        className="meals-list animate-in"
        style={{ "--i": 7 } as CSSProperties}
      >
        {MEALS.map((meal) => (
          <div className="meal-item card" key={meal.name}>
            <div className="meal-info">
              <div className="meal-name">{meal.name}</div>
              {meal.items.length > 0 ? (
                <div className="meal-items">{meal.items.join(", ")}</div>
              ) : (
                <div className="meal-empty">Ещё не добавлено</div>
              )}
            </div>
            <div className="meal-right">
              <div className="meal-meta">
                <div className="meal-kcal">
                  {meal.kcal > 0 ? meal.kcal : "—"}
                </div>
                <div className="meal-time">{meal.time}</div>
              </div>
              <button
                className="btn-inline-edit"
                onClick={() => triggerHaptic()}
              >
                <EditIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── COUNTERS ── */}
      <div
        className="section-header animate-in"
        style={{ "--i": 8 } as CSSProperties}
      >
        Трекинг
        <span className="section-sub-header">4 из 10</span>
      </div>
      <div
        className="counter-grid animate-in"
        style={{ "--i": 9 } as CSSProperties}
      >
        {COUNTERS.map((c) => {
          const isWater = c.id === "water";
          const fillPct = Math.min((counters[c.id] / c.goal) * 100, 100);

          return (
            <div
              className={`counter-item card counter-${c.id}`}
              key={c.id}
            >
              {isWater && (
                <div
                  className="water-fill"
                  style={{ height: `${fillPct}%` }}
                ></div>
              )}

              <div className="counter-top">
                <span className="counter-icon">{c.icon}</span>
                <span className="counter-label">{c.label}</span>
              </div>
              <div className="counter-main">
                <span className="counter-value">{counters[c.id]}</span>
                <span className="counter-unit">{c.unit}</span>
              </div>
              <div className="counter-controls">
                {c.adds.map((val) => (
                  <button
                    key={val}
                    className="btn-quick"
                    onClick={() => updateCounter(c.id, val)}
                  >
                    +{val}
                  </button>
                ))}
                <button
                  className="btn-quick btn-quick-custom"
                  onClick={() => triggerHaptic()}
                >
                  <EditIcon size={16} />
                </button>
              </div>
            </div>
          );
        })}

        <button className="add-counter-card" onClick={() => triggerHaptic()}>
          <div className="add-counter-icon">+</div>
          <div className="add-counter-text">
            Добавить
            <br />
            метрику
          </div>
        </button>
      </div>
    </div>
  );
}
