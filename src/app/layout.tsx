import type { Metadata, Viewport } from "next";
import { getConfig } from "@/lib/config";
import { detectLang } from "@/lib/i18n-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getConfig();
  return {
    title: `${siteName} — Free disposable email`,
    description: "Free temporary email address. Receive emails instantly, protect your real inbox from spam. No sign-up, auto-deleting messages.",
    robots: { index: true, follow: true },
    openGraph: { title: siteName, description: "Free disposable email — instant, private and auto-deleting.", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e1a" },
  ],
};

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await detectLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
