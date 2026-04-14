import { useEffect, useState } from "react";

function readStoredValue(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored == null) return defaultValue;
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => readStoredValue(key, defaultValue));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (e.g., private mode quota).
    }
  }, [key, value]);

  return [value, setValue];
}
