import { generateLocalPart } from "@/lib/address";
import { getConfig } from "@/lib/config";
import { apiError, json, rateLimit } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/generate?domain=example.com — returns a fresh random address. */
export function GET(req: Request) {
  const limited = rateLimit(req, "generate", 30);
  if (limited) return limited;

  const { domains } = getConfig();
  const requested = new URL(req.url).searchParams.get("domain")?.toLowerCase();
  if (requested && !domains.includes(requested)) return apiError(400, "Unsupported domain");

  const domain = requested ?? domains[0];
  return json({ address: `${generateLocalPart()}@${domain}` });
}
