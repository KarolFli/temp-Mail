import { describe, expect, it, vi } from "vitest";
import { MailStore, type NewMessage } from "@/lib/store";

const msg = (subject: string): NewMessage => ({
  from: { name: "Sender", address: "sender@example.net" },
  to: "box@example.com",
  subject,
  date: null,
  text: `Body of ${subject}`,
  html: null,
  attachments: [],
  size: 100,
});

function createStore(overrides: Partial<ConstructorParameters<typeof MailStore>[0]> = {}) {
  let now = 1_000_000;
  const store = new MailStore({ ttlMs: 60_000, maxPerInbox: 3, maxTotal: 5, now: () => now, ...overrides });
  return { store, advance: (ms: number) => (now += ms) };
}

describe("MailStore", () => {
  it("lists messages newest first and emits an event", () => {
    const { store, advance } = createStore();
    const listener = vi.fn();
    store.on("message:box@example.com", listener);

    store.add("box@example.com", msg("first"));
    advance(1);
    store.add("box@example.com", msg("second"));

    expect(store.list("box@example.com").map((m) => m.subject)).toEqual(["second", "first"]);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toMatchObject({ subject: "second", preview: "Body of second" });
  });

  it("caps messages per inbox", () => {
    const { store } = createStore();
    for (const s of ["a", "b", "c", "d"]) store.add("box@example.com", msg(s));
    expect(store.list("box@example.com").map((m) => m.subject)).toEqual(["d", "c", "b"]);
  });

  it("evicts the globally oldest message when full", () => {
    const { store } = createStore();
    store.add("one@example.com", msg("oldest"));
    for (let i = 0; i < 5; i++) store.add(`n${i}@example.com`, msg(`m${i}`));
    expect(store.list("one@example.com")).toEqual([]);
    expect(store.stats()).toEqual({ inboxes: 5, messages: 5 });
  });

  it("expires messages after the TTL", () => {
    const { store, advance } = createStore();
    const { id } = store.add("box@example.com", msg("temp"));
    advance(59_999);
    expect(store.get("box@example.com", id)).not.toBeNull();
    advance(1);
    expect(store.get("box@example.com", id)).toBeNull();
    expect(store.list("box@example.com")).toEqual([]);
    expect(store.purgeExpired()).toBe(1);
    expect(store.stats().messages).toBe(0);
  });

  it("removes single messages and clears inboxes", () => {
    const { store } = createStore();
    const { id } = store.add("box@example.com", msg("a"));
    store.add("box@example.com", msg("b"));
    expect(store.remove("box@example.com", id)).toBe(true);
    expect(store.remove("box@example.com", id)).toBe(false);
    expect(store.clear("box@example.com")).toBe(1);
    expect(store.stats()).toEqual({ inboxes: 0, messages: 0 });
  });
});
