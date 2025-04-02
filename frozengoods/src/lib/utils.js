import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function setTheme(theme) {
  const root = window.document.documentElement;
  const isDark = theme === "dark";

  root.classList.remove(isDark ? "light" : "dark");
  root.classList.add(theme);
  
  localStorage.setItem("theme", theme);
}

export function getTheme() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("theme") || "light";
  }
  return "light";
}
