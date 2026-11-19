/**
 * Runtime configuration, read from environment variables (server-side only).
 * See `.env.example` for documentation of every option.
 */
export interface AppConfig {
  siteName: string;
  domains: string[];
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    hostname: string;
    tlsKeyPath: string | null;
    tlsCertPath: string | null;
  };
  messageTtlMs: number;
  maxMessagesPerInbox: number;
  maxTotalMessages: number;
  maxMessageSize: number;
  maxSseConnections: number;
}

type Env = Record<string, string | undefined>;

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function loadConfig(env: Env = process.env): AppConfig {
  const domains = (env.DOMAINS ?? "localhost")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return {
    siteName: env.SITE_NAME?.trim() || "TempMail",
    domains: domains.length > 0 ? domains : ["localhost"],
    smtp: {
      enabled: bool(env.SMTP_ENABLED, true),
      host: env.SMTP_HOST || "0.0.0.0",
      port: int(env.SMTP_PORT, 2525),
      hostname: env.SMTP_HOSTNAME || domains[0] || "localhost",
      tlsKeyPath: env.SMTP_TLS_KEY || null,
      tlsCertPath: env.SMTP_TLS_CERT || null,
    },
    messageTtlMs: int(env.MESSAGE_TTL_MINUTES, 60) * 60_000,
    maxMessagesPerInbox: int(env.MAX_MESSAGES_PER_INBOX, 50),
    maxTotalMessages: int(env.MAX_TOTAL_MESSAGES, 5000),
    maxMessageSize: int(env.MAX_MESSAGE_SIZE_MB, 10) * 1024 * 1024,
    maxSseConnections: int(env.MAX_SSE_CONNECTIONS, 1000),
  };
}

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  cached ??= loadConfig();
  return cached;
}

/** The subset of configuration that is safe to expose to the browser. */
export interface PublicConfig {
  siteName: string;
  domains: string[];
  ttlMinutes: number;
  maxMessageSizeMb: number;
}

export function getPublicConfig(config: AppConfig = getConfig()): PublicConfig {
  return {
    siteName: config.siteName,
    domains: config.domains,
    ttlMinutes: Math.round(config.messageTtlMs / 60_000),
    maxMessageSizeMb: Math.round(config.maxMessageSize / 1024 / 1024),
  };
}
