import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/theme.css";
import "./index.css";
import App from "./App.tsx";

const applyInitialTheme = () => {
  const defaultTheme = "dark";

  try {
    const stored = window.localStorage.getItem("finqz-pro-storage");
    if (!stored) {
      document.documentElement.classList.add(defaultTheme);
      return;
    }

    const parsed: unknown = JSON.parse(stored);
    const persistedTheme =
      typeof parsed === "object" &&
      parsed !== null &&
      "state" in parsed &&
      typeof parsed.state === "object" &&
      parsed.state !== null &&
      "theme" in parsed.state &&
      (parsed.state.theme === "dark" || parsed.state.theme === "light")
        ? parsed.state.theme
        : defaultTheme;

    document.documentElement.classList.toggle("dark", persistedTheme === "dark");
  } catch {
    document.documentElement.classList.add(defaultTheme);
  }
};

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
