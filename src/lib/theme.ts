import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark";

const STORAGE_KEY = "mo-heng-theme";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

function noopStorage(): Storage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#161513" : "#eeeae3");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage() : localStorage,
      ),
      partialize: (state) => ({ theme: state.theme }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var theme="light";if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.state&&parsed.state.theme==="dark")theme="dark";}var root=document.documentElement;root.classList.toggle("dark",theme==="dark");root.setAttribute("data-theme",theme);}catch(e){}})();`;
