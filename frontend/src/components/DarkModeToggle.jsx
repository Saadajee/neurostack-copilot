// frontend/src/components/DarkModeToggle.jsx
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  const applyTheme = () => {
    const email = localStorage.getItem("email");
    let dark = false;

    if (email) {
      const saved = localStorage.getItem(`darkmode_${email}`);
      dark = saved === "true";
    } else {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme();

    const handler = () => setTimeout(applyTheme, 0);
    window.addEventListener("storage", handler);

    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggle = () => {
    const email = localStorage.getItem("email");
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    if (email) {
      localStorage.setItem(`darkmode_${email}`, String(newDark));
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-3 rounded-full bg-gray-800/80 dark:bg-white/10 backdrop-blur border border-white/20 hover:scale-110 transition-all duration-200"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-400" />
      )}
    </button>
  );
}