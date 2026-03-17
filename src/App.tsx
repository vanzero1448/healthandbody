import { useState, useEffect } from "react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { BottomNav } from "./components/BottomNav";
import FoodPage from "./pages/FoodPage";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("food");

  // Telegram WebApp initialization
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && !tg.initDataUnsafe) return; // Only in TWA context

    tg.expand(); // Full viewport height
    tg.ready(); // Signal ready to Telegram

    // Sync Telegram theme to CSS vars
    if (tg.themeParams) {
      const root = document.documentElement;
      root.style.setProperty("--bg", tg.themeParams.bg_color || "#ffffff");
      root.style.setProperty(
        "--text-h",
        tg.themeParams.text_color || "#000000",
      );
      root.style.setProperty("--text", tg.themeParams.hint_color || "#666666");
      root.style.setProperty(
        "--border",
        tg.themeParams.accent_text_color || "#000000",
      );
      root.style.setProperty(
        "--card-bg",
        tg.themeParams.secondary_bg_color || "#f8f8f8",
      );
      root.style.setProperty(
        "--social-bg",
        tg.themeParams.secondary_bg_color || "#f3f3f3",
      );
      root.style.setProperty(
        "--accent",
        tg.themeParams.button_color || "#000000",
      );
      root.style.setProperty(
        "--track",
        tg.themeParams.section_bg_color || "rgba(0,0,0,0.1)",
      );
    }

    // Header color for Telegram
    if (tg.setHeaderColor) {
      tg.setHeaderColor(tg.headerColor);
    }
  }, []);

  return (
    <AppRoot>
      <div className="app-shell">
        {activeTab === "food" && <FoodPage />}

        {activeTab === "fitness" && (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--text)",
              marginTop: 60,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
            <p
              style={{ fontWeight: 700, fontSize: 18, color: "var(--text-h)" }}
            >
              Тренировки
            </p>
            <p style={{ fontSize: 14, marginTop: 6 }}>
              Скоро здесь появятся твои тренировки
            </p>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </AppRoot>
  );
}
