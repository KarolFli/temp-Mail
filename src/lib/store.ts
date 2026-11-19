import { EventEmitter } from "node:events";
import { randomBytes } from "node:crypto";
import { getConfig } from "./config";

export interface MailAddress {
  name: string;
  address: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface NewMessage {
  from: MailAddress;
  to: string;
  subject: string;
  date: string | null;
  text: string;
  html: string | null;
  attachments: Attachment[];
  size: number;
}

export interface StoredMessage extends NewMessage {
  id: string;
  inbox: string;
  receivedAt: number;
  expiresAt: number;
}

export interface MessageSummary {
  id: string;
  from: MailAddress;
  subject: string;
  preview: string;
  receivedAt: number;
  expiresAt: number;
  attachments: number;
  size: number;
}

export interface MessageDetail extends Omit<MessageSummary, "attachments"> {
  to: string;
  date: string | null;
  text: string;
  html: string | null;
  attachments: { index: number; filename: string; contentType: string; size: number }[];
}

export interface StoreOptions {
  ttlMs: number;
  maxPerInbox: number;
  maxTotal: number;
  now?: () => number;
}

export function toSummary(m: StoredMessage): MessageSummary {
  return {
    id: m.id,
    from: m.from,
    subject: m.subject,
    preview: m.text.replace(/\s+/g, " ").trim().slice(0, 160),
    receivedAt: m.receivedAt,
    expiresAt: m.expiresAt,
    attachments: m.attachments.length,
    size: m.size,
  };
}

export function toDetail(m: StoredMessage): MessageDetail {
  return {
    ...toSummary(m),
    to: m.to,
    date: m.date,
    text: m.text,
    html: m.html,
    attachments: m.attachments.map((a, index) => ({
      index,
      filename: a.filename,
      contentType: a.contentType,
      size: a.size,
    })),
  };
}

/**
 * In-memory, self-expiring mail store. Nothing is ever written to disk.
 *
 * Emits `message:<address>` with a {@link MessageSummary} whenever mail arrives.
 */
export class MailStore extends EventEmitter {
  private readonly inboxes = new Map<string, StoredMessage[]>();
  /** Global insertion order (id → inbox) used to evict the oldest message when full. */
  private readonly order = new Map<string, string>();
  private readonly now: () => number;

  constructor(private readonly options: StoreOptions) {
    super();
    this.setMaxListeners(0);
    this.now = options.now ?? Date.now;
  }

  add(inbox: string, message: NewMessage): StoredMessage {
    const receivedAt = this.now();
    const stored: StoredMessage = {
      ...message,
      id: randomBytes(9).toString("base64url"),
      inbox,
      receivedAt,
      expiresAt: receivedAt + this.options.ttlMs,
    };

    const list = this.inboxes.get(inbox) ?? [];
    list.push(stored);
    this.inboxes.set(inbox, list);
    this.order.set(stored.id, inbox);

    while (list.length > this.options.maxPerInbox) this.remove(inbox, list[0].id);
    while (this.order.size > this.options.maxTotal) {
      const [oldestId, oldestInbox] = this.order.entries().next().value!;
      this.remove(oldestInbox, oldestId);
    }

    this.emit(`message:${inbox}`, toSummary(stored));
    return stored;
  }

  list(inbox: string): MessageSummary[] {
    const now = this.now();
    return (this.inboxes.get(inbox) ?? [])
      .filter((m) => m.expiresAt > now)
      .map(toSummary)
      .reverse();
  }

  get(inbox: string, id: string): StoredMessage | null {
    const message = this.inboxes.get(inbox)?.find((m) => m.id === id);
    return message && message.expiresAt > this.now() ? message : null;
  }

  remove(inbox: string, id: string): boolean {
    const list = this.inboxes.get(inbox);
    if (!list) return false;
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.order.delete(id);
    if (list.length === 0) this.inboxes.delete(inbox);
    return true;
  }

  clear(inbox: string): number {
    const list = this.inboxes.get(inbox) ?? [];
    for (const m of list) this.order.delete(m.id);
    this.inboxes.delete(inbox);
    return list.length;
  }

  purgeExpired(): number {
    const now = this.now();
    let removed = 0;
    for (const [inbox, list] of this.inboxes) {
      for (const m of list.filter((x) => x.expiresAt <= now)) {
        this.remove(inbox, m.id);
        removed++;
      }
    }
    return removed;
  }

  stats() {
    return { inboxes: this.inboxes.size, messages: this.order.size };
  }
}

// Next.js bundles route handlers and instrumentation separately, so the store
// must live on globalThis to be shared by the SMTP server and the API.
const globalForStore = globalThis as typeof globalThis & { __tempMailStore?: MailStore };

export function getStore(): MailStore {
  if (!globalForStore.__tempMailStore) {
    const config = getConfig();
    const store = new MailStore({
      ttlMs: config.messageTtlMs,
      maxPerInbox: config.maxMessagesPerInbox,
      maxTotal: config.maxTotalMessages,
    });
    setInterval(() => store.purgeExpired(), 60_000).unref();
    globalForStore.__tempMailStore = store;
  }
  return globalForStore.__tempMailStore;
}
