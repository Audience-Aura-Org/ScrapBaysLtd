import { z } from "zod";
import { QUANTITY_UNITS } from "./format";
import { MAX_QUANTITY } from "./limits";
export { MAX_QUANTITY, PHOTO_LIMITS } from "./limits";

const text = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);
const required = (label: string, max = 120) => text(max).min(1, `${label} is required`);

export const contactFields = {
  company: required("Company name", 160),
  name: required("Contact name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: text(40)
    .min(6, "Enter a phone number including country code")
    .regex(/^[+()\d\s.-]+$/, "Phone numbers may only contain digits, spaces and + ( ) - ."),
  country: required("Country", 80),
  message: text(4000).optional().default(""),
};

/** Anti-spam fields present on every form. `website` is a hidden honeypot; `startedAt` is a time trap. */
export const antiSpam = {
  website: z.string().optional().default(""),
  startedAt: z.coerce.number().optional(),
};

export const cartLine = z.object({
  slug: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().positive("Quantity must be more than 0").max(MAX_QUANTITY, `Quantities over ${MAX_QUANTITY.toLocaleString("en-GB")} need a direct enquiry`),
  unit: z.enum(QUANTITY_UNITS),
});

export const enquirySchema = z.object({
  ...contactFields,
  ...antiSpam,
  items: z.array(cartLine).min(1, "Add at least one product to your enquiry").max(50),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const orderSchema = z.object({
  ...contactFields,
  ...antiSpam,
  address: required("Billing address", 600),
  vatNumber: text(40).optional().default(""),
  paymentMethod: z.enum(["bank_transfer", "invoice"]),
  acceptTerms: z.literal(true, { error: "Please accept the conditions of use" }),
  items: z.array(cartLine).min(1, "Your cart is empty").max(50),
});
export type OrderInput = z.infer<typeof orderSchema>;

export const sellSchema = z.object({
  ...contactFields,
  ...antiSpam,
  materialType: required("Material type", 160),
  quantity: required("Estimated quantity", 80),
  location: required("Material location", 200),
});
export type SellInput = z.infer<typeof sellSchema>;

export const trackSchema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^SB[QOS]-\d{6}-[A-Z0-9]{5}$/, "References look like SBQ-261110-AB12C"),
  email: z.string().trim().toLowerCase().email("Enter the email address used for the enquiry"),
});


export type FieldErrors = Record<string, string>;
export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    // Line-item problems (e.g. items.2.quantity) are shown together above the submit button.
    const key = issue.path[0] === "items" ? "items" : issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
