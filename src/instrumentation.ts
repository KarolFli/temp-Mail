/**
 * Runs once when the Next.js server boots. Starts the built-in SMTP server
 * in the same process, so it shares the in-memory store with the API routes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSmtpServer } = await import("./lib/smtp");
    startSmtpServer();
  }
}
