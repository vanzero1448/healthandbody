import { useState, useMemo, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";
import "./FitnessPage.css";

/* ══════════════════════════════════════════════
   TELEGRAM API HELPERS
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
    return () => {
      btn.offClick?.(onBack);
    };
  }, [enabled, onBack]);
}

const triggerHaptic = (style: TelegramHapticStyle = "light") => {
  const webApp = tg();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(style);
  } else {
    navigator.vibrate?.(8);
  }
};

const shareProgram = (title: string, programId: string) => {
  const webApp = tg();
  const initDataUnsafe = webApp?.initDataUnsafe;
  const hasUser =
    !!initDataUnsafe &&
    typeof initDataUnsafe === "object" &&
    "user" in initDataUnsafe;
  const botUsername = hasUser ? "your_bot" : null;
  const link = botUsername
    ? `https://t.me/${botUsername}/app?startapp=program_${programId}`
    : window.location.href;

  if (webApp?.openTelegramLink && botUsername) {
    webApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Посмотри мою программу тренировок: ${title}`)}`,
    );
  } else if (navigator.share) {
    navigator.share({
      title: `Программа: ${title}`,
      text: `Посмотри мою программу тренировок: ${title}`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard?.writeText(link);
    webApp?.showAlert?.("Ссылка скопирована!");
  }
  triggerHaptic("medium");
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

// scheduleMap: "YYYY-MM-DD" -> { workoutId, programId }
type DayEntry = { workoutId: string; programId: string };
type ScheduleMap = Record<string, DayEntry>;

type Screen =
  | "main"
  | "program-detail"
  | "workout-detail"
  | "create-program"
  | "create-workout"
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
const FOCUS_OPTIONS = [
  "Сила",
  "Тонус",
  "Рельеф",
  "Кардио",
  "Мобильность",
  "Выносливость",
];
const LEVELS = ["Начальный", "Средний", "Продвинутый"];
const GOAL_OPTIONS: GoalType[] = [
  "Похудение",
  "Набор массы",
  "Рельеф",
  "Выносливость",
  "Здоровье",
];
const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WORKOUT_COLORS = [
  "#000000",
  "#1666b0",
  "#0d5c4a",
  "#8b2020",
  "#5a2d82",
  "#b05c00",
  "#1a6b6b",
];
const COVERS = [
  "linear-gradient(135deg,#0f0f0f,#2d2d2d)",
  "linear-gradient(135deg,#0a2240,#1666b0)",
  "linear-gradient(135deg,#0a2e1e,#1a7a50)",
  "linear-gradient(135deg,#2a0d0d,#8b2020)",
  "linear-gradient(135deg,#1a0a2e,#5a2d82)",
];

function getWeekDates(offset = 0): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const isToday = (d: Date) => fmt(d) === fmt(new Date());

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
          },
          {
            id: "e8",
            name: "Тяга штанги в наклоне",
            sets: 3,
            reps: "8–10",
            rest: "2 мин",
          },
          {
            id: "e9",
            name: "Подтягивания",
            sets: 3,
            reps: "max",
            rest: "2 мин",
          },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */

const Icon = {
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
  ChevronRight: ({ s = 18 }: { s?: number }) => (
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
};

/* ══════════════════════════════════════════════
   HELPERS — allWorkouts flat list
══════════════════════════════════════════════ */

type FlatWorkout = Workout & { programId: string; programTitle: string };

/* ══════════════════════════════════════════════
   SCHEDULE EDITOR BOTTOM SHEET
   Shows a grid: rows = workouts, cols = days
   Each cell toggleable
══════════════════════════════════════════════ */

type ScheduleEditorProps = {
  allWorkouts: FlatWorkout[];
  weekDates: Date[];
  scheduleMap: ScheduleMap;
  onApply: (map: ScheduleMap) => void;
  onClose: () => void;
};

function ScheduleEditor({
  allWorkouts,
  weekDates,
  scheduleMap,
  onApply,
  onClose,
}: ScheduleEditorProps) {
  const [local, setLocal] = useState<ScheduleMap>({ ...scheduleMap });

  const toggle = (dateStr: string, w: FlatWorkout) => {
    triggerHaptic("light");
    setLocal((prev) => {
      const cur = prev[dateStr];
      if (cur && cur.workoutId === w.id) {
        const n = { ...prev };
        delete n[dateStr];
        return n;
      }
      return {
        ...prev,
        [dateStr]: { workoutId: w.id, programId: w.programId },
      };
    });
  };

  const clearAll = () => {
    setLocal({});
    triggerHaptic("medium");
  };

  // Apply workout to specific days pattern
  const applyPattern = (w: FlatWorkout, days: number[]) => {
    triggerHaptic("medium");
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
              className="sched-clear-btn"
              type="button"
              onClick={clearAll}
            >
              Очистить
            </button>
            <button
              className="sched-done-btn"
              type="button"
              onClick={() => {
                onApply(local);
                triggerHaptic("medium");
                onClose();
              }}
            >
              <Icon.Check /> Готово
            </button>
          </div>
        </div>

        {/* Day headers */}
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

        {/* Rows per workout */}
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
                      {active && <Icon.Check s={12} />}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Quick patterns */}
        {allWorkouts.length > 0 && (
          <div className="sched-patterns">
            <div className="sched-patterns-title">Быстрые шаблоны</div>
            {allWorkouts.slice(0, 3).map((w) => (
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
                      className="sched-pattern-btn"
                      type="button"
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
   PAGE TITLE HEADER (replaces back button)
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
  /* Navigation */
  const [screen, setScreen] = useState<Screen>("main");
  const [mainTab, setMainTab] = useState<"personal" | "catalog">("personal");
  const [catSubTab, setCatSubTab] = useState<"catalog" | "mine">("catalog");

  /* Data */
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>({});
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  /* UI state */
  const [goal, setGoal] = useState<GoalType>("Рельеф");
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);
  const [catFilter, setCatFilter] = useState<"all" | "free" | "paid">("all");
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  /* Forms */
  const [npTitle, setNpTitle] = useState("");
  const [npDesc, setNpDesc] = useState("");
  const [npLevel, setNpLevel] = useState(LEVELS[1]);
  const [npWeeks, setNpWeeks] = useState(4);
  const [npCoverIdx, setNpCoverIdx] = useState(0);
  const [wTitle, setWTitle] = useState("");
  const [wDuration, setWDuration] = useState("");
  const [wFocus, setWFocus] = useState(FOCUS_OPTIONS[0]);
  const [wColorIdx, setWColorIdx] = useState(0);
  const [wExercises, setWExercises] = useState<Exercise[]>([]);
  const [wExName, setWExName] = useState("");
  const [wExSets, setWExSets] = useState(3);
  const [wExReps, setWExReps] = useState("10–12");
  const [wExRest, setWExRest] = useState("60 сек");
  const [editExName, setEditExName] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /* Derived */
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const activeProgram = programs.find((p) => p.id === activeProgramId) ?? null;
  const activeWorkout =
    activeProgram?.workouts.find((w) => w.id === activeWorkoutId) ?? null;
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

  /* Telegram BackButton */
  const handleBack = useCallback(() => {
    if (screen === "workout-detail" || screen === "create-workout") {
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
    triggerHaptic("medium");
  };

  const createWorkout = () => {
    if (!wTitle.trim() || !activeProgramId) return;
    const w: Workout = {
      id: uid(),
      title: wTitle.trim(),
      duration: wDuration || "30–45 мин",
      focus: wFocus,
      color: WORKOUT_COLORS[wColorIdx],
      exercises: wExercises,
    };
    updateProgram(activeProgramId, {
      workouts: [...(activeProgram?.workouts ?? []), w],
    });
    setWTitle("");
    setWDuration("");
    setWExercises([]);
    setScreen("program-detail");
    triggerHaptic("medium");
  };

  const addExToForm = () => {
    if (!wExName.trim()) return;
    setWExercises((p) => [
      ...p,
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
    updateProgram(activeProgramId, {
      workouts: activeProgram!.workouts.map((w) =>
        w.id === activeWorkoutId
          ? {
              ...w,
              exercises: [
                ...w.exercises,
                {
                  id: uid(),
                  name: editExName.trim(),
                  sets: 3,
                  reps: "10–12",
                  rest: "60 сек",
                },
              ],
            }
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
          {
            id: uid(),
            title: "Тренировка B",
            duration: "35–45 мин",
            focus: "Кардио",
            color: WORKOUT_COLORS[1],
            exercises: [
              { id: uid(), name: "Берпи", sets: 4, reps: "10", rest: "45 сек" },
              {
                id: uid(),
                name: "Прыжки",
                sets: 3,
                reps: "20",
                rest: "30 сек",
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
      triggerHaptic("medium");
    }, 1800);
  };

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
              {activeProgram.level} · {activeProgram.weeks} нед
            </div>
          </div>
          <div className="prog-hero-actions">
            <button
              className="prog-share-btn"
              type="button"
              onClick={() => {
                shareProgram(activeProgram.title, activeProgram.id);
              }}
            >
              <Icon.Share s={16} /> Поделиться
            </button>
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
            <Icon.Plus /> Добавить
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
                  <Icon.ChevronRight s={18} />
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
                <div className="workout-card-footer">
                  <button
                    className="btn-danger-sm"
                    type="button"
                    onClick={() => {
                      updateProgram(activeProgram.id, {
                        workouts: activeProgram.workouts.filter(
                          (w) => w.id !== wk.id,
                        ),
                      });
                      triggerHaptic();
                    }}
                  >
                    <Icon.Trash s={13} /> Удалить
                  </button>
                  <button
                    className="btn-share-sm"
                    type="button"
                    onClick={() => {
                      shareProgram(wk.title, activeProgram.id);
                    }}
                  >
                    <Icon.Share s={13} /> Поделиться
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
                triggerHaptic();
              }}
            />
          </div>
          {activeProgram.forSale && (
            <div className="sell-fields">
              <div className="price-row">
                <span className="price-star">
                  <Icon.Star s={14} />
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
     SCREEN: WORKOUT DETAIL
  ══════════════════════════════════════════════ */
  if (screen === "workout-detail" && activeWorkout && activeProgram)
    return (
      <div className="fitness-page">
        <PageHeader title={activeWorkout.title} />
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
                  <Icon.Trash />
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
            <Icon.Plus s={15} /> Добавить
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
     SCREEN: CREATE WORKOUT
  ══════════════════════════════════════════════ */
  if (screen === "create-workout" && activeProgram)
    return (
      <div className="fitness-page">
        <PageHeader title="Новая тренировка" />
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
                  <Icon.Trash />
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
              <div className="num-ctrl sm">
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
            <Icon.Plus s={15} /> Добавить
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
     SCREEN: AI TEXT
  ══════════════════════════════════════════════ */
  if (screen === "ai-text")
    return (
      <div className="fitness-page">
        <PageHeader title="AI по тексту" />
        <div className="ai-intro-card">
          <div className="ai-intro-icon">
            <Icon.Sparkle />
          </div>
          <div className="ai-intro-text">
            Опиши цель, уровень и предпочтения — AI составит программу
            тренировок
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
              <Icon.Sparkle s={16} /> Сгенерировать
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
            <Icon.Camera />
          </div>
          <div className="photo-upload-title">Загрузи фото тела</div>
          <div className="photo-upload-sub">
            AI проанализирует состав и составит программу
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

  // Week schedule derived data
  const weekWithWorkouts = weekDates.map((d, i) => {
    const ds = fmt(d);
    const entry = scheduleMap[ds];
    const workout = entry
      ? (allWorkouts.find((w) => w.id === entry.workoutId) ?? null)
      : null;
    return {
      date: d,
      dateStr: ds,
      dayName: DAYS_RU[i],
      workout,
      isToday: isToday(d),
    };
  });

  const hasAnySchedule = weekWithWorkouts.some((d) => d.workout);

  return (
    <div className="fitness-page">
      {/* ── MAIN TAB SWITCH ── */}
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
          {/* Goal */}
          <div
            className="goal-card"
            onClick={() => {
              setShowGoalEdit((v) => !v);
              triggerHaptic();
            }}
          >
            <div className="goal-card-left">
              <div className="goal-label">Твоя цель</div>
              <div className="goal-value">{goal}</div>
            </div>
            <div className={`goal-chevron ${showGoalEdit ? "open" : ""}`}>
              <Icon.ChevronRight s={18} />
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
                    triggerHaptic();
                  }}
                >
                  {goal === g && <Icon.Check s={14} />} {g}
                </button>
              ))}
            </div>
          )}

          {/* Create workout */}
          <div className="section-row" style={{ marginTop: 28 }}>
            <h2>Создать тренировку</h2>
          </div>

          <div className="create-grid">
            <button
              className="create-card ai-text-card"
              type="button"
              onClick={() => {
                setScreen("ai-text");
                triggerHaptic("medium");
              }}
            >
              <div className="create-card-icon">
                <Icon.Sparkle />
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
                triggerHaptic("medium");
              }}
            >
              <div className="create-card-icon">
                <Icon.Camera />
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
                <Icon.Pencil />
              </div>
              <div className="create-card-title">Вручную</div>
              <div className="create-card-sub">Своя программа с нуля</div>
            </button>
          </div>

          {/* ════ SCHEDULE SECTION ════ */}
          <div className="section-row" style={{ marginTop: 36 }}>
            <h2>Расписание</h2>
            <div className="schedule-header-right">
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
              <button
                className="btn-edit-schedule"
                type="button"
                onClick={() => {
                  setShowScheduleEditor(true);
                  triggerHaptic();
                }}
              >
                Изменить
              </button>
            </div>
          </div>

          {/* Week overview strip */}
          <div className="week-overview">
            {weekWithWorkouts.map(
              ({ date, dateStr, dayName, workout, isToday: tod }) => (
                <div
                  key={dateStr}
                  className={`week-day-card ${workout ? "has-workout" : "rest"} ${tod ? "today" : ""}`}
                  onClick={() => {
                    setShowScheduleEditor(true);
                    triggerHaptic();
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

          {/* Detailed list of scheduled days */}
          {hasAnySchedule && (
            <div className="schedule-detail-list">
              {weekWithWorkouts
                .filter((d) => d.workout)
                .map(({ date, dateStr, dayName, workout }) => (
                  <div key={dateStr} className="schedule-detail-item">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduleMap((prev) => {
                          const n = { ...prev };
                          delete n[dateStr];
                          return n;
                        });
                        triggerHaptic();
                      }}
                    >
                      <Icon.X s={14} />
                    </button>
                  </div>
                ))}

              {/* Clear week button */}
              <button
                className="btn-clear-week"
                type="button"
                onClick={() => {
                  const weekStrs = new Set(weekDates.map(fmt));
                  setScheduleMap((prev) =>
                    Object.fromEntries(
                      Object.entries(prev).filter(([k]) => !weekStrs.has(k)),
                    ),
                  );
                  triggerHaptic("medium");
                }}
              >
                Очистить всю неделю
              </button>
            </div>
          )}

          {!hasAnySchedule && allWorkouts.length > 0 && (
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

      {/* ════════════════════════════════
          TAB: КАТАЛОГ
      ════════════════════════════════ */}
      {mainTab === "catalog" && (
        <>
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
                      triggerHaptic();
                    }}
                  >
                    <div
                      className="catalog-cover"
                      style={{ background: item.cover }}
                    >
                      {item.isPaid ? (
                        <div className="catalog-price">
                          <Icon.Star /> {item.priceStars}
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
                    triggerHaptic("medium");
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
                      triggerHaptic();
                    }}
                  >
                    <div
                      className="program-card-cover"
                      style={{ background: prog.cover }}
                    >
                      <div className="program-card-cover-actions">
                        {prog.forSale && (
                          <div className="program-sale-badge">
                            <Icon.Star s={11} /> {prog.priceStars}
                          </div>
                        )}
                        <button
                          className="program-share-icon"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareProgram(prog.title, prog.id);
                          }}
                        >
                          <Icon.Share s={14} />
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
                    triggerHaptic("medium");
                  }}
                >
                  <Icon.Plus /> Создать программу
                </button>
              </div>
            ))}
        </>
      )}

      {/* ── SCHEDULE EDITOR ── */}
      {showScheduleEditor && (
        <ScheduleEditor
          allWorkouts={allWorkouts}
          weekDates={weekDates}
          scheduleMap={scheduleMap}
          onApply={setScheduleMap}
          onClose={() => setShowScheduleEditor(false)}
        />
      )}

      {/* ── CATALOG BOTTOM SHEET ── */}
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
                      triggerHaptic("medium");
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

/* ── CATALOG DATA ── */
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
