// FoodPage.tsx - Исправленная версия (TypeScript errors fixed)
import { useState, useCallback, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { getTelegramWebApp } from "../telegram";
import type { TelegramHapticStyle } from "../telegram";
import "./FoodPage.css";

// ────────────────────────────────────────────────────────────────────────────
// HAPTIC FEEDBACK
// ────────────────────────────────────────────────────────────────────────────
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
    // Используем impactOccurred вместо selectionChanged
    tg.HapticFeedback.impactOccurred("light");
  } else if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};

const triggerNotificationHaptic = (type: "success" | "warning" | "error") => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    // Используем impactOccurred вместо notificationOccurred
    tg.HapticFeedback.impactOccurred(
      type === "success" ? "light" : type === "warning" ? "medium" : "heavy",
    );
  } else if (navigator.vibrate) {
    navigator.vibrate(type === "success" ? 50 : type === "warning" ? 100 : 200);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// TELEGRAM BACK BUTTON
// ────────────────────────────────────────────────────────────────────────────
const useTelegramBack = (onBack: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;
    const tg = getTelegramWebApp();
    // Добавлена проверка на undefined
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(onBack);
      return () => {
        tg.BackButton.offClick(onBack);
        tg.BackButton.hide();
      };
    }
  }, [onBack, isActive]);
};

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────
interface MacroData {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

interface MealData {
  id: string;
  name: string;
  time: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  items: string[];
}

interface CounterData {
  id: string;
  label: string;
  value: number;
  goal: number;
  unit: string;
  icon: string;
  adds: number[];
  colorVar: string;
  isCustom?: boolean;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────
const WEEK_DATES = [
  { day: "Пт", date: "13" },
  { day: "Сб", date: "14" },
  { day: "Вс", date: "15" },
  { day: "Пн", date: "16" },
  { day: "Вт", date: "17" },
];

const INITIAL_MACROS: MacroData[] = [
  { label: "Белки", value: 87, goal: 150, unit: "г", color: "#000000" },
  { label: "Жиры", value: 54, goal: 80, unit: "г", color: "#FF9500" },
  { label: "Углев.", value: 210, goal: 280, unit: "г", color: "#007AFF" },
];

const INITIAL_MEALS: MealData[] = [
  {
    id: "1",
    name: "Завтрак",
    time: "08:30",
    kcal: 520,
    protein: 25,
    carbs: 65,
    fats: 18,
    items: ["Овсянка с ягодами", "Яйцо варёное", "Кофе"],
  },
  {
    id: "2",
    name: "Обед",
    time: "13:15",
    kcal: 740,
    protein: 45,
    carbs: 85,
    fats: 22,
    items: ["Куриная грудка", "Гречка", "Салат"],
  },
  {
    id: "3",
    name: "Ужин",
    time: "19:45",
    kcal: 490,
    protein: 35,
    carbs: 25,
    fats: 14,
    items: ["Лосось на пару", "Брокколи"],
  },
  {
    id: "4",
    name: "Перекус",
    time: "--:--",
    kcal: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    items: [],
  },
];

const INITIAL_COUNTERS: CounterData[] = [
  {
    id: "water",
    label: "Вода",
    value: 1400,
    goal: 2500,
    unit: "мл",
    icon: "💧",
    adds: [250, 500],
    colorVar: "#32ADE6",
  },
  {
    id: "fiber",
    label: "Клетчатка",
    value: 18,
    goal: 30,
    unit: "г",
    icon: "🌾",
    adds: [2, 5],
    colorVar: "#34C759",
  },
  {
    id: "sodium",
    label: "Натрий",
    value: 1840,
    goal: 2300,
    unit: "мг",
    icon: "🧂",
    adds: [100, 500],
    colorVar: "#FF453A",
  },
  {
    id: "sugar",
    label: "Сахар",
    value: 32,
    goal: 50,
    unit: "г",
    icon: "🍬",
    adds: [5, 15],
    colorVar: "#FFCC00",
  },
];

const EMOJI_SUGGESTIONS = [
  "💧",
  "🌾",
  "🧂",
  "🍬",
  "🍎",
  "🥗",
  "🍗",
  "🥚",
  "🥑",
  "🍌",
  "🥕",
  "🍇",
  "🍓",
  "🥛",
  "☕",
  "🍵",
  "🥤",
  "🍯",
  "🧀",
  "🥜",
];

// ────────────────────────────────────────────────────────────────────────────
// ICONS
// ────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────
// RADIAL PROGRESS
// ────────────────────────────────────────────────────────────────────────────
interface RadialProgressProps {
  value: number;
  goal: number;
  color: string;
  strokeWidth?: number;
  size?: number;
}

function RadialProgress({
  value,
  goal,
  color,
  strokeWidth = 8,
  size = 100,
}: RadialProgressProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / goal, 1);
  const dash = pct * circ;

