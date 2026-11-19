import { getPublicConfig } from "@/lib/config";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export function GET() {
  return json(getPublicConfig());
}
