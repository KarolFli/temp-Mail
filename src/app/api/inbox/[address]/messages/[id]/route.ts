import { apiError, json, rateLimit, resolveInbox } from "@/lib/http";
import { getStore, toDetail } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ address: string; id: string }> };

/** GET /api/inbox/:address/messages/:id — full message (text, HTML, attachment metadata). */
export async function GET(req: Request, { params }: Ctx) {
  const limited = rateLimit(req, "api", 240);
  if (limited) return limited;

  const { address, id } = await params;
  const inbox = resolveInbox(address);
  if (inbox instanceof Response) return inbox;

  const message = getStore().get(inbox.address, id);
  return message ? json(toDetail(message)) : apiError(404, "Message not found");
}

/** DELETE /api/inbox/:address/messages/:id */
export async function DELETE(req: Request, { params }: Ctx) {
  const limited = rateLimit(req, "api", 240);
  if (limited) return limited;

  const { address, id } = await params;
  const inbox = resolveInbox(address);
  if (inbox instanceof Response) return inbox;

  return getStore().remove(inbox.address, id) ? json({ deleted: 1 }) : apiError(404, "Message not found");
}
