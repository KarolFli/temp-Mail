import { json } from "@/lib/http";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ status: "ok", uptime: Math.round(process.uptime()), ...getStore().stats() });
}
