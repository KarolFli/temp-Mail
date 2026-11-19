"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { MessageSummary } from "@/lib/store";
import { generateLocalPart, isValidLocalPart, parseAddress } from "@/lib/address";
import { formatRelative, hueFor, storage } from "@/lib/format";
import { useI18n } from "./I18nProvider";
import { Icon } from "./Icon";
import { MessageReader } from "./MessageReader";

const ADDRESS_KEY = "tm:address";
const POLL_MS = 15_000;

const inboxUrl = (address: string) => `/api/inbox/${encodeURIComponent(address)}`;

export function Mailbox({ domains, ttlMinutes }: { domains: string[]; ttlMinutes: number }) {
  const { t, lang } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  const [address, setAddress] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [customLocal, setCustomLocal] = useState("");
  const [customDomain, setCustomDomain] = useState(domains[0]);
  const [customError, setCustomError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Restore the saved address, or create a fresh one.
  useEffect(() => {
    const saved = parseAddress(storage.get(ADDRESS_KEY) ?? "", domains);
    setAddress(saved?.address ?? `${generateLocalPart()}@${domains[0]}`);
  }, [domains]);

  useEffect(() => {
    if (!address) return;
    storage.set(ADDRESS_KEY, address);
    try {
      setSeen(new Set(JSON.parse(storage.get(`tm:seen:${address}`) ?? "[]")));
    } catch {
      setSeen(new Set());
    }
  }, [address]);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(inboxUrl(address), { cache: "no-store" });
      if (res.ok) setMessages((await res.json()).messages);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Live updates over Server-Sent Events (auto-reconnects; we resync on every reconnect).
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setMessages([]);
    load();

    const source = new EventSource(`${inboxUrl(address)}/events`);
    let connectedBefore = false;
    source.addEventListener("ready", () => {
      setLive(true);
      if (connectedBefore) load();
      connectedBefore = true;
    });
    source.addEventListener("message", (event) => {
      const message: MessageSummary = JSON.parse((event as MessageEvent).data);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [message, ...prev]));
      showToast(`${tRef.current.toast.newMail} ${message.from.name || message.from.address}`);
    });
    source.onerror = () => setLive(false);

    return () => {
      source.close();
      setLive(false);
    };
  }, [address, load, showToast]);

  // Fallback polling while the live connection is down.
  useEffect(() => {
    if (live || !address) return;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [live, address, load]);

  // Keep relative times and expirations fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(timer);
  }, []);

  const visible = messages.filter((m) => m.expiresAt > now);
  const unread = visible.filter((m) => !seen.has(m.id)).length;

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread]);

  const markSeen = (id: string) => {
    if (!address || seen.has(id)) return;
    const next = new Set(seen).add(id);
    setSeen(next);
    storage.set(`tm:seen:${address}`, JSON.stringify([...next].slice(-200)));
  };

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const input = document.createElement("textarea");
      input.value = address;
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const newAddress = () => {
    const domain = address?.split("@")[1] ?? domains[0];
    setAddress(`${generateLocalPart()}@${domain}`);
    setEditing(false);
  };

  const startEditing = () => {
    const [local, domain] = (address ?? "").split("@");
    setCustomLocal(local ?? "");
    setCustomDomain(domains.includes(domain) ? domain : domains[0]);
    setCustomError(false);
    setEditing(true);
  };

  const submitCustom = (e: FormEvent) => {
    e.preventDefault();
    const local = customLocal.trim().toLowerCase();
    if (!isValidLocalPart(local)) return setCustomError(true);
    setAddress(`${local}@${customDomain}`);
    setEditing(false);
  };

  const removeMessage = async (id: string) => {
    if (!address) return;
    const res = await fetch(`${inboxUrl(address)}/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) return showToast(t.toast.error);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setOpenId(null);
    showToast(t.toast.deleted);
  };

  const clearInbox = async () => {
    if (!address) return;
    const res = await fetch(inboxUrl(address), { method: "DELETE" });
    if (!res.ok) return showToast(t.toast.error);
    setMessages([]);
    showToast(t.toast.cleared);
  };

  return (
    <>
      <div className="address-card">
        <span className="address-label">{t.address.label}</span>

        {editing ? (
          <form className="custom-form" onSubmit={submitCustom} noValidate>
            <div className={`address-box ${customError ? "invalid" : ""}`}>
              <input
                autoFocus
                value={customLocal}
                onChange={(e) => {
                  setCustomLocal(e.target.value);
                  setCustomError(false);
                }}
                placeholder={t.address.placeholder}
                aria-label={t.address.custom}
                aria-invalid={customError}
                maxLength={64}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
              />
              <span className="at">@</span>
              {domains.length > 1 ? (
                <select value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} aria-label="Domain">
                  {domains.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <span className="domain">{domains[0]}</span>
              )}
            </div>
            {customError && <p className="form-error">{t.address.invalid}</p>}
            <div className="address-actions">
              <button type="submit" className="btn btn-primary">
                <Icon name="check" size={16} /> {t.address.save}
              </button>
              <button type="button" className="btn btn-soft" onClick={() => setEditing(false)}>
                {t.address.cancel}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="address-box">
              <output className="address-value" aria-live="polite">
                {address ?? <span className="skeleton" />}
              </output>
              <button type="button" className={`btn btn-primary copy-btn ${copied ? "copied" : ""}`} onClick={copy} disabled={!address}>
                <Icon name={copied ? "check" : "copy"} size={16} />
                {copied ? t.address.copied : t.address.copy}
              </button>
            </div>
            <div className="address-actions">
              <button type="button" className="btn btn-soft" onClick={newAddress}>
                <Icon name="sparkles" size={16} /> {t.address.new}
              </button>
              <button type="button" className="btn btn-soft" onClick={startEditing}>
                <Icon name="pencil" size={16} /> {t.address.custom}
              </button>
            </div>
          </>
        )}
        <p className="address-hint">
          <Icon name="timer" size={14} /> {t.address.expires(ttlMinutes)}
        </p>
      </div>

      <section className="inbox" aria-labelledby="inbox-title">
        <header className="inbox-head">
          <div className="inbox-title">
            <h2 id="inbox-title">{t.inbox.title}</h2>
            {visible.length > 0 && <span className="count">{visible.length}</span>}
            <span className={`status ${live ? "is-live" : ""}`}>
              <span className="status-dot" />
              {live ? t.inbox.live : t.inbox.offline}
            </span>
          </div>
          <div className="inbox-tools">
            <button type="button" className="btn btn-ghost btn-icon" onClick={load} aria-label={t.inbox.refresh} title={t.inbox.refresh}>
              <Icon name="refresh" />
            </button>
            {visible.length > 0 && (
              <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={clearInbox}>
                <Icon name="trash" size={16} />
                <span className="hide-sm">{t.inbox.clear}</span>
              </button>
            )}
          </div>
        </header>

        {loading && visible.length === 0 ? (
          <ul className="message-list" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="message-skeleton"><span className="skeleton avatar" /><span className="skeleton line" /></li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Icon name="inbox" size={34} />
              <span className="pulse" />
            </div>
            <h3>{t.inbox.emptyTitle}</h3>
            <p>{t.inbox.emptyText}</p>
          </div>
        ) : (
          <ul className="message-list">
            {visible.map((m) => {
              const sender = m.from.name || m.from.address || t.inbox.unknownSender;
              const isUnread = !seen.has(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`message ${isUnread ? "unread" : ""}`}
                    onClick={() => {
                      markSeen(m.id);
                      setOpenId(m.id);
                    }}
                  >
                    <span className="avatar" style={{ "--hue": hueFor(m.from.address || sender) } as React.CSSProperties}>
                      {sender.charAt(0).toUpperCase()}
                    </span>
                    <span className="message-main">
                      <span className="message-top">
                        <span className="message-from">{sender}</span>
                        <time className="message-time" dateTime={new Date(m.receivedAt).toISOString()}>
                          {formatRelative(m.receivedAt, now, lang)}
                        </time>
                      </span>
                      <span className="message-subject">
                        {m.subject || t.inbox.noSubject}
                        {m.attachments > 0 && <Icon name="paperclip" size={14} className="muted" />}
                      </span>
                      {m.preview && <span className="message-preview">{m.preview}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {openId && address && (
        <MessageReader address={address} messageId={openId} onClose={() => setOpenId(null)} onDelete={removeMessage} />
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        <Icon name="mail" size={16} />
        <span>{toast}</span>
      </div>
    </>
  );
}