  return (
    <div className="radial-wrapper" style={{ width: size, height: size }}>
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
          style={{ "--dash": `${dash}`, "--circ": `${circ}` } as CSSProperties}
        />
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CALORIE RING
// ────────────────────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 260;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const dash = pct * circ;
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div className="calorie-hero-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="radial-svg calorie-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E5E5EA"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#000000"
          strokeWidth={sw}
          strokeLinecap="round"
          className="radial-bar"
          style={{ "--dash": `${dash}`, "--circ": `${circ}` } as CSSProperties}
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

// ────────────────────────────────────────────────────────────────────────────
// WHEEL PICKER
// ────────────────────────────────────────────────────────────────────────────
interface WheelPickerProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onClose: () => void;
  title?: string;
}

function WheelPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  onClose,
  title,
}: WheelPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  // Удалена неиспользуемая переменная itemHeight

  const handleScroll = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      triggerSelectionHaptic();
      const delta = e.deltaY > 0 ? step : -step;
      const newValue = Math.min(max, Math.max(min, localValue + delta));
      setLocalValue(newValue);
      onChange(newValue);
    },
    [localValue, min, max, step, onChange],
  );

  const handleIncrement = (delta: number) => {
    triggerSelectionHaptic();
    const newValue = Math.min(max, Math.max(min, localValue + delta));
    setLocalValue(newValue);
    onChange(newValue);
  };

  const items = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  const currentIndex = Math.max(0, items.indexOf(localValue));
  const visibleRange = 3;
  const startIdx = Math.max(0, currentIndex - visibleRange);
  const endIdx = Math.min(items.length, currentIndex + visibleRange + 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wheel-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wheel-picker-header">
          <button
            className="wheel-picker-btn wheel-picker-btn-cancel"
            onClick={onClose}
          >
            Отмена
          </button>
          <span className="wheel-picker-title">{title || "Выберите"}</span>
          <button
            className="wheel-picker-btn wheel-picker-btn-primary"
            onClick={onClose}
          >
            Готово
          </button>
        </div>
        <div className="wheel-picker-container" onWheel={handleScroll}>
          <div className="wheel-picker-highlight" />
          <div className="wheel-picker-items">
            {items.slice(startIdx, endIdx).map((item, idx) => {
              const absoluteIdx = startIdx + idx;
              const offset = absoluteIdx - currentIndex;
              const opacity = 1 - Math.abs(offset) * 0.3;
              const scale = 1 - Math.abs(offset) * 0.15;

              return (
                <div
                  key={item}
                  className={`wheel-picker-item ${offset === 0 ? "active" : ""}`}
                  style={{
                    opacity: Math.max(0.2, opacity),
                    transform: `scale(${Math.max(0.6, scale)})`,
                  }}
                  onClick={() => {
                    triggerSelectionHaptic();
                    setLocalValue(item);
                    onChange(item);
                  }}
                >
                  <span className="wheel-value">{item}</span>
                  {unit && <span className="wheel-unit">{unit}</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="wheel-picker-controls">
          <button
            className="wheel-control-btn"
            onClick={() => handleIncrement(-step)}
          >
            −
          </button>
          <button
            className="wheel-control-btn"
            onClick={() => handleIncrement(step)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MEAL EDIT MODAL
// ────────────────────────────────────────────────────────────────────────────
interface MealEditModalProps {
  meal: MealData;
  onClose: () => void;
  onSave: (meal: MealData) => void;
  onDelete?: (id: string) => void;
}

function MealEditModal({
  meal,
  onClose,
  onSave,
  onDelete,
}: MealEditModalProps) {
  const [name, setName] = useState(meal.name);
  const [time, setTime] = useState(meal.time);
  const [kcal, setKcal] = useState(meal.kcal);
  const [protein, setProtein] = useState(meal.protein);
  const [carbs, setCarbs] = useState(meal.carbs);
  const [fats, setFats] = useState(meal.fats);
  const [itemsText, setItemsText] = useState(meal.items.join(", "));

  const [showKcalPicker, setShowKcalPicker] = useState(false);
  const [showProteinPicker, setShowProteinPicker] = useState(false);
  const [showCarbsPicker, setShowCarbsPicker] = useState(false);
  const [showFatsPicker, setShowFatsPicker] = useState(false);

  const handleSave = () => {
    triggerNotificationHaptic("success");
    onSave({
      ...meal,
      name,
      time,
      kcal,
      protein,
      carbs,
      fats,
      items: itemsText
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
    });
    onClose();
  };

  const handleDelete = () => {
    triggerHaptic("heavy");
    if (onDelete) onDelete(meal.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-full" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-full">
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={24} />
          </button>
          <span className="modal-title-full">{meal.name}</span>
          <div className="modal-header-spacer" />
        </div>

        <div className="modal-scroll-content">
          <div className="edit-section">
            <label className="edit-label-full">Название</label>
            <input
              type="text"
              className="edit-input-full"
              value={name}
              onChange={(e) => {
                triggerHaptic("light");
                setName(e.target.value);
              }}
              placeholder="Например: Завтрак"
            />
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Время</label>
            <input
              type="time"
              className="edit-input-full"
              value={time !== "--:--" ? time : ""}
              onChange={(e) => {
                triggerHaptic("light");
                setTime(e.target.value || "--:--");
              }}
            />
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Продукты</label>
            <textarea
              className="edit-textarea-full"
              value={itemsText}
              onChange={(e) => {
                triggerHaptic("light");
                setItemsText(e.target.value);
              }}
              placeholder="Через запятую"
              rows={3}
            />
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Пищевая ценность</label>
            <div className="macros-edit-grid">
              <div
                className="macro-edit-card"
                onClick={() => {
                  triggerHaptic("medium");
                  setShowKcalPicker(true);
                }}
              >
                <span className="macro-edit-icon">🔥</span>
                <span className="macro-edit-value">{kcal}</span>
                <span className="macro-edit-unit">ккал</span>
              </div>
              <div
                className="macro-edit-card"
                onClick={() => {
                  triggerHaptic("medium");
                  setShowProteinPicker(true);
                }}
              >
                <span className="macro-edit-icon">🥩</span>
                <span className="macro-edit-value">{protein}</span>
                <span className="macro-edit-unit">г</span>
              </div>
              <div
                className="macro-edit-card"
                onClick={() => {
                  triggerHaptic("medium");
                  setShowCarbsPicker(true);
                }}
              >
                <span className="macro-edit-icon">🍞</span>
                <span className="macro-edit-value">{carbs}</span>
                <span className="macro-edit-unit">г</span>
              </div>
              <div
                className="macro-edit-card"
                onClick={() => {
                  triggerHaptic("medium");
                  setShowFatsPicker(true);
                }}
              >
                <span className="macro-edit-icon">🥑</span>
                <span className="macro-edit-value">{fats}</span>
                <span className="macro-edit-unit">г</span>
              </div>
            </div>
          </div>

          {onDelete && (
            <div className="edit-section edit-section-danger">
              <button className="btn-delete-full" onClick={handleDelete}>
                <TrashIcon size={18} />
                <span>Удалить</span>
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer-full">
          <button className="modal-btn-full modal-btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button
            className="modal-btn-full modal-btn-save"
            onClick={handleSave}
          >
            Сохранить
          </button>
        </div>
      </div>

      {showKcalPicker && (
        <WheelPicker
          value={kcal}
          onChange={setKcal}
          min={0}
          max={2000}
          step={10}
          unit="ккал"
          onClose={() => setShowKcalPicker(false)}
          title="Калории"
        />
      )}
      {showProteinPicker && (
        <WheelPicker
          value={protein}
          onChange={setProtein}
          min={0}
          max={200}
          step={1}
          unit="г"
          onClose={() => setShowProteinPicker(false)}
          title="Белки"
        />
      )}
      {showCarbsPicker && (
        <WheelPicker
          value={carbs}
          onChange={setCarbs}
          min={0}
          max={300}
          step={1}
          unit="г"
          onClose={() => setShowCarbsPicker(false)}
          title="Углеводы"
        />
      )}
      {showFatsPicker && (
        <WheelPicker
          value={fats}
          onChange={setFats}
          min={0}
          max={150}
          step={1}
          unit="г"
          onClose={() => setShowFatsPicker(false)}
          title="Жиры"
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// WEIGHT/HEIGHT EDIT MODAL
// ────────────────────────────────────────────────────────────────────────────
interface WeightEditModalProps {
  weight: number;
  height: number;
  onClose: () => void;
  onSave: (weight: number, height: number) => void;
}

function WeightEditModal({
  weight,
  height,
  onClose,
  onSave,
}: WeightEditModalProps) {
  const [localWeight, setLocalWeight] = useState(weight);
  const [localHeight, setLocalHeight] = useState(height);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);

  const bmi = (localWeight / (localHeight / 100) ** 2).toFixed(1);
  const getBmiCategory = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: "Недостаток", color: "#FF9500" };
    if (bmiVal < 25) return { label: "Норма", color: "#34C759" };
    if (bmiVal < 30) return { label: "Избыток", color: "#FF9500" };
    return { label: "Ожирение", color: "#FF3B30" };
  };
  const bmiCategory = getBmiCategory(parseFloat(bmi));

  const handleSave = () => {
    triggerNotificationHaptic("success");
    onSave(localWeight, localHeight);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-full" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-full">
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={24} />
          </button>
          <span className="modal-title-full">Параметры тела</span>
          <div className="modal-header-spacer" />
        </div>

        <div className="modal-scroll-content">
          <div className="edit-section">
            <label className="edit-label-full">Вес</label>
            <button
              className="edit-value-btn-full"
              onClick={() => {
                triggerHaptic("medium");
                setShowWeightPicker(true);
              }}
            >
              <span className="edit-value-full">{localWeight}</span>
              <span className="edit-unit-full">кг</span>
            </button>
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Рост</label>
            <button
              className="edit-value-btn-full"
              onClick={() => {
                triggerHaptic("medium");
                setShowHeightPicker(true);
              }}
            >
              <span className="edit-value-full">{localHeight}</span>
              <span className="edit-unit-full">см</span>
            </button>
          </div>

          <div className="bmi-card-full">
            <div className="bmi-header">
              <span className="bmi-label">ИМТ</span>
              <span className="bmi-value">{bmi}</span>
            </div>
            <div className="bmi-category" style={{ color: bmiCategory.color }}>
              {bmiCategory.label}
            </div>
          </div>
        </div>

        <div className="modal-footer-full">
          <button className="modal-btn-full modal-btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button
            className="modal-btn-full modal-btn-save"
            onClick={handleSave}
          >
            Сохранить
          </button>
        </div>
      </div>

      {showWeightPicker && (
        <WheelPicker
          value={Math.round(localWeight * 10)}
          onChange={(v) => setLocalWeight(v / 10)}
          min={300}
          max={2000}
          step={1}
          unit="кг"
          onClose={() => setShowWeightPicker(false)}
          title="Вес"
        />
      )}
      {showHeightPicker && (
        <WheelPicker
          value={localHeight}
          onChange={setLocalHeight}
          min={100}
          max={250}
          step={1}
          unit="см"
          onClose={() => setShowHeightPicker(false)}
          title="Рост"
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MACRO EDIT MODAL
// ────────────────────────────────────────────────────────────────────────────
interface MacroEditModalProps {
  macro: MacroData;
  onClose: () => void;
  onSave: (value: number, goal: number) => void;
}

function MacroEditModal({ macro, onClose, onSave }: MacroEditModalProps) {
  const [value, setValue] = useState(macro.value);
  const [goal, setGoal] = useState(macro.goal);
  const [showValuePicker, setShowValuePicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const handleSave = () => {
    triggerNotificationHaptic("success");
    onSave(value, goal);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-full" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-full">
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={24} />
          </button>
          <span className="modal-title-full">{macro.label}</span>
          <div className="modal-header-spacer" />
        </div>

        <div className="modal-scroll-content">
          <div className="edit-section">
            <label className="edit-label-full">Текущее</label>
            <button
              className="edit-value-btn-full"
              onClick={() => {
                triggerHaptic("medium");
                setShowValuePicker(true);
              }}
            >
              <span className="edit-value-full">{value}</span>
              <span className="edit-unit-full">{macro.unit}</span>
            </button>
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Цель</label>
            <button
              className="edit-value-btn-full"
              onClick={() => {
                triggerHaptic("medium");
                setShowGoalPicker(true);
              }}
            >
              <span className="edit-value-full">{goal}</span>
              <span className="edit-unit-full">{macro.unit}</span>
            </button>
          </div>

          <div className="macro-progress-preview">
            <RadialProgress
              value={value}
              goal={goal}
              color={macro.color}
              strokeWidth={10}
              size={100}
            />
            <div className="macro-progress-text">
              <span className="progress-percent">
                {Math.min((value / goal) * 100, 100).toFixed(0)}%
              </span>
              <span className="progress-label">выполнено</span>
            </div>
          </div>
        </div>

        <div className="modal-footer-full">
          <button className="modal-btn-full modal-btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button
            className="modal-btn-full modal-btn-save"
            onClick={handleSave}
          >
            Сохранить
          </button>
        </div>
      </div>

      {showValuePicker && (
        <WheelPicker
          value={value}
          onChange={setValue}
          min={0}
          max={500}
          step={1}
          unit={macro.unit}
          onClose={() => setShowValuePicker(false)}
          title="Текущее"
        />
      )}
      {showGoalPicker && (
        <WheelPicker
          value={goal}
          onChange={setGoal}
          min={0}
          max={500}
          step={5}
          unit={macro.unit}
          onClose={() => setShowGoalPicker(false)}
          title="Цель"
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CUSTOM COUNTER MODAL
// ────────────────────────────────────────────────────────────────────────────
interface CustomCounterModalProps {
  onClose: () => void;
  onSave: (counter: CounterData) => void;
}

function CustomCounterModal({ onClose, onSave }: CustomCounterModalProps) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("📊");
  const [goal, setGoal] = useState(100);
  const [unit, setUnit] = useState("шт");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const handleSave = () => {
    if (!label.trim()) {
      triggerNotificationHaptic("error");
      return;
    }
    triggerNotificationHaptic("success");
    onSave({
      id: `custom_${Date.now()}`,
      label: label.trim(),
      value: 0,
      goal,
      unit,
      icon: emoji,
      adds: [Math.round(goal * 0.1), Math.round(goal * 0.25)],
      colorVar: "#007AFF",
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-full" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-full">
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={24} />
          </button>
          <span className="modal-title-full">Новый трекер</span>
          <div className="modal-header-spacer" />
        </div>

        <div className="modal-scroll-content">
          <div className="edit-section">
            <label className="edit-label-full">Название</label>
            <input
              type="text"
              className="edit-input-full"
              value={label}
              onChange={(e) => {
                triggerHaptic("light");
                setLabel(e.target.value);
              }}
              placeholder="Например: Витамины"
            />
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Иконка</label>
            <div className="emoji-picker-section">
              <button
                className="emoji-preview-btn"
                onClick={() => {
                  triggerHaptic("medium");
                  setShowEmojiPicker(!showEmojiPicker);
                }}
              >
                <span className="emoji-preview">{emoji}</span>
              </button>
              {showEmojiPicker && (
                <div className="emoji-grid">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      className={`emoji-btn ${emoji === e ? "active" : ""}`}
                      onClick={() => {
                        triggerSelectionHaptic();
                        setEmoji(e);
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Единица</label>
            <input
              type="text"
              className="edit-input-full"
              value={unit}
              onChange={(e) => {
                triggerHaptic("light");
                setUnit(e.target.value);
              }}
              placeholder="г, мл, шт..."
              maxLength={5}
            />
          </div>

          <div className="edit-section">
            <label className="edit-label-full">Цель</label>
            <button
              className="edit-value-btn-full"
              onClick={() => {
                triggerHaptic("medium");
                setShowGoalPicker(true);
              }}
            >
              <span className="edit-value-full">{goal}</span>
              <span className="edit-unit-full">{unit}</span>
            </button>
          </div>

          <div className="ai-suggestion-card">
            <div className="ai-suggestion-header">
              <SparkleIcon size={16} />
              <span>AI-подсказка</span>
            </div>
            <p className="ai-suggestion-text">
              {label
                ? `Для "${label}" цель ${goal} ${unit}. AI подберёт оптимальное значение.`
                : "Введите название для рекомендаций"}
            </p>
          </div>
        </div>

        <div className="modal-footer-full">
          <button className="modal-btn-full modal-btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button
            className="modal-btn-full modal-btn-save"
            onClick={handleSave}
          >
            Создать
          </button>
        </div>
      </div>

      {showGoalPicker && (
        <WheelPicker
          value={goal}
          onChange={setGoal}
          min={1}
          max={10000}
          step={10}
          unit={unit}
          onClose={() => setShowGoalPicker(false)}
          title="Цель"
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AI CHAT PAGE
// ────────────────────────────────────────────────────────────────────────────
interface AIChatPageProps {
  onBack: () => void;
}

function AIChatPage({ onBack }: AIChatPageProps) {
  useTelegramBack(onBack, true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Привет! Я ваш AI-помощник по питанию 🤖\n\nМогу помочь с:\n• Расчётом калорий\n• Рекомендациями по рациону\n• Советами по трекерам\n• Рецептами\n\nЧто вас интересует?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes("калор"))
      return `📊 Сегодня: 1950 ккал\n🎯 Цель: 2400 ккал\n⏳ Осталось: 450 ккал\n\nРекомендую лёгкий ужин!`;
    if (lowerMsg.includes("белок"))
      return `🥩 Съедено: 87г\n🎯 Цель: 150г\n⚠️ Недобор: 63г\n\nДобавьте творог или протеин!`;
    if (lowerMsg.includes("вод"))
      return `💧 Сейчас: 1400мл\n🎯 Цель: 2500мл\n\nВыпейте стакан воды!`;
    if (lowerMsg.includes("рецепт"))
      return `🍽️ Быстрый рецепт (450 ккал):\n• Курица 150г\n• Рис 100г\n• Овощи 200г\n\nБ: 42г | У: 45г | Ж: 12г`;
    return `Понял! 🤔 Уточните вопрос — я помогу с питанием, рецептами или трекерами!`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    triggerHaptic("light");
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setTimeout(
      () => {
        triggerNotificationHaptic("success");
        const aiMsg: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: generateAIResponse(input),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      },
      1000 + Math.random() * 500,
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-chat-page">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack}>
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="chat-title-wrapper">
          <span className="chat-title">AI-Ассистент</span>
          <span className="chat-subtitle">Питание и здоровье</span>
        </div>
        <div className="chat-avatar-premium">
          <span>🤖</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
          >
            <div className="message-bubble">
              <p className="message-content">{msg.content}</p>
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message assistant">
            <div className="message-bubble typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => {
            triggerHaptic("light");
            setInput(e.target.value);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Спросите о питании..."
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN FOOD PAGE
// ────────────────────────────────────────────────────────────────────────────
interface FoodPageProps {
  onOpenProfile?: () => void;
}

export default function FoodPage({ onOpenProfile }: FoodPageProps) {
  const [activeDate, setActiveDate] = useState("17");
  const [counters, setCounters] = useState<CounterData[]>(INITIAL_COUNTERS);
  const [macros, setMacros] = useState<MacroData[]>(INITIAL_MACROS);
  const [meals, setMeals] = useState<MealData[]>(INITIAL_MEALS);
  const [weight, setWeight] = useState(76.4);
  const [height, setHeight] = useState(182);

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [showCustomCounterModal, setShowCustomCounterModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [selectedMacro, setSelectedMacro] = useState<MacroData | null>(null);

  const totalKcal = meals.reduce((sum, m) => sum + m.kcal, 0);
  const kcalGoal = 2400;

  const updateCounter = (id: string, delta: number) => {
    const counter = counters.find((c) => c.id === id);
    triggerHaptic(counter?.id === "water" ? "medium" : "light");
    setCounters((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, value: Math.max(0, c.value + delta) } : c,
      ),
    );
  };

  const handleDateClick = (date: string) => {
    triggerHaptic("soft");
    setActiveDate(date);
  };
  const handleMealEdit = (meal: MealData) => {
    setSelectedMeal(meal);
    triggerHaptic("medium");
    setShowMealModal(true);
  };
  const handleMacroEdit = (macro: MacroData) => {
    setSelectedMacro(macro);
    triggerHaptic("medium");
    setShowMacroModal(true);
  };
  const handleWeightSave = (newWeight: number, newHeight: number) => {
    setWeight(newWeight);
    setHeight(newHeight);
  };
  const handleMealSave = (meal: MealData) => {
    setMeals((prev) => prev.map((m) => (m.id === meal.id ? meal : m)));
  };
  const handleMealDelete = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };
  const handleMacroSave = (value: number, goal: number) => {
    if (selectedMacro)
      setMacros((prev) =>
        prev.map((m) =>
          m.label === selectedMacro.label ? { ...m, value, goal } : m,
        ),
      );
  };
  const handleCustomCounterSave = (counter: CounterData) => {
    setCounters((prev) => [...prev, counter]);
  };

  useTelegramBack(() => setShowAIChat(false), showAIChat);

  if (showAIChat) return <AIChatPage onBack={() => setShowAIChat(false)} />;

  return (
    <div className="food-page">
      {/* TOP NAV */}
      <div className="top-nav animate-in" style={{ "--i": 0 } as CSSProperties}>
        <div className="streak-badge">🔥 12 дней</div>
        <div
          className="food-avatar"
          role="button"
          onClick={() => {
            triggerHaptic("light");
            onOpenProfile?.();
          }}
          style={{ cursor: onOpenProfile ? "pointer" : "default" }}
        />
      </div>

      {/* DATES */}
      <div
        className="dates-grid animate-in"
        style={{ "--i": 1 } as CSSProperties}
      >
        {WEEK_DATES.map((d, i) => (
          <div
            key={i}
            className={`date-item ${d.date === activeDate ? "active" : ""}`}
            onClick={() => handleDateClick(d.date)}
          >
            <span className="date-day">{d.day}</span>
            <span className="date-num">{d.date}</span>
          </div>
        ))}
      </div>

      {/* HERO */}
      <div
        className="hero-section animate-in"
        style={{ "--i": 2 } as CSSProperties}
      >
        <CalorieRing consumed={totalKcal} goal={kcalGoal} />
      </div>

      {/* MACROS */}
      <div
        className="section-header animate-in"
        style={{ "--i": 3 } as CSSProperties}
      >
        <span>КБЖУ</span>
        <button
          className="btn-icon-only"
          onClick={() => triggerHaptic("light")}
        >
          <EditIcon />
        </button>
      </div>

      <div
        className="macros-row animate-in"
        style={{ "--i": 4 } as CSSProperties}
      >
        {macros.map((m) => (
          <div
            className="macro-item card"
            key={m.label}
            onClick={() => handleMacroEdit(m)}
          >
            <div className="macro-ring-box">
              <RadialProgress
                value={m.value}
                goal={m.goal}
                color={m.color}
                strokeWidth={9}
                size={56}
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

      {/* HEALTH */}
      <div
        className="health-grid animate-in"
        style={{ "--i": 5 } as CSSProperties}
      >
        <div
          className="card health-card"
          onClick={() => {
            triggerHaptic("medium");
            setShowWeightModal(true);
          }}
        >
          <div className="health-header">
            <span className="health-title">Вес</span>
            <EditIcon size={18} />
          </div>
          <div className="health-val-group">
            <span className="health-val">
              {weight}
              <span className="health-unit">кг</span>
            </span>
            <span className="health-height">Рост {height} см</span>
          </div>
          <span className="health-sub health-sub-down">↓ 0.2 кг</span>
        </div>
        <div
          className="card health-card ai-action-card"
          onClick={() => {
            triggerHaptic("medium");
            setShowAIChat(true);
          }}
        >
          <div className="health-header">
            <span className="health-title">AI-Ассистент</span>
            <span className="ai-sparkle">✨</span>
          </div>
          <div className="health-val-group">
            <span className="health-val ai-ask-text">Чат</span>
          </div>
          <span className="health-sub">Рецепты и советы</span>
        </div>
      </div>

      {/* MEALS */}
      <div
        className="section-header animate-in"
        style={{ "--i": 6 } as CSSProperties}
      >
        <span>Приёмы пищи</span>
        <button className="btn-add-meal" onClick={() => triggerHaptic("light")}>
          <PlusIcon size={20} />
        </button>
      </div>

      <div
        className="meals-list animate-in"
        style={{ "--i": 7 } as CSSProperties}
      >
        {meals.map((meal) => (
          <div className="meal-item card" key={meal.id}>
            <div className="meal-info">
              <div className="meal-name">{meal.name}</div>
              {meal.items.length > 0 ? (
                <div className="meal-items">{meal.items.join(", ")}</div>
              ) : (
                <div className="meal-empty">Ещё не добавлено</div>
              )}
              <div className="meal-macros-mini">
                <span className="macro-mini">🥩 {meal.protein}г</span>
                <span className="macro-mini">🍞 {meal.carbs}г</span>
                <span className="macro-mini">🥑 {meal.fats}г</span>
              </div>
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
                onClick={() => handleMealEdit(meal)}
              >
                <EditIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* COUNTERS */}
      <div
        className="section-header animate-in"
        style={{ "--i": 8 } as CSSProperties}
      >
        <span>Трекинг</span>
        <span className="section-sub-header">{counters.length} из 10</span>
      </div>

      <div
        className="counter-grid animate-in"
        style={{ "--i": 9 } as CSSProperties}
      >
        {counters.map((c) => {
          const fillPct = Math.min((c.value / c.goal) * 100, 100);
          const isWater = c.id === "water";
          return (
            <div className={`counter-item card counter-${c.id}`} key={c.id}>
              {isWater ? (
                <div
                  className={`tracker-fill fill-${c.id}`}
                  style={{ height: `${fillPct}%` }}
                />
              ) : (
                <div
                  className={`tracker-fill-static fill-${c.id}`}
                  style={{ height: `${fillPct}%` }}
                />
              )}
              <div className="counter-top">
                <span className="counter-icon">{c.icon}</span>
                <span className="counter-label">{c.label}</span>
              </div>
              <div className="counter-main">
                <span className="counter-value">{c.value}</span>
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
        <button
          className="add-counter-card"
          onClick={() => {
            triggerHaptic("medium");
            setShowCustomCounterModal(true);
          }}
        >
          <div className="add-counter-icon">
            <PlusIcon size={28} />
          </div>
          <div className="add-counter-text">
            Добавить
            <br />
            трекер
          </div>
        </button>
      </div>

      {/* MODALS */}
      {showWeightModal && (
        <WeightEditModal
          weight={weight}
          height={height}
          onClose={() => setShowWeightModal(false)}
          onSave={handleWeightSave}
        />
      )}
      {showMealModal && selectedMeal && (
        <MealEditModal
          meal={selectedMeal}
          onClose={() => setShowMealModal(false)}
          onSave={handleMealSave}
          onDelete={handleMealDelete}
        />
      )}
      {showMacroModal && selectedMacro && (
        <MacroEditModal
          macro={selectedMacro}
          onClose={() => setShowMacroModal(false)}
          onSave={handleMacroSave}
        />
      )}
      {showCustomCounterModal && (
        <CustomCounterModal
          onClose={() => setShowCustomCounterModal(false)}
          onSave={handleCustomCounterSave}
        />
      )}
    </div>
  );
}
