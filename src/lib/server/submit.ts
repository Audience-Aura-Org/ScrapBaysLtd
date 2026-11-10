import "server-only";
import { NextResponse } from "next/server";
import { getProduct } from "../content";
import { clientIp, looksLikeBot, rateLimit } from "./rate-limit";
import { newReference, saveRecord, type LineItem, type RecordKind, type StoredRecord } from "./store";
import { sendRecordEmails } from "./mail";
import { site } from "../site";

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

const WINDOW = 10 * 60 * 1000;
const tooMany = (retryAfter: number) =>
  json(
    { ok: false, error: `Too many submissions from your connection. Please try again in ${Math.max(1, Math.ceil(retryAfter / 60))} minute(s), or email us at ${site.email}.` },
    429,
    { "Retry-After": String(retryAfter) },
  );

/**
 * First guard on every form request: same-origin check plus a loose per-IP limit on all requests
 * (stops hammering). The strict limit is applied only to valid submissions — see `limitValid` —
 * so customers who fix a few typos are never locked out.
 */
export function guard(req: Request, bucket: string, looseLimit = 30) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    if (origin && host && new URL(origin).host !== host) return json({ ok: false, error: "Cross-site request blocked" }, 403);
  } catch {
    return json({ ok: false, error: "Cross-site request blocked" }, 403);
  }
  const rl = rateLimit(`${bucket}:all:${clientIp(req.headers)}`, looseLimit, WINDOW);
  return rl.ok ? null : tooMany(rl.retryAfter);
}

/** Strict limit: at most `limit` accepted submissions per IP per 10 minutes. Call after validation. */
export function limitValid(req: Request, bucket: string, limit = 5) {
  const rl = rateLimit(`${bucket}:ok:${clientIp(req.headers)}`, limit, WINDOW);
  return rl.ok ? null : tooMany(rl.retryAfter);
}

export const badRequest = () => json({ ok: false, error: "We couldn't read that request. Please refresh the page and try again." }, 400);

/** Wraps a route handler so unexpected failures return a clear JSON error (details only in server logs). */
export function safeHandler(name: string, fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e) {
      console.error(`[api:${name}]`, e);
      return json(
        { ok: false, error: `Sorry — something went wrong on our side and your request wasn't saved. Please try again in a few minutes, or email us at ${site.email}.` },
        500,
      );
    }
  };
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
