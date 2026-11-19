"use client";

import { useI18n } from "./I18nProvider";

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="hero">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        {t.hero.badge}
      </span>
      <h1>
        {t.hero.title1} <span className="gradient-text">{t.hero.title2}</span>
      </h1>
      <p className="lead">{t.hero.lead}</p>
    </section>
  );
}
