import { useState, useMemo, useEffect, useCallback } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";

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
  dayLabel: string; // "День 1", "День 2", etc.
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

type ScheduleMap = Record<string, string>; // date -> workoutDayId
type CheckedMap = Record<string, boolean>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = {
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  purple: "#BF5AF2",
  red: "#FF3B30",
  teal: "#32ADE6",
  pink: "#FF375F",
  indigo: "#5E5CE6",
  mint: "#00C7BE",
  yellow: "#FFD60A",
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
const haptic = (s: TelegramHapticStyle = "light"): void =>
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(s);

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700;800;900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

:root {
  --bg: #f2f2f7;
  --bg2: #e5e5ea;
  --card: #ffffff;
  --black: #000000;
  --black2: #1c1c1e;
  --blue: #007AFF;
  --green: #34C759;
  --orange: #FF9500;
  --red: #FF3B30;
  --purple: #BF5AF2;
  --teal: #32ADE6;
  --muted: #8e8e93;
  --light: #c7c7cc;
  --sep: rgba(0,0,0,0.08);
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}

/* ── Layout ── */
.fp { background: var(--bg); min-height: 100vh; max-width: 480px; margin: 0 auto; padding-bottom: 90px; overflow-x: hidden; }
.fp-hdr { background: var(--bg); padding: 52px 20px 0; position: sticky; top: 0; z-index: 100; }
.fp-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.fp-title { font-size: 34px; font-weight: 900; letter-spacing: -0.04em; color: var(--black); }
.fp-streak { background: white; border-radius: 20px; padding: 6px 12px; font-size: 13px; font-weight: 700; color: var(--orange); border: 1px solid var(--sep); }
.fp-tabs { display: flex; background: rgba(116,116,128,0.12); border-radius: 12px; padding: 2px; margin-bottom: 0; }
.fp-tab { flex: 1; padding: 8px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: var(--muted); border-radius: 10px; transition: all .2s; cursor: pointer; }
.fp-tab.on { background: white; color: var(--black); box-shadow: var(--shadow); }
.fp-body { padding: 16px 16px 0; }

/* ── AI Card ── */
.ai-card { background: var(--black2); border-radius: 24px; padding: 18px 18px 16px; margin-bottom: 14px; }
.ai-top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ai-dot { width: 8px; height: 8px; border-radius: 4px; background: var(--purple); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
.ai-lbl { font-size: 11px; font-weight: 800; letter-spacing: .1em; color: rgba(255,255,255,.45); text-transform: uppercase; }
.ai-row { display: flex; gap: 9px; align-items: center; margin-bottom: 11px; }
.ai-inp { flex: 1; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 11px 13px; color: white; font-size: 14px; font-weight: 500; outline: none; transition: border-color .15s; }
.ai-inp:focus { border-color: rgba(255,255,255,.3); }
.ai-inp::placeholder { color: rgba(255,255,255,.3); }
.ai-send { width: 42px; height: 42px; border-radius: 13px; background: var(--purple); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; transition: transform .15s, opacity .15s; }
.ai-send:active { transform: scale(.9); }
.ai-send:disabled { opacity: .5; }
.ai-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.75); padding: 6px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }
.chip.on { background: white; color: black; border-color: white; }
.chip:active { transform: scale(.95); }

/* ── Quick actions ── */
.q-row { display: flex; gap: 10px; margin-bottom: 14px; }
.q-btn { flex: 1; background: white; border: 1px solid var(--sep); border-radius: 16px; padding: 13px 10px; font-size: 13px; font-weight: 700; color: var(--black); cursor: pointer; transition: transform .1s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.q-btn:active { transform: scale(.97); }
.q-btn-ico { font-size: 16px; }

/* ── Section headers ── */
.sec-hdr { display: flex; justify-content: space-between; align-items: center; margin: 20px 0 12px; }
.sec-hdr h2 { font-size: 20px; font-weight: 800; letter-spacing: -.03em; }
.sec-btn { background: none; border: none; color: var(--blue); font-size: 14px; font-weight: 600; cursor: pointer; }

/* ── Calendar ── */
.cal-wrap { background: white; border-radius: 22px; border: 1px solid var(--sep); overflow: hidden; margin-bottom: 14px; }
.cal-hdr { padding: 14px 16px 10px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--sep); }
.cal-month { font-size: 16px; font-weight: 800; flex: 1; }
.cal-nav-btn { background: var(--bg); border: none; width: 30px; height: 30px; border-radius: 9px; font-size: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
.cal-nav-btn:active { background: var(--bg2); }
.cal-legend { display: grid; grid-template-columns: repeat(7,1fr); padding: 8px 12px 4px; }
.cal-leg-item { text-align: center; font-size: 10px; font-weight: 700; color: var(--muted); }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; padding: 4px 12px 12px; }
.cal-day { border-radius: 12px; padding: 7px 3px; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; transition: all .15s; min-height: 60px; justify-content: center; position: relative; }
.cal-day:active { transform: scale(.88); }
.cal-day.today { background: var(--black); color: white; }
.cal-day.has-wk { background: rgba(0,122,255,.07); outline: 1.5px solid rgba(0,122,255,.25); }
.cal-day.today.has-wk { background: var(--black); outline-color: var(--black); }
.cal-day.past { opacity: .45; }
.cal-day.empty { pointer-events: none; }
.cdn { font-size: 10px; font-weight: 700; color: var(--muted); }
.today .cdn { color: rgba(255,255,255,.55); }
.cdnum { font-size: 16px; font-weight: 800; line-height: 1; }
.cddot { width: 6px; height: 6px; border-radius: 3px; margin-top: 1px; }
.today .cddot { background: white !important; }

