import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Orders/enquiries are stored as one JSON file each under STORAGE_DIR.
 * On Hostinger, point STORAGE_DIR at a folder OUTSIDE the deployed app directory
 * (e.g. /home/<user>/scrapbay-storage) so redeploys don't wipe it.
 */
export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));
const RECORDS = path.join(STORAGE_DIR, "records");

export type RecordKind = "quote" | "order" | "sell";
export const STATUSES = [
  "received",
  "in_review",
  "quoted",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
  received: "Received",
  in_review: "In review",
  quoted: "Quote sent",
  awaiting_payment: "Awaiting payment",
  paid: "Payment received",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type LineItem = {
  slug: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  currency: string;
  lineTotal: number | null;
};

export type StoredRecord = {
  reference: string;
  kind: RecordKind;
  createdAt: string;
  status: Status;
  history: { status: Status; at: string; note?: string }[];
  customer: { company: string; name: string; email: string; phone: string; country: string };
  message: string;
  items?: LineItem[];
  totals?: { currency: string; subtotal: number } | null;
  order?: { address: string; vatNumber: string; paymentMethod: "bank_transfer" | "invoice" };
  sell?: { materialType: string; quantity: string; location: string; photos: string[] };
  mail?: { business: "sent" | "failed" | "skipped"; customer: "sent" | "failed" | "skipped"; error?: string };
  meta?: { ip?: string; userAgent?: string };
};

const PREFIX: Record<RecordKind, string> = { quote: "SBQ", order: "SBO", sell: "SBS" };
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function newReference(kind: RecordKind, now = new Date()) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = crypto.randomBytes(5);
  const rand = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${PREFIX[kind]}-${ymd}-${rand}`;
}

const fileFor = (ref: string) => {
  if (!/^SB[QOS]-\d{6}-[A-Z0-9]{5}$/.test(ref)) throw new Error("Invalid reference");
  return path.join(RECORDS, `${ref}.json`);
};

export async function saveRecord(rec: StoredRecord) {
  await fs.mkdir(RECORDS, { recursive: true });
  const file = fileFor(rec.reference);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rec, null, 2));
  await fs.rename(tmp, file);
}

export async function loadRecord(ref: string): Promise<StoredRecord | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(ref), "utf8"));
  } catch {
    return null;
  }
}

export async function listRecords(): Promise<StoredRecord[]> {
  try {
    const files = (await fs.readdir(RECORDS)).filter((f) => f.endsWith(".json"));
    const recs = await Promise.all(files.map((f) => fs.readFile(path.join(RECORDS, f), "utf8").then(JSON.parse).catch(() => null)));
    return (recs.filter(Boolean) as StoredRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function savePhoto(ref: string, index: number, file: File) {
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" } as Record<string, string>)[file.type] || "bin";
  const dir = path.join(STORAGE_DIR, "uploads", ref);
  await fs.mkdir(dir, { recursive: true });
  const name = `photo-${index + 1}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), buf);
  return { name, buf, type: file.type };
}
