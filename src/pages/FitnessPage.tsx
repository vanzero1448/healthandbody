import { useState, useMemo } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";
import "./FitnessPage.css";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
};

type Workout = {
  id: string;
  title: string;
  duration: string;
  focus: string;
  color: string;
  exercises: Exercise[];
};

type ScheduleEntry = {
  date: string; // "YYYY-MM-DD"
  workoutId: string;
};

type MyProgram = {
  id: string;
  title: string;
  description: string;
  level: string;
  weeks: number;
  cover: string;
  workouts: Workout[];
  schedule: ScheduleEntry[];
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
  priceStars?: number;
  cover: string;
  description: string;
  items: string[];
};

type Screen =
  | "main"
  | "program-detail"
  | "workout-detail"
  | "create-program"
  | "create-workout"
  | "create-ai-text"
  | "create-ai-photo";

type GoalType =
  | "Похудение"
  | "Набор массы"
  | "Рельеф"
  | "Выносливость"
  | "Здоровье";

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const FOCUS_OPTIONS = [
  "Сила",
  "Тонус",
  "Рельеф",
  "Кардио",
  "Мобильность",
  "Выносливость",
];
const LEVELS = ["Начальный", "Средний", "Продвинутый"];
const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const GOAL_OPTIONS: GoalType[] = [
  "Похудение",
  "Набор массы",
  "Рельеф",
  "Выносливость",
  "Здоровье",
];

const WORKOUT_COLORS = [
  "#000000",
  "#1666b0",
  "#0d5c4a",
  "#8b2020",
  "#5a2d82",
  "#b05c00",
];

const COVERS = [
  "linear-gradient(135deg, #0f0f0f 0%, #2d2d2d 100%)",
  "linear-gradient(135deg, #0a2240 0%, #1666b0 100%)",
  "linear-gradient(135deg, #0a2e1e 0%, #1a7a50 100%)",
  "linear-gradient(135deg, #2a0d0d 0%, #8b2020 100%)",
  "linear-gradient(135deg, #1a0a2e 0%, #5a2d82 100%)",
];

const CATALOG: CatalogItem[] = [
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
    cover: "linear-gradient(140deg, #0f0f0f, #2a2a2a)",
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
    cover: "linear-gradient(140deg, #1666b0, #4a9de0)",
    description:
      "Мягкий вход в тренировки: короткие сессии, без прыжков, бережная нагрузка.",
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
    cover: "linear-gradient(140deg, #101010, #606060)",
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
    cover: "linear-gradient(140deg, #0d5c4a, #2a9d7a)",
    description:
      "Укрепление кора и раскрытие грудного отдела. Для офисного ритма.",
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
    cover: "linear-gradient(140deg, #2a0d0d, #8b2020)",
    description:
      "Интенсивные 20 минут: 8 кругов по 4 упражнения. Максимальный эффект.",
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
    cover: "linear-gradient(140deg, #1a0a2e, #5a2d82)",
    description:
      "Пилатес с фокусом на глубокий кор, осанку и подвижность суставов.",
    items: [
      "Активация кора 10 мин",
      "Основной блок 25 мин",
      "Стретчинг 10 мин",
    ],
  },
];

