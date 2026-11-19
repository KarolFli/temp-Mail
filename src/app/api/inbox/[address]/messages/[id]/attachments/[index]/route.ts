import { apiError, rateLimit, resolveInbox } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ address: string; id: string; index: string }> };

/** GET /api/inbox/:address/messages/:id/attachments/:index — always served as a download. */
export async function GET(req: Request, { params }: Ctx) {
  const limited = rateLimit(req, "api", 240);
  if (limited) return limited;

  const { address, id, index } = await params;
  const inbox = resolveInbox(address);
  if (inbox instanceof Response) return inbox;

  const attachment = getStore().get(inbox.address, id)?.attachments[Number(index)];
  if (!attachment) return apiError(404, "Attachment not found");

  const filename = attachment.filename.replace(/[\r\n"\\]/g, "_");
  return new Response(new Uint8Array(attachment.content), {
    headers: {
      // Served as an opaque download so untrusted content can never render on our origin.
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(attachment.content.length),
      "Cache-Control": "no-store",
    },
  });
}
