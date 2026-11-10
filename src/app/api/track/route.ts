import { fieldErrors, trackSchema } from "@/lib/validation";
import { guard, json } from "@/lib/server/submit";
import { loadRecord, STATUS_LABEL } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = guard(req, "track", 20, 10 * 60 * 1000);
  if (blocked) return blocked;
  const parsed = trackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const rec = await loadRecord(parsed.data.reference);
  // Same response for "no such reference" and "wrong email" so references can't be probed.
  if (!rec || rec.customer.email.toLowerCase() !== parsed.data.email)
    return json({ ok: false, error: "We couldn't find an order or enquiry with that reference and email address." }, 404);
  return json({
    ok: true,
    record: {
      reference: rec.reference,
      kind: rec.kind,
      createdAt: rec.createdAt,
      status: rec.status,
      statusLabel: STATUS_LABEL[rec.status],
      history: rec.history.map((h) => ({ ...h, label: STATUS_LABEL[h.status] })),
      items: rec.items?.map(({ name, quantity, unit, lineTotal, currency }) => ({ name, quantity, unit, lineTotal, currency })),
      totals: rec.totals,
      sell: rec.sell ? { materialType: rec.sell.materialType, quantity: rec.sell.quantity } : undefined,
    },
  });
}
