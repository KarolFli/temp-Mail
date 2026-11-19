import { getPublicConfig } from "@/lib/config";
import { detectLang } from "@/lib/i18n-server";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { I18nProvider } from "@/components/I18nProvider";
import { Mailbox } from "@/components/Mailbox";
import { Faq, Features, Footer } from "@/components/Sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = getPublicConfig();
  const lang = await detectLang();

  return (
    <I18nProvider initialLang={lang}>
      <div className="backdrop" aria-hidden="true" />
      <Header siteName={config.siteName} />
      <main className="container">
        <Hero />
        <Mailbox domains={config.domains} ttlMinutes={config.ttlMinutes} />
        <Features />
        <Faq ttlMinutes={config.ttlMinutes} />
      </main>
      <Footer siteName={config.siteName} />
    </I18nProvider>
  );
}
