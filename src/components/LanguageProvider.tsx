"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  dictionaryFor,
  en,
  LANGUAGE_STORAGE_KEY,
  type Dictionary,
  type Language,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: en,
});
const serverLanguage = (): Language => "en";

// Each provider owns its store: preferences never leak between SSR requests.
function createLanguageStore() {
  let language: Language = "en";
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => language,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    set: (next: Language) => {
      if (language === next) return;
      language = next;
      listeners.forEach((listener) => listener());
    },
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createLanguageStore);
  const language = useSyncExternalStore(store.subscribe, store.getSnapshot, serverLanguage);

  useLayoutEffect(() => {
    let saved: Language = "en";
    try {
      if (localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ru") saved = "ru";
    } catch {
      // Storage can be blocked by browser settings.
    }
    store.set(saved);
    document.documentElement.lang = saved;
  }, [store]);

  const setLanguage = useCallback((next: Language) => {
    store.set(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Switching still works without persistence.
    }
  }, [store]);

  const value = useMemo(
    () => ({ language, setLanguage, t: dictionaryFor(language) }),
    [language, setLanguage],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
