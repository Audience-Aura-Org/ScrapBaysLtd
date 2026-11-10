import { z } from "zod";
import { json } from "@/lib/server/submit";
import { loadRecord, saveRecord, STATUSES } from "@/lib/server/store";
import { sendStatusEmail } from "@/lib/server/mail";

export const dynamic = "force-dynamic";

// Protected by HTTP Basic auth in src/middleware.ts.
const schema = z.object({
  reference: z.string().regex(/^SB[QOS]-\d{6}-[A-Z0-9]{5}$/),
  status: z.enum(STATUSES),
  note: z.string().trim().max(2000).optional().default(""),
  notify: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json({ ok: false, error: "Cross-site request blocked" }, 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid update" }, 422);
  const { reference, status, note, notify } = parsed.data;
  const rec = await loadRecord(reference);
  if (!rec) return json({ ok: false, error: "Not found" }, 404);
  rec.status = status;
  rec.history.push({ status, at: new Date().toISOString(), note: note || undefined });
  await saveRecord(rec);
  let mailed = false;
  if (notify) {
    try {
      mailed = (await sendStatusEmail(rec, note)) === "sent";
    } catch (e) {
      return json({ ok: true, mailed: false, error: `Saved, but the email failed: ${(e as Error).message}` });
    }
  }
  return json({ ok: true, mailed });
}
