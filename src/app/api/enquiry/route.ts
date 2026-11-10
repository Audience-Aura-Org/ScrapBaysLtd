import { enquirySchema, fieldErrors } from "@/lib/validation";
import { badRequest, botResponse, guard, json, limitValid, persistAndNotify, priceLines, safeHandler } from "@/lib/server/submit";

export const dynamic = "force-dynamic";

/** Quote cart: one enquiry covering any number of products. */
export const POST = safeHandler("enquiry", async (req) => {
  const blocked = guard(req, "enquiry");
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest();
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;
  const bot = botResponse(input, "quote");
  if (bot) return bot;
  const limited = limitValid(req, "enquiry");
  if (limited) return limited;

  const { lines, errors } = priceLines(input.items);
  if (errors.length || !lines.length) return json({ ok: false, errors: { items: "Some products in your enquiry are no longer available. Please refresh your quote list." } }, 422);

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
});
