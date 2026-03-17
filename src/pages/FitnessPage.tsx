import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";
import "./FitnessPage.css";

/* ══════════════════════════════════════════════
   TELEGRAM
══════════════════════════════════════════════ */
const tg = () => getTelegramWebApp();

function useTelegramBack(onBack: () => void, enabled: boolean) {
  useEffect(() => {
    const btn = tg()?.BackButton;
    if (!btn) return;
    if (enabled) {
      btn.show();
      btn.onClick(onBack);
    } else {
      btn.hide();
    }
    return () => btn.offClick?.(onBack);
  }, [enabled, onBack]);
}

const haptic = (s: TelegramHapticStyle = "light") => {
  const webApp = tg();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(s);
  } else {
    navigator.vibrate?.(8);
  }
};

const shareWorkout = (title: string, id: string) => {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const url = `${baseUrl}#workout-${encodeURIComponent(id)}`;
  const webApp = tg();
  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Посмотри мою тренировку: ${title}`)}`,
    );
  } else if (navigator.share) {
    void navigator.share({ title, url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
  haptic("medium");
};

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  note: string;
};
type Workout = {
  id: string;
  title: string;
  duration: string;
  focus: string;
  color: string;
  exercises: Exercise[];
};
type Program = {
  id: string;
  title: string;
  description: string;
  level: string;
  weeks: number;
  cover: string;
  workouts: Workout[];
  forSale: boolean;
  priceStars: number;
};
type CatalogItem = {
  id: string;
  title: string;
  author: string;
  level: string;
  duration: string;
  focus: string;
  equipment: string;
  isPaid: boolean;
  priceStars: number;
  cover: string;
  description: string;
  items: string[];
};
type DayEntry = { workoutId: string; programId: string };
type ScheduleMap = Record<string, DayEntry>;
type Screen =
  | "main"
  | "program-detail"
  | "workout-edit"
  | "create-program"
  | "ai-text"
  | "ai-photo";
type GoalType =
  | "Похудение"
  | "Набор массы"
  | "Рельеф"
  | "Выносливость"
  | "Здоровье";

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const isToday = (d: Date) => fmt(d) === fmt(new Date());

const FOCUS_OPTIONS = [
  "Сила",
  "Тонус",
  "Рельеф",
  "Кардио",
  "Мобильность",
  "Выносливость",
  "Пресс",
  "Растяжка",
];
const LEVELS = ["Начальный", "Средний", "Продвинутый"];
const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const GOAL_OPTIONS: GoalType[] = [
  "Похудение",
  "Набор массы",
  "Рельеф",
  "Выносливость",
  "Здоровье",
];
const WORKOUT_COLORS = [
  "#111111",
  "#1666b0",
  "#0d5c4a",
  "#8b2020",
  "#5a2d82",
  "#b05c00",
  "#1a6b6b",
  "#8b6c1a",
];
const COVERS = [
  "linear-gradient(135deg,#0f0f0f,#2d2d2d)",
  "linear-gradient(135deg,#0a2240,#1666b0)",
  "linear-gradient(135deg,#0a2e1e,#1a7a50)",
  "linear-gradient(135deg,#2a0d0d,#8b2020)",
  "linear-gradient(135deg,#1a0a2e,#5a2d82)",
];

/* Exercise suggestions grouped by category */
const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  Грудь: [
    "Жим штанги лёжа",
    "Жим гантелей лёжа",
    "Разводка гантелей",
    "Жим в тренажёре",
    "Отжимания",
    "Жим на наклонной",
    "Кроссовер в блоке",
    "Отжимания на брусьях",
  ],
  Спина: [
    "Становая тяга",
    "Тяга штанги в наклоне",
    "Подтягивания",
    "Тяга верхнего блока",
    "Тяга горизонтального блока",
    "Тяга гантели одной рукой",
    "Гиперэкстензия",
    "Шраги",
  ],
  Ноги: [
    "Присед со штангой",
    "Жим ногами",
    "Выпады",
    "Румынская тяга",
    "Разгибание ног",
    "Сгибание ног",
    "Подъём на носки",
    "Сумо приседания",
    "Болгарские выпады",
  ],
  Плечи: [
    "Жим штанги стоя",
    "Жим гантелей сидя",
    "Тяга к подбородку",
    "Махи в стороны",
    "Передние подъёмы",
    "Разводка в наклоне",
    "Армейский жим",
  ],
  Бицепс: [
    "Подъём штанги на бицепс",
    "Молотки",
    "Концентрированные сгибания",
    "Сгибания в блоке",
    "Подъём гантелей поочерёдно",
  ],
  Трицепс: [
    "Французский жим",
    "Жим узким хватом",
    "Разгибание в блоке",
    "Разгибание гантелью из-за головы",
    "Отжимания от скамьи",
  ],
  Пресс: [
    "Скручивания",
    "Обратные скручивания",
    "Планка",
    "Велосипед",
    "Подъём ног",
    "Русский твист",
    "Крокодил",
    "Боковая планка",
  ],
  Кардио: [
    "Бег на месте",
    "Берпи",
    "Прыжки со скакалкой",
    "Горизонтальные прыжки",
    "Альпинист",
    "Прыжки в стороны",
    "Велотренажёр",
  ],
};

