export const LANGS = ["en", "pl"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

const en = {
  nav: { github: "Star on GitHub", theme: "Toggle theme", lang: "Change language" },
  hero: {
    badge: "Free · No sign-up · Auto-deleting",
    title1: "Disposable email,",
    title2: "ready in a second.",
    lead: "Keep your real inbox free of spam, newsletters and data leaks. Use this address anywhere — emails show up here instantly.",
  },
  address: {
    label: "Your temporary address",
    copy: "Copy",
    copied: "Copied!",
    new: "New address",
    custom: "Custom name",
    cancel: "Cancel",
    save: "Use address",
    placeholder: "your-name",
    invalid: "Use 1–64 characters: letters, digits, dots, dashes or underscores.",
    expires: (min: number) => `Messages are deleted automatically after ${min} minutes.`,
  },
  inbox: {
    title: "Inbox",
    live: "Live",
    offline: "Reconnecting…",
    refresh: "Refresh",
    clear: "Clear inbox",
    emptyTitle: "Waiting for incoming emails…",
    emptyText: "New messages appear here automatically — no need to refresh.",
    noSubject: "(no subject)",
    unknownSender: "Unknown sender",
  },
  reader: {
    from: "From",
    to: "To",
    date: "Date",
    attachments: "Attachments",
    delete: "Delete",
    close: "Close",
    html: "HTML",
    text: "Text",
    loading: "Loading message…",
    imagesBlocked: "Remote images are blocked to protect your privacy.",
    showImages: "Load images",
    emptyBody: "This message has no content.",
  },
  toast: {
    newMail: "New email from",
    deleted: "Message deleted",
    cleared: "Inbox cleared",
    error: "Something went wrong. Please try again.",
  },
  features: {
    title: "Why use a temporary inbox?",
    items: [
      { icon: "bolt", title: "Real-time delivery", text: "Emails are streamed to your browser the moment they arrive. No refreshing." },
      { icon: "shield", title: "Private by design", text: "No accounts, no tracking. Remote images are blocked until you allow them." },
      { icon: "timer", title: "Self-destructing", text: "Every message is wiped automatically and never written to disk." },
      { icon: "code", title: "Open source", text: "Self-host it on your own domain in minutes with Docker." },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: (ttl: number) => [
      { q: "What is a temporary email?", a: "A short-lived address you can use to sign up for services, download files or test forms without exposing your personal inbox." },
      { q: "How long are messages kept?", a: `Every message is deleted automatically ${ttl} minutes after it arrives. Your address stays in this browser until you generate a new one.` },
      { q: "Can I send emails?", a: "No — the service is receive-only. That keeps it simple and prevents abuse." },
      { q: "Is it safe to use for anything?", a: "Anyone who knows an address can read its inbox. Never use it for banking, important accounts or password resets you need to keep." },
    ],
  },
  footer: { license: "Open source under the MIT license.", built: "Built with Next.js" },
};

export type Dictionary = typeof en;

const pl: Dictionary = {
  nav: { github: "Gwiazdka na GitHub", theme: "Zmień motyw", lang: "Zmień język" },
  hero: {
    badge: "Za darmo · Bez rejestracji · Samousuwanie",
    title1: "Tymczasowy e-mail,",
    title2: "gotowy w sekundę.",
    lead: "Chroń swoją prawdziwą skrzynkę przed spamem, newsletterami i wyciekami danych. Użyj tego adresu gdziekolwiek — wiadomości pojawią się tutaj od razu.",
  },
  address: {
    label: "Twój tymczasowy adres",
    copy: "Kopiuj",
    copied: "Skopiowano!",
    new: "Nowy adres",
    custom: "Własna nazwa",
    cancel: "Anuluj",
    save: "Użyj adresu",
    placeholder: "twoja-nazwa",
    invalid: "Użyj 1–64 znaków: liter, cyfr, kropek, myślników lub podkreśleń.",
    expires: (min: number) => `Wiadomości są automatycznie usuwane po ${min} minutach.`,
  },
  inbox: {
    title: "Skrzynka odbiorcza",
    live: "Na żywo",
    offline: "Łączenie ponownie…",
    refresh: "Odśwież",
    clear: "Wyczyść skrzynkę",
    emptyTitle: "Czekamy na wiadomości…",
    emptyText: "Nowe wiadomości pojawią się tutaj automatycznie — nie musisz odświeżać.",
    noSubject: "(brak tematu)",
    unknownSender: "Nieznany nadawca",
  },
  reader: {
    from: "Od",
    to: "Do",
    date: "Data",
    attachments: "Załączniki",
    delete: "Usuń",
    close: "Zamknij",
    html: "HTML",
    text: "Tekst",
    loading: "Wczytywanie wiadomości…",
    imagesBlocked: "Zewnętrzne obrazy są zablokowane, aby chronić Twoją prywatność.",
    showImages: "Pokaż obrazy",
    emptyBody: "Ta wiadomość nie ma treści.",
  },
  toast: {
    newMail: "Nowa wiadomość od",
    deleted: "Wiadomość usunięta",
    cleared: "Skrzynka wyczyszczona",
    error: "Coś poszło nie tak. Spróbuj ponownie.",
  },
  features: {
    title: "Dlaczego tymczasowa skrzynka?",
    items: [
      { icon: "bolt", title: "Dostarczanie na żywo", text: "Wiadomości trafiają do przeglądarki w chwili, gdy dotrą. Bez odświeżania." },
      { icon: "shield", title: "Prywatność od podstaw", text: "Bez kont i śledzenia. Zewnętrzne obrazy są blokowane, dopóki na nie nie pozwolisz." },
      { icon: "timer", title: "Samousuwanie", text: "Każda wiadomość jest automatycznie kasowana i nigdy nie trafia na dysk." },
      { icon: "code", title: "Open source", text: "Postaw własną instancję na swojej domenie w kilka minut dzięki Dockerowi." },
    ],
  },
  faq: {
    title: "Najczęstsze pytania",
    items: (ttl: number) => [
      { q: "Czym jest tymczasowy e-mail?", a: "To krótkotrwały adres, którego możesz użyć do rejestracji, pobierania plików czy testowania formularzy bez ujawniania swojej prywatnej skrzynki." },
      { q: "Jak długo przechowywane są wiadomości?", a: `Każda wiadomość jest usuwana automatycznie ${ttl} minut po dotarciu. Twój adres zostaje w tej przeglądarce, dopóki nie wygenerujesz nowego.` },
      { q: "Czy mogę wysyłać wiadomości?", a: "Nie — usługa służy wyłącznie do odbierania. Dzięki temu jest prosta i odporna na nadużycia." },
      { q: "Czy mogę jej używać do wszystkiego?", a: "Każdy, kto zna adres, może przeczytać skrzynkę. Nigdy nie używaj go do bankowości, ważnych kont ani resetowania haseł, których potrzebujesz." },
    ],
  },
  footer: { license: "Open source na licencji MIT.", built: "Zbudowane w Next.js" },
};

export const dictionaries: Record<Lang, Dictionary> = { en, pl };

/** Picks the best language from an `Accept-Language` header. */
export function langFromHeader(header: string | null | undefined): Lang {
  for (const part of (header ?? "").split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "en";
}
