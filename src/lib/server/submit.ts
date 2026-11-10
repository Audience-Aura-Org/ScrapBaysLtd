import "server-only";
import { NextResponse } from "next/server";
import { getProduct } from "../content";
import { clientIp, looksLikeBot, rateLimit } from "./rate-limit";
import { newReference, saveRecord, type LineItem, type RecordKind, type StoredRecord } from "./store";
import { sendRecordEmails } from "./mail";

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Shared guard: same-origin check, rate limit, body size. Returns a response to short-circuit, or null. */
export function guard(req: Request, bucket: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return json({ ok: false, error: "Cross-site request blocked" }, 403);
  const ip = clientIp(req.headers);
  const rl = rateLimit(`${bucket}:${ip}`, limit, windowMs);
  if (!rl.ok)
    return json({ ok: false, error: `Too many submissions. Please try again in ${Math.ceil(rl.retryAfter / 60)} minute(s), or email us directly.` }, 429, { "Retry-After": String(rl.retryAfter) });
  return null;
}

/** Bots get a plausible success response but nothing is stored or sent. */
export function botResponse(input: { website?: string; startedAt?: number }, kind: RecordKind) {
  return looksLikeBot(input) ? json({ ok: true, reference: newReference(kind) }) : null;
}

export function priceLines(items: { slug: string; quantity: number; unit: string }[]) {
  const lines: LineItem[] = [];
  const errors: string[] = [];
  for (const it of items) {
    const p = getProduct(it.slug);
    if (!p) {
      errors.push(`Unknown product: ${it.slug}`);
      continue;
    }
    const priced = p.price != null && it.unit === p.unit;
    lines.push({
      slug: p.slug,
      name: p.name,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: priced ? p.price : null,
      currency: p.currency,
      lineTotal: priced ? Math.round(p.price! * it.quantity * 100) / 100 : null,
    });
  }
  return { lines, errors };
}

export async function persistAndNotify(
  rec: Omit<StoredRecord, "reference" | "createdAt" | "status" | "history" | "mail">,
  req: Request,
  attachments?: Parameters<typeof sendRecordEmails>[1],
  reference = newReference(rec.kind),
) {
  const now = new Date().toISOString();
  const full: StoredRecord = {
    ...rec,
    reference,
    createdAt: now,
    status: "received",
    history: [{ status: "received", at: now }],
    meta: { ip: clientIp(req.headers), userAgent: req.headers.get("user-agent")?.slice(0, 200) || undefined },
  };
  await saveRecord(full);
  full.mail = await sendRecordEmails(full, attachments);
  await saveRecord(full);
  return full;
}
