import { enquirySchema, fieldErrors } from "@/lib/validation";
import { botResponse, guard, json, persistAndNotify, priceLines } from "@/lib/server/submit";

export const dynamic = "force-dynamic";

/** Quote cart: one enquiry covering any number of products. */
export async function POST(req: Request) {
  const blocked = guard(req, "enquiry");
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;
  const bot = botResponse(input, "quote");
  if (bot) return bot;

  const { lines, errors } = priceLines(input.items);
  if (errors.length || !lines.length) return json({ ok: false, errors: { items: "Some products in your enquiry are no longer available. Please refresh your cart." } }, 422);

  const rec = await persistAndNotify(
    {
      kind: "quote",
      customer: { company: input.company, name: input.name, email: input.email, phone: input.phone, country: input.country },
      message: input.message,
      items: lines,
      totals: null,
    },
    req,
  );
  return json({ ok: true, reference: rec.reference, emailed: rec.mail?.customer === "sent" });
}
