// FitnessPage.tsx - Полная улучшенная версия в dark premium стиле
import { useState, useMemo, useEffect, useCallback } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";
import "./FitnessPage.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type Level = "Начальный" | "Средний" | "Продвинутый";
type Screen = "main" | "player";
type Tab = "personal" | "catalog";

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  note?: string;
}

interface ExerciseDraft {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  note: string;
}

interface WorkoutDay {
  id: string;
  dayLabel: string;
  title: string;
  dur: string;
  focus: string;
  color: string;
  exes: Exercise[];
}

interface Program {
  id: string;
  title: string;
  author: string;
  desc: string;
  descAfter: string;
  level: Level;
  weeks: number;
  daysPerWeek: number;
  cover: string;
  owned: boolean;
  isOwn: boolean;
  priceStars: number;
  workoutDays: WorkoutDay[];
  tags: string[];
  rating?: number;
  reviews?: number;
}

type ScheduleMap = Record<string, string>;
type CheckedMap = Record<string, boolean>;

// ─── Constants ────────────────────────────────────────────────────────────────
const PALETTE = {
  blue: "#007AFF",
  green: "#30d158",
  orange: "#ff9f0a",
  purple: "#bf5af2",
  red: "#ff453a",
  teal: "#32ade6",
  pink: "#ff375f",
  indigo: "#5e5ce6",
  mint: "#00c7be",
  yellow: "#ffd60a",
};

const WK_COLORS = Object.values(PALETTE);
const COVERS: string[] = [
  "linear-gradient(145deg, #0f0c29, #302b63, #24243e)",
  "linear-gradient(145deg, #1a1a2e, #e94560)",
  "linear-gradient(145deg, #004d40, #1de9b6)",
  "linear-gradient(145deg, #3a1c71, #d76d77, #ffaf7b)",
  "linear-gradient(145deg, #1565c0, #b92b27)",
  "linear-gradient(145deg, #134e5e, #71b280)",
  "linear-gradient(145deg, #0f2027, #203a43, #2c5364)",
  "linear-gradient(145deg, #4e0000, #200122)",
];

const DAY_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const MON_SHORT = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const GOAL_CHIPS = [
  "Похудеть",
  "Набрать массу",
  "Рельеф",
  "Сила",
  "Выносливость",
  "Гибкость",
  "Кардио",
];

const uid = (): string => Math.random().toString(36).substr(2, 8);
const fmtDate = (d: Date): string => d.toISOString().split("T")[0];

// ─── HAPTIC & TELEGRAM ────────────────────────────────────────────────────────
const triggerHaptic = (style: TelegramHapticStyle = "light") => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  } else if (navigator.vibrate) {
    navigator.vibrate(style === "heavy" ? 50 : style === "medium" ? 30 : 10);
  }
};

const triggerSelectionHaptic = () => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  } else if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};

const triggerNotificationHaptic = (type: "success" | "warning" | "error") => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(
      type === "success" ? "light" : type === "warning" ? "medium" : "heavy",
    );
  } else if (navigator.vibrate) {
    navigator.vibrate(type === "success" ? 50 : type === "warning" ? 100 : 200);
  }
};

const useTelegramBack = (onBack: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;
    const tg = getTelegramWebApp();
    if (tg?.BackButton) {
      const backButton = tg.BackButton;
      backButton.show();
      backButton.onClick(onBack);
      return () => {
        backButton.offClick(onBack);
        backButton.hide();
      };
    }
  }, [onBack, isActive]);
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_PROGS: Program[] = [
  {
    id: "p1",
    title: "Моя база",
    author: "Я",
    desc: "Личная программа для поддержания общей формы. Базовые упражнения с собственным весом.",
    descAfter:
      "Тренируйся 3 раза в неделю. Отдых между подходами строго соблюдай.",
    level: "Средний",
    weeks: 4,
    daysPerWeek: 3,
    cover: COVERS[0],
    owned: true,
    isOwn: true,
    priceStars: 0,
    tags: ["Дома", "Без инвентаря", "Тонус"],
    rating: 4.8,
    reviews: 12,
    workoutDays: [
      {
        id: "wd1",
        dayLabel: "День A",
        title: "Тело целиком",
        dur: "25 мин",
        focus: "Тонус",
        color: PALETTE.blue,
        exes: [
          { id: "e1", name: "Приседания", sets: "3", reps: "20", rest: "30с" },
          { id: "e2", name: "Отжимания", sets: "3", reps: "15", rest: "45с" },
          { id: "e3", name: "Планка", sets: "3", reps: "60с", rest: "30с" },
          {
            id: "e4",
            name: "Выпады",
            sets: "2",
            reps: "12 кажд.",
            rest: "30с",
          },
        ],
      },
      {
        id: "wd2",
        dayLabel: "День B",
        title: "Кардио",
        dur: "20 мин",
        focus: "Жиросжигание",
        color: PALETTE.green,
        exes: [
          { id: "e5", name: "Берпи", sets: "4", reps: "12", rest: "30с" },
          { id: "e6", name: "Прыжки", sets: "3", reps: "30с", rest: "15с" },
          {
            id: "e7",
            name: "Маунтин климбер",
            sets: "3",
            reps: "30с",
            rest: "15с",
          },
        ],
      },
    ],
  },
];

