export type TelegramHapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "soft"
  | "rigid";

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  accent_text_color?: string;
  secondary_bg_color?: string;
  button_color?: string;
  section_bg_color?: string;
}

export interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick?: (cb: () => void) => void;
}

export interface TelegramWebApp {
  initDataUnsafe?: unknown;
  themeParams?: TelegramThemeParams;
  headerColor?: string;
  setHeaderColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  showAlert?: (message: string) => void;
  expand: () => void;
  ready: () => void;
  BackButton?: TelegramBackButton;
  safeAreaInset?: { top?: number };
  contentSafeAreaInset?: { top?: number };
  onEvent?: (event: "safeAreaChanged" | "contentSafeAreaChanged", cb: () => void) => void;
  offEvent?: (event: "safeAreaChanged" | "contentSafeAreaChanged", cb: () => void) => void;
  HapticFeedback?: { impactOccurred: (style: TelegramHapticStyle) => void };
}

type TelegramWindow = Window & {
  Telegram?: { WebApp?: TelegramWebApp };
};

export const getTelegramWebApp = (): TelegramWebApp | undefined => {
  if (typeof window === "undefined") return undefined;
  return (window as TelegramWindow).Telegram?.WebApp;
};
