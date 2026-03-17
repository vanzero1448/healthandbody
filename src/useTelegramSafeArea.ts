import { useEffect } from "react";

/**
 * Читает safe area insets из Telegram WebApp API
 * и записывает их в CSS-переменные на :root.
 *
 * Использование: вызови хук один раз в корне приложения (App.tsx).
 *
 * Поддерживаемые переменные:
 *   --tg-safe-area-inset-top      — отступ под статус-баром Telegram
 *   --tg-content-safe-area-inset-top — отступ под кнопками (Close, Back и т.д.)
 *
 * CSS уже использует эти переменные через:
 *   padding-top: max(var(--tg-content-safe-area-inset-top, 0px), ...)
 */
export function useTelegramSafeArea() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const root = document.documentElement;

    function applyInsets() {
      // Telegram >= 7.7: safeAreaInset объект
      const safeArea = tg?.safeAreaInset;
      const contentSafeArea = tg?.contentSafeAreaInset;

      const safeTop = safeArea?.top ?? 0;
      const contentTop = contentSafeArea?.top ?? 0;

      root.style.setProperty("--tg-safe-area-inset-top", `${safeTop}px`);
      root.style.setProperty(
        "--tg-content-safe-area-inset-top",
        `${contentTop}px`,
      );
    }

    applyInsets();

    // Пересчитываем при изменении (разворот, полноэкранный режим)
    tg?.onEvent?.("safeAreaChanged", applyInsets);
    tg?.onEvent?.("contentSafeAreaChanged", applyInsets);

    return () => {
      tg?.offEvent?.("safeAreaChanged", applyInsets);
      tg?.offEvent?.("contentSafeAreaChanged", applyInsets);
    };
  }, []);
}