const CATALOG_DATA: Program[] = [
  {
    id: "c1",
    title: "Iron Body Pro",
    author: "Alex Lift",
    desc: "Профессиональная программа на 8 недель для набора мышечной массы. 4 дня в зале.",
    descAfter:
      "4 тренировки в неделю. Протокол питания: профицит ~300 ккал, 2г белка на кг.",
    level: "Продвинутый",
    weeks: 8,
    daysPerWeek: 4,
    cover: COVERS[1],
    owned: false,
    isOwn: false,
    priceStars: 250,
    tags: ["Зал", "Масса", "Сила"],
    rating: 4.9,
    reviews: 247,
    workoutDays: [
      {
        id: "cw1",
        dayLabel: "День 1",
        title: "Грудь + Трицепс",
        dur: "65 мин",
        focus: "Сила",
        color: PALETTE.red,
        exes: [
          { id: "ce1", name: "Жим лёжа", sets: "4", reps: "6–8", rest: "2–3м" },
          {
            id: "ce2",
            name: "Наклонный жим",
            sets: "3",
            reps: "10",
            rest: "90с",
          },
          { id: "ce3", name: "Разводка", sets: "3", reps: "12", rest: "60с" },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Yoga Flow 6W",
    author: "Maria Sun",
    desc: "Йога для начинающих. Гибкость, баланс и осознанность за 6 недель.",
    descAfter: "Ежедневные занятия 20–40 минут. Включает дыхательные практики.",
    level: "Начальный",
    weeks: 6,
    daysPerWeek: 5,
    cover: COVERS[2],
    owned: false,
    isOwn: false,
    priceStars: 0,
    tags: ["Дома", "Гибкость", "Йога"],
    rating: 4.7,
    reviews: 89,
    workoutDays: [
      {
        id: "cw13",
        dayLabel: "День A",
        title: "Утреннее пробуждение",
        dur: "25 мин",
        focus: "Гибкость",
        color: PALETTE.mint,
        exes: [
          {
            id: "cy1",
            name: "Кошка-Корова",
            sets: "1",
            reps: "10 цикл.",
            rest: "—",
          },
          {
            id: "cy2",
            name: "Собака мордой вниз",
            sets: "1",
            reps: "60с",
            rest: "—",
          },
        ],
      },
    ],
  },
];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const CloseIcon = ({ size = 24 }: { size?: number }) => (
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
    <path d="M18 6L6 18"></path>
    <path d="M6 6l12 12"></path>
  </svg>
);

const SendIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2L11 13"></path>
    <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
  </svg>
);

const PlusIcon = ({ size = 20 }: { size?: number }) => (
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
    <path d="M12 5v14"></path>
    <path d="M5 12h14"></path>
  </svg>
);

const TrashIcon = ({ size = 18 }: { size?: number }) => (
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
    <path d="M3 6h18"></path>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SparkleIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6L9 17l-5-5"></path>
  </svg>
);

// ─── LOADING DOTS ─────────────────────────────────────────────────────────────
function LoadingDots({ color = "white" }: { color?: string }) {
  return (
    <div className="loading-dots" style={{ color }}>
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
    </div>
  );
}

// ─── STARS RATING ─────────────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) =>
        i < Math.round(n) ? "★" : "☆",
      ).join("")}
    </span>
  );
}

// ─── PROGRAM CARD ─────────────────────────────────────────────────────────────
interface ProgCardProps {
  prog: Program;
  delay?: number;
  badge: React.ReactNode;
  onClick: () => void;
}

