import { fieldErrors, PHOTO_LIMITS, sellSchema } from "@/lib/validation";
import { botResponse, guard, json, persistAndNotify } from "@/lib/server/submit";
import { newReference, savePhoto } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** "Scrap Material Enquiry": people offering scrap for sale, with optional photos (multipart). */
export async function POST(req: Request) {
  const blocked = guard(req, "sell");
  if (blocked) return blocked;
  const len = Number(req.headers.get("content-length") || 0);
  if (len > PHOTO_LIMITS.maxFiles * PHOTO_LIMITS.maxBytes + 200_000) return json({ ok: false, errors: { photos: "Photos are too large (max 5 MB each)." } }, 413);

  const form = await req.formData().catch(() => null);
  if (!form) return json({ ok: false, error: "Invalid form submission" }, 400);
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = sellSchema.safeParse(fields);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;
  const bot = botResponse(input, "sell");
  if (bot) return bot;

  const photos = form.getAll("photos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  if (photos.length > PHOTO_LIMITS.maxFiles) return json({ ok: false, errors: { photos: `Attach up to ${PHOTO_LIMITS.maxFiles} photos.` } }, 422);
  for (const p of photos) {
    if (!PHOTO_LIMITS.types.includes(p.type)) return json({ ok: false, errors: { photos: "Photos must be JPG, PNG, WebP or HEIC images." } }, 422);
    if (p.size > PHOTO_LIMITS.maxBytes) return json({ ok: false, errors: { photos: `"${p.name}" is larger than 5 MB.` } }, 422);
  }

  const reference = newReference("sell");
  const saved = await Promise.all(photos.map((p, i) => savePhoto(reference, i, p)));
  const rec = await persistAndNotify(
    {
      kind: "sell",
      customer: { company: input.company, name: input.name, email: input.email, phone: input.phone, country: input.country },
      message: input.message,
      sell: { materialType: input.materialType, quantity: input.quantity, location: input.location, photos: saved.map((s) => s.name) },
    },
    req,
    saved.map((s) => ({ filename: s.name, content: s.buf, contentType: s.type })),
    reference,
  );
  return json({ ok: true, reference: rec.reference, emailed: rec.mail?.customer === "sent" });
}
