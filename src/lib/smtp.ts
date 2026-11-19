import { readFileSync } from "node:fs";
import { SMTPServer, type SMTPServerOptions } from "smtp-server";
import { simpleParser } from "mailparser";
import { parseAddress } from "./address";
import { getConfig, type AppConfig } from "./config";
import { getStore, type MailStore, type NewMessage } from "./store";

const MAX_RECIPIENTS = 20;

function smtpError(code: number, message: string): Error {
  return Object.assign(new Error(message), { responseCode: code });
}

/** Creates a receive-only SMTP server that accepts mail for the configured domains. */
export function createSmtpServer(config: AppConfig, store: MailStore): SMTPServer {
  const tls: Partial<SMTPServerOptions> =
    config.smtp.tlsKeyPath && config.smtp.tlsCertPath
      ? { key: readFileSync(config.smtp.tlsKeyPath), cert: readFileSync(config.smtp.tlsCertPath) }
      : {};

  return new SMTPServer({
    ...tls,
    name: config.smtp.hostname,
    banner: `${config.siteName} ESMTP — receive only`,
    size: config.maxMessageSize,
    authOptional: true,
    disabledCommands: ["AUTH"],
    logger: false,

    onRcptTo(address, session, callback) {
      if (session.envelope.rcptTo.length >= MAX_RECIPIENTS) {
        return callback(smtpError(452, "Too many recipients"));
      }
      if (!parseAddress(address.address, config.domains)) {
        return callback(smtpError(550, "Mailbox unavailable"));
      }
      callback();
    },

    onData(stream, session, callback) {
      simpleParser(stream)
        .then((parsed) => {
          if ((stream as typeof stream & { sizeExceeded?: boolean }).sizeExceeded) {
            return callback(smtpError(552, "Message exceeds the maximum size"));
          }

          const sender = parsed.from?.value[0];
          const message: NewMessage = {
            from: {
              name: sender?.name ?? "",
              address: sender?.address ?? (session.envelope.mailFrom || undefined)?.address ?? "",
            },
            to: Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(", ") : (parsed.to?.text ?? ""),
            subject: parsed.subject ?? "",
            date: parsed.date?.toISOString() ?? null,
            text: parsed.text ?? "",
            html: parsed.html || null,
            attachments: parsed.attachments
              .filter((a) => !a.related)
              .map((a) => ({
                filename: a.filename || "attachment",
                contentType: a.contentType || "application/octet-stream",
                size: a.size,
                content: a.content,
              })),
            size: stream.byteLength,
          };

          for (const rcpt of session.envelope.rcptTo) {
            const parsedRcpt = parseAddress(rcpt.address, config.domains);
            if (parsedRcpt) store.add(parsedRcpt.address, message);
          }
          callback();
        })
        .catch((err: unknown) => {
          console.error("[smtp] failed to parse message:", err);
          callback(smtpError(451, "Temporary failure, please retry"));
        });
    },
  });
}

const globalForSmtp = globalThis as typeof globalThis & { __tempMailSmtp?: SMTPServer };

/** Starts the SMTP server once per process (called from `instrumentation.ts`). */
export function startSmtpServer(): void {
  const config = getConfig();
  if (!config.smtp.enabled || globalForSmtp.__tempMailSmtp) return;

  const server = createSmtpServer(config, getStore());
  server.on("error", (err) => console.error("[smtp] error:", err.message));
  server.listen(config.smtp.port, config.smtp.host, () => {
    console.log(
      `[smtp] listening on ${config.smtp.host}:${config.smtp.port} for @${config.domains.join(", @")}`,
    );
  });
  globalForSmtp.__tempMailSmtp = server;

  if (config.domains.includes("localhost")) {
    console.warn("[smtp] DOMAINS is not set — only accepting mail for @localhost.");
  }
}