const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "c1",
    title: "Сушка 6 недель",
    author: "Coach Vera",
    level: "Продвинутый",
    duration: "50–70 мин",
    focus: "Рельеф",
    equipment: "Зал",
    isPaid: true,
    priceStars: 120,
    cover: "linear-gradient(140deg,#0f0f0f,#2a2a2a)",
    description:
      "Программа с прогрессией нагрузки и контролем объёмов. 4 тренировки в неделю.",
    items: [
      "Разминка 10 мин",
      "Силовой блок 40 мин",
      "HIIT финишер 10 мин",
      "Заминка 10 мин",
    ],
  },
  {
    id: "c2",
    title: "Тонус дома",
    author: "Fit Home Lab",
    level: "Начальный",
    duration: "25–35 мин",
    focus: "Тонус",
    equipment: "Без инвентаря",
    isPaid: false,
    priceStars: 0,
    cover: "linear-gradient(140deg,#1666b0,#4a9de0)",
    description: "Мягкий вход в тренировки: короткие сессии, без прыжков.",
    items: [
      "Разминка 5 мин",
      "Низ тела 15 мин",
      "Корпус 10 мин",
      "Растяжка 5 мин",
    ],
  },
  {
    id: "c3",
    title: "Сила + Кардио",
    author: "Urban Gym",
    level: "Средний",
    duration: "40–55 мин",
    focus: "Выносливость",
    equipment: "Гантели",
    isPaid: true,
    priceStars: 80,
    cover: "linear-gradient(140deg,#101010,#606060)",
    description:
      "Чередование силовых и кардио блоков для стабильного прогресса.",
    items: [
      "Разминка 8 мин",
      "Силовой блок 20 мин",
      "Кардио блок 15 мин",
      "Заминка 5 мин",
    ],
  },
  {
    id: "c4",
    title: "Здоровая спина",
    author: "Balance Studio",
    level: "Начальный",
    duration: "30–40 мин",
    focus: "Осанка",
    equipment: "Коврик",
    isPaid: false,
    priceStars: 0,
    cover: "linear-gradient(140deg,#0d5c4a,#2a9d7a)",
    description:
      "Укрепление кора и раскрытие грудного отдела для офисного ритма.",
    items: [
      "Разогрев 6 мин",
      "Кор 14 мин",
      "Мобильность 12 мин",
      "Дыхание 5 мин",
    ],
  },
  {
    id: "c5",
    title: "HIIT 20 мин",
    author: "Fast Lab",
    level: "Средний",
    duration: "20 мин",
    focus: "Жиросжигание",
    equipment: "Без инвентаря",
    isPaid: false,
    priceStars: 0,
    cover: "linear-gradient(140deg,#2a0d0d,#8b2020)",
    description: "Интенсивные 20 минут: 8 кругов по 4 упражнения.",
    items: ["Разминка 3 мин", "8 кругов HIIT", "Заминка 3 мин"],
  },
  {
    id: "c6",
    title: "Пилатес PRO",
    author: "Studio Move",
    level: "Средний",
    duration: "45 мин",
    focus: "Мобильность",
    equipment: "Коврик",
    isPaid: true,
    priceStars: 60,
    cover: "linear-gradient(140deg,#1a0a2e,#5a2d82)",
    description:
      "Пилатес с фокусом на глубокий кор, осанку и подвижность суставов.",
    items: [
      "Активация кора 10 мин",
      "Основной блок 25 мин",
      "Стретчинг 10 мин",
    ],
  },
];

