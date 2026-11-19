"use client";

import { useI18n } from "./I18nProvider";
import { Icon, type IconName } from "./Icon";
import { REPO_URL } from "./Header";

export function Features() {
  const { t } = useI18n();
  return (
    <section className="section" aria-labelledby="features-title">
      <h2 id="features-title" className="section-title">{t.features.title}</h2>
      <div className="features">
        {t.features.items.map((item) => (
          <article key={item.icon} className="feature">
            <span className="feature-icon">
              <Icon name={item.icon as IconName} size={20} />
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Faq({ ttlMinutes }: { ttlMinutes: number }) {
  const { t } = useI18n();
  return (
    <section className="section section-narrow" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title">{t.faq.title}</h2>
      <div className="faq">
        {t.faq.items(ttlMinutes).map((item) => (
          <details key={item.q} className="faq-item">
            <summary>
              {item.q}
              <Icon name="chevron" className="faq-chevron" />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Footer({ siteName }: { siteName: string }) {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>
          © {new Date().getFullYear()} {siteName}. {t.footer.license}
        </span>
        <span className="footer-links">
          <span>{t.footer.built}</span>
          <span aria-hidden="true">·</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
        </span>
      </div>
    </footer>
  );
}
