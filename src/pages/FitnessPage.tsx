import { useState } from "react";
import "./FitnessPage.css";

/* ── TYPES ──────────────────────────────────────────────────────────── */

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
  exercises: Exercise[];
};

type Program = {
  id: string;
  title: string;
  description: string;
  days: string[];
  weeks: number;
  level: string;
  workouts: Workout[];
  forSale: boolean;
  priceStars: number;
  cover: string;
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
  preview: string[];
  full: string[];
};

type Screen = "main" | "program" | "workout" | "new-program" | "new-workout";

/* ── CONSTANTS ──────────────────────────────────────────────────────── */

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const LEVELS = ["Начальный", "Средний", "Продвинутый"];
const FOCUS_OPTIONS = [
  "Сила",
  "Тонус",
  "Рельеф",
  "Выносливость",
  "Мобильность",
  "Кардио",
];
const COVERS = [
  "linear-gradient(135deg, #0f0f0f 0%, #2d2d2d 100%)",
  "linear-gradient(135deg, #0a2240 0%, #1666b0 100%)",
  "linear-gradient(135deg, #0a2e1e 0%, #1a7a50 100%)",
  "linear-gradient(135deg, #2a0d0d 0%, #8b2020 100%)",
];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const INITIAL_PROGRAMS: Program[] = [
  {
    id: "p1",
    title: "Сила 3×",
    description: "Базовые движения + корпус. Прогрессия каждые 2 недели.",
    days: ["Пн", "Ср", "Пт"],
    weeks: 4,
    level: "Средний",
    cover: COVERS[0],
    forSale: false,
    priceStars: 99,
    workouts: [
      {
        id: "w1",
        title: "День A — Жим",
        duration: "50 мин",
        focus: "Верх",
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
            name: "Жим гантелей сидя",
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
          { id: "e4", name: "Планка", sets: 3, reps: "45 сек", rest: "30 сек" },
        ],
      },
      {
        id: "w2",
        title: "День B — Ноги",
        duration: "55 мин",
        focus: "Низ",
        exercises: [
          {
            id: "e5",
            name: "Присед со штангой",
            sets: 4,
            reps: "5–7",
            rest: "3 мин",
          },
          {
            id: "e6",
            name: "Жим ногами",
            sets: 3,
            reps: "10–12",
            rest: "2 мин",
          },
          {
            id: "e7",
            name: "Румынская тяга",
            sets: 3,
            reps: "10–12",
            rest: "90 сек",
          },
          {
            id: "e8",
            name: "Подъём на носки",
            sets: 4,
            reps: "15–20",
            rest: "45 сек",
          },
        ],
      },
      {
        id: "w3",
        title: "День C — Тяга",
        duration: "50 мин",
        focus: "Спина",
        exercises: [
          {
            id: "e9",
            name: "Становая тяга",
            sets: 4,
            reps: "4–6",
            rest: "3 мин",
          },
          {
            id: "e10",
            name: "Тяга штанги в наклоне",
            sets: 3,
            reps: "8–10",
            rest: "2 мин",
          },
          {
            id: "e11",
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
      "Программа с прогрессией нагрузки и контролем объёмов. 4 тренировки в неделю, упор на рельеф.",
    preview: ["Разминка 10 мин", "Силовой блок", "Заминка"],
    full: [
      "Разминка 10 мин",
      "Силовой блок 40 мин",
      "Финишер HIIT 10 мин",
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
    preview: ["Разминка 5 мин", "Низ тела", "Корпус"],
    full: [
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
      "Чередование силовых и кардио блоков. Подходит для стабильного прогресса.",
    preview: ["Разминка", "Силовой блок", "Кардио блок"],
    full: [
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
      "Укрепление кора и раскрытие грудного отдела. Подходит для офисного ритма.",
    preview: ["Разогрев 6 мин", "Кор", "Мобильность"],
    full: [
      "Разогрев 6 мин",
      "Кор 14 мин",
      "Мобильность 12 мин",
      "Дыхание 5 мин",
    ],
  },
];

/* ── ICONS ──────────────────────────────────────────────────────────── */

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

const PlusIcon = ({ size = 20 }: { size?: number }) => (
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

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const triggerHaptic = (style: "light" | "medium" = "light") => {
  if ((window as any).Telegram?.WebApp?.HapticFeedback) {
    (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style);
  } else if (navigator.vibrate) {
    navigator.vibrate(8);
  }
};

/* ── COMPONENT ──────────────────────────────────────────────────────── */

export default function FitnessPage() {
  // Navigation
  const [screen, setScreen] = useState<Screen>("main");
  const [tab, setTab] = useState<"mine" | "catalog">("mine");

  // Data
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  // Active item references
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);

  // Catalog filter
  const [catFilter, setCatFilter] = useState<"all" | "free" | "paid">("all");

  // New program form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDays, setNewDays] = useState<string[]>([]);
  const [newWeeks, setNewWeeks] = useState(4);
  const [newLevel, setNewLevel] = useState(LEVELS[1]);
  const [newCoverIdx, setNewCoverIdx] = useState(0);

  // New workout form
  const [wkTitle, setWkTitle] = useState("");
  const [wkDuration, setWkDuration] = useState("");
  const [wkFocus, setWkFocus] = useState(FOCUS_OPTIONS[0]);
  const [wkExercises, setWkExercises] = useState<Exercise[]>([]);
  const [wkExName, setWkExName] = useState("");
  const [wkExSets, setWkExSets] = useState(3);
  const [wkExReps, setWkExReps] = useState("10–12");
  const [wkExRest, setWkExRest] = useState("60 сек");

  // Edit workout (existing)
  const [editExName, setEditExName] = useState("");

  // Derived
  const activeProgram = programs.find((p) => p.id === activeProgramId) ?? null;
  const activeWorkout =
    activeProgram?.workouts.find((w) => w.id === activeWorkoutId) ?? null;
  const filteredCatalog =
    catFilter === "free"
      ? CATALOG.filter((c) => !c.isPaid)
      : catFilter === "paid"
        ? CATALOG.filter((c) => c.isPaid)
        : CATALOG;

  /* ── MUTATIONS ── */

  const updateProgram = (id: string, patch: Partial<Program>) =>
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );

  const deleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    setScreen("main");
  };

  const createProgram = () => {
    if (!newTitle.trim() || newDays.length === 0) return;
    const prog: Program = {
      id: uid(),
      title: newTitle.trim(),
      description: newDesc.trim() || "Описание программы",
      days: newDays,
      weeks: newWeeks,
      level: newLevel,
      cover: COVERS[newCoverIdx],
      workouts: [],
      forSale: false,
      priceStars: 99,
    };
    setPrograms((prev) => [...prev, prog]);
    setActiveProgramId(prog.id);
    setNewTitle("");
    setNewDesc("");
    setNewDays([]);
    setNewWeeks(4);
    setNewLevel(LEVELS[1]);
    setNewCoverIdx(0);
    setScreen("program");
    triggerHaptic("medium");
  };

  const createWorkout = () => {
    if (!wkTitle.trim() || !activeProgramId) return;
    const workout: Workout = {
      id: uid(),
      title: wkTitle.trim(),
      duration: wkDuration || "30–45 мин",
      focus: wkFocus,
      exercises: wkExercises,
    };
    updateProgram(activeProgramId, {
      workouts: [...(activeProgram?.workouts ?? []), workout],
    });
    setWkTitle("");
    setWkDuration("");
    setWkFocus(FOCUS_OPTIONS[0]);
    setWkExercises([]);
    setScreen("program");
    triggerHaptic("medium");
  };

  const addExToForm = () => {
    if (!wkExName.trim()) return;
    setWkExercises((prev) => [
      ...prev,
      {
        id: uid(),
        name: wkExName.trim(),
        sets: wkExSets,
        reps: wkExReps,
        rest: wkExRest,
      },
    ]);
    setWkExName("");
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

  const removeExFromWorkout = (exId: string) => {
    if (!activeProgramId || !activeWorkoutId) return;
    updateProgram(activeProgramId, {
      workouts: activeProgram!.workouts.map((w) =>
        w.id === activeWorkoutId
          ? { ...w, exercises: w.exercises.filter((e) => e.id !== exId) }
          : w,
      ),
    });
  };

  const deleteWorkout = (workoutId: string) => {
    if (!activeProgramId) return;
    updateProgram(activeProgramId, {
      workouts: activeProgram!.workouts.filter((w) => w.id !== workoutId),
    });
  };

  /* ── NAV ── */

  const goToProgram = (id: string) => {
    setActiveProgramId(id);
    setScreen("program");
    triggerHaptic();
  };

  const goToWorkout = (programId: string, workoutId: string) => {
    setActiveProgramId(programId);
    setActiveWorkoutId(workoutId);
    setScreen("workout");
    triggerHaptic();
  };

  const goBack = () => {
    if (screen === "workout" || screen === "new-workout") {
      setScreen("program");
      return;
    }
    setScreen("main");
  };

  const toggleDay = (d: string) =>
    setNewDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  /* ══════════════════════════════════════════════════════════════════
     SCREEN: MAIN
  ══════════════════════════════════════════════════════════════════ */
  if (screen === "main")
    return (
      <div className="fitness-page">
        <div className="fitness-header">
          <h1>Тренировки</h1>
          <p>Программы, каталог и AI‑подбор</p>
        </div>

        <div className="fitness-switch">
          <div className="fitness-pill">
            <div
              className={`fitness-pill-blob ${tab === "catalog" ? "right" : ""}`}
            />
            <button
              className={`fitness-pill-tab ${tab === "mine" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setTab("mine");
                triggerHaptic();
              }}
            >
              Мои программы
            </button>
            <button
              className={`fitness-pill-tab ${tab === "catalog" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setTab("catalog");
                triggerHaptic();
              }}
            >
              Каталог
            </button>
          </div>
        </div>

        {/* ── TAB: MINE ── */}
        {tab === "mine" && (
          <>
            {programs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏋️</div>
                <div className="empty-title">Нет программ</div>
                <div className="empty-sub">
                  Создай первую или выбери из каталога
                </div>
              </div>
            ) : (
              <div className="program-list">
                {programs.map((prog) => (
                  <div
                    className="program-card"
                    key={prog.id}
                    onClick={() => goToProgram(prog.id)}
                  >
                    <div
                      className="program-card-cover"
                      style={{ background: prog.cover }}
                    >
                      {prog.forSale && (
                        <div className="program-sale-badge">
                          <StarIcon /> {prog.priceStars}
                        </div>
                      )}
                    </div>
                    <div className="program-card-body">
                      <div className="program-card-title">{prog.title}</div>
                      <div className="program-card-meta">
                        {prog.days.join(" · ")} · {prog.weeks} нед ·{" "}
                        {prog.level}
                      </div>
                      <div className="program-card-stats">
                        <span className="program-stat">
                          {prog.workouts.length} тренировок
                        </span>
                        {prog.forSale && (
                          <span className="program-stat program-stat-sale">
                            В продаже
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn-create-program"
              type="button"
              onClick={() => {
                setScreen("new-program");
                triggerHaptic("medium");
              }}
            >
              <PlusIcon size={18} /> Создать программу
            </button>
          </>
        )}

        {/* ── TAB: CATALOG ── */}
        {tab === "catalog" && (
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
                    {item.isPaid && (
                      <div className="catalog-price">
                        <StarIcon /> {item.priceStars}
                      </div>
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

        {/* ── CATALOG BOTTOM SHEET ── */}
        {catalogItem && (
          <div className="sheet-overlay-wrap">
            <div
              className="sheet-overlay"
              onClick={() => setCatalogItem(null)}
            />
            <div className="bottom-sheet">
              <div
                className="bottom-sheet-cover"
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
                <div className="sheet-program-label">Программа</div>
                <ul className="sheet-list">
                  {(purchasedIds.includes(catalogItem.id) || !catalogItem.isPaid
                    ? catalogItem.full
                    : catalogItem.preview
                  ).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                {catalogItem.isPaid &&
                  !purchasedIds.includes(catalogItem.id) && (
                    <div className="sheet-lock">
                      Полный план доступен после покупки
                    </div>
                  )}
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
                          days: ["Пн", "Ср", "Пт"],
                          weeks: 6,
                          level: catalogItem.level,
                          cover: catalogItem.cover,
                          workouts: [],
                          forSale: false,
                          priceStars: 0,
                        };
                        setPrograms((p) => [...p, prog]);
                        setCatalogItem(null);
                        setTab("mine");
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

  /* ══════════════════════════════════════════════════════════════════
     SCREEN: NEW PROGRAM
  ══════════════════════════════════════════════════════════════════ */
  if (screen === "new-program")
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
          <span className="screen-title">Новая программа</span>
        </div>

        <div className="form-card">
          <label className="form-label">Название</label>
          <input
            className="form-input"
            placeholder="Например: Сила 3×"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>

        <div className="form-card">
          <label className="form-label">Описание</label>
          <textarea
            className="form-textarea"
            placeholder="Кратко о программе: акцент, инвентарь, особенности"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-card">
          <label className="form-label">Дни тренировок</label>
          <div className="day-pills">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                className={`day-pill ${newDays.includes(d) ? "active" : ""}`}
                onClick={() => {
                  toggleDay(d);
                  triggerHaptic();
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="form-card">
          <label className="form-label">Уровень</label>
          <div className="chip-row">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                className={`option-chip ${newLevel === l ? "active" : ""}`}
                onClick={() => {
                  setNewLevel(l);
                  triggerHaptic();
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="form-card form-row">
          <label className="form-label">Количество недель</label>
          <div className="number-control">
            <button
              type="button"
              className="num-btn"
              onClick={() => setNewWeeks((w) => Math.max(1, w - 1))}
            >
              −
            </button>
            <span className="num-val">{newWeeks}</span>
            <button
              type="button"
              className="num-btn"
              onClick={() => setNewWeeks((w) => Math.min(24, w + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div className="form-card">
          <label className="form-label">Обложка</label>
          <div className="cover-row">
            {COVERS.map((c, i) => (
              <div
                key={i}
                className={`cover-swatch ${newCoverIdx === i ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setNewCoverIdx(i);
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
          disabled={!newTitle.trim() || newDays.length === 0}
        >
          Создать программу
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════════════════════════
     SCREEN: PROGRAM DETAIL
  ══════════════════════════════════════════════════════════════════ */
  if (screen === "program" && activeProgram)
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
        </div>

        <div className="prog-hero" style={{ background: activeProgram.cover }}>
          <div className="prog-hero-content">
            <div className="prog-hero-title">{activeProgram.title}</div>
            <div className="prog-hero-meta">
              {activeProgram.days.join(" · ")} · {activeProgram.weeks} нед
            </div>
          </div>
        </div>

        <div className="prog-chips-row">
          <span className="prog-chip">{activeProgram.level}</span>
          <span className="prog-chip">
            {activeProgram.workouts.length} тренировок
          </span>
          {activeProgram.forSale && (
            <span className="prog-chip prog-chip-sale">
              <StarIcon /> {activeProgram.priceStars}
            </span>
          )}
        </div>

        <p className="prog-desc">{activeProgram.description}</p>

        {/* Workouts list */}
        <div className="section-row">
          <h2>Тренировки</h2>
          <button
            className="btn-text"
            type="button"
            onClick={() => {
              setWkTitle("");
              setWkDuration("");
              setWkFocus(FOCUS_OPTIONS[0]);
              setWkExercises([]);
              setScreen("new-workout");
              triggerHaptic();
            }}
          >
            <PlusIcon size={16} /> Добавить
          </button>
        </div>

        {activeProgram.workouts.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-sub">Тренировки ещё не добавлены</div>
          </div>
        ) : (
          <div className="workout-list">
            {activeProgram.workouts.map((wk) => (
              <div className="workout-card" key={wk.id}>
                <div
                  className="workout-card-main"
                  onClick={() => goToWorkout(activeProgram.id, wk.id)}
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
                <button
                  className="btn-delete-workout"
                  type="button"
                  onClick={() => {
                    deleteWorkout(wk.id);
                    triggerHaptic();
                  }}
                >
                  <TrashIcon /> Удалить тренировку
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sell section */}
        <div className="sell-section">
          <div className="sell-section-header">
            <div>
              <div className="sell-title">Продать программу</div>
              <div className="sell-sub">
                Зарабатывай Telegram Stars за свои программы
              </div>
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
              <div className="sell-price-row">
                <label className="form-label">Цена в звёздах</label>
                <div className="price-input-wrap">
                  <StarIcon size={16} />
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
              </div>

              <div className="sell-preview-label">Превью в каталоге</div>
              <div
                className="sell-preview-card"
                style={{ background: activeProgram.cover }}
              >
                <div className="sell-preview-price">
                  <StarIcon /> {activeProgram.priceStars}
                </div>
                <div className="sell-preview-body">
                  <div className="sell-preview-title">
                    {activeProgram.title}
                  </div>
                  <div className="sell-preview-meta">
                    {activeProgram.level} · {activeProgram.weeks} нед ·{" "}
                    {activeProgram.workouts.length} тренировок
                  </div>
                </div>
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
          className="btn-delete-program"
          type="button"
          onClick={() => {
            deleteProgram(activeProgram.id);
            triggerHaptic("medium");
          }}
        >
          Удалить программу
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════════════════════════
     SCREEN: NEW WORKOUT
  ══════════════════════════════════════════════════════════════════ */
  if (screen === "new-workout" && activeProgram)
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
          <span className="screen-title">Новая тренировка</span>
        </div>

        <div className="form-card">
          <label className="form-label">Название</label>
          <input
            className="form-input"
            placeholder="День A — Жим"
            value={wkTitle}
            onChange={(e) => setWkTitle(e.target.value)}
          />
        </div>

        <div className="form-card">
          <label className="form-label">Длительность</label>
          <input
            className="form-input"
            placeholder="45–60 мин"
            value={wkDuration}
            onChange={(e) => setWkDuration(e.target.value)}
          />
        </div>

        <div className="form-card">
          <label className="form-label">Акцент</label>
          <div className="chip-row wrap">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                className={`option-chip ${wkFocus === f ? "active" : ""}`}
                onClick={() => {
                  setWkFocus(f);
                  triggerHaptic();
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="section-row">
          <h2>Упражнения</h2>
          <span className="section-hint">{wkExercises.length}</span>
        </div>

        {wkExercises.length > 0 && (
          <div className="exercise-list">
            {wkExercises.map((ex, idx) => (
              <div className="exercise-card" key={ex.id}>
                <div className="exercise-idx">{idx + 1}</div>
                <div className="exercise-info">
                  <div className="exercise-card-name">{ex.name}</div>
                  <div className="exercise-card-chips">
                    <span className="ex-chip">{ex.sets} подх.</span>
                    <span className="ex-chip">{ex.reps}</span>
                    <span className="ex-chip muted">{ex.rest}</span>
                  </div>
                </div>
                <button
                  className="btn-remove-ex"
                  type="button"
                  onClick={() => {
                    setWkExercises((prev) =>
                      prev.filter((e) => e.id !== ex.id),
                    );
                    triggerHaptic();
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="add-exercise-card">
          <label className="form-label">Добавить упражнение</label>
          <input
            className="form-input"
            placeholder="Название упражнения"
            value={wkExName}
            onChange={(e) => setWkExName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addExToForm();
            }}
          />
          <div className="ex-params-row">
            <div className="ex-param-col">
              <span className="ex-param-label">Подходы</span>
              <div className="number-control small">
                <button
                  type="button"
                  className="num-btn"
                  onClick={() => setWkExSets((s) => Math.max(1, s - 1))}
                >
                  −
                </button>
                <span className="num-val">{wkExSets}</span>
                <button
                  type="button"
                  className="num-btn"
                  onClick={() => setWkExSets((s) => Math.min(10, s + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="ex-param-col">
              <span className="ex-param-label">Повторения</span>
              <input
                className="ex-param-input"
                value={wkExReps}
                onChange={(e) => setWkExReps(e.target.value)}
                placeholder="10–12"
              />
            </div>
            <div className="ex-param-col">
              <span className="ex-param-label">Отдых</span>
              <input
                className="ex-param-input"
                value={wkExRest}
                onChange={(e) => setWkExRest(e.target.value)}
                placeholder="60 сек"
              />
            </div>
          </div>
          <button
            className="btn-add-ex"
            type="button"
            onClick={addExToForm}
            disabled={!wkExName.trim()}
          >
            <PlusIcon size={16} /> Добавить упражнение
          </button>
        </div>

        <button
          className="btn-primary full-w"
          type="button"
          onClick={createWorkout}
          disabled={!wkTitle.trim()}
        >
          Сохранить тренировку
        </button>
      </div>
    );

  /* ══════════════════════════════════════════════════════════════════
     SCREEN: WORKOUT DETAIL
  ══════════════════════════════════════════════════════════════════ */
  if (screen === "workout" && activeWorkout && activeProgram)
    return (
      <div className="fitness-page">
        <div className="screen-topbar">
          <button className="btn-back" type="button" onClick={goBack}>
            <ChevronLeft /> Назад
          </button>
        </div>

        <div className="workout-hero">
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
                <div className="exercise-idx">{idx + 1}</div>
                <div className="exercise-info">
                  <div className="exercise-card-name">{ex.name}</div>
                  <div className="exercise-card-chips">
                    <span className="ex-chip">{ex.sets} подх.</span>
                    <span className="ex-chip">{ex.reps}</span>
                    <span className="ex-chip muted">отдых {ex.rest}</span>
                  </div>
                </div>
                <button
                  className="btn-remove-ex"
                  type="button"
                  onClick={() => {
                    removeExFromWorkout(ex.id);
                    triggerHaptic();
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="add-exercise-card">
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
            <PlusIcon size={16} /> Добавить
          </button>
        </div>
      </div>
    );

  return null;
}
