import { cookies, headers } from "next/headers";
import { isLang, langFromHeader, type Lang } from "./i18n";

export async function detectLang(): Promise<Lang> {
  const fromCookie = (await cookies()).get("lang")?.value;
  if (isLang(fromCookie)) return fromCookie;
  return langFromHeader((await headers()).get("accept-language"));
}
