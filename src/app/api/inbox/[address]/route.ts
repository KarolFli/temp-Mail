import { json, rateLimit, resolveInbox } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ address: string }> };

/** GET /api/inbox/:address — list message summaries, newest first. */
export async function GET(req: Request, { params }: Ctx) {
  const limited = rateLimit(req, "api", 240);
  if (limited) return limited;

  const inbox = resolveInbox((await params).address);
  if (inbox instanceof Response) return inbox;

  return json({ address: inbox.address, messages: getStore().list(inbox.address) });
}

/** DELETE /api/inbox/:address — remove every message in the inbox. */
export async function DELETE(req: Request, { params }: Ctx) {
  const limited = rateLimit(req, "api", 240);
  if (limited) return limited;

  const inbox = resolveInbox((await params).address);
  if (inbox instanceof Response) return inbox;

  return json({ deleted: getStore().clear(inbox.address) });
}
