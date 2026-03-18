import { useState, useMemo, useEffect } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "Начальный" | "Средний" | "Продвинутый";

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

interface ExerciseDraft {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

interface Workout {
  id: string;
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
  cover: string;
  owned: boolean;
  isOwn: boolean;
  priceStars: number;
  workouts: Workout[];
}

type ScheduleMap = Record<string, string>;
type CheckedMap = Record<string, boolean>;

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS: string[] = [
  "#007AFF",
  "#34C759",
  "#FF9500",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
  "#FF3B30",
  "#30B0C7",
];

const COVERS: string[] = [
  "linear-gradient(135deg,#1a1a2e,#16213e)",
  "linear-gradient(135deg,#0f3460,#533483)",
  "linear-gradient(135deg,#134e5e,#71b280)",
  "linear-gradient(135deg,#c94b4b,#4b134f)",
  "linear-gradient(135deg,#373b44,#4286f4)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
];

const DAY: string[] = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MON: string[] = [
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

const uid = (): string => Math.random().toString(36).substr(2, 7);
const fmtDate = (d: Date): string => d.toISOString().split("T")[0];

const haptic = (s: TelegramHapticStyle = "light"): void => {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(s);
};

// ─── Styles (injected once) ───────────────────────────────────────────────────

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
*{box-sizing:border-box;font-family:'Inter',-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;margin:0;padding:0;}
:root{--bg:#f2f2f7;--card:#ffffff;--black:#000000;--blue:#007AFF;--green:#34C759;--orange:#FF9500;--red:#FF3B30;--purple:#AF52DE;--muted:#8e8e93;--light:#c7c7cc;--border:rgba(0,0,0,0.06);}
.fp{background:var(--bg);min-height:100vh;max-width:480px;margin:0 auto;padding-bottom:80px;}
.fp-hdr{background:var(--bg);padding:52px 20px 0;position:sticky;top:0;z-index:50;}
.fp-title{font-size:34px;font-weight:900;letter-spacing:-0.04em;color:var(--black);margin-bottom:14px;}
.fp-tabs{display:flex;background:rgba(116,116,128,0.12);border-radius:12px;padding:2px;}
.fp-tab{flex:1;padding:8px;border:none;background:transparent;font-size:14px;font-weight:600;color:var(--muted);border-radius:10px;transition:all .2s;cursor:pointer;}
.fp-tab.on{background:white;color:var(--black);box-shadow:0 2px 8px rgba(0,0,0,0.1);}
.fp-body{padding:20px 20px 0;}
.ai-card{background:var(--black);border-radius:24px;padding:20px;margin-bottom:16px;}
.ai-lbl{font-size:11px;font-weight:800;letter-spacing:.1em;color:rgba(255,255,255,.45);text-transform:uppercase;margin-bottom:12px;}
.ai-row{display:flex;gap:10px;align-items:center;margin-bottom:12px;}
.ai-inp{flex:1;background:rgba(255,255,255,.12);border:none;border-radius:14px;padding:12px 14px;color:white;font-size:15px;font-weight:500;outline:none;}
.ai-inp::placeholder{color:rgba(255,255,255,.35);}
.ai-btn{width:44px;height:44px;border-radius:14px;background:white;border:none;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s;}
.ai-btn:active{transform:scale(.92);}
.ai-chips{display:flex;gap:7px;flex-wrap:wrap;}
.chip{background:rgba(255,255,255,.12);border:none;color:white;padding:7px 13px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
.chip.on{background:white;color:black;}
.row2{display:flex;gap:10px;margin-bottom:20px;}
.btn-outline{flex:1;background:white;border:1px solid var(--border);border-radius:16px;padding:13px;font-size:14px;font-weight:700;color:var(--black);cursor:pointer;transition:transform .1s;}
.btn-outline:active{transform:scale(.97);}
.sec-hdr{display:flex;justify-content:space-between;align-items:center;margin:22px 0 13px;}
.sec-hdr h2{font-size:22px;font-weight:800;letter-spacing:-.03em;}
.sec-hdr button{background:none;border:none;color:var(--blue);font-size:15px;font-weight:600;cursor:pointer;}
.cal-card{background:white;border-radius:20px;padding:16px;border:1px solid var(--border);margin-bottom:20px;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;}
.cal-day{background:var(--bg);border-radius:14px;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transition:all .15s;min-height:66px;justify-content:center;}
.cal-day:active{transform:scale(.9);}
.cal-day.today{background:var(--black);color:white;}
.cal-day.haswk{border:1.5px solid var(--blue);background:rgba(0,122,255,.06);}
.cal-day.today.haswk{background:var(--black);border-color:var(--black);}
.cdn{font-size:10px;font-weight:700;color:var(--muted);}
.today .cdn{color:rgba(255,255,255,.55);}
.cdnum{font-size:17px;font-weight:800;}
.cddot{width:6px;height:6px;border-radius:3px;}
.today .cddot{background:white!important;}
.prog-card{background:white;border-radius:22px;overflow:hidden;margin-bottom:14px;cursor:pointer;border:1px solid var(--border);transition:transform .1s;}
.prog-card:active{transform:scale(.98);}
.prog-cov{height:155px;position:relative;display:flex;align-items:flex-end;padding:14px;}
.prog-cov-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 55%);}
.prog-cov-info{position:relative;z-index:1;}
.prog-cov-title{color:white;font-size:21px;font-weight:900;letter-spacing:-.03em;line-height:1.15;}
.prog-cov-auth{color:rgba(255,255,255,.65);font-size:13px;font-weight:600;margin-top:2px;}
.prog-badge{position:absolute;top:12px;right:12px;z-index:1;padding:5px 11px;border-radius:100px;font-size:11px;font-weight:800;}
.badge-paid{background:rgba(255,214,10,.92);color:#000;}
.badge-free{background:rgba(52,199,89,.2);color:#34C759;backdrop-filter:blur(8px);}
.badge-owned{background:rgba(255,255,255,.2);color:white;backdrop-filter:blur(8px);}
.prog-body{padding:14px;}
.prog-desc{font-size:13px;color:var(--muted);line-height:1.45;margin-bottom:10px;}
.tags{display:flex;gap:7px;flex-wrap:wrap;}
.tag{background:var(--bg);padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;color:var(--muted);}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:300;display:flex;align-items:flex-end;animation:fIn .2s;}
@keyframes fIn{from{opacity:0}to{opacity:1}}
.sheet{background:white;width:100%;border-radius:28px 28px 0 0;padding:10px 20px 50px;max-height:88vh;overflow-y:auto;animation:sUp .35s cubic-bezier(.16,1,.3,1);}
@keyframes sUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.shdl{width:40px;height:4px;background:var(--light);border-radius:2px;margin:0 auto 18px;}
.sheet-cover{height:190px;border-radius:18px;position:relative;overflow:hidden;margin-bottom:18px;}
.sheet-cover-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 50%);}
.sheet-cover-info{position:absolute;bottom:18px;left:18px;}
.sheet-cover-info h2{color:white;font-size:26px;font-weight:900;letter-spacing:-.03em;}
.sheet-cover-info p{color:rgba(255,255,255,.65);font-size:14px;font-weight:600;}
.stats3{display:flex;gap:8px;margin-bottom:18px;}
.sbox{flex:1;background:var(--bg);border-radius:14px;padding:12px;}
.sbox-lbl{font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
.sbox-val{font-size:16px;font-weight:800;}
.sheet-desc{font-size:15px;color:#3a3a3c;line-height:1.6;margin-bottom:18px;}
.wk-row{display:flex;align-items:center;gap:11px;background:var(--bg);border-radius:14px;padding:13px 14px;margin-bottom:7px;cursor:pointer;transition:transform .1s;}
.wk-row:active{transform:scale(.98);}
.wk-row-dot{width:10px;height:10px;border-radius:5px;flex-shrink:0;}
.wk-row-info{flex:1;}
.wk-row-name{font-size:15px;font-weight:700;}
.wk-row-meta{font-size:12px;color:var(--muted);margin-top:1px;}
.wk-row-ico{color:var(--light);font-size:17px;}
.btn-buy{width:100%;background:var(--black);color:white;border:none;padding:16px;border-radius:16px;font-size:15px;font-weight:800;cursor:pointer;margin-top:6px;transition:transform .1s;}
.btn-buy:active{transform:scale(.98);}
.btn-lib{width:100%;background:var(--bg);border:none;border-radius:14px;padding:13px;font-size:14px;font-weight:600;color:var(--muted);text-align:center;margin-top:6px;}
.player{background:var(--bg);min-height:100vh;max-width:480px;margin:0 auto;padding-bottom:90px;}
.player-hdr{padding:52px 20px 28px;color:white;border-radius:0 0 30px 30px;}
.player-back{background:rgba(255,255,255,.2);border:none;color:white;width:38px;height:38px;border-radius:12px;font-size:17px;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:18px;}
.player-badge{display:inline-block;background:rgba(255,255,255,.2);padding:4px 12px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:.08em;margin-bottom:10px;}
.player-title{font-size:28px;font-weight:900;letter-spacing:-.04em;margin-bottom:5px;}
.player-sub{font-size:14px;opacity:.7;font-weight:500;}
.prog-bar{margin-top:14px;background:rgba(255,255,255,.2);border-radius:4px;height:4px;overflow:hidden;}
.prog-fill{height:100%;background:white;border-radius:4px;transition:width .3s;}
.prog-txt{font-size:12px;color:rgba(255,255,255,.65);margin-top:5px;font-weight:600;}
.player-body{padding:20px;}
.ex-card{background:white;border-radius:18px;padding:15px;display:flex;align-items:center;gap:12px;margin-bottom:9px;transition:all .2s;border:1px solid var(--border);}
.ex-card.done{opacity:.45;}
.ex-num{font-size:20px;font-weight:900;color:var(--light);width:26px;text-align:center;flex-shrink:0;}
.ex-info{flex:1;}
.ex-info h3{font-size:16px;font-weight:700;margin-bottom:3px;}
.ex-info p{font-size:12px;color:var(--muted);font-weight:500;}
.ex-chk{width:32px;height:32px;border-radius:10px;border:2px solid #e5e5ea;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0;font-size:16px;color:transparent;}
.ex-chk.on{background:#34C759;border-color:#34C759;color:white;}
.player-foot{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;padding:14px 20px 32px;background:linear-gradient(to top,var(--bg) 65%,transparent);}
.btn-done{width:100%;background:var(--black);color:white;border:none;padding:17px;border-radius:17px;font-size:16px;font-weight:800;cursor:pointer;transition:transform .1s;}
.btn-done:active{transform:scale(.98);}
.form-lbl{font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:7px;}
.form-inp{width:100%;background:var(--bg);border:none;border-radius:13px;padding:13px;font-size:15px;font-weight:500;outline:none;color:var(--black);}
.form-ta{width:100%;background:var(--bg);border:none;border-radius:13px;padding:13px;font-size:15px;font-weight:500;outline:none;color:var(--black);resize:none;min-height:80px;font-family:inherit;}
.form-field{margin-bottom:15px;}
.colors{display:flex;gap:9px;flex-wrap:wrap;}
.cdot{width:32px;height:32px;border-radius:16px;border:3px solid transparent;cursor:pointer;transition:transform .15s;}
.cdot.on{border-color:var(--black);transform:scale(1.15);}
.covers{display:flex;gap:9px;flex-wrap:wrap;}
.covdot{width:56px;height:56px;border-radius:13px;border:3px solid transparent;cursor:pointer;transition:all .15s;}
.covdot.on{border-color:var(--black);transform:scale(1.08);}
.lvl-row{display:flex;gap:7px;}
.lvl-btn{flex:1;padding:10px 4px;border-radius:12px;border:none;font-weight:700;font-size:12px;cursor:pointer;transition:all .15s;}
.btn-main{width:100%;background:var(--black);color:white;border:none;padding:15px;border-radius:15px;font-size:15px;font-weight:800;cursor:pointer;margin-top:6px;transition:transform .1s;}
.btn-main:active{transform:scale(.98);}
.empty-st{text-align:center;padding:36px 20px;color:var(--muted);}
.empty-ico{font-size:44px;margin-bottom:10px;}
.empty-st p{font-size:15px;font-weight:500;line-height:1.5;}
.create-card{background:var(--black);border-radius:22px;padding:20px;display:flex;align-items:center;gap:14px;margin-bottom:16px;cursor:pointer;transition:transform .1s;}
.create-card:active{transform:scale(.98);}
.create-icon{width:48px;height:48px;background:rgba(255,255,255,.15);border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.create-txt h3{color:white;font-size:17px;font-weight:800;margin-bottom:3px;}
.create-txt p{color:rgba(255,255,255,.55);font-size:13px;font-weight:500;}
.ldots{display:flex;gap:4px;align-items:center;}
.ld{width:6px;height:6px;border-radius:3px;background:white;animation:b .8s infinite;}
.ld:nth-child(2){animation-delay:.15s;}
.ld:nth-child(3){animation-delay:.3s;}
@keyframes b{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}
@keyframes aUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.anim{animation:aUp .4s cubic-bezier(.16,1,.3,1) both;}
`;

// ─── Initial data ─────────────────────────────────────────────────────────────

const INIT_PROGS: Program[] = [
  {
    id: "p1",
    title: "Моя база",
    author: "Я",
    desc: "Личная программа для поддержания формы. Упражнения с собственным весом.",
    descAfter: "Тренируйся 3 раза в неделю. Соблюдай отдых между подходами.",
    level: "Средний",
    weeks: 4,
    cover: COVERS[0],
    owned: true,
    isOwn: true,
    priceStars: 0,
    workouts: [
      {
        id: "w1",
        title: "Утренняя зарядка",
        dur: "20 мин",
        focus: "Тонус",
        color: COLORS[0],
        exes: [
          { id: "e1", name: "Приседания", sets: "3", reps: "20", rest: "30с" },
          { id: "e2", name: "Отжимания", sets: "3", reps: "15", rest: "45с" },
          { id: "e3", name: "Планка", sets: "3", reps: "60с", rest: "30с" },
        ],
      },
      {
        id: "w2",
        title: "Кардио",
        dur: "30 мин",
        focus: "Жиросжигание",
        color: COLORS[1],
        exes: [
          { id: "e4", name: "Берпи", sets: "4", reps: "12", rest: "30с" },
          { id: "e5", name: "Прыжки", sets: "3", reps: "30с", rest: "15с" },
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
    desc: "Профессиональная программа для набора мышечной массы. 8 недель интенсивных тренировок в зале.",
    descAfter:
      "4 тренировки в неделю. 32 занятия с прогрессивной нагрузкой. Детальные инструкции по питанию.",
    level: "Продвинутый",
    weeks: 8,
    cover: COVERS[3],
    owned: false,
    isOwn: false,
    priceStars: 250,
    workouts: [
      {
        id: "cw1",
        title: "День груди",
        dur: "60 мин",
        focus: "Сила",
        color: COLORS[4],
        exes: [
          { id: "ce1", name: "Жим лёжа", sets: "4", reps: "8", rest: "2м" },
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
      {
        id: "cw2",
        title: "День спины",
        dur: "55 мин",
        focus: "Сила",
        color: COLORS[7],
        exes: [
          {
            id: "ce4",
            name: "Становая тяга",
            sets: "4",
            reps: "6",
            rest: "3м",
          },
          { id: "ce5", name: "Тяга блока", sets: "3", reps: "10", rest: "90с" },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Yoga Flow",
    author: "Maria Sun",
    desc: "Йога для начинающих. Гибкость, баланс и осознанность за 6 недель. Без оборудования.",
    descAfter:
      "Ежедневные занятия 20–40 минут. Включает дыхательные практики и медитацию.",
    level: "Начальный",
    weeks: 6,
    cover: COVERS[2],
    owned: false,
    isOwn: false,
    priceStars: 0,
    workouts: [
      {
        id: "cw3",
        title: "Утренняя йога",
        dur: "30 мин",
        focus: "Гибкость",
        color: COLORS[1],
        exes: [
          {
            id: "ce6",
            name: "Собака мордой вниз",
            sets: "1",
            reps: "60с",
            rest: "10с",
          },
          { id: "ce7", name: "Воин I", sets: "1", reps: "45с", rest: "10с" },
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "HIIT Blaster",
    author: "Fitness Club",
    desc: "Высокоинтенсивный интервальный тренинг. Сжигай жир максимально эффективно без зала.",
    descAfter:
      "3–4 тренировки в неделю по 25–35 минут. Всё что нужно — коврик и желание.",
    level: "Средний",
    weeks: 4,
    cover: COVERS[4],
    owned: true,
    isOwn: false,
    priceStars: 0,
    workouts: [
      {
        id: "cw4",
        title: "HIIT Full Body",
        dur: "25 мин",
        focus: "Жиросжигание",
        color: COLORS[6],
        exes: [
          { id: "ce8", name: "Берпи", sets: "5", reps: "10", rest: "20с" },
          {
            id: "ce9",
            name: "Маунтин климбер",
            sets: "5",
            reps: "20",
            rest: "20с",
          },
        ],
      },
    ],
  },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

type Screen = "main" | "player";
type Tab = "personal" | "catalog";

function LoadingDots(): React.ReactElement {
  return (
    <div className="ldots">
      <div className="ld" />
      <div className="ld" />
      <div className="ld" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FitnessPage(): React.ReactElement {
  // inject styles once
  useEffect(() => {
    if (!document.getElementById("fp-css")) {
      const s = document.createElement("style");
      s.id = "fp-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // ── navigation state ──
  const [tab, setTab] = useState<Tab>("personal");
  const [screen, setScreen] = useState<Screen>("main");

  // ── data state ──
  const [myProgs, setMyProgs] = useState<Program[]>(INIT_PROGS);
  const [catalog, setCatalog] = useState<Program[]>(CATALOG_DATA);
  const [schedule, setSchedule] = useState<ScheduleMap>({
    [fmtDate(new Date())]: "w1",
  });

  // ── calendar ──
  const [weekOff, setWeekOff] = useState<number>(0);

  // ── player ──
  const [activeWk, setActiveWk] = useState<Workout | null>(null);
  const [checked, setChecked] = useState<CheckedMap>({});

  // ── modals ──
  const [selProg, setSelProg] = useState<Program | null>(null);
  const [schedDate, setSchedDate] = useState<string | null>(null);
  const [showMakeWk, setShowMakeWk] = useState<boolean>(false);
  const [showMakeProg, setShowMakeProg] = useState<boolean>(false);

  // ── AI form ──
  const [aiQ, setAiQ] = useState<string>("");
  const [aiGoal, setAiGoal] = useState<string>("Похудеть");
  const [aiLoad, setAiLoad] = useState<boolean>(false);

  // ── create workout form ──
  const [wkName, setWkName] = useState<string>(COLORS[0]);
  const [wkColor, setWkColor] = useState<string>(COLORS[0]);
  const [wkExes, setWkExes] = useState<ExerciseDraft[]>([
    { name: "", sets: "3", reps: "10", rest: "60с" },
  ]);

  // ── create program form ──
  const [pName, setPName] = useState<string>("");
  const [pDesc, setPDesc] = useState<string>("");
  const [pDescA, setPDescA] = useState<string>("");
  const [pLevel, setPLevel] = useState<Level>("Средний");
  const [pCover, setPCover] = useState<string>(COVERS[0]);
  const [pPrice, setPPrice] = useState<string>("");
  const [pWeeks, setPWeeks] = useState<string>("4");

  // ── derived ──
  const weekDays = useMemo<Date[]>(() => {
    const s = new Date();
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7) + weekOff * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return d;
    });
  }, [weekOff]);

  const allMyWks = useMemo<Workout[]>(
    () => myProgs.flatMap((p) => p.workouts),
    [myProgs],
  );

  // ── actions ──
  const openWk = (wk: Workout): void => {
    setActiveWk(wk);
    setChecked({});
    setScreen("player");
    haptic("medium");
  };

  const runAI = (): void => {
    if (!aiQ.trim() || aiLoad) return;
    haptic("medium");
    setAiLoad(true);
    setTimeout(() => {
      const wk: Workout = {
        id: uid(),
        title: `AI: ${aiQ.slice(0, 18)}`,
        dur: "35 мин",
        focus: aiGoal,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        exes: [
          { id: uid(), name: "Берпи", sets: "4", reps: "15", rest: "30с" },
          {
            id: uid(),
            name: "Прыжки на месте",
            sets: "3",
            reps: "30с",
            rest: "20с",
          },
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
        title: `AI: ${aiQ.slice(0, 18)}`,
        author: "AI Тренер",
        desc: `Создано по запросу: "${aiQ}". Цель: ${aiGoal}.`,
        descAfter: `Тренируйся 3–4 раза в неделю для достижения цели: ${aiGoal}.`,
        level: "Средний",
        weeks: 4,
        cover: COVERS[1],
        owned: true,
        isOwn: true,
        priceStars: 0,
        workouts: [wk],
      };
      setMyProgs((prev) => [prog, ...prev]);
      setAiQ("");
      setAiLoad(false);
      haptic("heavy");
    }, 1800);
  };

  const buyProg = (prog: Program): void => {
    haptic("heavy");
    const updated: Program = { ...prog, owned: true };
    setCatalog((prev) => prev.map((p) => (p.id === prog.id ? updated : p)));
    const copy: Program = { ...updated, id: uid(), isOwn: false };
    setMyProgs((prev) => [...prev, copy]);
    setSelProg(updated);
  };

  const saveWk = (): void => {
    if (!wkName.trim()) return;
    haptic("medium");
    const wk: Workout = {
      id: uid(),
      title: wkName,
      dur: "30 мин",
      focus: "Сила",
      color: wkColor,
      exes: wkExes
        .filter((e) => e.name.trim())
        .map((e) => ({ ...e, id: uid() })),
    };
    setMyProgs((prev) => {
      if (prev.length > 0) {
        return prev.map((p, i) =>
          i === 0 ? { ...p, workouts: [...p.workouts, wk] } : p,
        );
      }
      return [
        {
          id: uid(),
          title: "Мои тренировки",
          author: "Я",
          desc: "",
          descAfter: "",
          level: "Средний" as Level,
          weeks: 52,
          cover: COVERS[0],
          owned: true,
          isOwn: true,
          priceStars: 0,
          workouts: [wk],
        },
      ];
    });
    setShowMakeWk(false);
    setWkName("");
    setWkColor(COLORS[0]);
    setWkExes([{ name: "", sets: "3", reps: "10", rest: "60с" }]);
  };

  const saveProg = (): void => {
    if (!pName.trim()) return;
    haptic("medium");
    const prog: Program = {
      id: uid(),
      title: pName,
      author: "Я",
      desc: pDesc,
      descAfter: pDescA,
      level: pLevel,
      weeks: parseInt(pWeeks) || 4,
      cover: pCover,
      owned: true,
      isOwn: true,
      priceStars: parseInt(pPrice) || 0,
      workouts: [],
    };
    setCatalog((prev) => [prog, ...prev]);
    setMyProgs((prev) => [prog, ...prev]);
    setShowMakeProg(false);
    setPName("");
    setPDesc("");
    setPDescA("");
    setPPrice("");
  };

  const updateExDraft = (
    i: number,
    key: keyof ExerciseDraft,
    val: string,
  ): void => {
    setWkExes((prev) =>
      prev.map((x, j) => (j === i ? { ...x, [key]: val } : x)),
    );
  };

  const addExDraft = (): void => {
    setWkExes((prev) => [
      ...prev,
      { name: "", sets: "3", reps: "10", rest: "60с" },
    ]);
  };

  const toggleCheck = (id: string): void => {
    haptic("light");
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Player screen ──────────────────────────────────────────────────────────
  if (screen === "player" && activeWk) {
    const total = activeWk.exes.length;
    const done = activeWk.exes.filter((e) => checked[e.id]).length;
    const pct = total > 0 ? (done / total) * 100 : 0;

    return (
      <div className="player">
        <div className="player-hdr" style={{ background: activeWk.color }}>
          <button className="player-back" onClick={() => setScreen("main")}>
            ✕
          </button>
          <div className="player-badge">ТРЕНИРОВКА</div>
          <div className="player-title">{activeWk.title}</div>
          <div className="player-sub">
            {activeWk.dur} · {total} упражнений
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="prog-txt">
            {done} из {total} выполнено
          </div>
        </div>

        <div className="player-body">
          {activeWk.exes.map((ex, i) => (
            <div
              key={ex.id}
              className={`ex-card anim ${checked[ex.id] ? "done" : ""}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="ex-num">{i + 1}</div>
              <div className="ex-info">
                <h3>{ex.name}</h3>
                <p>
                  {ex.sets} подх. × {ex.reps} · Отдых {ex.rest}
                </p>
              </div>
              <div
                className={`ex-chk ${checked[ex.id] ? "on" : ""}`}
                onClick={() => toggleCheck(ex.id)}
              >
                {checked[ex.id] && "✓"}
              </div>
            </div>
          ))}
        </div>

        <div className="player-foot">
          <button className="btn-done" onClick={() => setScreen("main")}>
            {done === total && total > 0
              ? "🎉 Тренировка завершена!"
              : "Завершить"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main screen ────────────────────────────────────────────────────────────
  return (
    <div className="fp">
      {/* Header */}
      <div className="fp-hdr">
        <div className="fp-title">Тренировки</div>
        <div style={{ paddingBottom: 14 }}>
          <div className="fp-tabs">
            <button
              className={`fp-tab ${tab === "personal" ? "on" : ""}`}
              onClick={() => {
                setTab("personal");
                haptic();
              }}
            >
              Личные
            </button>
            <button
              className={`fp-tab ${tab === "catalog" ? "on" : ""}`}
              onClick={() => {
                setTab("catalog");
                haptic();
              }}
            >
              Каталог
            </button>
          </div>
        </div>
      </div>

      <div className="fp-body">
        {tab === "personal" ? (
          <>
            {/* ── AI block ── */}
            <div className="ai-card anim" style={{ animationDelay: ".04s" }}>
              <div className="ai-lbl">✦ AI Тренер</div>
              <div className="ai-row">
                <input
                  className="ai-inp"
                  placeholder="Опиши цель или тип тренировки..."
                  value={aiQ}
                  onChange={(e) => setAiQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runAI()}
                />
                <button className="ai-btn" onClick={runAI} disabled={aiLoad}>
                  {aiLoad ? <LoadingDots /> : "🪄"}
                </button>
              </div>
              <div className="ai-chips">
                {[
                  "Похудеть",
                  "Набрать массу",
                  "Сила",
                  "Выносливость",
                  "Гибкость",
                ].map((g) => (
                  <button
                    key={g}
                    className={`chip ${aiGoal === g ? "on" : ""}`}
                    onClick={() => {
                      setAiGoal(g);
                      haptic();
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="row2">
              <button
                className="btn-outline"
                onClick={() => {
                  setShowMakeWk(true);
                  haptic();
                }}
              >
                ＋ Тренировка
              </button>
              <button
                className="btn-outline"
                onClick={() => {
                  setShowMakeProg(true);
                  haptic();
                }}
              >
                ＋ Программа
              </button>
            </div>

            {/* ── Calendar ── */}
            <div className="sec-hdr anim" style={{ animationDelay: ".08s" }}>
              <h2>Расписание</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <button
                  style={{
                    background: "var(--bg)",
                    border: "none",
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                  onClick={() => setWeekOff((v) => v - 1)}
                >
                  ‹
                </button>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  {weekDays[0] &&
                    `${weekDays[0].getDate()} ${MON[weekDays[0].getMonth()]}`}
                </span>
                <button
                  style={{
                    background: "var(--bg)",
                    border: "none",
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                  onClick={() => setWeekOff((v) => v + 1)}
                >
                  ›
                </button>
              </div>
            </div>

            <div className="cal-card anim" style={{ animationDelay: ".1s" }}>
              <div className="cal-grid">
                {weekDays.map((date) => {
                  const ds = fmtDate(date);
                  const wkId = schedule[ds];
                  const wk = wkId
                    ? allMyWks.find((w) => w.id === wkId)
                    : undefined;
                  const isToday = ds === fmtDate(new Date());
                  return (
                    <div
                      key={ds}
                      className={`cal-day ${isToday ? "today" : ""} ${wkId ? "haswk" : ""}`}
                      onClick={() => {
                        haptic();
                        wk ? openWk(wk) : setSchedDate(ds);
                      }}
                    >
                      <span className="cdn">{DAY[date.getDay()]}</span>
                      <span className="cdnum">{date.getDate()}</span>
                      {wkId && (
                        <div
                          className="cddot"
                          style={{
                            background: wk
                              ? isToday
                                ? "white"
                                : wk.color
                              : "var(--blue)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── My programs ── */}
            <div className="sec-hdr anim" style={{ animationDelay: ".12s" }}>
              <h2>Мои программы</h2>
            </div>

            {myProgs.length === 0 ? (
              <div className="empty-st">
                <div className="empty-ico">🏋️</div>
                <p>
                  Создай тренировку с помощью AI
                  <br />
                  или вручную, используя кнопки выше
                </p>
              </div>
            ) : (
              myProgs.map((p, i) => (
                <ProgramCard
                  key={p.id}
                  prog={p}
                  delay={0.14 + i * 0.04}
                  badge={
                    <span className="prog-badge badge-owned">
                      {p.workouts.length} тренировок
                    </span>
                  }
                  onClick={() => {
                    setSelProg(p);
                    haptic();
                  }}
                />
              ))
            )}
          </>
        ) : (
          <>
            {/* ── Catalog tab ── */}
            <div
              className="create-card anim"
              style={{ animationDelay: ".04s" }}
              onClick={() => {
                setShowMakeProg(true);
                haptic();
              }}
            >
              <div className="create-icon">✦</div>
              <div className="create-txt">
                <h3>Создать программу</h3>
                <p>Продавай или делись с другими бесплатно</p>
              </div>
            </div>

            {myProgs.filter((p) => p.isOwn).length > 0 && (
              <>
                <div
                  className="sec-hdr anim"
                  style={{ animationDelay: ".08s" }}
                >
                  <h2>Мои программы</h2>
                </div>
                {myProgs
                  .filter((p) => p.isOwn)
                  .map((p, i) => (
                    <ProgramCard
                      key={p.id}
                      prog={p}
                      delay={0.1 + i * 0.04}
                      badge={
                        <span
                          className={`prog-badge ${p.priceStars ? "badge-paid" : "badge-free"}`}
                        >
                          {p.priceStars ? `★ ${p.priceStars}` : "Бесплатно"}
                        </span>
                      }
                      onClick={() => {
                        setSelProg(p);
                        haptic();
                      }}
                    />
                  ))}
              </>
            )}

            <div className="sec-hdr anim">
              <h2>Каталог</h2>
            </div>
            {catalog.map((p, i) => (
              <ProgramCard
                key={p.id}
                prog={p}
                delay={0.14 + i * 0.04}
                badge={
                  <span
                    className={`prog-badge ${p.owned ? "badge-owned" : p.priceStars ? "badge-paid" : "badge-free"}`}
                  >
                    {p.owned
                      ? "✓ В библиотеке"
                      : p.priceStars
                        ? `★ ${p.priceStars}`
                        : "Бесплатно"}
                  </span>
                }
                onClick={() => {
                  setSelProg(p);
                  haptic();
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Program detail sheet ── */}
      {selProg && (
        <div className="overlay" onClick={() => setSelProg(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="shdl" />
            <div className="sheet-cover" style={{ background: selProg.cover }}>
              <div className="sheet-cover-ov" />
              <div className="sheet-cover-info">
                <h2>{selProg.title}</h2>
                <p>{selProg.author}</p>
              </div>
            </div>

            <div className="stats3">
              {(
                [
                  { l: "Уровень", v: selProg.level },
                  { l: "Длительность", v: `${selProg.weeks} нед.` },
                  { l: "Тренировок", v: String(selProg.workouts.length) },
                ] as { l: string; v: string }[]
              ).map((s) => (
                <div key={s.l} className="sbox">
                  <div className="sbox-lbl">{s.l}</div>
                  <div className="sbox-val">{s.v}</div>
                </div>
              ))}
            </div>

            <p className="sheet-desc">
              {selProg.owned ? selProg.descAfter || selProg.desc : selProg.desc}
            </p>

            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
              Тренировки
            </div>
            {selProg.workouts.map((wk) => (
              <div
                key={wk.id}
                className="wk-row"
                onClick={() => {
                  if (selProg.owned) {
                    setSelProg(null);
                    openWk(wk);
                  }
                }}
              >
                <div className="wk-row-dot" style={{ background: wk.color }} />
                <div className="wk-row-info">
                  <div className="wk-row-name">{wk.title}</div>
                  <div className="wk-row-meta">
                    {wk.dur} · {wk.exes.length} упражнений
                  </div>
                </div>
                <div className="wk-row-ico">{selProg.owned ? "▶" : "🔒"}</div>
              </div>
            ))}

            {selProg.owned ? (
              <div className="btn-lib">✓ Программа в вашей библиотеке</div>
            ) : (
              <button className="btn-buy" onClick={() => buyProg(selProg)}>
                {selProg.priceStars
                  ? `Купить за ★ ${selProg.priceStars}`
                  : "Получить бесплатно"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Schedule picker ── */}
      {schedDate && (
        <div className="overlay" onClick={() => setSchedDate(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="shdl" />
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              Запланировать
            </div>
            <div
              style={{ fontSize: 14, color: "var(--muted)", marginBottom: 18 }}
            >
              {schedDate}
            </div>

            {allMyWks.length === 0 ? (
              <div className="empty-st">
                <div className="empty-ico">📅</div>
                <p>Нет тренировок для планирования</p>
              </div>
            ) : (
              allMyWks.map((wk) => (
                <div
                  key={wk.id}
                  className="wk-row"
                  onClick={() => {
                    haptic();
                    setSchedule((s) => ({ ...s, [schedDate!]: wk.id }));
                    setSchedDate(null);
                  }}
                >
                  <div
                    className="wk-row-dot"
                    style={{ background: wk.color }}
                  />
                  <div className="wk-row-info">
                    <div className="wk-row-name">{wk.title}</div>
                    <div className="wk-row-meta">
                      {wk.dur} · {wk.exes.length} упражнений
                    </div>
                  </div>
                  <div className="wk-row-ico">+</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Create workout ── */}
      {showMakeWk && (
        <div className="overlay" onClick={() => setShowMakeWk(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="shdl" />
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>
              Новая тренировка
            </div>

            <div className="form-field">
              <label className="form-lbl">Название</label>
              <input
                className="form-inp"
                placeholder="Например: Ноги и ягодицы"
                value={wkName}
                onChange={(e) => setWkName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-lbl">Цвет</label>
              <div className="colors">
                {COLORS.map((c) => (
                  <div
                    key={c}
                    className={`cdot ${wkColor === c ? "on" : ""}`}
                    style={{ background: c }}
                    onClick={() => setWkColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="form-field">
              <label
                className="form-lbl"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                Упражнения
                <span
                  style={{
                    color: "var(--blue)",
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                  onClick={addExDraft}
                >
                  + Добавить
                </span>
              </label>

              {wkExes.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg)",
                    borderRadius: 13,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <input
                    className="form-inp"
                    style={{ marginBottom: 8, background: "white" }}
                    placeholder="Название упражнения"
                    value={ex.name}
                    onChange={(e) => updateExDraft(i, "name", e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 7 }}>
                    {(["sets", "reps", "rest"] as (keyof ExerciseDraft)[]).map(
                      (k, ki) => (
                        <input
                          key={k}
                          className="form-inp"
                          style={{ background: "white", flex: 1 }}
                          placeholder={["Подх.", "Повт.", "Отдых"][ki]}
                          value={ex[k]}
                          onChange={(e) => updateExDraft(i, k, e.target.value)}
                        />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-main" onClick={saveWk}>
              Сохранить тренировку
            </button>
          </div>
        </div>
      )}

      {/* ── Create program ── */}
      {showMakeProg && (
        <div className="overlay" onClick={() => setShowMakeProg(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="shdl" />
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>
              Новая программа
            </div>

            <div className="form-field">
              <label className="form-lbl">Название</label>
              <input
                className="form-inp"
                placeholder="Рельеф за 8 недель"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-lbl">Описание до покупки</label>
              <textarea
                className="form-ta"
                placeholder="Что получит пользователь?"
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-lbl">Описание после покупки</label>
              <textarea
                className="form-ta"
                placeholder="Детали, инструкции, расписание..."
                value={pDescA}
                onChange={(e) => setPDescA(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <label className="form-lbl">Недель</label>
                <input
                  className="form-inp"
                  type="number"
                  placeholder="4"
                  value={pWeeks}
                  onChange={(e) => setPWeeks(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-lbl">Цена ★ Stars</label>
                <input
                  className="form-inp"
                  type="number"
                  placeholder="0 = бесплатно"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-lbl">Уровень</label>
              <div className="lvl-row">
                {(["Начальный", "Средний", "Продвинутый"] as Level[]).map(
                  (l) => (
                    <button
                      key={l}
                      className="lvl-btn"
                      style={{
                        background: pLevel === l ? "var(--black)" : "var(--bg)",
                        color: pLevel === l ? "white" : "var(--muted)",
                      }}
                      onClick={() => setPLevel(l)}
                    >
                      {l}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="form-field">
              <label className="form-lbl">Обложка</label>
              <div className="covers">
                {COVERS.map((c) => (
                  <div
                    key={c}
                    className={`covdot ${pCover === c ? "on" : ""}`}
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
      )}
    </div>
  );
}

// ─── ProgramCard helper component ────────────────────────────────────────────

interface ProgramCardProps {
  prog: Program;
  delay: number;
  badge: React.ReactNode;
  onClick: () => void;
}

function ProgramCard({
  prog,
  delay,
  badge,
  onClick,
}: ProgramCardProps): React.ReactElement {
  return (
    <div
      className="prog-card anim"
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      <div className="prog-cov" style={{ background: prog.cover }}>
        <div className="prog-cov-ov" />
        <div className="prog-cov-info">
          <div className="prog-cov-title">{prog.title}</div>
          <div className="prog-cov-auth">{prog.author}</div>
        </div>
        {badge}
      </div>
      <div className="prog-body">
        <div className="prog-desc">
          {prog.desc.slice(0, 90)}
          {prog.desc.length > 90 ? "..." : ""}
        </div>
        <div className="tags">
          <span className="tag">{prog.level}</span>
          <span className="tag">{prog.weeks} нед.</span>
          {prog.author === "AI Тренер" && <span className="tag">🪄 AI</span>}
        </div>
      </div>
    </div>
  );
}