function ProgCard({ prog, delay = 0, badge, onClick }: ProgCardProps) {
  return (
    <div
      className="prog-card animate-in"
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      <div className="prog-cover" style={{ background: prog.cover }}>
        <div className="prog-overlay" />
        {badge}
        <div className="prog-info">
          <div className="prog-title">{prog.title}</div>
          <div className="prog-author">{prog.author}</div>
        </div>
      </div>
      <div className="prog-body">
        <div className="prog-desc">
          {prog.desc.slice(0, 90)}
          {prog.desc.length > 90 ? "…" : ""}
        </div>
        <div className="prog-tags">
          <span className="prog-tag">{prog.level}</span>
          <span className="prog-tag">{prog.weeks} нед.</span>
          <span className="prog-tag">{prog.daysPerWeek}×/нед.</span>
          {prog.rating && (
            <span className="prog-rating">
              ★ {prog.rating}{" "}
              <span className="prog-reviews">({prog.reviews})</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FitnessPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>("personal");
  const [screen, setScreen] = useState<Screen>("main");
  const [myProgs, setMyProgs] = useState<Program[]>(INIT_PROGS);
  const [catalog, setCatalog] = useState<Program[]>(CATALOG_DATA);
  const [schedule, setSchedule] = useState<ScheduleMap>({
    [fmtDate(new Date())]: "wd1",
  });
  const [weekOff, setWeekOff] = useState(0);
  const [activeWk, setActiveWk] = useState<WorkoutDay | null>(null);
  const [checked, setChecked] = useState<CheckedMap>({});
  const [selProg, setSelProg] = useState<Program | null>(null);
  const [progDescTab, setProgDescTab] = useState<"before" | "after">("before");
  const [schedDateModal, setSchedDateModal] = useState<string | null>(null);
  const [showMakeWk, setShowMakeWk] = useState(false);
  const [showMakeProg, setShowMakeProg] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState("Все");
  const [aiQ, setAiQ] = useState("");
  const [aiGoal, setAiGoal] = useState("Похудеть");
  const [aiLoad, setAiLoad] = useState(false);

  // Create workout form
  const [wkName, setWkName] = useState("");
  const [wkColor, setWkColor] = useState(PALETTE.blue);
  const [wkFocus, setWkFocus] = useState("Тонус");
  const [wkDur, setWkDur] = useState("30");
  const [wkExes, setWkExes] = useState<ExerciseDraft[]>([
    { name: "", sets: "3", reps: "10", rest: "60с", note: "" },
  ]);

  // Create program form
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pDescA, setPDescA] = useState("");
  const [pLevel, setPLevel] = useState<Level>("Средний");
  const [pCover, setPCover] = useState(COVERS[0]);
  const [pPrice, setPPrice] = useState("");
  const [pWeeks, setPWeeks] = useState("4");
  const [pDays, setPDays] = useState("3");
  const [pTags, setPTags] = useState<string[]>([]);

  const weekDays = useMemo<Date[]>(() => {
    const s = new Date();
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7) + weekOff * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return d;
    });
  }, [weekOff]);

  const monthLabel = useMemo(() => {
    if (!weekDays[0]) return "";
    const m1 = weekDays[0].getMonth();
    const m2 = weekDays[6].getMonth();
    if (m1 === m2) return MONTHS[m1];
    return `${MON_SHORT[m1]} — ${MON_SHORT[m2]}`;
  }, [weekDays]);

  const allMyWkDays = useMemo<WorkoutDay[]>(
    () => myProgs.flatMap((p) => p.workoutDays),
    [myProgs],
  );
  const today = fmtDate(new Date());

  // ── ACTIONS ─────────────────────────────────────────────────────────────────
  const openWk = useCallback((wk: WorkoutDay) => {
    setActiveWk(wk);
    setChecked({});
    setScreen("player");
    triggerHaptic("medium");
  }, []);

  const scheduleWk = (wkId: string, date: string) => {
    setSchedule((s) => ({ ...s, [date]: wkId }));
    triggerHaptic("light");
  };

  const removeFromSchedule = (date: string) => {
    setSchedule((s) => {
      const n = { ...s };
      delete n[date];
      return n;
    });
    triggerHaptic("light");
  };

  const autoSchedule = (prog: Program, weeks: number) => {
    const wds = prog.workoutDays;
    if (!wds.length) return;
    const daysPerWeek = prog.daysPerWeek || 3;
    const slotsByDpw: Record<number, number[]> = {
      1: [1],
      2: [1, 4],
      3: [1, 3, 5],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [1, 2, 3, 4, 5, 6],
      7: [0, 1, 2, 3, 4, 5, 6],
    };
    const slots = slotsByDpw[daysPerWeek] || [1, 3, 5];
    const base = new Date();
    const dayOfWeek = (base.getDay() + 6) % 7;
    base.setDate(base.getDate() - dayOfWeek);
    const newSched: ScheduleMap = { ...schedule };
    let wdIdx = 0;
    for (let w = 0; w < weeks; w++) {
      for (const slot of slots) {
        const d = new Date(base);
        d.setDate(base.getDate() + w * 7 + slot);
        const ds = fmtDate(d);
        newSched[ds] = wds[wdIdx % wds.length].id;
        wdIdx++;
      }
    }
    setSchedule(newSched);
    triggerNotificationHaptic("success");
  };

  const runAI = () => {
    if (!aiQ.trim() || aiLoad) return;
    triggerHaptic("medium");
    setAiLoad(true);
    setTimeout(() => {
      const wkDay: WorkoutDay = {
        id: uid(),
        dayLabel: "День A",
        title: `AI: ${aiQ.slice(0, 16)}`,
        dur: "35 мин",
        focus: aiGoal,
        color: WK_COLORS[Math.floor(Math.random() * WK_COLORS.length)],
        exes: [
          { id: uid(), name: "Берпи", sets: "4", reps: "15", rest: "30с" },
          { id: uid(), name: "Прыжки", sets: "3", reps: "30с", rest: "20с" },
          { id: uid(), name: "Планка", sets: "3", reps: "45с", rest: "20с" },
          {
            id: uid(),
            name: "Скручивания",
            sets: "4",
            reps: "20",
            rest: "30с",
          },
        ],
      };
      const prog: Program = {
        id: uid(),
        title: `AI: ${aiQ.slice(0, 16)}`,
        author: "AI Тренер",
        desc: `Создано по запросу: "${aiQ}". Цель: ${aiGoal}.`,
        descAfter: `Тренируйся 3–4 раза в неделю для достижения цели: ${aiGoal}.`,
        level: "Средний",
        weeks: 4,
        daysPerWeek: 3,
        cover: COVERS[1],
        owned: true,
        isOwn: true,
        priceStars: 0,
        tags: [aiGoal, "AI", "Дома"],
        workoutDays: [wkDay],
      };
      setMyProgs((prev) => [prog, ...prev]);
      setAiQ("");
      setAiLoad(false);
      triggerNotificationHaptic("success");
    }, 1800);
  };

  const buyProg = (prog: Program) => {
    triggerNotificationHaptic("success");
    const updated = { ...prog, owned: true };
    setCatalog((prev) => prev.map((p) => (p.id === prog.id ? updated : p)));
    setMyProgs((prev) => {
      if (prev.find((p) => p.id === prog.id)) return prev;
      return [...prev, { ...updated, id: uid(), isOwn: false }];
    });
    setSelProg(updated);
  };

  const saveWk = () => {
    if (!wkName.trim()) return;
    triggerNotificationHaptic("success");
    const wkDay: WorkoutDay = {
      id: uid(),
      dayLabel: "День A",
      title: wkName,
      dur: `${wkDur} мин`,
      focus: wkFocus,
      color: wkColor,
      exes: wkExes
        .filter((e) => e.name.trim())
        .map((e) => ({ ...e, id: uid() })),
    };
    setMyProgs((prev) =>
      prev.length > 0
        ? prev.map((p, i) =>
            i === 0 ? { ...p, workoutDays: [...p.workoutDays, wkDay] } : p,
          )
        : [
            {
              id: uid(),
              title: "Мои тренировки",
              author: "Я",
              desc: "",
              descAfter: "",
              level: "Средний",
              weeks: 52,
              daysPerWeek: 3,
              cover: COVERS[0],
              owned: true,
              isOwn: true,
              priceStars: 0,
              tags: [],
              workoutDays: [wkDay],
            },
          ],
    );
    setShowMakeWk(false);
    setWkName("");
    setWkColor(PALETTE.blue);
    setWkExes([{ name: "", sets: "3", reps: "10", rest: "60с", note: "" }]);
  };

  const saveProg = () => {
    if (!pName.trim()) return;
    triggerNotificationHaptic("success");
    const prog: Program = {
      id: uid(),
      title: pName,
      author: "Я",
      desc: pDesc,
      descAfter: pDescA,
      level: pLevel,
      weeks: parseInt(pWeeks) || 4,
      daysPerWeek: parseInt(pDays) || 3,
      cover: pCover,
      owned: true,
      isOwn: true,
      priceStars: parseInt(pPrice) || 0,
      tags: pTags,
      workoutDays: [],
    };
    setCatalog((prev) => [prog, ...prev]);
    setMyProgs((prev) => [prog, ...prev]);
    setShowMakeProg(false);
    setPName("");
    setPDesc("");
    setPDescA("");
    setPPrice("");
    setPTags([]);
  };

  const updateExDraft = (i: number, k: keyof ExerciseDraft, v: string) =>
    setWkExes((prev) => prev.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const removeExDraft = (i: number) =>
    setWkExes((prev) => prev.filter((_, j) => j !== i));
  const toggleTag = (t: string) =>
    setPTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const catLevels = ["Все", "Начальный", "Средний", "Продвинутый"];
  const filteredCatalog = catalog.filter(
    (p) => catalogFilter === "Все" || p.level === catalogFilter,
  );

  // Telegram BackButton for player
  useTelegramBack(() => setScreen("main"), screen === "player");

  // ── PLAYER SCREEN ───────────────────────────────────────────────────────────
  if (screen === "player" && activeWk) {
    const total = activeWk.exes.length;
    const done = activeWk.exes.filter((e) => checked[e.id]).length;
    const progress = total ? (done / total) * 100 : 0;

    return (
      <div className="player-page">
        <div className="player-header" style={{ background: activeWk.color }}>
          <div className="player-badge">ТРЕНИРОВКА</div>
          <div className="player-title">{activeWk.title}</div>
          <div className="player-subtitle">
            {activeWk.dur} · {total} упражнений · {activeWk.focus}
          </div>
          <div className="player-progress-wrap">
            <div
              className="player-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="player-progress-text">
            {done} из {total} выполнено
          </div>
        </div>
        <div className="player-body">
          {activeWk.exes.map((ex, i) => (
            <div
              key={ex.id}
              className={`exercise-card animate-in ${checked[ex.id] ? "done" : ""}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="exercise-number">{i + 1}</div>
              <div className="exercise-info">
                <h3>{ex.name}</h3>
                <p>
                  {ex.sets} подх. × {ex.reps} · Отдых {ex.rest}
                </p>
                {ex.note && <small>{ex.note}</small>}
              </div>
              <div
                className={`exercise-check ${checked[ex.id] ? "on" : ""}`}
                onClick={() => {
                  triggerSelectionHaptic();
                  setChecked((p) => ({ ...p, [ex.id]: !p[ex.id] }));
                }}
              >
                {checked[ex.id] && <CheckIcon size={18} />}
              </div>
            </div>
          ))}
        </div>
        <div className="player-footer">
          <button
            className="btn-finish"
            onClick={() => {
              triggerNotificationHaptic("success");
              setScreen("main");
            }}
          >
            {done === total && total > 0
              ? "🎉 Тренировка завершена!"
              : "Завершить тренировку"}
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div className="fitness-page">
      {/* HEADER */}
      <div className="fitness-header">
        <div className="fitness-title-row">
          <div className="fitness-title">Тренировки</div>
          <div className="fitness-streak">🔥 12 дней</div>
        </div>
        <div className="fitness-tabs">
          {(["personal", "catalog"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`fitness-tab ${tab === t ? "active" : ""}`}
              onClick={() => {
                setTab(t);
                triggerHaptic();
              }}
            >
              {t === "personal" ? "Личные" : "Каталог"}
            </button>
          ))}
        </div>
      </div>

      <div className="fitness-body">
        {/* ══ PERSONAL TAB ═══════════════════════════════════════════════════ */}
        {tab === "personal" && (
          <>
            {/* AI CARD */}
            <div
              className="ai-card animate-in"
              style={{ animationDelay: ".02s" }}
            >
              <div className="ai-top">
                <div className="ai-dot" />
                <span className="ai-label">AI Тренер</span>
              </div>
              <div className="ai-row">
                <input
                  className="ai-input"
                  placeholder="Опиши цель или тип тренировки..."
                  value={aiQ}
                  onChange={(e) => setAiQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runAI()}
                />
                <button className="ai-send" onClick={runAI} disabled={aiLoad}>
                  {aiLoad ? <LoadingDots /> : <SendIcon size={18} />}
                </button>
              </div>
              <div className="ai-chips">
                {GOAL_CHIPS.map((g) => (
                  <button
                    key={g}
                    className={`ai-chip ${aiGoal === g ? "active" : ""}`}
                    onClick={() => {
                      setAiGoal(g);
                      triggerSelectionHaptic();
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div
              className="quick-actions animate-in"
              style={{ animationDelay: ".06s" }}
            >
              <button
                className="quick-btn"
                onClick={() => {
                  setShowMakeWk(true);
                  triggerHaptic("medium");
                }}
              >
                <PlusIcon size={18} /> Тренировка
              </button>
              <button
                className="quick-btn"
                onClick={() => {
                  setShowMakeProg(true);
                  triggerHaptic("medium");
                }}
              >
                <SparkleIcon size={16} /> Программа
              </button>
            </div>

            {/* CALENDAR */}
            <div
              className="section-header animate-in"
              style={{ animationDelay: ".08s" }}
            >
              <h2>Расписание</h2>
              {Object.keys(schedule).length > 0 && (
                <button
                  className="section-btn"
                  onClick={() => {
                    setSchedule({});
                    triggerHaptic();
                  }}
                >
                  Очистить
                </button>
              )}
            </div>

            <div
              className="calendar-wrap animate-in"
              style={{ animationDelay: ".1s" }}
            >
              <div className="calendar-header">
                <button
                  className="calendar-nav"
                  onClick={() => setWeekOff((v) => v - 1)}
                >
                  ‹
                </button>
                <span className="calendar-month">{monthLabel}</span>
                <button
                  className="calendar-nav"
                  onClick={() => setWeekOff((v) => v + 1)}
                >
                  ›
                </button>
              </div>
              <div className="calendar-legend">
                {DAY_SHORT.map((d) => (
                  <div key={d} className="calendar-leg-item">
                    {d}
                  </div>
                ))}
              </div>
              <div className="calendar-grid">
                {weekDays.map((date) => {
                  const ds = fmtDate(date);
                  const wkId = schedule[ds];
                  const wkDay = wkId
                    ? allMyWkDays.find((w) => w.id === wkId)
                    : undefined;
                  const isToday = ds === today;
                  const isPast = ds < today && !isToday;
                  return (
                    <div
                      key={ds}
                      className={`calendar-day ${isToday ? "today" : ""} ${wkId ? "has-workout" : ""} ${isPast ? "past" : ""}`}
                      onClick={() => {
                        triggerHaptic();
                        if (wkDay) openWk(wkDay);
                        else setSchedDateModal(ds);
                      }}
                    >
                      <span className="calendar-day-name">
                        {DAY_SHORT[date.getDay()]}
                      </span>
                      <span className="calendar-day-num">{date.getDate()}</span>
                      {wkId && (
                        <div
                          className="calendar-day-dot"
                          style={{ background: wkDay?.color ?? PALETTE.blue }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MY PROGRAMS */}
            <div
              className="section-header animate-in"
              style={{ animationDelay: ".12s" }}
            >
              <h2>Мои программы</h2>
            </div>

            {myProgs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏋️</div>
                <p>
                  Создай тренировку с помощью AI
                  <br />
                  или вручную кнопками выше
                </p>
              </div>
            ) : (
              myProgs.map((p, i) => (
                <ProgCard
                  key={p.id}
                  prog={p}
                  delay={0.14 + i * 0.04}
                  badge={
                    <span className="prog-badge owned">
                      {p.workoutDays.length} тренировок
                    </span>
                  }
                  onClick={() => {
                    setSelProg(p);
                    setProgDescTab(p.owned ? "after" : "before");
                    triggerHaptic();
                  }}
                />
              ))
            )}
          </>
        )}

        {/* ══ CATALOG TAB ════════════════════════════════════════════════════ */}
        {tab === "catalog" && (
          <>
            <div
              className="create-cta animate-in"
              style={{ animationDelay: ".02s" }}
              onClick={() => {
                setShowMakeProg(true);
                triggerHaptic("medium");
              }}
            >
              <div className="create-cta-icon">✦</div>
              <div>
                <h3>Создать программу</h3>
                <p>Продавай или делись бесплатно</p>
              </div>
            </div>

            {myProgs.filter((p) => p.isOwn).length > 0 && (
              <>
                <div className="section-header animate-in">
                  <h2>Мои программы</h2>
                </div>
                {myProgs
                  .filter((p) => p.isOwn)
                  .map((p, i) => (
                    <ProgCard
                      key={p.id}
                      prog={p}
                      delay={0.08 + i * 0.04}
                      badge={
                        <span
                          className={`prog-badge ${p.priceStars ? "paid" : "free"}`}
                        >
                          {p.priceStars ? `★ ${p.priceStars}` : "Бесплатно"}
                        </span>
                      }
                      onClick={() => {
                        setSelProg(p);
                        setProgDescTab("before");
                        triggerHaptic();
                      }}
                    />
                  ))}
              </>
            )}

            <div className="section-header animate-in">
              <h2>Каталог</h2>
            </div>
            <div className="catalog-filter animate-in">
              {catLevels.map((l) => (
                <button
                  key={l}
                  className={`filter-btn ${catalogFilter === l ? "active" : ""}`}
                  onClick={() => {
                    setCatalogFilter(l);
                    triggerHaptic();
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {filteredCatalog.map((p, i) => (
              <ProgCard
                key={p.id}
                prog={p}
                delay={0.1 + i * 0.04}
                badge={
                  <span
                    className={`prog-badge ${p.owned ? "owned" : p.priceStars ? "paid" : "free"}`}
                  >
                    {p.owned
                      ? "✓ Куплено"
                      : p.priceStars
                        ? `★ ${p.priceStars}`
                        : "Бесплатно"}
                  </span>
                }
                onClick={() => {
                  setSelProg(p);
                  setProgDescTab("before");
                  triggerHaptic();
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* ══════════ MODALS ═══════════════════════════════════════════════════ */}
      {/* PROGRAM DETAIL */}
      {selProg && (
        <div className="modal-overlay" onClick={() => setSelProg(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle-bar">
              <div className="modal-handle" />
            </div>
            <div className="modal-content">
              <div
                className="sheet-cover"
                style={{ background: selProg.cover }}
              >
                <div className="sheet-cover-overlay" />
                <div className="sheet-cover-text">
                  <h2>{selProg.title}</h2>
                  <div className="sheet-cover-meta">
                    {selProg.author} · {selProg.level}
                  </div>
                </div>
                <div className="sheet-cover-badge">
                  <span
                    className={`prog-badge ${selProg.owned ? "owned" : selProg.priceStars ? "paid" : "free"}`}
                  >
                    {selProg.owned
                      ? "✓ В библиотеке"
                      : selProg.priceStars
                        ? `★ ${selProg.priceStars}`
                        : "Бесплатно"}
                  </span>
                </div>
              </div>

              <div className="stats-row">
                {[
                  { l: "Уровень", v: selProg.level },
                  { l: "Длительность", v: `${selProg.weeks} нед.` },
                  { l: "Дней/нед.", v: `${selProg.daysPerWeek}×` },
                  { l: "Тренировок", v: `${selProg.workoutDays.length}` },
                ].map((s) => (
                  <div key={s.l} className="stat-box">
                    <div className="stat-label">{s.l}</div>
                    <div className="stat-value">{s.v}</div>
                  </div>
                ))}
              </div>

              {selProg.rating && (
                <div className="rating-row">
                  <span className="rating-stars">
                    <Stars n={selProg.rating} />
                  </span>
                  <span className="rating-value">{selProg.rating}</span>
                  <span className="rating-reviews">
                    {selProg.reviews} отзывов
                  </span>
                </div>
              )}

              <div className="prog-tags-row">
                {selProg.tags.map((t) => (
                  <span key={t} className="prog-tag accent">
                    {t}
                  </span>
                ))}
              </div>

              {selProg.owned && selProg.descAfter ? (
                <>
                  <div className="desc-tabs">
                    <button
                      className={`desc-tab ${progDescTab === "before" ? "active" : ""}`}
                      onClick={() => setProgDescTab("before")}
                    >
                      О программе
                    </button>
                    <button
                      className={`desc-tab ${progDescTab === "after" ? "active" : ""}`}
                      onClick={() => setProgDescTab("after")}
                    >
                      После покупки
                    </button>
                  </div>
                  <div className="desc-text">
                    {progDescTab === "before"
                      ? selProg.desc
                      : selProg.descAfter}
                  </div>
                </>
              ) : (
                <div className="desc-text">{selProg.desc}</div>
              )}

              {selProg.owned && (
                <>
                  <div className="section-label">Автозапись в расписание</div>
                  <div className="sched-actions">
                    {[
                      {
                        ico: "📅",
                        lbl: "На 1 неделю",
                        sub: `${selProg.daysPerWeek * 1} занятий`,
                        weeks: 1,
                      },
                      {
                        ico: "🗓",
                        lbl: "На 2 недели",
                        sub: `${selProg.daysPerWeek * 2} занятий`,
                        weeks: 2,
                      },
                      {
                        ico: "📆",
                        lbl: "На весь курс",
                        sub: `${selProg.daysPerWeek * selProg.weeks} занятий`,
                        weeks: selProg.weeks,
                      },
                    ].map((opt) => (
                      <button
                        key={opt.lbl}
                        className="sched-btn"
                        onClick={() => {
                          autoSchedule(selProg, opt.weeks);
                          setSelProg(null);
                        }}
                      >
                        <div className="sched-btn-icon">{opt.ico}</div>
                        <div className="sched-btn-info">
                          <div className="sched-btn-label">{opt.lbl}</div>
                          <div className="sched-btn-sub">{opt.sub}</div>
                        </div>
                        <span className="sched-btn-arrow">›</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="section-label">Тренировки программы</div>
              {selProg.workoutDays.map((wk) => (
                <div
                  key={wk.id}
                  className="workout-row"
                  onClick={() =>
                    selProg.owned && (setSelProg(null), openWk(wk))
                  }
                >
                  <div
                    className="workout-dot"
                    style={{ background: wk.color }}
                  />
                  <div className="workout-info">
                    <div className="workout-name">
                      {wk.dayLabel} — {wk.title}
                    </div>
                    <div className="workout-meta">
                      {wk.dur} · {wk.focus} · {wk.exes.length} упражнений
                    </div>
                  </div>
                  <div
                    className={
                      selProg.owned ? "workout-icon-play" : "workout-icon-lock"
                    }
                  >
                    {selProg.owned ? "▶" : "🔒"}
                  </div>
                </div>
              ))}

              {selProg.owned ? (
                <div className="btn-library">
                  ✓ Программа в вашей библиотеке
                </div>
              ) : (
                <button className="btn-buy" onClick={() => buyProg(selProg)}>
                  {selProg.priceStars
                    ? `Купить за ★ ${selProg.priceStars}`
                    : "Получить бесплатно"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE DATE PICKER */}
      {schedDateModal && (
        <div className="modal-overlay" onClick={() => setSchedDateModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle-bar">
              <div className="modal-handle" />
            </div>
            <div className="modal-content">
              <div className="modal-title">Запланировать</div>
              <div className="modal-subtitle">
                {schedDateModal === today ? "Сегодня" : schedDateModal}
              </div>
              {allMyWkDays.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <p>Нет тренировок для планирования</p>
                </div>
              ) : (
                allMyWkDays.map((wk) => (
                  <div
                    key={wk.id}
                    className="workout-row"
                    onClick={() => {
                      scheduleWk(wk.id, schedDateModal!);
                      setSchedDateModal(null);
                    }}
                  >
                    <div
                      className="workout-dot"
                      style={{ background: wk.color }}
                    />
                    <div className="workout-info">
                      <div className="workout-name">{wk.title}</div>
                      <div className="workout-meta">
                        {wk.dur} · {wk.exes.length} упражнений
                      </div>
                    </div>
                    <span className="workout-add">+</span>
                  </div>
                ))
              )}
              {schedule[schedDateModal] && (
                <button
                  className="btn-danger"
                  onClick={() => {
                    removeFromSchedule(schedDateModal!);
                    setSchedDateModal(null);
                  }}
                >
                  Убрать тренировку с этого дня
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE WORKOUT */}
      {showMakeWk && (
        <div className="modal-overlay" onClick={() => setShowMakeWk(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle-bar">
              <div className="modal-handle" />
            </div>
            <div className="modal-content">
              <div className="modal-title">Новая тренировка</div>
              <div className="form-field">
                <label className="form-label">Название</label>
                <input
                  className="form-input"
                  placeholder="Ноги и ягодицы"
                  value={wkName}
                  onChange={(e) => setWkName(e.target.value)}
                />
              </div>
              <div className="form-row-2">
                <div>
                  <label className="form-label">Длительность (мин)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="30"
                    value={wkDur}
                    onChange={(e) => setWkDur(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Фокус</label>
                  <input
                    className="form-input"
                    placeholder="Сила / Кардио..."
                    value={wkFocus}
                    onChange={(e) => setWkFocus(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Цвет</label>
                <div className="colors-row">
                  {WK_COLORS.map((c) => (
                    <div
                      key={c}
                      className={`color-swatch ${wkColor === c ? "active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setWkColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="form-field">
                <div className="form-label-row">
                  <label className="form-label">Упражнения</label>
                  <span
                    className="form-label-add"
                    onClick={() =>
                      setWkExes((p) => [
                        ...p,
                        {
                          name: "",
                          sets: "3",
                          reps: "10",
                          rest: "60с",
                          note: "",
                        },
                      ])
                    }
                  >
                    + Добавить
                  </span>
                </div>
                {wkExes.map((ex, i) => (
                  <div key={i} className="exercise-draft">
                    <div className="exercise-draft-top">
                      <input
                        className="exercise-draft-name"
                        placeholder="Название упражнения"
                        value={ex.name}
                        onChange={(e) =>
                          updateExDraft(i, "name", e.target.value)
                        }
                      />
                      {wkExes.length > 1 && (
                        <button
                          className="exercise-draft-del"
                          onClick={() => removeExDraft(i)}
                        >
                          <TrashIcon size={16} />
                        </button>
                      )}
                    </div>
                    <div className="exercise-draft-fields">
                      {(
                        ["sets", "reps", "rest"] as (keyof ExerciseDraft)[]
                      ).map((k, ki) => (
                        <div key={k} className="exercise-draft-field">
                          <label>
                            {["Подходы", "Повторения", "Отдых"][ki]}
                          </label>
                          <input
                            value={ex[k]}
                            onChange={(e) =>
                              updateExDraft(i, k, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-main" onClick={saveWk}>
                Сохранить тренировку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROGRAM */}
      {showMakeProg && (
        <div className="modal-overlay" onClick={() => setShowMakeProg(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle-bar">
              <div className="modal-handle" />
            </div>
            <div className="modal-content">
              <div className="modal-title">Новая программа</div>
              <div className="form-field">
                <label className="form-label">Название</label>
                <input
                  className="form-input"
                  placeholder="Рельеф за 8 недель"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>
              <div className="form-row-2">
                <div>
                  <label className="form-label">Недель</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="4"
                    value={pWeeks}
                    onChange={(e) => setPWeeks(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Дней в нед.</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="3"
                    value={pDays}
                    onChange={(e) => setPDays(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Описание до покупки</label>
                <textarea
                  className="form-textarea"
                  placeholder="Что получит пользователь?"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Описание после покупки</label>
                <textarea
                  className="form-textarea"
                  placeholder="Детальное расписание, советы..."
                  value={pDescA}
                  onChange={(e) => setPDescA(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Цена в Stars (0 = бесплатно)
                </label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Уровень</label>
                <div className="level-row">
                  {(["Начальный", "Средний", "Продвинутый"] as Level[]).map(
                    (l) => (
                      <button
                        key={l}
                        className={`level-btn ${pLevel === l ? "active" : ""}`}
                        onClick={() => setPLevel(l)}
                      >
                        {l}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Теги</label>
                <div className="tags-row">
                  {[
                    "Дома",
                    "Зал",
                    "Масса",
                    "Похудение",
                    "Сила",
                    "Кардио",
                    "Гибкость",
                    "Без инвентаря",
                    "HIIT",
                    "Йога",
                  ].map((t) => (
                    <button
                      key={t}
                      className={`tag-toggle ${pTags.includes(t) ? "active" : ""}`}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Обложка</label>
                <div className="covers-row">
                  {COVERS.map((c) => (
                    <div
                      key={c}
                      className={`cover-thumb ${pCover === c ? "active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setPCover(c)}
                    />
                  ))}
                </div>
              </div>
              <button className="btn-main" onClick={saveProg}>
                Опубликовать программу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