/* ── Program cards ── */
.prog-card { background: white; border-radius: 22px; overflow: hidden; margin-bottom: 12px; cursor: pointer; border: 1px solid var(--sep); transition: transform .12s, box-shadow .12s; }
.prog-card:active { transform: scale(.98); box-shadow: var(--shadow); }
.prog-cov { height: 160px; position: relative; display: flex; align-items: flex-end; padding: 14px; }
.prog-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.1) 55%, transparent 100%); }
.prog-info { position: relative; z-index: 1; flex: 1; }
.prog-title { color: white; font-size: 20px; font-weight: 900; letter-spacing: -.03em; line-height: 1.2; margin-bottom: 3px; }
.prog-auth { color: rgba(255,255,255,.6); font-size: 12px; font-weight: 600; }
.prog-badge { position: absolute; top: 12px; right: 12px; z-index: 1; padding: 5px 10px; border-radius: 100px; font-size: 11px; font-weight: 800; }
.b-paid { background: rgba(255,214,10,.9); color: #000; }
.b-free { background: rgba(52,199,89,.18); color: #27ae60; backdrop-filter: blur(8px); }
.b-owned { background: rgba(255,255,255,.2); color: white; backdrop-filter: blur(8px); }
.prog-body { padding: 12px 14px 14px; }
.prog-desc { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 10px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.tag { background: var(--bg); padding: 4px 9px; border-radius: 7px; font-size: 11px; font-weight: 700; color: var(--muted); }
.tag-accent { background: rgba(0,122,255,.1); color: var(--blue); }
.prog-rating { display: flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; color: var(--orange); margin-left: auto; }

/* ── Modals / sheets ── */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 400; display: flex; align-items: flex-end; animation: fIn .2s; }
@keyframes fIn { from{opacity:0} to{opacity:1} }
.sheet { background: var(--bg); width: 100%; border-radius: 28px 28px 0 0; padding: 0 0 50px; max-height: 92vh; overflow-y: auto; animation: sUp .32s cubic-bezier(.16,1,.3,1); display: flex; flex-direction: column; }
@keyframes sUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
.sheet-handle-bar { padding: 10px 0 6px; display: flex; justify-content: center; flex-shrink: 0; }
.shdl { width: 40px; height: 4px; background: var(--light); border-radius: 2px; }
.sheet-inner { padding: 0 18px; flex: 1; overflow-y: auto; }

/* Sheet cover */
.sh-cover { height: 200px; border-radius: 20px; position: relative; overflow: hidden; margin-bottom: 18px; }
.sh-cover-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 55%); }
.sh-cover-txt { position: absolute; bottom: 18px; left: 18px; right: 18px; }
.sh-cover-txt h2 { color: white; font-size: 26px; font-weight: 900; letter-spacing: -.03em; margin-bottom: 4px; }
.sh-cover-meta { color: rgba(255,255,255,.6); font-size: 13px; font-weight: 600; }
.sh-cover-badge { position: absolute; top: 14px; right: 14px; }

