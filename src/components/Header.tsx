"use client";

import { useI18n } from "./I18nProvider";
import { Icon } from "./Icon";

export const REPO_URL = "https://github.com/KarolFli/temp-Mail";

export function Header({ siteName }: { siteName: string }) {
  const { lang, setLang, t } = useI18n();

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a href="/" className="brand" aria-label={siteName}>
          <span className="brand-mark">
            <Icon name="mail" size={18} />
          </span>
          <span className="brand-name">{siteName}</span>
        </a>

        <nav className="topbar-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setLang(lang === "pl" ? "en" : "pl")}
            aria-label={t.nav.lang}
            title={t.nav.lang}
          >
            <Icon name="globe" size={16} />
            {lang.toUpperCase()}
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={toggleTheme} aria-label={t.nav.theme} title={t.nav.theme}>
            <Icon name="sun" className="icon-sun" />
            <Icon name="moon" className="icon-moon" />
          </button>
          <a className="btn btn-ghost btn-icon" href={REPO_URL} target="_blank" rel="noreferrer" aria-label={t.nav.github} title={t.nav.github}>
            <Icon name="github" />
          </a>
        </nav>
      </div>
    </header>
  );
}