const INITIAL_PROGRAMS: MyProgram[] = [
  {
    id: "p1",
    title: "Сила 3×",
    description: "Базовые движения + корпус. Прогрессия каждые 2 недели.",
    level: "Средний",
    weeks: 4,
    cover: COVERS[0],
    forSale: false,
    priceStars: 99,
    schedule: [],
    workouts: [
      {
        id: "w1",
        title: "День A — Жим",
        duration: "50 мин",
        focus: "Верх",
        color: "#000000",
        exercises: [
          {
            id: "e1",
            name: "Жим штанги лёжа",
            sets: 4,
            reps: "6–8",
            rest: "2 мин",
          },
          {
            id: "e2",
            name: "Жим гантелей",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
          },
          {
            id: "e3",
            name: "Тяга верхнего блока",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
          },
        ],
      },
      {
        id: "w2",
        title: "День B — Ноги",
        duration: "55 мин",
        focus: "Низ",
        color: "#1666b0",
        exercises: [
          {
            id: "e4",
            name: "Присед со штангой",
            sets: 4,
            reps: "5–7",
            rest: "3 мин",
          },
          {
            id: "e5",
            name: "Жим ногами",
            sets: 3,
            reps: "10–12",
            rest: "2 мин",
          },
          {
            id: "e6",
            name: "Румынская тяга",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
          },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */

function getWeekDates(offset = 0): Date[] {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isToday(d: Date) {
  return fmtDate(d) === fmtDate(new Date());
}

const triggerHaptic = (style: TelegramHapticStyle = "light") => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  } else if (navigator.vibrate) {
    navigator.vibrate(8);
  }
};

/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */

const ChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const PlusIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const StarIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SparkleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
    <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5z" />
    <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" />
  </svg>
);

const CameraIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const PencilIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */

export default function FitnessPage() {
  /* ── Navigation ── */
  const [mainTab, setMainTab] = useState<"personal" | "catalog">("personal");
  const [catSubTab, setCatSubTab] = useState<"catalog" | "mine">("catalog");
  const [screen, setScreen] = useState<Screen>("main");

  /* ── Data ── */
  const [programs, setPrograms] = useState<MyProgram[]>(INITIAL_PROGRAMS);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  /* ── User goals ── */
  const [goal, setGoal] = useState<GoalType>("Рельеф");
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  /* ── Schedule ── */
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()));
  const [scheduleMap, setScheduleMap] = useState<
    Record<string, { workoutId: string; programId: string }>
  >({});
  const [showAssign, setShowAssign] = useState(false);

  /* ── Active refs ── */
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);
  const [catFilter, setCatFilter] = useState<"all" | "free" | "paid">("all");

  /* ── New program form ── */
  const [npTitle, setNpTitle] = useState("");
  const [npDesc, setNpDesc] = useState("");
  const [npLevel, setNpLevel] = useState(LEVELS[1]);
  const [npWeeks, setNpWeeks] = useState(4);
  const [npCoverIdx, setNpCoverIdx] = useState(0);

  /* ── New workout form ── */
  const [wTitle, setWTitle] = useState("");
  const [wDuration, setWDuration] = useState("");
  const [wFocus, setWFocus] = useState(FOCUS_OPTIONS[0]);
  const [wColorIdx, setWColorIdx] = useState(0);
  const [wExercises, setWExercises] = useState<Exercise[]>([]);
  const [wExName, setWExName] = useState("");
  const [wExSets, setWExSets] = useState(3);
  const [wExReps, setWExReps] = useState("10–12");
  const [wExRest, setWExRest] = useState("60 сек");

  /* ── AI text form ── */
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /* ── Edit workout (existing) ── */
  const [editExName, setEditExName] = useState("");

  /* ── Derived ── */
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const activeProgram = programs.find((p) => p.id === activeProgramId) ?? null;
  const activeWorkout =
    activeProgram?.workouts.find((w) => w.id === activeWorkoutId) ?? null;
  const filteredCatalog =
    catFilter === "free"
      ? CATALOG.filter((c) => !c.isPaid)
      : catFilter === "paid"
        ? CATALOG.filter((c) => c.isPaid)
        : CATALOG;

  const selectedDayEntry = scheduleMap[selectedDate];
  const selectedDayWorkout = selectedDayEntry
    ? (programs
        .find((p) => p.id === selectedDayEntry.programId)
        ?.workouts.find((w) => w.id === selectedDayEntry.workoutId) ?? null)
    : null;

  const allWorkoutsFlat = useMemo(
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

  /* ── Mutations ── */

  const updateProgram = (id: string, patch: Partial<MyProgram>) =>
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );

  const createProgram = () => {
    if (!npTitle.trim()) return;
    const prog: MyProgram = {
      id: uid(),
      title: npTitle.trim(),
      description: npDesc.trim() || "Описание программы",
      level: npLevel,
      weeks: npWeeks,
      cover: COVERS[npCoverIdx],
      workouts: [],
      schedule: [],
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
    triggerHaptic("medium");
  };

  const createWorkout = () => {
    if (!wTitle.trim() || !activeProgramId) return;
    const workout: Workout = {
      id: uid(),
      title: wTitle.trim(),
      duration: wDuration || "30–45 мин",
      focus: wFocus,
      color: WORKOUT_COLORS[wColorIdx],
      exercises: wExercises,
    };
    updateProgram(activeProgramId, {
      workouts: [...(activeProgram?.workouts ?? []), workout],
    });
    setWTitle("");
    setWDuration("");
    setWExercises([]);
    setScreen("program-detail");
    triggerHaptic("medium");
  };

  const addExToForm = () => {
    if (!wExName.trim()) return;
    setWExercises((prev) => [
      ...prev,
      {
        id: uid(),
        name: wExName.trim(),
        sets: wExSets,
        reps: wExReps,
        rest: wExRest,
      },
    ]);
    setWExName("");
    triggerHaptic();
  };

  const addExToWorkout = () => {
    if (!editExName.trim() || !activeProgramId || !activeWorkoutId) return;
    const ex: Exercise = {
      id: uid(),
      name: editExName.trim(),
      sets: 3,
      reps: "10–12",
      rest: "60 сек",
    };
    updateProgram(activeProgramId, {
      workouts: activeProgram!.workouts.map((w) =>
        w.id === activeWorkoutId
          ? { ...w, exercises: [...w.exercises, ex] }
          : w,
      ),
    });
    setEditExName("");
    triggerHaptic();
  };

  const removeEx = (exId: string) => {
    if (!activeProgramId || !activeWorkoutId) return;
    updateProgram(activeProgramId, {
      workouts: activeProgram!.workouts.map((w) =>
        w.id === activeWorkoutId
          ? { ...w, exercises: w.exercises.filter((e) => e.id !== exId) }
          : w,
      ),
    });
  };

  const assignToDay = (workoutId: string, programId: string) => {
    setScheduleMap((prev) => ({
      ...prev,
      [selectedDate]: { workoutId, programId },
    }));
    setShowAssign(false);
    triggerHaptic("medium");
  };

  const clearDay = () => {
    setScheduleMap((prev) => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
  };

  const simulateAI = () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setTimeout(() => {
      const prog: MyProgram = {
        id: uid(),
        title: `AI: ${aiQuery.slice(0, 20)}`,
        description: aiQuery,
        level: "Средний",
        weeks: 4,
        cover: COVERS[Math.floor(Math.random() * COVERS.length)],
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
              },
              {
                id: uid(),
                name: "Жим",
                sets: 3,
                reps: "10–12",
                rest: "90 сек",
              },
              {
                id: uid(),
                name: "Тяга",
                sets: 3,
                reps: "10–12",
                rest: "90 сек",
              },
            ],
          },
        ],
        schedule: [],
        forSale: false,
        priceStars: 0,
      };
      setPrograms((p) => [...p, prog]);
      setAiLoading(false);
      setAiQuery("");
      setActiveProgramId(prog.id);
      setScreen("program-detail");
      triggerHaptic("medium");
    }, 1800);
  };

  const goBack = () => {
    if (screen === "workout-detail" || screen === "create-workout")
      setScreen("program-detail");
    else setScreen("main");
  };

  /* ══════════════════════════════════════════════
     SCREEN: PROGRAM DETAIL
  ══════════════════════════════════════════════ */
  if (screen === "program-detail" && activeProgram)
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
        </div>

        <div className="prog-hero" style={{ background: activeProgram.cover }}>
          <div>
            <div className="prog-hero-title">{activeProgram.title}</div>
            <div className="prog-hero-meta">
              {activeProgram.level} · {activeProgram.weeks} нед
            </div>
          </div>
        </div>

        <p className="prog-desc">{activeProgram.description}</p>

        <div className="section-row">
          <h2>Тренировки</h2>
          <button
            className="btn-text"
            type="button"
            onClick={() => {
              setWTitle("");
              setWDuration("");
              setWExercises([]);
              setScreen("create-workout");
              triggerHaptic();
            }}
          >
            <PlusIcon /> Добавить
          </button>
        </div>

        {activeProgram.workouts.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-sub">Нет тренировок — добавь первую</div>
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
                  onClick={() => {
                    setActiveWorkoutId(wk.id);
                    setScreen("workout-detail");
                    triggerHaptic();
                  }}
                >
                  <div>
                    <div className="workout-card-title">{wk.title}</div>
                    <div className="workout-card-meta">
                      {wk.focus} · {wk.duration} · {wk.exercises.length} упр.
                    </div>
                  </div>
                  <span className="workout-chevron">›</span>
                </div>
                {wk.exercises.length > 0 && (
                  <div className="workout-ex-preview">
                    {wk.exercises.slice(0, 3).map((ex) => (
                      <span key={ex.id} className="ex-preview-chip">
                        {ex.name}
                      </span>
                    ))}
                    {wk.exercises.length > 3 && (
                      <span className="ex-preview-chip muted">
                        +{wk.exercises.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sell */}
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
                triggerHaptic();
              }}
            />
          </div>
          {activeProgram.forSale && (
            <div className="sell-fields">
              <div className="price-row">
                <span className="price-star">
                  <StarIcon size={14} />
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
                onClick={() => triggerHaptic("medium")}
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
            triggerHaptic("medium");
          }}
        >
          Удалить программу
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: CREATE WORKOUT
  ══════════════════════════════════════════════ */
  if (screen === "create-workout" && activeProgram)
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
          <span className="screen-title">Новая тренировка</span>
        </div>

        <div className="form-block">
          <label className="form-label">Название</label>
          <input
            className="form-input"
            placeholder="День A — Жим"
            value={wTitle}
            onChange={(e) => setWTitle(e.target.value)}
          />
        </div>

        <div className="form-block">
          <label className="form-label">Длительность</label>
          <input
            className="form-input"
            placeholder="45–60 мин"
            value={wDuration}
            onChange={(e) => setWDuration(e.target.value)}
          />
        </div>

        <div className="form-block">
          <label className="form-label">Акцент</label>
          <div className="chip-row wrap">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                className={`opt-chip ${wFocus === f ? "active" : ""}`}
                onClick={() => {
                  setWFocus(f);
                  triggerHaptic();
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="form-block">
          <label className="form-label">Цвет</label>
          <div className="color-row">
            {WORKOUT_COLORS.map((c, i) => (
              <div
                key={i}
                className={`color-dot ${wColorIdx === i ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setWColorIdx(i);
                  triggerHaptic();
                }}
              />
            ))}
          </div>
        </div>

        <div className="section-row">
          <h2>Упражнения</h2>
          <span className="section-hint">{wExercises.length}</span>
        </div>

        {wExercises.length > 0 && (
          <div className="exercise-list">
            {wExercises.map((ex, idx) => (
              <div className="exercise-card" key={ex.id}>
                <div className="ex-idx">{idx + 1}</div>
                <div className="ex-info">
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-chips">
                    <span className="ex-chip">{ex.sets} подх.</span>
                    <span className="ex-chip">{ex.reps}</span>
                    <span className="ex-chip muted">{ex.rest}</span>
                  </div>
                </div>
                <button
                  className="btn-remove-ex"
                  type="button"
                  onClick={() => {
                    setWExercises((p) => p.filter((e) => e.id !== ex.id));
                    triggerHaptic();
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="add-ex-block">
          <label className="form-label">Добавить упражнение</label>
          <input
            className="form-input"
            placeholder="Название упражнения"
            value={wExName}
            onChange={(e) => setWExName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addExToForm();
            }}
          />
          <div className="ex-params-row">
            <div className="ex-param-col">
              <span className="ex-param-label">Подходы</span>
              <div className="num-ctrl">
                <button
                  type="button"
                  className="num-btn"
                  onClick={() => setWExSets((s) => Math.max(1, s - 1))}
                >
                  −
                </button>
                <span className="num-val">{wExSets}</span>
                <button
                  type="button"
                  className="num-btn"
                  onClick={() => setWExSets((s) => Math.min(10, s + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="ex-param-col">
              <span className="ex-param-label">Повторения</span>
              <input
                className="ex-param-input"
                value={wExReps}
                onChange={(e) => setWExReps(e.target.value)}
              />
            </div>
            <div className="ex-param-col">
              <span className="ex-param-label">Отдых</span>
              <input
                className="ex-param-input"
                value={wExRest}
                onChange={(e) => setWExRest(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn-add-ex"
            type="button"
            onClick={addExToForm}
            disabled={!wExName.trim()}
          >
            <PlusIcon size={15} /> Добавить
          </button>
        </div>

        <button
          className="btn-primary full-w"
          type="button"
          onClick={createWorkout}
          disabled={!wTitle.trim()}
        >
          Сохранить тренировку
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: WORKOUT DETAIL
  ══════════════════════════════════════════════ */
  if (screen === "workout-detail" && activeWorkout)
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
        </div>

        <div
          className="workout-hero"
          style={{ borderLeft: `4px solid ${activeWorkout.color}` }}
        >
          <span className="workout-hero-focus">{activeWorkout.focus}</span>
          <div className="workout-hero-title">{activeWorkout.title}</div>
          <div className="workout-hero-meta">
            {activeWorkout.duration} · {activeWorkout.exercises.length}{" "}
            упражнений
          </div>
        </div>

        <div className="section-row">
          <h2>Упражнения</h2>
          <span className="section-hint">{activeWorkout.exercises.length}</span>
        </div>

        {activeWorkout.exercises.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-sub">Упражнения не добавлены</div>
          </div>
        ) : (
          <div className="exercise-list">
            {activeWorkout.exercises.map((ex, idx) => (
              <div className="exercise-card" key={ex.id}>
                <div
                  className="ex-idx"
                  style={{ background: activeWorkout.color }}
                >
                  {idx + 1}
                </div>
                <div className="ex-info">
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-chips">
                    <span className="ex-chip">{ex.sets} подх.</span>
                    <span className="ex-chip">{ex.reps}</span>
                    <span className="ex-chip muted">отдых {ex.rest}</span>
                  </div>
                </div>
                <button
                  className="btn-remove-ex"
                  type="button"
                  onClick={() => {
                    removeEx(ex.id);
                    triggerHaptic();
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="add-ex-block">
          <label className="form-label">Добавить упражнение</label>
          <input
            className="form-input"
            placeholder="Название упражнения"
            value={editExName}
            onChange={(e) => setEditExName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addExToWorkout();
            }}
          />
          <button
            className="btn-add-ex"
            type="button"
            onClick={addExToWorkout}
            disabled={!editExName.trim()}
          >
            <PlusIcon size={15} /> Добавить
          </button>
        </div>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: CREATE PROGRAM
  ══════════════════════════════════════════════ */
  if (screen === "create-program")
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
          <span className="screen-title">Новая программа</span>
        </div>

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
                  triggerHaptic();
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
                  triggerHaptic();
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
  if (screen === "create-ai-text")
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
          <span className="screen-title">AI по тексту</span>
        </div>

        <div className="ai-intro-card">
          <div className="ai-intro-icon">
            <SparkleIcon />
          </div>
          <div className="ai-intro-text">
            Опиши цель, уровень и предпочтения — AI сгенерирует программу
            тренировок
          </div>
        </div>

        <div className="form-block">
          <label className="form-label">Запрос</label>
          <textarea
            className="form-textarea big"
            rows={5}
            placeholder={
              "Например:\n«Хочу похудеть, 3 тренировки в неделю, дома без инвентаря, уровень начальный»"
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
                triggerHaptic();
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
              <SparkleIcon /> Сгенерировать
            </>
          )}
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: AI PHOTO
  ══════════════════════════════════════════════ */
  if (screen === "create-ai-photo")
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
          <span className="screen-title">AI по фото</span>
        </div>

        <div className="photo-upload-area">
          <div className="photo-upload-icon">
            <CameraIcon />
          </div>
          <div className="photo-upload-title">Загрузи фото тела</div>
          <div className="photo-upload-sub">
            AI проанализирует состав тела и составит программу
          </div>
          <button
            className="btn-primary"
            type="button"
            style={{ marginTop: 20 }}
            onClick={() => triggerHaptic("medium")}
          >
            Выбрать фото
          </button>
        </div>

        <div className="photo-hint-list">
          {[
            "Фото в полный рост, хорошее освещение",
            "Нейтральная поза, лицом или боком",
            "Без лишней одежды для точного анализа",
          ].map((h) => (
            <div key={h} className="photo-hint-item">
              <span className="photo-hint-dot" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>
    );

  /* ══════════════════════════════════════════════
     SCREEN: MAIN
  ══════════════════════════════════════════════ */
  return (
    <div className="fitness-page">
      {/* Header */}
      <div className="fitness-header">
        <h1>Тренировки</h1>
      </div>

      {/* Main tab switch */}
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
              triggerHaptic();
            }}
          >
            Личные
          </button>
          <button
            className={`fitness-pill-tab ${mainTab === "catalog" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setMainTab("catalog");
              triggerHaptic();
            }}
          >
            Каталог
          </button>
        </div>
      </div>

      {/* ════════════════════════════════
          TAB: ЛИЧНЫЕ
      ════════════════════════════════ */}
      {mainTab === "personal" && (
        <>
          {/* Goal card */}
          <div className="goal-card">
            <div className="goal-card-left">
              <div className="goal-label">Цель</div>
              <div className="goal-value">{goal}</div>
            </div>
            <button
              className="goal-edit-btn"
              type="button"
              onClick={() => {
                setShowGoalEdit(!showGoalEdit);
                triggerHaptic();
              }}
            >
              Изменить
            </button>
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
                    triggerHaptic();
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Create workout section */}
          <div className="section-row" style={{ marginTop: 28 }}>
            <h2>Создать тренировку</h2>
          </div>

          <div className="create-grid">
            <button
              className="create-card ai-text-card"
              type="button"
              onClick={() => {
                setScreen("create-ai-text");
                triggerHaptic("medium");
              }}
            >
              <div className="create-card-icon">
                <SparkleIcon />
              </div>
              <div className="create-card-title">AI по тексту</div>
              <div className="create-card-sub">Опиши цель — получи план</div>
            </button>

            <button
              className="create-card ai-photo-card"
              type="button"
              onClick={() => {
                setScreen("create-ai-photo");
                triggerHaptic("medium");
              }}
            >
              <div className="create-card-icon">
                <CameraIcon />
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
                triggerHaptic("medium");
              }}
            >
              <div className="create-card-icon">
                <PencilIcon />
              </div>
              <div className="create-card-title">Вручную</div>
              <div className="create-card-sub">Своя программа с нуля</div>
            </button>
          </div>

          {/* Schedule */}
          <div className="section-row" style={{ marginTop: 32 }}>
            <h2>Расписание</h2>
            <div className="week-nav">
              <button
                className="week-nav-btn"
                type="button"
                onClick={() => {
                  setWeekOffset((o) => o - 1);
                  triggerHaptic();
                }}
              >
                ‹
              </button>
              <span className="week-nav-label">
                {weekOffset === 0
                  ? "Эта неделя"
                  : weekOffset === 1
                    ? "След. неделя"
                    : weekOffset === -1
                      ? "Пред. неделя"
                      : `${weekOffset > 0 ? "+" : ""}${weekOffset} нед`}
              </span>
              <button
                className="week-nav-btn"
                type="button"
                onClick={() => {
                  setWeekOffset((o) => o + 1);
                  triggerHaptic();
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Week strip */}
          <div className="week-strip">
            {weekDates.map((d, i) => {
              const dateStr = fmtDate(d);
              const hasWorkout = !!scheduleMap[dateStr];
              const isSelected = dateStr === selectedDate;
              const todayFlag = isToday(d);
              return (
                <div
                  key={i}
                  className={`day-col ${isSelected ? "selected" : ""} ${todayFlag ? "today" : ""}`}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    triggerHaptic();
                  }}
                >
                  <span className="day-col-name">{DAYS_SHORT[i]}</span>
                  <span className="day-col-num">{d.getDate()}</span>
                  {hasWorkout && (
                    <span
                      className="day-dot"
                      style={{
                        background: scheduleMap[dateStr]
                          ? (programs
                              .find(
                                (p) => p.id === scheduleMap[dateStr].programId,
                              )
                              ?.workouts.find(
                                (w) => w.id === scheduleMap[dateStr].workoutId,
                              )?.color ?? "#000")
                          : "#000",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          <div className="day-detail">
            <div className="day-detail-header">
              <div className="day-detail-date">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("ru", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              {selectedDayWorkout && (
                <button
                  className="btn-ghost-sm"
                  type="button"
                  onClick={() => {
                    clearDay();
                    triggerHaptic();
                  }}
                >
                  Убрать
                </button>
              )}
            </div>

            {selectedDayWorkout ? (
              <div
                className="day-workout-card"
                style={{ borderLeft: `4px solid ${selectedDayWorkout.color}` }}
              >
                <div className="day-workout-title">
                  {selectedDayWorkout.title}
                </div>
                <div className="day-workout-meta">
                  {selectedDayWorkout.focus} · {selectedDayWorkout.duration} ·{" "}
                  {selectedDayWorkout.exercises.length} упр.
                </div>
                {selectedDayWorkout.exercises.length > 0 && (
                  <div className="day-workout-exercises">
                    {selectedDayWorkout.exercises.map((ex) => (
                      <div key={ex.id} className="day-ex-row">
                        <span className="day-ex-name">{ex.name}</span>
                        <span className="day-ex-sets">
                          {ex.sets}×{ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="day-empty">
                <div className="day-empty-label">Тренировка не назначена</div>
                {allWorkoutsFlat.length > 0 && (
                  <button
                    className="btn-assign"
                    type="button"
                    onClick={() => {
                      setShowAssign(true);
                      triggerHaptic();
                    }}
                  >
                    <PlusIcon size={15} /> Назначить тренировку
                  </button>
                )}
                {allWorkoutsFlat.length === 0 && (
                  <button
                    className="btn-assign"
                    type="button"
                    onClick={() => {
                      setScreen("create-ai-text");
                      triggerHaptic("medium");
                    }}
                  >
                    <PlusIcon size={15} /> Создать тренировку
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Assign workout bottom sheet */}
          {showAssign && (
            <div className="sheet-overlay-wrap">
              <div
                className="sheet-overlay"
                onClick={() => setShowAssign(false)}
              />
              <div className="bottom-sheet">
                <div className="bottom-sheet-handle" />
                <div className="bottom-sheet-body">
                  <div className="sheet-title" style={{ marginBottom: 16 }}>
                    Выбери тренировку
                  </div>
                  <div className="assign-list">
                    {allWorkoutsFlat.map((w) => (
                      <div
                        key={w.id}
                        className="assign-item"
                        onClick={() => {
                          assignToDay(w.id, w.programId);
                        }}
                      >
                        <div
                          className="assign-dot"
                          style={{ background: w.color }}
                        />
                        <div>
                          <div className="assign-title">{w.title}</div>
                          <div className="assign-meta">
                            {w.programTitle} · {w.duration}
                          </div>
                        </div>
                        <span className="workout-chevron">›</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════
          TAB: КАТАЛОГ
      ════════════════════════════════ */}
      {mainTab === "catalog" && (
        <>
          {/* Sub-switch */}
          <div className="sub-switch">
            <button
              className={`sub-tab ${catSubTab === "catalog" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setCatSubTab("catalog");
                triggerHaptic();
              }}
            >
              Каталог
            </button>
            <button
              className={`sub-tab ${catSubTab === "mine" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setCatSubTab("mine");
                triggerHaptic();
              }}
            >
              Мои программы
              {programs.length > 0 && (
                <span className="sub-tab-badge">{programs.length}</span>
              )}
            </button>
          </div>

          {/* Sub-tab: Каталог */}
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
                      triggerHaptic();
                    }}
                  >
                    {{ all: "Все", free: "Бесплатные", paid: "Платные" }[f]}
                  </button>
                ))}
              </div>
              <div className="catalog-grid">
                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="catalog-card"
                    onClick={() => {
                      setCatalogItem(item);
                      triggerHaptic();
                    }}
                  >
                    <div
                      className="catalog-cover"
                      style={{ background: item.cover }}
                    >
                      {item.isPaid ? (
                        <div className="catalog-price">
                          <StarIcon /> {item.priceStars}
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

          {/* Sub-tab: Мои программы */}
          {catSubTab === "mine" && (
            <>
              {programs.length === 0 ? (
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
                      triggerHaptic("medium");
                    }}
                  >
                    Перейти к созданию
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
                        triggerHaptic();
                      }}
                    >
                      <div
                        className="program-card-cover"
                        style={{ background: prog.cover }}
                      >
                        {prog.forSale && (
                          <div className="program-sale-badge">
                            <StarIcon size={11} /> {prog.priceStars}
                          </div>
                        )}
                      </div>
                      <div className="program-card-body">
                        <div className="program-card-title">{prog.title}</div>
                        <div className="program-card-meta">
                          {prog.level} · {prog.weeks} нед
                        </div>
                        <div className="program-card-stats">
                          <span className="prog-stat">
                            {prog.workouts.length} тренировок
                          </span>
                          {prog.forSale && (
                            <span className="prog-stat sale">В продаже</span>
                          )}
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
                      triggerHaptic("medium");
                    }}
                  >
                    <PlusIcon /> Создать программу
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Catalog bottom sheet */}
      {catalogItem && (
        <div className="sheet-overlay-wrap">
          <div className="sheet-overlay" onClick={() => setCatalogItem(null)} />
          <div className="bottom-sheet">
            <div className="bottom-sheet-handle" />
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
                ].map((t) => (
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
                ).map((line, i) => (
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
                      triggerHaptic("medium");
                    }}
                  >
                    Купить за ★ {catalogItem.priceStars}
                  </button>
                ) : (
                  <button
                    className="btn-primary full-w"
                    type="button"
                    onClick={() => {
                      const prog: MyProgram = {
                        id: uid(),
                        title: catalogItem.title,
                        description: catalogItem.description,
                        level: catalogItem.level,
                        weeks: 6,
                        cover: catalogItem.cover,
                        workouts: [],
                        schedule: [],
                        forSale: false,
                        priceStars: 0,
                      };
                      setPrograms((p) => [...p, prog]);
                      setSavedIds((s) => [...s, catalogItem.id]);
                      setCatalogItem(null);
                      setCatSubTab("mine");
                      triggerHaptic("medium");
                    }}
                  >
                    {savedIds.includes(catalogItem.id)
                      ? "Добавлено ✓"
                      : "Добавить в мои"}
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