/* Stats row */
.stats-row { display: flex; gap: 8px; margin-bottom: 18px; }
.stat-box { flex: 1; background: white; border-radius: 14px; padding: 12px 10px; border: 1px solid var(--sep); }
.stat-lbl { font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
.stat-val { font-size: 15px; font-weight: 800; color: var(--black); }

/* Description tabs */
.desc-tabs { display: flex; gap: 0; background: var(--bg2); border-radius: 10px; padding: 2px; margin-bottom: 14px; }
.desc-tab { flex: 1; padding: 7px; border: none; background: transparent; font-size: 13px; font-weight: 600; color: var(--muted); border-radius: 8px; cursor: pointer; transition: all .15s; }
.desc-tab.on { background: white; color: var(--black); }
.desc-text { font-size: 14px; color: #3a3a3c; line-height: 1.65; margin-bottom: 18px; white-space: pre-wrap; }

/* Workout rows */
.wk-row { display: flex; align-items: center; gap: 12px; background: white; border-radius: 14px; padding: 12px 13px; margin-bottom: 8px; cursor: pointer; transition: transform .1s; border: 1px solid var(--sep); }
.wk-row:active { transform: scale(.98); }
.wk-dot { width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; }
.wk-info { flex: 1; }
.wk-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
.wk-meta { font-size: 12px; color: var(--muted); }
.wk-ico { color: var(--light); font-size: 16px; }
.wk-ico-play { color: var(--blue); font-size: 14px; font-weight: 700; }

/* Schedule actions in sheet */
.sched-actions { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.sched-btn { background: white; border: 1px solid var(--sep); border-radius: 14px; padding: 13px 15px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: transform .1s; }
.sched-btn:active { transform: scale(.98); }
.sched-btn-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.sched-btn-info { flex: 1; }
.sched-btn-lbl { font-size: 14px; font-weight: 700; }
.sched-btn-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }

/* Buy / lib buttons */
.btn-buy { width: 100%; background: var(--black); color: white; border: none; padding: 16px; border-radius: 16px; font-size: 15px; font-weight: 800; cursor: pointer; margin-top: 8px; transition: transform .1s; }
.btn-buy:active { transform: scale(.98); }
.btn-lib { width: 100%; background: var(--bg); border: none; border-radius: 14px; padding: 13px; font-size: 14px; font-weight: 600; color: var(--muted); text-align: center; margin-top: 8px; }

/* ── Player ── */
.player { background: var(--bg); min-height: 100vh; max-width: 480px; margin: 0 auto; padding-bottom: 90px; }
.player-hdr { padding: 52px 18px 24px; color: white; border-radius: 0 0 28px 28px; }
.player-back { background: rgba(255,255,255,.18); border: none; color: white; width: 38px; height: 38px; border-radius: 12px; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 16px; transition: background .15s; }
.player-back:active { background: rgba(255,255,255,.3); }
.player-badge { display: inline-block; background: rgba(255,255,255,.18); padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: .08em; margin-bottom: 9px; }
.player-title { font-size: 28px; font-weight: 900; letter-spacing: -.04em; margin-bottom: 4px; }
.player-sub { font-size: 14px; opacity: .65; font-weight: 500; margin-bottom: 14px; }
.p-bar-wrap { background: rgba(255,255,255,.18); border-radius: 4px; height: 4px; overflow: hidden; }
.p-bar-fill { height: 100%; background: white; border-radius: 4px; transition: width .4s cubic-bezier(.4,0,.2,1); }
.p-bar-txt { font-size: 12px; color: rgba(255,255,255,.55); margin-top: 5px; font-weight: 600; }
.player-body { padding: 16px; }
.ex-card { background: white; border-radius: 18px; padding: 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; border: 1px solid var(--sep); transition: opacity .25s; }
.ex-card.done { opacity: .4; }
.ex-num { font-size: 18px; font-weight: 900; color: var(--light); width: 24px; text-align: center; flex-shrink: 0; }
.ex-info { flex: 1; }
.ex-info h3 { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
.ex-info p { font-size: 12px; color: var(--muted); }
.ex-info small { font-size: 11px; color: var(--light); font-style: italic; }
.ex-chk { width: 32px; height: 32px; border-radius: 10px; border: 2px solid #e5e5ea; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; flex-shrink: 0; font-size: 14px; color: transparent; }
.ex-chk.on { background: var(--green); border-color: var(--green); color: white; }
.player-footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; padding: 12px 18px 32px; background: linear-gradient(to top, var(--bg) 65%, transparent); }
.btn-finish { width: 100%; background: var(--black); color: white; border: none; padding: 16px; border-radius: 17px; font-size: 16px; font-weight: 800; cursor: pointer; transition: transform .1s; }
.btn-finish:active { transform: scale(.98); }

/* ── Forms ── */
.form-field { margin-bottom: 14px; }
.form-lbl { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 6px; }
.form-lbl-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.form-lbl-add { color: var(--blue); font-weight: 700; cursor: pointer; font-size: 13px; text-transform: none; letter-spacing: 0; }
.form-inp { width: 100%; background: white; border: 1px solid var(--sep); border-radius: 13px; padding: 12px 13px; font-size: 14px; font-weight: 500; outline: none; color: var(--black); transition: border-color .15s; }
.form-inp:focus { border-color: var(--blue); }
.form-ta { width: 100%; background: white; border: 1px solid var(--sep); border-radius: 13px; padding: 12px 13px; font-size: 14px; font-weight: 500; outline: none; color: var(--black); resize: none; min-height: 75px; font-family: inherit; transition: border-color .15s; line-height: 1.5; }
.form-ta:focus { border-color: var(--blue); }
.form-row2 { display: flex; gap: 8px; }
.form-row2 > * { flex: 1; }

.ex-draft { background: white; border: 1px solid var(--sep); border-radius: 14px; padding: 12px; margin-bottom: 8px; }
.ex-draft-top { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.ex-draft-name { flex: 1; background: var(--bg); border: none; border-radius: 10px; padding: 9px 11px; font-size: 14px; font-weight: 600; outline: none; color: var(--black); }
.ex-draft-del { width: 30px; height: 30px; border-radius: 9px; background: rgba(255,59,48,.1); border: none; color: var(--red); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ex-draft-fields { display: flex; gap: 6px; }
.ex-draft-field { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.ex-draft-field label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.ex-draft-field input { background: var(--bg); border: none; border-radius: 9px; padding: 7px 9px; font-size: 13px; font-weight: 700; outline: none; color: var(--black); width: 100%; }

.lvl-row { display: flex; gap: 6px; }
.lvl-btn { flex: 1; padding: 10px 4px; border-radius: 11px; border: 1.5px solid var(--sep); font-weight: 700; font-size: 12px; cursor: pointer; transition: all .15s; background: white; color: var(--muted); }
.lvl-btn.on { border-color: var(--black); background: var(--black); color: white; }

.colors-row { display: flex; gap: 8px; flex-wrap: wrap; }
.color-swatch { width: 30px; height: 30px; border-radius: 15px; border: 3px solid transparent; cursor: pointer; transition: transform .15s; }
.color-swatch.on { border-color: var(--black); transform: scale(1.2); }

.covers-row { display: flex; gap: 8px; flex-wrap: wrap; }
.cover-thumb { width: 52px; height: 52px; border-radius: 12px; border: 3px solid transparent; cursor: pointer; transition: all .15s; }
.cover-thumb.on { border-color: var(--black); transform: scale(1.08); }

.tags-input-row { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 6px; }
.tag-toggle { padding: 6px 12px; border-radius: 9px; border: 1.5px solid var(--sep); font-size: 12px; font-weight: 700; cursor: pointer; background: white; color: var(--muted); transition: all .15s; }
.tag-toggle.on { background: var(--black); color: white; border-color: var(--black); }

.btn-main { width: 100%; background: var(--black); color: white; border: none; padding: 15px; border-radius: 15px; font-size: 15px; font-weight: 800; cursor: pointer; margin-top: 8px; transition: transform .1s; }
.btn-main:active { transform: scale(.98); }
.btn-danger { width: 100%; background: none; border: 1.5px solid var(--red); color: var(--red); padding: 13px; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 8px; }

/* ── Loading ── */
.ldots { display: flex; gap: 3px; align-items: center; }
.ld { width: 5px; height: 5px; border-radius: 3px; background: currentColor; animation: lb .75s infinite; }
.ld:nth-child(2){animation-delay:.12s;} .ld:nth-child(3){animation-delay:.24s;}
@keyframes lb { 0%,80%,100%{transform:scale(.5);opacity:.4} 40%{transform:scale(1);opacity:1} }

/* ── Empty state ── */
.empty { text-align: center; padding: 32px 16px; color: var(--muted); }
.empty-ico { font-size: 42px; margin-bottom: 10px; }
.empty p { font-size: 14px; font-weight: 500; line-height: 1.55; }

/* ── Create card ── */
.create-cta { background: var(--black2); border-radius: 22px; padding: 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 12px; cursor: pointer; transition: transform .1s; }
.create-cta:active { transform: scale(.98); }
.create-cta-ico { width: 46px; height: 46px; background: rgba(255,255,255,.12); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.create-cta h3 { color: white; font-size: 16px; font-weight: 800; margin-bottom: 3px; }
.create-cta p { color: rgba(255,255,255,.5); font-size: 12px; font-weight: 500; }

/* ── Animations ── */
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.au { animation: fadeUp .4s cubic-bezier(.16,1,.3,1) both; }

/* ── Inline week-days sched picker ── */
.week-sched { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.ws-row { display: flex; align-items: center; gap: 8px; background: white; border-radius: 13px; padding: 10px 12px; border: 1px solid var(--sep); }
.ws-day { font-size: 13px; font-weight: 700; width: 28px; flex-shrink: 0; }
.ws-wk { flex: 1; background: var(--bg); border: none; border-radius: 9px; padding: 7px 10px; font-size: 13px; font-weight: 600; color: var(--black); outline: none; cursor: pointer; }
.ws-clear { background: none; border: none; color: var(--light); font-size: 16px; cursor: pointer; padding: 2px 4px; }

/* ── Repeat schedule sheet ── */
.repeat-opts { display: flex; flex-direction: column; gap: 8px; }
.repeat-opt { background: white; border: 1.5px solid var(--sep); border-radius: 14px; padding: 13px 15px; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 12px; }
.repeat-opt.on { border-color: var(--blue); background: rgba(0,122,255,.05); }
.repeat-opt-ico { font-size: 20px; }
.repeat-opt-info { flex: 1; }
.repeat-opt-lbl { font-size: 14px; font-weight: 700; }
.repeat-opt-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.repeat-opt-check { width: 22px; height: 22px; border-radius: 11px; border: 2px solid var(--light); display: flex; align-items: center; justify-content: center; font-size: 12px; color: transparent; flex-shrink: 0; }
.repeat-opt.on .repeat-opt-check { background: var(--blue); border-color: var(--blue); color: white; }

/* ── Catalog section ── */
.catalog-filter { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 14px; scrollbar-width: none; }
.catalog-filter::-webkit-scrollbar { display: none; }
.cf-btn { background: white; border: 1px solid var(--sep); border-radius: 20px; padding: 7px 13px; font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer; white-space: nowrap; transition: all .15s; flex-shrink: 0; }
.cf-btn.on { background: var(--black); color: white; border-color: var(--black); }

/* ── Program workout days ── */
.prog-days-header { font-size: 15px; font-weight: 800; margin-bottom: 10px; }
.prog-day-divider { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin: 14px 0 6px; }

/* ── Remove schedule dot ── */
.cal-day-remove { position: absolute; top: 3px; right: 3px; width: 14px; height: 14px; border-radius: 7px; background: var(--red); color: white; font-size: 10px; display: none; align-items: center; justify-content: center; font-weight: 900; }
.cal-day.has-wk:active .cal-day-remove { display: flex; }
`;

// ─── Initial data ─────────────────────────────────────────────────────────────

const INIT_PROGS: Program[] = [
  {
    id: "p1",
    title: "Моя база",
    author: "Я",
    desc: "Личная программа для поддержания общей формы. Базовые упражнения с собственным весом, не требующие оборудования.",
    descAfter:
      "Тренируйся 3 раза в неделю — например пн/ср/пт. Отдых между подходами строго соблюдай. Пей воду и высыпайся.\n\nНеделя 1–2: делай всё в умеренном темпе\nНеделя 3–4: добавь подходы и повторения",
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
          {
            id: "e6",
            name: "Прыжки на месте",
            sets: "3",
            reps: "30с",
            rest: "15с",
          },
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
    desc: "Профессиональная программа на 8 недель для набора мышечной массы. 4 дня в зале, прогрессивная нагрузка, упор на базовые движения.",
    descAfter:
      "— 4 тренировки в неделю: Пн/Вт/Чт/Пт\n— 32 занятия с прогрессивной нагрузкой\n— Протокол питания: профицит ~300 ккал, 2 г белка на кг\n— Неделя 1–2: адаптация (лёгкие веса)\n— Неделя 3–6: основная нагрузка\n— Неделя 7–8: максимальная интенсивность",
    level: "Продвинутый",
    weeks: 8,
    daysPerWeek: 4,
    cover: COVERS[1],
    owned: false,
    isOwn: false,
    priceStars: 250,
    tags: ["Зал", "Масса", "Сила", "Штанга"],
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
          {
            id: "ce1",
            name: "Жим лёжа",
            sets: "4",
            reps: "6–8",
            rest: "2–3м",
            note: "Рабочий вес",
          },
          {
            id: "ce2",
            name: "Наклонный жим гантелей",
            sets: "3",
            reps: "10",
            rest: "90с",
          },
          { id: "ce3", name: "Разводка", sets: "3", reps: "12", rest: "60с" },
          {
            id: "ce4",
            name: "Отжимания на брусьях",
            sets: "3",
            reps: "12",
            rest: "60с",
          },
        ],
      },
      {
        id: "cw2",
        dayLabel: "День 2",
        title: "Спина + Бицепс",
        dur: "60 мин",
        focus: "Сила",
        color: PALETTE.indigo,
        exes: [
          {
            id: "ce5",
            name: "Становая тяга",
            sets: "4",
            reps: "5",
            rest: "3м",
            note: "Главное упражнение",
          },
          {
            id: "ce6",
            name: "Тяга верхнего блока",
            sets: "3",
            reps: "10",
            rest: "90с",
          },
          {
            id: "ce7",
            name: "Горизонтальная тяга",
            sets: "3",
            reps: "12",
            rest: "75с",
          },
          {
            id: "ce8",
            name: "Сгибания на бицепс",
            sets: "3",
            reps: "12",
            rest: "60с",
          },
        ],
      },
      {
        id: "cw3",
        dayLabel: "День 3",
        title: "Ноги + Плечи",
        dur: "70 мин",
        focus: "Масса",
        color: PALETTE.orange,
        exes: [
          {
            id: "ce9",
            name: "Приседания со штангой",
            sets: "4",
            reps: "8",
            rest: "2–3м",
          },
          {
            id: "ce10",
            name: "Жим ногами",
            sets: "3",
            reps: "12",
            rest: "90с",
          },
          {
            id: "ce11",
            name: "Армейский жим",
            sets: "3",
            reps: "10",
            rest: "90с",
          },
          {
            id: "ce12",
            name: "Тяга штанги к подбородку",
            sets: "3",
            reps: "12",
            rest: "60с",
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Yoga Flow 6W",
    author: "Maria Sun",
    desc: "Йога для начинающих. Гибкость, баланс и осознанность — всё за 6 недель занятий дома без инвентаря.",
    descAfter:
      "— Ежедневные занятия 20–40 минут\n— Включает дыхательные практики (пранаяма)\n— Расписание: 6 дней + 1 день отдыха\n— Прогресс виден уже на 2-й неделе\n— Нужны только коврик и тихое место",
    level: "Начальный",
    weeks: 6,
    daysPerWeek: 5,
    cover: COVERS[2],
    owned: false,
    isOwn: false,
    priceStars: 0,
    tags: ["Дома", "Гибкость", "Йога", "Медитация"],
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
          {
            id: "cy3",
            name: "Воин I",
            sets: "1",
            reps: "45с кажд.",
            rest: "—",
          },
          {
            id: "cy4",
            name: "Поза ребёнка",
            sets: "1",
            reps: "60с",
            rest: "—",
          },
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "HIIT Blaster",
    author: "FitClub",
    desc: "Высокоинтенсивный интервальный тренинг. Сжигай жир без зала — только коврик и желание.",
    descAfter:
      "— 3–4 тренировки в неделю по 25–35 минут\n— Протокол: 40с работа / 20с отдых\n— Пульс должен быть 75–85% от макс.\n— Разминка обязательна — 5 минут\n— Питание: дефицит 200–300 ккал",
    level: "Средний",
    weeks: 4,
    daysPerWeek: 4,
    cover: COVERS[4],
    owned: false,
    isOwn: false,
    priceStars: 150,
    tags: ["Дома", "Жиросжигание", "HIIT"],
    rating: 4.6,
    reviews: 134,
    workoutDays: [
      {
        id: "cw14",
        dayLabel: "День A",
        title: "HIIT Full Body",
        dur: "30 мин",
        focus: "Жиросжигание",
        color: PALETTE.red,
        exes: [
          { id: "ch1", name: "Берпи", sets: "5", reps: "10", rest: "20с" },
          {
            id: "ch2",
            name: "Маунтин климбер",
            sets: "5",
            reps: "20",
            rest: "20с",
          },
          {
            id: "ch3",
            name: "Прыжковые приседания",
            sets: "4",
            reps: "12",
            rest: "20с",
          },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ n }: { n: number }): React.ReactElement {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) =>
        i < Math.round(n) ? "★" : "☆",
      ).join("")}
    </span>
  );
}

function LoadingDots({
  color = "white",
}: {
  color?: string;
}): React.ReactElement {
  return (
    <div className="ldots" style={{ color }}>
      <div className="ld" />
      <div className="ld" />
      <div className="ld" />
    </div>
  );
}

interface ProgCardProps {
  prog: Program;
  delay?: number;
  badge: React.ReactNode;
  onClick: () => void;
}
function ProgCard({
  prog,
  delay = 0,
  badge,
  onClick,
}: ProgCardProps): React.ReactElement {
  return (
    <div
      className="prog-card au"
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      <div className="prog-cov" style={{ background: prog.cover }}>
        <div className="prog-ov" />
        {badge}
        <div className="prog-info">
          <div className="prog-title">{prog.title}</div>
          <div className="prog-auth">{prog.author}</div>
        </div>
      </div>
      <div className="prog-body">
        <div className="prog-desc">
          {prog.desc.slice(0, 95)}
          {prog.desc.length > 95 ? "…" : ""}
        </div>
        <div className="tags">
          <span className="tag">{prog.level}</span>
          <span className="tag">{prog.weeks} нед.</span>
          <span className="tag">{prog.daysPerWeek}×/нед.</span>
          {prog.tags.slice(0, 2).map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
          {prog.rating && (
            <span className="prog-rating" style={{ marginLeft: "auto" }}>
              ★ {prog.rating}{" "}
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                ({prog.reviews})
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FitnessPage(): React.ReactElement {
  useEffect(() => {
    if (!document.getElementById("fp-css")) {
      const s = document.createElement("style");
      s.id = "fp-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // nav
  const [tab, setTab] = useState<Tab>("personal");
  const [screen, setScreen] = useState<Screen>("main");

  // data
  const [myProgs, setMyProgs] = useState<Program[]>(INIT_PROGS);
  const [catalog, setCatalog] = useState<Program[]>(CATALOG_DATA);
  const [schedule, setSchedule] = useState<ScheduleMap>({
    [fmtDate(new Date())]: "wd1",
  });

  // calendar
  const [weekOff, setWeekOff] = useState(0);

  // player
  const [activeWk, setActiveWk] = useState<WorkoutDay | null>(null);
  const [checked, setChecked] = useState<CheckedMap>({});

  // modals
  const [selProg, setSelProg] = useState<Program | null>(null);
  const [progDescTab, setProgDescTab] = useState<"before" | "after">("before");
  const [schedDateModal, setSchedDateModal] = useState<string | null>(null);
  const [showMakeWk, setShowMakeWk] = useState(false);
  const [showMakeProg, setShowMakeProg] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState("Все");

  // AI
  const [aiQ, setAiQ] = useState("");
  const [aiGoal, setAiGoal] = useState("Похудеть");
  const [aiLoad, setAiLoad] = useState(false);

  // create workout form
  const [wkName, setWkName] = useState("");
  const [wkColor, setWkColor] = useState(PALETTE.blue);
  const [wkFocus, setWkFocus] = useState("Тонус");
  const [wkDur, setWkDur] = useState("30");
  const [wkExes, setWkExes] = useState<ExerciseDraft[]>([
    { name: "", sets: "3", reps: "10", rest: "60с", note: "" },
  ]);

  // create program form
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pDescA, setPDescA] = useState("");
  const [pLevel, setPLevel] = useState<Level>("Средний");
  const [pCover, setPCover] = useState(COVERS[0]);
  const [pPrice, setPPrice] = useState("");
  const [pWeeks, setPWeeks] = useState("4");
  const [pDays, setPDays] = useState("3");
  const [pTags, setPTags] = useState<string[]>([]);

  // ── derived
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

  // ── actions
  const openWk = useCallback((wk: WorkoutDay) => {
    setActiveWk(wk);
    setChecked({});
    setScreen("player");
    haptic("medium");
  }, []);

  const scheduleWk = (wkId: string, date: string) => {
    setSchedule((s) => ({ ...s, [date]: wkId }));
    haptic("light");
  };

  const removeFromSchedule = (date: string) => {
    setSchedule((s) => {
      const n = { ...s };
      delete n[date];
      return n;
    });
    haptic("light");
  };

  // auto-schedule: fill N weeks with program's workout days rotating
  const autoSchedule = (prog: Program, weeks: number) => {
    const wds = prog.workoutDays;
    if (!wds.length) return;
    const daysPerWeek = prog.daysPerWeek || 3;
    // Spread training days evenly across week: e.g. daysPerWeek=3 → Mon/Wed/Fri
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
    const dayOfWeek = (base.getDay() + 6) % 7; // 0=Mon
    base.setDate(base.getDate() - dayOfWeek); // start of current week

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
    haptic("heavy");
  };

  const runAI = () => {
    if (!aiQ.trim() || aiLoad) return;
    haptic("medium");
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
        title: `AI: ${aiQ.slice(0, 16)}`,
        author: "AI Тренер",
        desc: `Создано по запросу: "${aiQ}". Цель: ${aiGoal}.`,
        descAfter: `Тренируйся 3–4 раза в неделю для достижения цели: ${aiGoal}.\n\nПрограмма обновится по мере прогресса.`,
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
      haptic("heavy");
    }, 1800);
  };

  const buyProg = (prog: Program) => {
    haptic("heavy");
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
    haptic("medium");
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
    haptic("medium");
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

  // ── PLAYER ────────────────────────────────────────────────────────────────

  if (screen === "player" && activeWk) {
    const total = activeWk.exes.length;
    const done = activeWk.exes.filter((e) => checked[e.id]).length;
    return (
      <div className="player">
        <div className="player-hdr" style={{ background: activeWk.color }}>
          <button className="player-back" onClick={() => setScreen("main")}>
            ✕
          </button>
          <div className="player-badge">ТРЕНИРОВКА</div>
          <div className="player-title">{activeWk.title}</div>
          <div className="player-sub">
            {activeWk.dur} · {total} упражнений · {activeWk.focus}
          </div>
          <div className="p-bar-wrap">
            <div
              className="p-bar-fill"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <div className="p-bar-txt">
            {done} из {total} выполнено
          </div>
        </div>

        <div className="player-body">
          {activeWk.exes.map((ex, i) => (
            <div
              key={ex.id}
              className={`ex-card au ${checked[ex.id] ? "done" : ""}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="ex-num">{i + 1}</div>
              <div className="ex-info">
                <h3>{ex.name}</h3>
                <p>
                  {ex.sets} подх. × {ex.reps} · Отдых {ex.rest}
                </p>
                {ex.note && <small>{ex.note}</small>}
              </div>
              <div
                className={`ex-chk ${checked[ex.id] ? "on" : ""}`}
                onClick={() => {
                  haptic("light");
                  setChecked((p) => ({ ...p, [ex.id]: !p[ex.id] }));
                }}
              >
                {checked[ex.id] && "✓"}
              </div>
            </div>
          ))}
        </div>

        <div className="player-footer">
          <button
            className="btn-finish"
            onClick={() => {
              haptic("heavy");
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

  // ── MAIN ─────────────────────────────────────────────────────────────────

  return (
    <div className="fp">
      {/* Header */}
      <div className="fp-hdr">
        <div className="fp-title-row">
          <div className="fp-title">Тренировки</div>
          <div className="fp-streak">🔥 12 дней</div>
        </div>
        <div style={{ paddingBottom: 14 }}>
          <div className="fp-tabs">
            {(["personal", "catalog"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`fp-tab ${tab === t ? "on" : ""}`}
                onClick={() => {
                  setTab(t);
                  haptic();
                }}
              >
                {t === "personal" ? "Личные" : "Каталог"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fp-body">
        {/* ══ PERSONAL TAB ══════════════════════════════════════════════════ */}
        {tab === "personal" && (
          <>
            {/* AI */}
            <div className="ai-card au" style={{ animationDelay: ".02s" }}>
              <div className="ai-top">
                <div className="ai-dot" />
                <span className="ai-lbl">AI Тренер</span>
              </div>
              <div className="ai-row">
                <input
                  className="ai-inp"
                  placeholder="Опиши цель или тип тренировки..."
                  value={aiQ}
                  onChange={(e) => setAiQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runAI()}
                />
                <button className="ai-send" onClick={runAI} disabled={aiLoad}>
                  {aiLoad ? <LoadingDots /> : "🪄"}
                </button>
              </div>
              <div className="ai-chips">
                {GOAL_CHIPS.map((g) => (
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

            {/* Quick actions */}
            <div className="q-row au" style={{ animationDelay: ".06s" }}>
              <button
                className="q-btn"
                onClick={() => {
                  setShowMakeWk(true);
                  haptic();
                }}
              >
                <span className="q-btn-ico">＋</span> Тренировка
              </button>
              <button
                className="q-btn"
                onClick={() => {
                  setShowMakeProg(true);
                  haptic();
                }}
              >
                <span className="q-btn-ico">📋</span> Программа
              </button>
            </div>

            {/* Calendar */}
            <div className="sec-hdr au" style={{ animationDelay: ".08s" }}>
              <h2>Расписание</h2>
              {Object.keys(schedule).length > 0 && (
                <button
                  className="sec-btn"
                  onClick={() => {
                    setSchedule({});
                    haptic();
                  }}
                >
                  Очистить
                </button>
              )}
            </div>

            <div className="cal-wrap au" style={{ animationDelay: ".1s" }}>
              <div className="cal-hdr">
                <button
                  className="cal-nav-btn"
                  onClick={() => setWeekOff((v) => v - 1)}
                >
                  ‹
                </button>
                <span className="cal-month">{monthLabel}</span>
                <button
                  className="cal-nav-btn"
                  onClick={() => setWeekOff((v) => v + 1)}
                >
                  ›
                </button>
              </div>
              <div className="cal-legend">
                {DAY_SHORT.map((d) => (
                  <div key={d} className="cal-leg-item">
                    {d}
                  </div>
                ))}
              </div>
              <div className="cal-grid">
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
                      className={`cal-day ${isToday ? "today" : ""} ${wkId ? "has-wk" : ""} ${isPast ? "past" : ""}`}
                      onClick={() => {
                        haptic();
                        if (wkDay) openWk(wkDay);
                        else setSchedDateModal(ds);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (wkId) removeFromSchedule(ds);
                      }}
                    >
                      <span className="cdn">{DAY_SHORT[date.getDay()]}</span>
                      <span className="cdnum">{date.getDate()}</span>
                      {wkId && (
                        <div
                          className="cddot"
                          style={{
                            background: isToday
                              ? "white"
                              : (wkDay?.color ?? "var(--blue)"),
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                textAlign: "center",
                marginTop: -8,
                marginBottom: 14,
              }}
            >
              Нажми на день чтобы открыть · Удержи чтобы убрать тренировку
            </div>

            {/* My programs */}
            <div className="sec-hdr au" style={{ animationDelay: ".12s" }}>
              <h2>Мои программы</h2>
            </div>

            {myProgs.length === 0 ? (
              <div className="empty">
                <div className="empty-ico">🏋️</div>
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
                    <span className="prog-badge b-owned">
                      {p.workoutDays.length} тренировок
                    </span>
                  }
                  onClick={() => {
                    setSelProg(p);
                    setProgDescTab(p.owned ? "after" : "before");
                    haptic();
                  }}
                />
              ))
            )}
          </>
        )}

        {/* ══ CATALOG TAB ═══════════════════════════════════════════════════ */}
        {tab === "catalog" && (
          <>
            <div
              className="create-cta au"
              style={{ animationDelay: ".02s" }}
              onClick={() => {
                setShowMakeProg(true);
                haptic();
              }}
            >
              <div className="create-cta-ico">✦</div>
              <div>
                <h3>Создать программу</h3>
                <p>Продавай или делись бесплатно</p>
              </div>
            </div>

            {myProgs.filter((p) => p.isOwn).length > 0 && (
              <>
                <div className="sec-hdr au">
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
                          className={`prog-badge ${p.priceStars ? "b-paid" : "b-free"}`}
                        >
                          {p.priceStars ? `★ ${p.priceStars}` : "Бесплатно"}
                        </span>
                      }
                      onClick={() => {
                        setSelProg(p);
                        setProgDescTab("before");
                        haptic();
                      }}
                    />
                  ))}
              </>
            )}

            <div className="sec-hdr au">
              <h2>Каталог</h2>
            </div>
            <div className="catalog-filter au">
              {catLevels.map((l) => (
                <button
                  key={l}
                  className={`cf-btn ${catalogFilter === l ? "on" : ""}`}
                  onClick={() => {
                    setCatalogFilter(l);
                    haptic();
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
                    className={`prog-badge ${p.owned ? "b-owned" : p.priceStars ? "b-paid" : "b-free"}`}
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
                  haptic();
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* ══════════ MODALS ════════════════════════════════════════════════════ */}

      {/* ── Program detail ── */}
      {selProg && (
        <div className="overlay" onClick={() => setSelProg(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar">
              <div className="shdl" />
            </div>
            <div className="sheet-inner">
              <div className="sh-cover" style={{ background: selProg.cover }}>
                <div className="sh-cover-ov" />
                <div className="sh-cover-txt">
                  <h2>{selProg.title}</h2>
                  <div className="sh-cover-meta">
                    {selProg.author} · {selProg.level}
                  </div>
                </div>
                <div className="sh-cover-badge">
                  <span
                    className={`prog-badge ${selProg.owned ? "b-owned" : selProg.priceStars ? "b-paid" : "b-free"}`}
                  >
                    {selProg.owned
                      ? "✓ В библиотеке"
                      : selProg.priceStars
                        ? `★ ${selProg.priceStars}`
                        : "Бесплатно"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-row">
                {[
                  { l: "Уровень", v: selProg.level },
                  { l: "Длительность", v: `${selProg.weeks} нед.` },
                  { l: "Дней/нед.", v: `${selProg.daysPerWeek}×` },
                  { l: "Тренировок", v: `${selProg.workoutDays.length}` },
                ].map((s) => (
                  <div key={s.l} className="stat-box">
                    <div className="stat-lbl">{s.l}</div>
                    <div className="stat-val">{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Rating */}
              {selProg.rating && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      color: "var(--orange)",
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    <Stars n={selProg.rating} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {selProg.rating}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    {selProg.reviews} отзывов
                  </span>
                </div>
              )}

              {/* Tags */}
              <div className="tags" style={{ marginBottom: 16 }}>
                {selProg.tags.map((t) => (
                  <span key={t} className="tag tag-accent">
                    {t}
                  </span>
                ))}
              </div>

              {/* Description tabs */}
              {selProg.owned && selProg.descAfter ? (
                <>
                  <div className="desc-tabs">
                    <button
                      className={`desc-tab ${progDescTab === "before" ? "on" : ""}`}
                      onClick={() => setProgDescTab("before")}
                    >
                      О программе
                    </button>
                    <button
                      className={`desc-tab ${progDescTab === "after" ? "on" : ""}`}
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

              {/* Auto-schedule block (only if owned) */}
              {selProg.owned && (
                <>
                  <div className="prog-days-header">
                    Автозапись в расписание
                  </div>
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
                        <div
                          className="sched-btn-ico"
                          style={{ background: "var(--bg)" }}
                        >
                          {opt.ico}
                        </div>
                        <div className="sched-btn-info">
                          <div className="sched-btn-lbl">{opt.lbl}</div>
                          <div className="sched-btn-sub">{opt.sub}</div>
                        </div>
                        <span style={{ color: "var(--blue)", fontSize: 18 }}>
                          ›
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Workout days list */}
              <div className="prog-days-header">Тренировки программы</div>
              {selProg.workoutDays.map((wk) => (
                <div
                  key={wk.id}
                  className="wk-row"
                  onClick={() =>
                    selProg.owned && (setSelProg(null), openWk(wk))
                  }
                >
                  <div className="wk-dot" style={{ background: wk.color }} />
                  <div className="wk-info">
                    <div className="wk-name">
                      {wk.dayLabel} — {wk.title}
                    </div>
                    <div className="wk-meta">
                      {wk.dur} · {wk.focus} · {wk.exes.length} упражнений
                    </div>
                  </div>
                  <div className={selProg.owned ? "wk-ico-play" : "wk-ico"}>
                    {selProg.owned ? "▶" : "🔒"}
                  </div>
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
        </div>
      )}

      {/* ── Schedule date picker ── */}
      {schedDateModal && (
        <div className="overlay" onClick={() => setSchedDateModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar">
              <div className="shdl" />
            </div>
            <div className="sheet-inner">
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                Запланировать
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  marginBottom: 18,
                }}
              >
                {schedDateModal === today ? "Сегодня" : schedDateModal}
              </div>

              {allMyWkDays.length === 0 ? (
                <div className="empty">
                  <div className="empty-ico">📅</div>
                  <p>Нет тренировок для планирования</p>
                </div>
              ) : (
                allMyWkDays.map((wk) => (
                  <div
                    key={wk.id}
                    className="wk-row"
                    onClick={() => {
                      scheduleWk(wk.id, schedDateModal!);
                      setSchedDateModal(null);
                    }}
                  >
                    <div className="wk-dot" style={{ background: wk.color }} />
                    <div className="wk-info">
                      <div className="wk-name">{wk.title}</div>
                      <div className="wk-meta">
                        {wk.dur} · {wk.exes.length} упражнений
                      </div>
                    </div>
                    <div style={{ color: "var(--blue)", fontSize: 18 }}>+</div>
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

      {/* ── Create workout ── */}
      {showMakeWk && (
        <div className="overlay" onClick={() => setShowMakeWk(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar">
              <div className="shdl" />
            </div>
            <div className="sheet-inner">
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>
                Новая тренировка
              </div>

              <div className="form-field">
                <label className="form-lbl">Название</label>
                <input
                  className="form-inp"
                  placeholder="Ноги и ягодицы"
                  value={wkName}
                  onChange={(e) => setWkName(e.target.value)}
                />
              </div>

              <div className="form-row2" style={{ marginBottom: 14 }}>
                <div>
                  <label className="form-lbl">Длительность (мин)</label>
                  <input
                    className="form-inp"
                    type="number"
                    placeholder="30"
                    value={wkDur}
                    onChange={(e) => setWkDur(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-lbl">Фокус</label>
                  <input
                    className="form-inp"
                    placeholder="Сила / Кардио..."
                    value={wkFocus}
                    onChange={(e) => setWkFocus(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-lbl">Цвет</label>
                <div className="colors-row">
                  {WK_COLORS.map((c) => (
                    <div
                      key={c}
                      className={`color-swatch ${wkColor === c ? "on" : ""}`}
                      style={{ background: c }}
                      onClick={() => setWkColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-field">
                <div className="form-lbl-row">
                  <label className="form-lbl" style={{ margin: 0 }}>
                    Упражнения
                  </label>
                  <span
                    className="form-lbl-add"
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
                  <div key={i} className="ex-draft">
                    <div className="ex-draft-top">
                      <input
                        className="ex-draft-name"
                        placeholder="Название упражнения"
                        value={ex.name}
                        onChange={(e) =>
                          updateExDraft(i, "name", e.target.value)
                        }
                      />
                      {wkExes.length > 1 && (
                        <button
                          className="ex-draft-del"
                          onClick={() => removeExDraft(i)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="ex-draft-fields">
                      {(
                        ["sets", "reps", "rest"] as (keyof ExerciseDraft)[]
                      ).map((k, ki) => (
                        <div key={k} className="ex-draft-field">
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

      {/* ── Create program ── */}
      {showMakeProg && (
        <div className="overlay" onClick={() => setShowMakeProg(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar">
              <div className="shdl" />
            </div>
            <div className="sheet-inner">
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

              <div className="form-row2" style={{ marginBottom: 14 }}>
                <div>
                  <label className="form-lbl">Недель</label>
                  <input
                    className="form-inp"
                    type="number"
                    placeholder="4"
                    value={pWeeks}
                    onChange={(e) => setPWeeks(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-lbl">Дней в нед.</label>
                  <input
                    className="form-inp"
                    type="number"
                    placeholder="3"
                    value={pDays}
                    onChange={(e) => setPDays(e.target.value)}
                  />
                </div>
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
                  placeholder="Детальное расписание, советы по питанию, секреты..."
                  value={pDescA}
                  onChange={(e) => setPDescA(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-field">
                <label className="form-lbl">Цена в Stars (0 = бесплатно)</label>
                <input
                  className="form-inp"
                  type="number"
                  placeholder="0"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-lbl">Уровень</label>
                <div className="lvl-row">
                  {(["Начальный", "Средний", "Продвинутый"] as Level[]).map(
                    (l) => (
                      <button
                        key={l}
                        className={`lvl-btn ${pLevel === l ? "on" : ""}`}
                        onClick={() => setPLevel(l)}
                      >
                        {l}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="form-field">
                <label className="form-lbl">Теги</label>
                <div className="tags-input-row">
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
                      className={`tag-toggle ${pTags.includes(t) ? "on" : ""}`}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="form-lbl">Обложка</label>
                <div className="covers-row">
                  {COVERS.map((c) => (
                    <div
                      key={c}
                      className={`cover-thumb ${pCover === c ? "on" : ""}`}
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
