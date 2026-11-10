import { fieldErrors, orderSchema } from "@/lib/validation";
import { botResponse, guard, json, persistAndNotify, priceLines } from "@/lib/server/submit";
import { getProduct } from "@/lib/content";

export const dynamic = "force-dynamic";

/** Checkout for priced products. No card processing: paid offline by bank transfer or invoice. */
export async function POST(req: Request) {
  const blocked = guard(req, "order");
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;
  const bot = botResponse(input, "order");
  if (bot) return bot;

  // Prices always come from the repo content, never from the browser.
  const { lines, errors } = priceLines(input.items);
  const unpriced = lines.filter((l) => l.unitPrice == null);
  const unavailable = input.items.filter((i) => getProduct(i.slug)?.stock === "out_of_stock");
  if (errors.length || unpriced.length || unavailable.length)
    return json(
      {
        ok: false,
        errors: {
          items: unpriced.length
            ? `These items need a quote and can't be ordered directly: ${unpriced.map((l) => l.name).join(", ")}`
            : "Some products in your cart are no longer available. Please review your cart.",
        },
      },
      422,
    );
  const currencies = new Set(lines.map((l) => l.currency));
  if (currencies.size > 1) return json({ ok: false, errors: { items: "Products priced in different currencies must be ordered separately." } }, 422);

  const subtotal = Math.round(lines.reduce((s, l) => s + (l.lineTotal || 0), 0) * 100) / 100;
  const rec = await persistAndNotify(
    {
      kind: "order",
      customer: { company: input.company, name: input.name, email: input.email, phone: input.phone, country: input.country },
      message: input.message,
      items: lines,
      totals: { currency: lines[0].currency, subtotal },
      order: { address: input.address, vatNumber: input.vatNumber, paymentMethod: input.paymentMethod },
    },
    req,
  );
  return json({ ok: true, reference: rec.reference, emailed: rec.mail?.customer === "sent" });
}
