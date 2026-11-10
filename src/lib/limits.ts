/** Upload limits for the Scrap Material Enquiry photos (shared by client and server). */
export const PHOTO_LIMITS = { maxFiles: 5, maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] };

/** Largest quantity accepted per product line (any unit). Bigger volumes: contact the trading team. */
export const MAX_QUANTITY = 1_000_000;
