"use client";

import { useEffect, useRef, useState } from "react";
import type { MessageDetail } from "@/lib/store";
import { formatDate, formatSize, hueFor } from "@/lib/format";
import { useI18n } from "./I18nProvider";
import { Icon } from "./Icon";

interface Props {
  address: string;
  messageId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}

/**
 * Builds the document for the sandboxed iframe. The iframe has no
 * `allow-scripts` / `allow-same-origin`, and an extra CSP blocks every
 * network request except (optionally) images.
 */
function buildSrcDoc(html: string, allowImages: boolean): string {
  const csp = [
    "default-src 'none'",
    `img-src data: ${allowImages ? "https:" : ""}`,
    "style-src 'unsafe-inline'",
    `font-src data: ${allowImages ? "https:" : ""}`,
  ].join("; ");

  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>html,body{margin:0;background:#fff;color:#111}body{padding:20px;font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}a{color:#4f3fe0}</style></head><body>${html}</body></html>`;
}

export function MessageReader({ address, messageId, onClose, onDelete }: Props) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<"html" | "text">("html");
  const [allowImages, setAllowImages] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setMessage(null);
    setFailed(false);
    setAllowImages(false);

    fetch(`/api/inbox/${encodeURIComponent(address)}/messages/${encodeURIComponent(messageId)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: MessageDetail) => {
        setMessage(data);
        setView(data.html ? "html" : "text");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setFailed(true);
      });

    return () => controller.abort();
  }, [address, messageId]);

  const base = `/api/inbox/${encodeURIComponent(address)}/messages/${encodeURIComponent(messageId)}`;
  const senderLabel = message?.from.name || message?.from.address || t.inbox.unknownSender;
  const hasRemoteImages = !!message?.html && /<img[^>]+src=["']?https?:/i.test(message.html);

  return (
    <dialog
      ref={dialogRef}
      className="reader"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      aria-label={message?.subject || t.inbox.noSubject}
    >
      <div className="reader-inner">
        <header className="reader-head">
          <h2 className="reader-subject">{message ? message.subject || t.inbox.noSubject : t.reader.loading}</h2>
          <div className="reader-tools">
            <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => onDelete(messageId)} disabled={!message}>
              <Icon name="trash" size={16} />
              <span className="hide-sm">{t.reader.delete}</span>
            </button>
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => dialogRef.current?.close()} aria-label={t.reader.close}>
              <Icon name="close" />
            </button>
          </div>
        </header>

        {failed && <p className="reader-status">{t.toast.error}</p>}
        {!message && !failed && <div className="reader-status"><span className="spinner" /> {t.reader.loading}</div>}

        {message && (
          <>
            <div className="reader-meta">
              <span className="avatar avatar-lg" style={{ "--hue": hueFor(message.from.address || senderLabel) } as React.CSSProperties}>
                {senderLabel.charAt(0).toUpperCase()}
              </span>
              <dl>
                <div>
                  <dt>{t.reader.from}</dt>
                  <dd>
                    <strong>{senderLabel}</strong>
                    {message.from.name && message.from.address && <span className="muted"> &lt;{message.from.address}&gt;</span>}
                  </dd>
                </div>
                <div>
                  <dt>{t.reader.to}</dt>
                  <dd className="muted">{message.to || address}</dd>
                </div>
                <div>
                  <dt>{t.reader.date}</dt>
                  <dd className="muted">{formatDate(message.date ?? message.receivedAt, lang)}</dd>
                </div>
              </dl>
            </div>

            {message.attachments.length > 0 && (
              <div className="attachments">
                <span className="attachments-label">
                  <Icon name="paperclip" size={15} /> {t.reader.attachments}
                </span>
                {message.attachments.map((a) => (
                  <a key={a.index} className="chip" href={`${base}/attachments/${a.index}`} download={a.filename}>
                    <Icon name="download" size={14} />
                    <span className="chip-name">{a.filename}</span>
                    <span className="muted">{formatSize(a.size)}</span>
                  </a>
                ))}
              </div>
            )}

            {(message.html || hasRemoteImages) && (
              <div className="reader-bar">
                {message.html && message.text ? (
                  <div className="segmented" role="tablist">
                    {(["html", "text"] as const).map((v) => (
                      <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
                        {t.reader[v]}
                      </button>
                    ))}
                  </div>
                ) : <span />}
                {view === "html" && hasRemoteImages && !allowImages && (
                  <button type="button" className="images-note" onClick={() => setAllowImages(true)}>
                    <Icon name="image" size={15} />
                    <span>{t.reader.imagesBlocked}</span>
                    <strong>{t.reader.showImages}</strong>
                  </button>
                )}
              </div>
            )}

            <div className="reader-body">
              {view === "html" && message.html ? (
                <iframe
                  key={String(allowImages)}
                  title={message.subject || t.inbox.noSubject}
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer"
                  srcDoc={buildSrcDoc(message.html, allowImages)}
                />
              ) : message.text.trim() ? (
                <pre className="mail-text">{message.text}</pre>
              ) : (
                <p className="reader-status">{t.reader.emptyBody}</p>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
