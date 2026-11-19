import { getConfig } from "@/lib/config";
import { apiError, rateLimit, resolveInbox } from "@/lib/http";
import { getStore, type MessageSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

const globalForSse = globalThis as typeof globalThis & { __tempMailSse?: { open: number } };
const sse = (globalForSse.__tempMailSse ??= { open: 0 });

/**
 * GET /api/inbox/:address/events — Server-Sent Events stream.
 * Emits `ready` on connect and `message` (a MessageSummary) for every new email.
 */
export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const limited = rateLimit(req, "events", 30);
  if (limited) return limited;

  const inbox = resolveInbox((await params).address);
  if (inbox instanceof Response) return inbox;
  if (sse.open >= getConfig().maxSseConnections) return apiError(503, "Too many open connections");

  const store = getStore();
  const encoder = new TextEncoder();
  const eventName = `message:${inbox.address}`;
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sse.open++;
      let closed = false;

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const onMessage = (summary: MessageSummary) =>
        send(`event: message\ndata: ${JSON.stringify(summary)}\n\n`);
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        sse.open--;
        clearInterval(heartbeat);
        store.off(eventName, onMessage);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      store.on(eventName, onMessage);
      req.signal.addEventListener("abort", () => cleanup());
      send("retry: 5000\n\nevent: ready\ndata: {}\n\n");
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