const INITIAL_PROGRAMS: Program[] = [
  {
    id: "p1",
    title: "Сила 3×",
    description: "Базовые движения + прогрессия нагрузки каждые 2 недели.",
    level: "Средний",
    weeks: 4,
    cover: COVERS[0],
    forSale: false,
    priceStars: 99,
    workouts: [
      {
        id: "w1",
        title: "День A — Жим",
        duration: "50 мин",
        focus: "Грудь",
        color: "#111111",
        exercises: [
          {
            id: "e1",
            name: "Жим штанги лёжа",
            sets: 4,
            reps: "6–8",
            rest: "2 мин",
            note: "",
          },
          {
            id: "e2",
            name: "Жим гантелей лёжа",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
            note: "",
          },
          {
            id: "e3",
            name: "Тяга верхнего блока",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
            note: "",
          },
        ],
      },
      {
        id: "w2",
        title: "День B — Ноги",
        duration: "55 мин",
        focus: "Ноги",
        color: "#1666b0",
        exercises: [
          {
            id: "e4",
            name: "Присед со штангой",
            sets: 4,
            reps: "5–7",
            rest: "3 мин",
            note: "",
          },
          {
            id: "e5",
            name: "Жим ногами",
            sets: 3,
            reps: "10–12",
            rest: "2 мин",
            note: "",
          },
          {
            id: "e6",
            name: "Румынская тяга",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
            note: "",
          },
        ],
      },
      {
        id: "w3",
        title: "День C — Спина",
        duration: "50 мин",
        focus: "Спина",
        color: "#0d5c4a",
        exercises: [
          {
            id: "e7",
            name: "Становая тяга",
            sets: 4,
            reps: "4–6",
            rest: "3 мин",
            note: "",
          },
          {
            id: "e8",
            name: "Тяга штанги в наклоне",
            sets: 3,
            reps: "8–10",
            rest: "2 мин",
            note: "",
          },
          {
            id: "e9",
            name: "Подтягивания",
            sets: 3,
            reps: "max",
            rest: "2 мин",
            note: "С весом если возможно",
          },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */
const I = {
  Plus: ({ s = 18 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Trash: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  ),
  Star: ({ s = 13 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Sparkle: ({ s = 18 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5z" />
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" />
    </svg>
  ),
  Camera: ({ s = 22 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Pencil: ({ s = 22 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Share: ({ s = 18 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  X: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Check: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  ChevR: ({ s = 18 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  ChevD: ({ s = 18 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Drag: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="9" y1="5" x2="9" y2="19" />
      <line x1="15" y1="5" x2="15" y2="19" />
    </svg>
  ),
  Up: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  Down: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Note: ({ s = 14 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Search: ({ s = 16 }: { s?: number }) => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
};

/* ══════════════════════════════════════════════
   EXERCISE EDITOR COMPONENT
   The core powerful component for adding/editing exercises
══════════════════════════════════════════════ */

type ExerciseEditorProps = {
  exercises: Exercise[];
  accentColor: string;
  onChange: (exs: Exercise[]) => void;
};

function ExerciseEditor({
  exercises,
  accentColor,
  onChange,
}: ExerciseEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = Object.keys(EXERCISE_SUGGESTIONS);

  const filteredSuggestions = useMemo(() => {
    if (activeCategory)
      return EXERCISE_SUGGESTIONS[activeCategory].filter((s) =>
        s.toLowerCase().includes(query.toLowerCase()),
      );
    if (query.length < 1) return [];
    return Object.values(EXERCISE_SUGGESTIONS)
      .flat()
      .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 12);
  }, [query, activeCategory]);

  const addExercise = (name: string) => {
    const ex: Exercise = {
      id: uid(),
      name: name.trim(),
      sets: 3,
      reps: "10–12",
      rest: "60 сек",
      note: "",
    };
    const next = [...exercises, ex];
    onChange(next);
    setExpandedId(ex.id);
    setQuery("");
    setShowSuggestions(false);
    setActiveCategory(null);
    haptic("medium");
  };

  const addCustom = () => {
    if (!query.trim()) return;
    addExercise(query.trim());
  };

  const updateEx = (id: string, patch: Partial<Exercise>) =>
    onChange(exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeEx = (id: string) => {
    onChange(exercises.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
    haptic();
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...exercises];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
    haptic();
  };

  const moveDown = (idx: number) => {
    if (idx === exercises.length - 1) return;
    const arr = [...exercises];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
    haptic();
  };

  return (
    <div className="ex-editor">
      {/* Exercise list */}
      {exercises.length > 0 && (
        <div className="ex-editor-list">
          {exercises.map((ex, idx) => {
            const isOpen = expandedId === ex.id;
            return (
              <div
                key={ex.id}
                className={`ex-editor-card ${isOpen ? "open" : ""}`}
              >
                {/* Header row */}
                <div
                  className="ex-editor-row"
                  onClick={() => {
                    setExpandedId(isOpen ? null : ex.id);
                    haptic();
                  }}
                >
                  <div
                    className="ex-editor-num"
                    style={{ background: accentColor }}
                  >
                    {idx + 1}
                  </div>
                  <div className="ex-editor-info">
                    <div className="ex-editor-name">{ex.name}</div>
                    <div className="ex-editor-summary">
                      {ex.sets}×{ex.reps} · {ex.rest}
                    </div>
                  </div>
                  <div className="ex-editor-row-actions">
                    <div
                      className={`ex-editor-chevron ${isOpen ? "open" : ""}`}
                    >
                      <I.ChevD s={16} />
                    </div>
                  </div>
                </div>

                {/* Expanded editor */}
                {isOpen && (
                  <div className="ex-editor-expanded">
                    {/* Name edit */}
                    <div className="ex-field-row">
                      <label className="ex-field-label">Название</label>
                      <input
                        className="ex-field-input"
                        value={ex.name}
                        onChange={(e) =>
                          updateEx(ex.id, { name: e.target.value })
                        }
                      />
                    </div>

                    {/* Sets / Reps / Rest */}
                    <div className="ex-params-grid">
                      <div className="ex-param-block">
                        <label className="ex-field-label">Подходы</label>
                        <div className="ex-num-ctrl">
                          <button
                            type="button"
                            className="ex-num-btn"
                            onClick={() => {
                              updateEx(ex.id, {
                                sets: Math.max(1, ex.sets - 1),
                              });
                              haptic();
                            }}
                          >
                            −
                          </button>
                          <span className="ex-num-val">{ex.sets}</span>
                          <button
                            type="button"
                            className="ex-num-btn"
                            onClick={() => {
                              updateEx(ex.id, {
                                sets: Math.min(20, ex.sets + 1),
                              });
                              haptic();
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="ex-param-block">
                        <label className="ex-field-label">Повторения</label>
                        <input
                          className="ex-field-input center"
                          value={ex.reps}
                          onChange={(e) =>
                            updateEx(ex.id, { reps: e.target.value })
                          }
                          placeholder="10–12"
                        />
                      </div>
                      <div className="ex-param-block">
                        <label className="ex-field-label">Отдых</label>
                        <input
                          className="ex-field-input center"
                          value={ex.rest}
                          onChange={(e) =>
                            updateEx(ex.id, { rest: e.target.value })
                          }
                          placeholder="60 сек"
                        />
                      </div>
                    </div>

                    {/* Note */}
                    <div className="ex-field-row">
                      <label className="ex-field-label">
                        <I.Note s={13} /> Заметка (необязательно)
                      </label>
                      <input
                        className="ex-field-input"
                        value={ex.note}
                        onChange={(e) =>
                          updateEx(ex.id, { note: e.target.value })
                        }
                        placeholder="Например: рукоятка нейтральная, не до отказа..."
                      />
                    </div>

                    {/* Move / Delete */}
                    <div className="ex-editor-footer">
                      <div className="ex-move-btns">
                        <button
                          type="button"
                          className="ex-move-btn"
                          disabled={idx === 0}
                          onClick={() => moveUp(idx)}
                        >
                          <I.Up s={14} /> Вверх
                        </button>
                        <button
                          type="button"
                          className="ex-move-btn"
                          disabled={idx === exercises.length - 1}
                          onClick={() => moveDown(idx)}
                        >
                          <I.Down s={14} /> Вниз
                        </button>
                      </div>
                      <button
                        type="button"
                        className="ex-delete-btn"
                        onClick={() => removeEx(ex.id)}
                      >
                        <I.Trash s={14} /> Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {exercises.length === 0 && (
        <div className="ex-editor-empty">
          <div className="ex-editor-empty-icon">🏋️</div>
          <div className="ex-editor-empty-text">
            Упражнений пока нет — добавь ниже
          </div>
        </div>
      )}

      {/* Add section */}
      <div className="ex-add-section">
        {/* Search / input */}
        <div className="ex-search-wrap">
          <div className="ex-search-icon">
            <I.Search s={16} />
          </div>
          <input
            ref={inputRef}
            className="ex-search-input"
            placeholder="Название упражнения..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setActiveCategory(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) addCustom();
            }}
          />
          {query.length > 0 && (
            <button
              type="button"
              className="ex-search-clear"
              onClick={() => {
                setQuery("");
                setActiveCategory(null);
                inputRef.current?.focus();
              }}
            >
              <I.X s={14} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="ex-category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ex-cat-chip ${activeCategory === cat ? "active" : ""}`}
              onClick={() => {
                setActiveCategory(activeCategory === cat ? null : cat);
                setShowSuggestions(true);
                setQuery("");
                haptic();
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Suggestions list */}
        {showSuggestions && (activeCategory || query.length > 0) && (
          <div className="ex-suggestions">
            {filteredSuggestions.length === 0 && query.trim() ? (
              <button
                type="button"
                className="ex-suggestion-item custom-add"
                onClick={addCustom}
              >
                <I.Plus s={16} /> Добавить «{query.trim()}»
              </button>
            ) : (
              <>
                {filteredSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="ex-suggestion-item"
                    onClick={() => addExercise(name)}
                  >
                    <span>{name}</span>
                    <I.Plus s={15} />
                  </button>
                ))}
                {query.trim() &&
                  !filteredSuggestions.includes(query.trim()) && (
                    <button
                      type="button"
                      className="ex-suggestion-item custom-add"
                      onClick={addCustom}
                    >
                      <I.Plus s={16} /> Добавить «{query.trim()}»
                    </button>
                  )}
              </>
            )}
          </div>
        )}

        {/* No query, no category: quick "add custom" */}
        {!showSuggestions && query.length === 0 && (
          <button
            type="button"
            className="ex-add-custom-btn"
            onClick={() => {
              inputRef.current?.focus();
              setShowSuggestions(true);
            }}
          >
            <I.Plus s={16} /> Добавить своё упражнение
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SCHEDULE EDITOR
══════════════════════════════════════════════ */
type FlatWorkout = Workout & { programId: string; programTitle: string };

function ScheduleEditor({
  allWorkouts,
  weekDates,
  scheduleMap,
  onApply,
  onClose,
}: {
  allWorkouts: FlatWorkout[];
  weekDates: Date[];
  scheduleMap: ScheduleMap;
  onApply: (m: ScheduleMap) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ScheduleMap>({ ...scheduleMap });

  const toggle = (ds: string, w: FlatWorkout) => {
    haptic();
    setLocal((prev) => {
      if (prev[ds]?.workoutId === w.id) {
        const n = { ...prev };
        delete n[ds];
        return n;
      }
      return { ...prev, [ds]: { workoutId: w.id, programId: w.programId } };
    });
  };

  const applyPattern = (w: FlatWorkout, days: number[]) => {
    haptic("medium");
    setLocal((prev) => {
      const n = { ...prev };
      weekDates.forEach((d, i) => {
        if (days.includes(i))
          n[fmt(d)] = { workoutId: w.id, programId: w.programId };
      });
      return n;
    });
  };

  return (
    <div className="sheet-overlay-wrap">
      <div className="sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet schedule-sheet">
        <div className="sheet-handle-bar" />
        <div className="schedule-sheet-header">
          <span className="schedule-sheet-title">Расписание недели</span>
          <div className="schedule-sheet-actions">
            <button
              type="button"
              className="sched-clear-btn"
              onClick={() => {
                setLocal({});
                haptic("medium");
              }}
            >
              Очистить
            </button>
            <button
              type="button"
              className="sched-done-btn"
              onClick={() => {
                onApply(local);
                haptic("medium");
                onClose();
              }}
            >
              <I.Check s={13} /> Готово
            </button>
          </div>
        </div>
        <div className="sched-day-row header-row">
          <div className="sched-workout-col-label" />
          {weekDates.map((d, i) => (
            <div
              key={i}
              className={`sched-day-header ${isToday(d) ? "today" : ""}`}
            >
              <span className="sched-day-name">{DAYS_RU[i]}</span>
              <span className="sched-day-num">{d.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="sched-rows">
          {allWorkouts.length === 0 ? (
            <div className="sched-empty">Сначала создай тренировки</div>
          ) : (
            allWorkouts.map((w) => (
              <div key={w.id} className="sched-row">
                <div className="sched-workout-label">
                  <span
                    className="sched-wk-dot"
                    style={{ background: w.color }}
                  />
                  <div>
                    <div className="sched-wk-name">{w.title}</div>
                    <div className="sched-wk-prog">{w.programTitle}</div>
                  </div>
                </div>
                {weekDates.map((d, i) => {
                  const ds = fmt(d);
                  const active = local[ds]?.workoutId === w.id;
                  return (
                    <div
                      key={i}
                      className={`sched-cell ${active ? "active" : ""}`}
                      style={
                        { "--cell-color": w.color } as CSSProperties
                      }
                      onClick={() => toggle(ds, w)}
                    >
                      {active && <I.Check s={12} />}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        {allWorkouts.length > 0 && (
          <div className="sched-patterns">
            <div className="sched-patterns-title">Быстрые шаблоны</div>
            {allWorkouts.slice(0, 4).map((w) => (
              <div key={w.id} className="sched-pattern-row">
                <div className="sched-pattern-label">
                  <span
                    className="sched-wk-dot"
                    style={{ background: w.color }}
                  />
                  <span className="sched-pattern-name">{w.title}</span>
                </div>
                <div className="sched-pattern-btns">
                  {[
                    { label: "Пн Ср Пт", days: [0, 2, 4] },
                    { label: "Вт Чт Сб", days: [1, 3, 5] },
                    { label: "Пн–Пт", days: [0, 1, 2, 3, 4] },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="sched-pattern-btn"
                      onClick={() => applyPattern(w, p.days)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGE HEADER
══════════════════════════════════════════════ */
function PageHeader({ title }: { title: string }) {
  return (
    <div className="page-title-header">
      <span className="page-title-text">{title}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function FitnessPage() {
  const [screen, setScreen] = useState<Screen>("main");
  const [mainTab, setMainTab] = useState<"personal" | "catalog">("personal");
  const [catSubTab, setCatSubTab] = useState<"catalog" | "mine">("catalog");

  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>({});
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [goal, setGoal] = useState<GoalType>("Рельеф");
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);
  const [catFilter, setCatFilter] = useState<"all" | "free" | "paid">("all");
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  /* New program form */
  const [npTitle, setNpTitle] = useState("");
  const [npDesc, setNpDesc] = useState("");
  const [npLevel, setNpLevel] = useState(LEVELS[1]);
  const [npWeeks, setNpWeeks] = useState(4);
  const [npCoverIdx, setNpCoverIdx] = useState(0);

  /* Workout editor state — used for both create and edit */
  const [wkTitle, setWkTitle] = useState("");
  const [wkDuration, setWkDuration] = useState("");
  const [wkFocus, setWkFocus] = useState(FOCUS_OPTIONS[0]);
  const [wkColorIdx, setWkColorIdx] = useState(0);
  const [wkExercises, setWkExercises] = useState<Exercise[]>([]);
  const [wkIsNew, setWkIsNew] = useState(true); // true=create, false=edit existing

  /* AI */
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /* Derived */
  const weekDates = useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((dow + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const activeProgram = programs.find((p) => p.id === activeProgramId) ?? null;
  const allWorkouts = useMemo<FlatWorkout[]>(
    () =>
      programs.flatMap((p) =>
        p.workouts.map((w) => ({
          ...w,
          programId: p.id,
          programTitle: p.title,
        })),
      ),
    [programs],
  );

  /* Back */
  const handleBack = useCallback(() => {
    if (screen === "workout-edit") {
      setScreen("program-detail");
      return;
    }
    setScreen("main");
  }, [screen]);
  useTelegramBack(handleBack, screen !== "main");

  /* Mutations */
  const updateProgram = (id: string, patch: Partial<Program>) =>
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );

  const openCreateWorkout = () => {
    setWkTitle("");
    setWkDuration("");
    setWkFocus(FOCUS_OPTIONS[0]);
    setWkColorIdx(0);
    setWkExercises([]);
    setWkIsNew(true);
    setScreen("workout-edit");
    haptic();
  };

  const openEditWorkout = (wk: Workout) => {
    setActiveWorkoutId(wk.id);
    setWkTitle(wk.title);
    setWkDuration(wk.duration);
    setWkFocus(wk.focus);
    setWkColorIdx(
      WORKOUT_COLORS.indexOf(wk.color) >= 0
        ? WORKOUT_COLORS.indexOf(wk.color)
        : 0,
    );
    setWkExercises([...wk.exercises.map((e) => ({ ...e }))]);
    setWkIsNew(false);
    setScreen("workout-edit");
    haptic();
  };

  const saveWorkout = () => {
    if (!wkTitle.trim() || !activeProgramId) return;
    if (wkIsNew) {
      const wk: Workout = {
        id: uid(),
        title: wkTitle.trim(),
        duration: wkDuration || "30–45 мин",
        focus: wkFocus,
        color: WORKOUT_COLORS[wkColorIdx],
        exercises: wkExercises,
      };
      updateProgram(activeProgramId, {
        workouts: [...(activeProgram?.workouts ?? []), wk],
      });
    } else if (activeWorkoutId) {
      updateProgram(activeProgramId, {
        workouts: activeProgram!.workouts.map((w) =>
          w.id === activeWorkoutId
            ? {
                ...w,
                title: wkTitle.trim(),
                duration: wkDuration || w.duration,
                focus: wkFocus,
                color: WORKOUT_COLORS[wkColorIdx],
                exercises: wkExercises,
              }
            : w,
        ),
      });
    }
    setScreen("program-detail");
    haptic("medium");
  };

  const deleteWorkout = (wkId: string) => {
    if (!activeProgramId) return;
    updateProgram(activeProgramId, {
      workouts: activeProgram!.workouts.filter((w) => w.id !== wkId),
    });
    haptic();
  };

  const createProgram = () => {
    if (!npTitle.trim()) return;
    const prog: Program = {
      id: uid(),
      title: npTitle.trim(),
      description: npDesc.trim() || "Описание программы",
      level: npLevel,
      weeks: npWeeks,
      cover: COVERS[npCoverIdx],
      workouts: [],
      forSale: false,
      priceStars: 99,
    };
    setPrograms((p) => [...p, prog]);
    setActiveProgramId(prog.id);
    setNpTitle("");
    setNpDesc("");
    setNpWeeks(4);
    setNpCoverIdx(0);
    setScreen("program-detail");
    haptic("medium");
  };

  const simulateAI = () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      const prog: Program = {
        id: uid(),
        title: `AI: ${aiQuery.slice(0, 18)}`,
        description: aiQuery,
        level: "Средний",
        weeks: 4,
        cover: COVERS[Math.floor(Math.random() * COVERS.length)],
        forSale: false,
        priceStars: 0,
        workouts: [
          {
            id: uid(),
            title: "Тренировка A",
            duration: "40–50 мин",
            focus: "Сила",
            color: WORKOUT_COLORS[0],
            exercises: [
              {
                id: uid(),
                name: "Присед",
                sets: 4,
                reps: "8–10",
                rest: "2 мин",
                note: "",
              },
              {
                id: uid(),
                name: "Жим штанги лёжа",
                sets: 3,
                reps: "10–12",
                rest: "90 сек",
                note: "",
              },
              {
                id: uid(),
                name: "Тяга в наклоне",
                sets: 3,
                reps: "10–12",
                rest: "90 сек",
                note: "",
              },
            ],
          },
          {
            id: uid(),
            title: "Тренировка B",
            duration: "35–45 мин",
            focus: "Кардио",
            color: WORKOUT_COLORS[1],
            exercises: [
              {
                id: uid(),
                name: "Берпи",
                sets: 4,
                reps: "10",
                rest: "45 сек",
                note: "",
              },
              {
                id: uid(),
                name: "Прыжки со скакалкой",
                sets: 3,
                reps: "60 сек",
                rest: "30 сек",
                note: "",
              },
            ],
          },
        ],
      };
      setPrograms((p) => [...p, prog]);
      setAiLoading(false);
      setAiQuery("");
      setActiveProgramId(prog.id);
      setScreen("program-detail");
      haptic("medium");
    }, 1800);
  };

  /* ── Week schedule helpers ── */
  const weekWithData = weekDates.map((d, i) => {
    const ds = fmt(d);
    const entry = scheduleMap[ds];
    const wk = entry
      ? (allWorkouts.find((w) => w.id === entry.workoutId) ?? null)
      : null;
    return {
      date: d,
      ds,
      dayName: DAYS_RU[i],
      workout: wk,
      isToday: isToday(d),
    };
  });
  const hasSchedule = weekWithData.some((d) => d.workout);

  /* ══════════════════════════════════════════════
     SCREEN: WORKOUT EDIT (create + edit merged)
  ══════════════════════════════════════════════ */
  if (screen === "workout-edit" && activeProgram)
    return (
      <div className="fitness-page">
        <PageHeader title={wkIsNew ? "Новая тренировка" : "Редактировать"} />

        {/* Meta card */}
        <div className="wk-meta-card">
          <div className="wk-meta-field">
            <label className="form-label">Название тренировки</label>
            <input
              className="form-input large"
              placeholder="День A — Жим"
              value={wkTitle}
              onChange={(e) => setWkTitle(e.target.value)}
            />
          </div>
          <div className="wk-meta-row">
            <div className="wk-meta-field half">
              <label className="form-label">Длительность</label>
              <input
                className="form-input"
                placeholder="45–60 мин"
                value={wkDuration}
                onChange={(e) => setWkDuration(e.target.value)}
              />
            </div>
            <div className="wk-meta-field half">
              <label className="form-label">Акцент</label>
              <select
                className="form-select"
                value={wkFocus}
                onChange={(e) => {
                  setWkFocus(e.target.value);
                  haptic();
                }}
              >
                {FOCUS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="wk-meta-field">
            <label className="form-label">Цвет карточки</label>
            <div className="color-row">
              {WORKOUT_COLORS.map((c, i) => (
                <div
                  key={i}
                  className={`color-dot ${wkColorIdx === i ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => {
                    setWkColorIdx(i);
                    haptic();
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="section-row">
          <h2>
            Упражнения{" "}
            <span className="ex-count-badge">{wkExercises.length}</span>
          </h2>
        </div>

        {/* Exercise editor */}
        <ExerciseEditor
          exercises={wkExercises}
          accentColor={WORKOUT_COLORS[wkColorIdx]}
          onChange={setWkExercises}
        />

        {/* Save */}
        <div className="wk-save-area">
          <button
            className="btn-primary full-w"
            type="button"
            onClick={saveWorkout}
            disabled={!wkTitle.trim()}
          >
            {wkIsNew ? "Создать тренировку" : "Сохранить изменения"}
          </button>
          {!wkIsNew && activeWorkoutId && (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => {
                deleteWorkout(activeWorkoutId);
                setScreen("program-detail");
                haptic("heavy");
              }}
            >
              <I.Trash s={15} /> Удалить тренировку
            </button>
          )}
        </div>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: PROGRAM DETAIL
  ══════════════════════════════════════════════ */
  if (screen === "program-detail" && activeProgram)
    return (
      <div className="fitness-page">
        <PageHeader title={activeProgram.title} />
        <div className="prog-hero" style={{ background: activeProgram.cover }}>
          <div className="prog-hero-inner">
            <div className="prog-hero-title">{activeProgram.title}</div>
            <div className="prog-hero-meta">
              {activeProgram.level} · {activeProgram.weeks} нед ·{" "}
              {activeProgram.workouts.length} тренировок
            </div>
          </div>
          <div className="prog-hero-actions">
            <button
              className="prog-share-btn"
              type="button"
              onClick={() =>
                shareWorkout(activeProgram.title, activeProgram.id)
              }
            >
              <I.Share s={15} /> Поделиться
            </button>
          </div>
        </div>

        <p className="prog-desc">{activeProgram.description}</p>

        <div className="section-row">
          <h2>Тренировки</h2>
          <button
            className="btn-text"
            type="button"
            onClick={openCreateWorkout}
          >
            <I.Plus /> Добавить
          </button>
        </div>

        {activeProgram.workouts.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-sub">Добавь первую тренировку</div>
          </div>
        ) : (
          <div className="workout-list">
            {activeProgram.workouts.map((wk) => (
              <div className="workout-card" key={wk.id}>
                <div
                  className="workout-card-accent"
                  style={{ background: wk.color }}
                />
                <div
                  className="workout-card-main"
                  onClick={() => openEditWorkout(wk)}
                >
                  <div>
                    <div className="workout-card-title">{wk.title}</div>
                    <div className="workout-card-meta">
                      {wk.focus} · {wk.duration} · {wk.exercises.length} упр.
                    </div>
                  </div>
                  <div className="workout-card-edit-hint">
                    Ред. <I.ChevR s={16} />
                  </div>
                </div>
                {wk.exercises.length > 0 && (
                  <div className="workout-ex-preview">
                    {wk.exercises.slice(0, 4).map((ex) => (
                      <span key={ex.id} className="ex-preview-chip">
                        {ex.name}
                      </span>
                    ))}
                    {wk.exercises.length > 4 && (
                      <span className="ex-preview-chip muted">
                        +{wk.exercises.length - 4}
                      </span>
                    )}
                  </div>
                )}
                <div className="workout-card-footer">
                  <button
                    className="btn-share-sm"
                    type="button"
                    onClick={() => shareWorkout(wk.title, activeProgram.id)}
                  >
                    <I.Share s={13} /> Поделиться
                  </button>
                  <button
                    className="btn-danger-sm"
                    type="button"
                    onClick={() => {
                      deleteWorkout(wk.id);
                      haptic();
                    }}
                  >
                    <I.Trash s={13} /> Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sell-section">
          <div className="sell-row">
            <div>
              <div className="sell-title">Продать программу</div>
              <div className="sell-sub">Зарабатывай Telegram Stars</div>
            </div>
            <div
              className={`toggle ${activeProgram.forSale ? "on" : ""}`}
              onClick={() => {
                updateProgram(activeProgram.id, {
                  forSale: !activeProgram.forSale,
                });
                haptic();
              }}
            />
          </div>
          {activeProgram.forSale && (
            <div className="sell-fields">
              <div className="price-row">
                <span className="price-star">
                  <I.Star s={14} />
                </span>
                <input
                  className="price-input"
                  type="number"
                  min={1}
                  value={activeProgram.priceStars}
                  onChange={(e) =>
                    updateProgram(activeProgram.id, {
                      priceStars: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
              </div>
              <button
                className="btn-primary full-w"
                type="button"
                onClick={() => haptic("medium")}
              >
                Опубликовать в каталог
              </button>
            </div>
          )}
        </div>

        <button
          className="btn-danger"
          type="button"
          onClick={() => {
            setPrograms((p) => p.filter((x) => x.id !== activeProgram.id));
            setScreen("main");
            haptic("heavy");
          }}
        >
          Удалить программу
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: CREATE PROGRAM
  ══════════════════════════════════════════════ */
  if (screen === "create-program")
    return (
      <div className="fitness-page">
        <PageHeader title="Новая программа" />
        <div className="form-block">
          <label className="form-label">Название</label>
          <input
            className="form-input"
            placeholder="Например: Сила 3×"
            value={npTitle}
            onChange={(e) => setNpTitle(e.target.value)}
          />
        </div>
        <div className="form-block">
          <label className="form-label">Описание</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Акцент, инвентарь, особенности"
            value={npDesc}
            onChange={(e) => setNpDesc(e.target.value)}
          />
        </div>
        <div className="form-block">
          <label className="form-label">Уровень</label>
          <div className="chip-row">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                className={`opt-chip ${npLevel === l ? "active" : ""}`}
                onClick={() => {
                  setNpLevel(l);
                  haptic();
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="form-block">
          <label className="form-label">Недель</label>
          <div className="num-ctrl">
            <button
              type="button"
              className="num-btn"
              onClick={() => setNpWeeks((w) => Math.max(1, w - 1))}
            >
              −
            </button>
            <span className="num-val" style={{ minWidth: 36 }}>
              {npWeeks}
            </span>
            <button
              type="button"
              className="num-btn"
              onClick={() => setNpWeeks((w) => Math.min(24, w + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="form-block">
          <label className="form-label">Обложка</label>
          <div className="cover-row">
            {COVERS.map((c, i) => (
              <div
                key={i}
                className={`cover-swatch ${npCoverIdx === i ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setNpCoverIdx(i);
                  haptic();
                }}
              />
            ))}
          </div>
        </div>
        <button
          className="btn-primary full-w"
          type="button"
          onClick={createProgram}
          disabled={!npTitle.trim()}
        >
          Создать программу
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: AI TEXT
  ══════════════════════════════════════════════ */
  if (screen === "ai-text")
    return (
      <div className="fitness-page">
        <PageHeader title="AI по тексту" />
        <div className="ai-intro-card">
          <div className="ai-intro-icon">
            <I.Sparkle />
          </div>
          <div className="ai-intro-text">
            Опиши цель, уровень и предпочтения — AI составит программу с
            упражнениями
          </div>
        </div>
        <div className="form-block">
          <label className="form-label">Запрос</label>
          <textarea
            className="form-textarea big"
            rows={5}
            placeholder={
              "Например:\n«Хочу похудеть, 3 тренировки в неделю,\nдома без инвентаря, начальный уровень»"
            }
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
          />
        </div>
        <div className="ai-examples">
          {[
            "Набор массы, зал, 4× в неделю",
            "Рельеф, гантели дома, средний",
            "Кардио и гибкость, без инвентаря",
          ].map((ex) => (
            <button
              key={ex}
              className="ai-example-chip"
              type="button"
              onClick={() => {
                setAiQuery(ex);
                haptic();
              }}
            >
              {ex}
            </button>
          ))}
        </div>
        <button
          className="btn-primary full-w ai-submit-btn"
          type="button"
          onClick={simulateAI}
          disabled={!aiQuery.trim() || aiLoading}
        >
          {aiLoading ? (
            <span className="ai-loader" />
          ) : (
            <>
              <I.Sparkle s={16} /> Сгенерировать
            </>
          )}
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: AI PHOTO
  ══════════════════════════════════════════════ */
  if (screen === "ai-photo")
    return (
      <div className="fitness-page">
        <PageHeader title="AI по фото" />
        <div className="photo-upload-area">
          <div className="photo-upload-icon">
            <I.Camera />
          </div>
          <div className="photo-upload-title">Загрузи фото тела</div>
          <div className="photo-upload-sub">
            AI проанализирует состав и составит программу
          </div>
          <button
            className="btn-primary"
            type="button"
            style={{ marginTop: 20 }}
            onClick={() => haptic("medium")}
          >
            Выбрать фото
          </button>
        </div>
        {[
          ["🔆", "Хорошее освещение, фото в полный рост"],
          ["🧍", "Нейтральная поза, лицом или боком"],
          ["👕", "Минимум одежды для точного анализа"],
        ].map(([ic, t]) => (
          <div key={t as string} className="photo-hint-item">
            <span className="photo-hint-emoji">{ic}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: MAIN
  ══════════════════════════════════════════════ */
  return (
    <div className="fitness-page">
      <div className="fitness-header">
        <h1>Тренировки</h1>
      </div>

      <div className="fitness-switch">
        <div className="fitness-pill">
          <div
            className={`fitness-pill-blob ${mainTab === "catalog" ? "right" : ""}`}
          />
          <button
            className={`fitness-pill-tab ${mainTab === "personal" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setMainTab("personal");
              haptic();
            }}
          >
            Личные
          </button>
          <button
            className={`fitness-pill-tab ${mainTab === "catalog" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setMainTab("catalog");
              haptic();
            }}
          >
            Каталог
          </button>
        </div>
      </div>

      {/* ════ TAB: ЛИЧНЫЕ ════ */}
      {mainTab === "personal" && (
        <>
          {/* Goal */}
          <div
            className="goal-card"
            onClick={() => {
              setShowGoalEdit((v) => !v);
              haptic();
            }}
          >
            <div>
              <div className="goal-label">Твоя цель</div>
              <div className="goal-value">{goal}</div>
            </div>
            <div className={`goal-chevron ${showGoalEdit ? "open" : ""}`}>
              <I.ChevD s={18} />
            </div>
          </div>
          {showGoalEdit && (
            <div className="goal-picker">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`goal-option ${goal === g ? "active" : ""}`}
                  onClick={() => {
                    setGoal(g);
                    setShowGoalEdit(false);
                    haptic();
                  }}
                >
                  {goal === g && <I.Check s={14} />} {g}
                </button>
              ))}
            </div>
          )}

          {/* Create */}
          <div className="section-row" style={{ marginTop: 28 }}>
            <h2>Создать тренировку</h2>
          </div>
          <div className="create-grid">
            <button
              className="create-card ai-text-card"
              type="button"
              onClick={() => {
                setScreen("ai-text");
                haptic("medium");
              }}
            >
              <div className="create-card-icon">
                <I.Sparkle />
              </div>
              <div className="create-card-content">
                <div className="create-card-title">AI по тексту</div>
                <div className="create-card-sub">Опиши цель — получи план</div>
              </div>
            </button>
            <button
              className="create-card ai-photo-card"
              type="button"
              onClick={() => {
                setScreen("ai-photo");
                haptic("medium");
              }}
            >
              <div className="create-card-icon">
                <I.Camera />
              </div>
              <div className="create-card-title">AI по фото</div>
              <div className="create-card-sub">Анализ состава тела</div>
            </button>
            <button
              className="create-card manual-card"
              type="button"
              onClick={() => {
                setNpTitle("");
                setNpDesc("");
                setNpWeeks(4);
                setNpCoverIdx(0);
                setScreen("create-program");
                haptic("medium");
              }}
            >
              <div className="create-card-icon">
                <I.Pencil />
              </div>
              <div className="create-card-title">Вручную</div>
              <div className="create-card-sub">Своя программа с нуля</div>
            </button>
          </div>

          {/* Schedule */}
          <div className="section-row" style={{ marginTop: 36 }}>
            <h2>Расписание</h2>
            <div className="schedule-header-right">
              <div className="week-nav">
                <button
                  className="week-nav-btn"
                  type="button"
                  onClick={() => {
                    setWeekOffset((o) => o - 1);
                    haptic();
                  }}
                >
                  ‹
                </button>
                <span className="week-nav-label">
                  {weekOffset === 0
                    ? "Эта неделя"
                    : weekOffset === 1
                      ? "След."
                      : weekOffset === -1
                        ? "Пред."
                        : weekOffset > 0
                          ? `+${weekOffset}нед`
                          : `${weekOffset}нед`}
                </span>
                <button
                  className="week-nav-btn"
                  type="button"
                  onClick={() => {
                    setWeekOffset((o) => o + 1);
                    haptic();
                  }}
                >
                  ›
                </button>
              </div>
              <button
                className="btn-edit-schedule"
                type="button"
                onClick={() => {
                  setShowScheduleEditor(true);
                  haptic();
                }}
              >
                Изменить
              </button>
            </div>
          </div>

          <div className="week-overview">
            {weekWithData.map(
              ({ date, ds, dayName, workout, isToday: tod }) => (
                <div
                  key={ds}
                  className={`week-day-card ${workout ? "has-workout" : "rest"} ${tod ? "today" : ""}`}
                  onClick={() => {
                    setShowScheduleEditor(true);
                    haptic();
                  }}
                >
                  <div className="week-day-name">{dayName}</div>
                  <div className={`week-day-num ${tod ? "today-num" : ""}`}>
                    {date.getDate()}
                  </div>
                  {workout ? (
                    <div
                      className="week-day-workout-pill"
                      style={{ background: workout.color }}
                    >
                      <span className="week-day-workout-name">
                        {workout.title.split(" — ")[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="week-day-rest">отдых</div>
                  )}
                </div>
              ),
            )}
          </div>

          {hasSchedule && (
            <div className="schedule-detail-list">
              {weekWithData
                .filter((d) => d.workout)
                .map(({ date, ds, dayName, workout }) => (
                  <div key={ds} className="schedule-detail-item">
                    <div className="sched-item-left">
                      <div className="sched-item-day">
                        {dayName}, {date.getDate()}
                      </div>
                      <div
                        className="sched-item-workout"
                        style={{ borderLeft: `3px solid ${workout!.color}` }}
                      >
                        <div className="sched-item-workout-name">
                          {workout!.title}
                        </div>
                        <div className="sched-item-workout-meta">
                          {workout!.focus} · {workout!.duration} ·{" "}
                          {workout!.exercises.length} упр.
                        </div>
                      </div>
                    </div>
                    <button
                      className="sched-item-remove"
                      type="button"
                      onClick={() => {
                        setScheduleMap((p) => {
                          const n = { ...p };
                          delete n[ds];
                          return n;
                        });
                        haptic();
                      }}
                    >
                      <I.X s={14} />
                    </button>
                  </div>
                ))}
              <button
                className="btn-clear-week"
                type="button"
                onClick={() => {
                  const ws = new Set(weekDates.map(fmt));
                  setScheduleMap((p) =>
                    Object.fromEntries(
                      Object.entries(p).filter(([k]) => !ws.has(k)),
                    ),
                  );
                  haptic("medium");
                }}
              >
                Очистить всю неделю
              </button>
            </div>
          )}

          {!hasSchedule && allWorkouts.length > 0 && (
            <div className="sched-empty-hint">
              <div className="sched-empty-hint-text">
                Нажми «Изменить» чтобы назначить тренировки на дни
              </div>
            </div>
          )}
          {allWorkouts.length === 0 && (
            <div className="sched-empty-hint">
              <div className="sched-empty-hint-text">
                Сначала создай программу с тренировками
              </div>
            </div>
          )}
        </>
      )}

      {/* ════ TAB: КАТАЛОГ ════ */}
      {mainTab === "catalog" && (
        <>
          <div className="sub-switch">
            <button
              className={`sub-tab ${catSubTab === "catalog" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setCatSubTab("catalog");
                haptic();
              }}
            >
              Каталог
            </button>
            <button
              className={`sub-tab ${catSubTab === "mine" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setCatSubTab("mine");
                haptic();
              }}
            >
              Мои программы{" "}
              {programs.length > 0 && (
                <span className="sub-tab-badge">{programs.length}</span>
              )}
            </button>
          </div>

          {catSubTab === "catalog" && (
            <>
              <div className="catalog-filters">
                {(["all", "free", "paid"] as const).map((f) => (
                  <button
                    key={f}
                    className={`filter-chip ${catFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setCatFilter(f);
                      haptic();
                    }}
                  >
                    {{ all: "Все", free: "Бесплатные", paid: "Платные" }[f]}
                  </button>
                ))}
              </div>
              <div className="catalog-grid">
                {(catFilter === "free"
                  ? CATALOG_ITEMS.filter((c) => !c.isPaid)
                  : catFilter === "paid"
                    ? CATALOG_ITEMS.filter((c) => c.isPaid)
                    : CATALOG_ITEMS
                ).map((item) => (
                  <div
                    key={item.id}
                    className="catalog-card"
                    onClick={() => {
                      setCatalogItem(item);
                      haptic();
                    }}
                  >
                    <div
                      className="catalog-cover"
                      style={{ background: item.cover }}
                    >
                      {item.isPaid ? (
                        <div className="catalog-price">
                          <I.Star /> {item.priceStars}
                        </div>
                      ) : (
                        <div className="catalog-price free">Бесплатно</div>
                      )}
                    </div>
                    <div className="catalog-body">
                      <div className="catalog-title">{item.title}</div>
                      <div className="catalog-author">{item.author}</div>
                      <div className="catalog-meta">
                        {item.level} · {item.duration}
                      </div>
                      <div className="catalog-tags">
                        <span>{item.focus}</span>
                        <span>{item.equipment}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {catSubTab === "mine" &&
            (programs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">Нет программ</div>
                <div className="empty-sub">
                  Создай свою или добавь из каталога
                </div>
                <button
                  className="btn-primary"
                  type="button"
                  style={{ marginTop: 20 }}
                  onClick={() => {
                    setMainTab("personal");
                    haptic("medium");
                  }}
                >
                  Создать программу
                </button>
              </div>
            ) : (
              <div className="program-list">
                {programs.map((prog) => (
                  <div
                    className="program-card"
                    key={prog.id}
                    onClick={() => {
                      setActiveProgramId(prog.id);
                      setScreen("program-detail");
                      haptic();
                    }}
                  >
                    <div
                      className="program-card-cover"
                      style={{ background: prog.cover }}
                    >
                      <div className="program-card-cover-actions">
                        {prog.forSale && (
                          <div className="program-sale-badge">
                            <I.Star s={11} /> {prog.priceStars}
                          </div>
                        )}
                        <button
                          className="program-share-icon"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareWorkout(prog.title, prog.id);
                          }}
                        >
                          <I.Share s={14} />
                        </button>
                      </div>
                    </div>
                    <div className="program-card-body">
                      <div className="program-card-title">{prog.title}</div>
                      <div className="program-card-meta">
                        {prog.level} · {prog.weeks} нед · {prog.workouts.length}{" "}
                        тренировок
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="btn-create-prog"
                  type="button"
                  onClick={() => {
                    setNpTitle("");
                    setNpDesc("");
                    setNpWeeks(4);
                    setNpCoverIdx(0);
                    setScreen("create-program");
                    haptic("medium");
                  }}
                >
                  <I.Plus /> Создать программу
                </button>
              </div>
            ))}
        </>
      )}

      {showScheduleEditor && (
        <ScheduleEditor
          allWorkouts={allWorkouts}
          weekDates={weekDates}
          scheduleMap={scheduleMap}
          onApply={setScheduleMap}
          onClose={() => setShowScheduleEditor(false)}
        />
      )}

      {catalogItem && (
        <div className="sheet-overlay-wrap">
          <div className="sheet-overlay" onClick={() => setCatalogItem(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle-bar" />
            <div
              className="bottom-sheet-cover-img"
              style={{ background: catalogItem.cover }}
            />
            <div className="bottom-sheet-body">
              <div className="sheet-header-row">
                <div>
                  <div className="sheet-title">{catalogItem.title}</div>
                  <div className="sheet-author">{catalogItem.author}</div>
                </div>
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => setCatalogItem(null)}
                >
                  Закрыть
                </button>
              </div>
              <div className="sheet-chips">
                {[
                  catalogItem.level,
                  catalogItem.duration,
                  catalogItem.focus,
                  catalogItem.equipment,
                ].map((t: string) => (
                  <span key={t} className="sheet-chip">
                    {t}
                  </span>
                ))}
              </div>
              <p className="sheet-desc">{catalogItem.description}</p>
              <div className="sheet-program-label">Что внутри</div>
              <ul className="sheet-list">
                {(purchasedIds.includes(catalogItem.id) || !catalogItem.isPaid
                  ? catalogItem.items
                  : catalogItem.items.slice(0, 2)
                ).map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))}
                {catalogItem.isPaid &&
                  !purchasedIds.includes(catalogItem.id) && (
                    <li
                      style={{
                        color: "var(--text-light)",
                        listStyle: "none",
                        marginTop: 4,
                      }}
                    >
                      🔒 Полный план после покупки
                    </li>
                  )}
              </ul>
              <div className="sheet-actions">
                {catalogItem.isPaid &&
                !purchasedIds.includes(catalogItem.id) ? (
                  <button
                    className="btn-primary full-w"
                    type="button"
                    onClick={() => {
                      setPurchasedIds((p) => [...p, catalogItem.id]);
                      haptic("medium");
                    }}
                  >
                    Купить за ★ {catalogItem.priceStars}
                  </button>
                ) : (
                  <button
                    className="btn-primary full-w"
                    type="button"
                    onClick={() => {
                      const prog: Program = {
                        id: uid(),
                        title: catalogItem.title,
                        description: catalogItem.description,
                        level: catalogItem.level,
                        weeks: 6,
                        cover: catalogItem.cover,
                        workouts: [],
                        forSale: false,
                        priceStars: 0,
                      };
                      setPrograms((p) => [...p, prog]);
                      setCatalogItem(null);
                      setCatSubTab("mine");
                      haptic("medium");
                    }}
                  >
                    Добавить в мои
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
