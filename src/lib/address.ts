/**
 * Email address helpers. Pure and isomorphic — safe to import from both
 * server code and client components.
 */
const LOCAL_PART_RE = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

const ADJECTIVES = [
  "amber", "bold", "brave", "bright", "calm", "clever", "cosmic", "crisp", "dusty", "eager",
  "fancy", "fuzzy", "gentle", "golden", "happy", "hidden", "icy", "jolly", "keen", "lucky",
  "lunar", "mellow", "misty", "neon", "noble", "polar", "quick", "quiet", "rapid", "rusty",
  "shiny", "silent", "silver", "sleepy", "sunny", "swift", "tiny", "velvet", "witty", "zesty",
];

const NOUNS = [
  "badger", "beacon", "breeze", "canyon", "comet", "coral", "falcon", "fern", "fox", "galaxy",
  "harbor", "heron", "island", "koala", "lagoon", "lynx", "maple", "meadow", "meteor", "moose",
  "nebula", "orbit", "otter", "panda", "pebble", "pixel", "puffin", "raven", "river", "rocket",
  "sparrow", "summit", "tiger", "tundra", "valley", "walrus", "willow", "yeti", "zebra", "zephyr",
];

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] % max;
}

/** Generates a friendly but hard-to-guess local part, e.g. `swift-otter-k3x9`. */
export function generateLocalPart(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `${ADJECTIVES[randomInt(ADJECTIVES.length)]}-${NOUNS[randomInt(NOUNS.length)]}-${suffix}`;
}

export function isValidLocalPart(local: string): boolean {
  return LOCAL_PART_RE.test(local) && !local.includes("..");
}

export interface ParsedAddress {
  local: string;
  domain: string;
  address: string;
}

/** Normalizes and validates an address. Returns `null` when it is invalid or the domain is not served. */
export function parseAddress(input: string, domains: readonly string[]): ParsedAddress | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  if (value.length > 254) return null;

  const at = value.lastIndexOf("@");
  if (at <= 0) return null;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domains.includes(domain) || !isValidLocalPart(local)) return null;

  return { local, domain, address: `${local}@${domain}` };
}
