import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@telegram-apps/telegram-ui/dist/styles.css"; // Стили UI компонентов ТГ

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
