"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Dictionary, type Lang } from "@/lib/i18n";

interface I18nValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ lang, t: dictionaries[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
