import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import nodemailer from "nodemailer";
import type { SMTPServer } from "smtp-server";
import { loadConfig } from "@/lib/config";
import { createSmtpServer } from "@/lib/smtp";
import { MailStore } from "@/lib/store";

const config = loadConfig({ DOMAINS: "example.com", MAX_MESSAGE_SIZE_MB: "1" });
const store = new MailStore({ ttlMs: 60_000, maxPerInbox: 10, maxTotal: 100 });
let server: SMTPServer;
let port: number;

const transport = () =>
  nodemailer.createTransport({ host: "127.0.0.1", port, secure: false, ignoreTLS: true });

beforeAll(async () => {
  server = createSmtpServer(config, store);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.server.address() as AddressInfo).port;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("SMTP server", () => {
  it("accepts mail for served domains and stores it", async () => {
    await transport().sendMail({
      from: '"Alice" <alice@sender.net>',
      to: "Inbox@Example.com",
      subject: "Hello",
      text: "Plain body",
      html: "<p>HTML body</p>",
      attachments: [{ filename: "notes.txt", content: "hi there" }],
    });

    const [summary] = store.list("inbox@example.com");
    expect(summary).toMatchObject({ subject: "Hello", from: { name: "Alice", address: "alice@sender.net" }, attachments: 1 });

    const full = store.get("inbox@example.com", summary.id)!;
    expect(full.html).toContain("HTML body");
    expect(full.attachments[0].content.toString()).toBe("hi there");
  });

  it("rejects recipients on other domains", async () => {
    await expect(transport().sendMail({ from: "a@sender.net", to: "x@other.com", text: "nope" })).rejects.toMatchObject({
      responseCode: 550,
    });
  });

  it("rejects messages over the size limit", async () => {
    await expect(
      transport().sendMail({ from: "a@sender.net", to: "big@example.com", text: "x".repeat(1.5 * 1024 * 1024) }),
    ).rejects.toMatchObject({ responseCode: 552 });
    expect(store.list("big@example.com")).toEqual([]);
  });
});
