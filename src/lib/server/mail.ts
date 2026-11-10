import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { site } from "../site";
import { formatPrice } from "../format";
import { STATUS_LABEL, type StoredRecord } from "./store";

/**
 * SMTP via nodemailer. Defaults suit Titan Mail (Hostinger): smtp.titan.email, port 465, SSL.
 * If SMTP_HOST/USER/PASS are missing, mail is skipped and logged (useful in development).
 */
export function mailConfig() {
  const port = Number(process.env.SMTP_PORT || 465);
  return {
    host: process.env.SMTP_HOST || "smtp.titan.email",
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || (process.env.SMTP_USER ? `${site.name} <${process.env.SMTP_USER}>` : `${site.name} <${site.email}>`),
    to: process.env.MAIL_TO || site.email,
    bcc: process.env.MAIL_BCC || undefined,
  };
}

let transporter: Transporter | null = null;
function getTransport() {
  const c = mailConfig();
  if (!c.user || !c.pass) return null;
  // Timeouts so a slow or unreachable SMTP server can't leave the customer's form spinning:
  // the submission is already saved before mail is sent.
  transporter ??= nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

type Mail = { to: string; subject: string; text: string; html: string; replyTo?: string; bcc?: string; attachments?: { filename: string; content: Buffer; contentType: string }[] };

async function send(mail: Mail): Promise<"sent" | "skipped"> {
  const t = getTransport();
  const c = mailConfig();
  if (!t) {
    console.warn(`[mail] SMTP not configured — skipped "${mail.subject}" to ${mail.to}`);
    return "skipped";
  }
  await t.sendMail({ from: c.from, ...mail });
  return "sent";
}

// ------------------------------------------------------------------ templates
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

const KIND_LABEL = { quote: "Quote request", order: "Order", sell: "Scrap material offer" } as const;

function itemsTable(rec: StoredRecord) {
  if (!rec.items?.length) return { text: "", html: "" };
  const text = rec.items
    .map((i) => `- ${i.name} — ${i.quantity} ${i.unit}${i.unitPrice != null ? ` @ ${formatPrice(i.unitPrice, i.currency)} = ${formatPrice(i.lineTotal!, i.currency)}` : " (price on request)"}`)
    .join("\n");
  const rows = rec.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${esc(i.name)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;white-space:nowrap">${esc(i.quantity)} ${esc(i.unit)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap">${
          i.lineTotal != null ? esc(formatPrice(i.lineTotal, i.currency)) : "Quote"
        }</td></tr>`,
    )
    .join("");
  const total = rec.totals ? `<tr><td colspan="2" style="padding:8px;text-align:right"><strong>Total</strong></td><td style="padding:8px;text-align:right"><strong>${esc(formatPrice(rec.totals.subtotal, rec.totals.currency))}</strong></td></tr>` : "";
  return {
    text: text + (rec.totals ? `\nTotal: ${formatPrice(rec.totals.subtotal, rec.totals.currency)}` : ""),
    html: `<table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr><th align="left" style="padding:6px 8px">Product</th><th align="left" style="padding:6px 8px">Quantity</th><th align="right" style="padding:6px 8px">Price</th></tr></thead><tbody>${rows}${total}</tbody></table>`,
  };
}

function detailRows(rec: StoredRecord): [string, string][] {
  const rows: [string, string][] = [
    ["Reference", rec.reference],
    ["Company", rec.customer.company],
    ["Contact", rec.customer.name],
    ["Email", rec.customer.email],
    ["Phone", rec.customer.phone],
    ["Country", rec.customer.country],
  ];
  if (rec.order) rows.push(["Billing address", rec.order.address], ["VAT / company no.", rec.order.vatNumber || "—"], ["Payment", rec.order.paymentMethod === "bank_transfer" ? "Bank transfer" : "Invoice"]);
  if (rec.sell) rows.push(["Material", rec.sell.materialType], ["Estimated quantity", rec.sell.quantity], ["Location", rec.sell.location], ["Photos", rec.sell.photos.length ? `${rec.sell.photos.length} attached` : "None"]);
  if (rec.message) rows.push(["Message", rec.message]);
  return rows;
}

// Poppins, as on the site. It loads where the mail client allows web fonts (Apple Mail,
// iOS, Outlook.com); elsewhere (e.g. Gmail) it falls back to Arial/Helvetica.
const BODY_FONT = "Poppins,Arial,Helvetica,sans-serif";
const HEADING_FONT = BODY_FONT; // headings use Poppins too

function layout(title: string, inner: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>body,td,p,a,span{font-family:${BODY_FONT}}h1,h2,h3{font-family:${HEADING_FONT}}</style></head>
<body style="margin:0;background:#f4f5f2;font-family:${BODY_FONT};color:#1e293b">
<div style="max-width:620px;margin:0 auto;padding:24px">
<div style="background:#14532d;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;font-family:${HEADING_FONT};font-size:22px;font-weight:bold">${esc(site.name)}</div>
<div style="background:#fff;padding:20px;border-radius:0 0 8px 8px">
<h1 style="font-family:${HEADING_FONT};font-size:26px;line-height:1.2;margin:0 0 12px">${esc(title)}</h1>${inner}
</div>
<p style="font-size:12px;color:#64748b;text-align:center;margin-top:16px">${esc(site.name)} · ${esc(site.email)} · ${esc(site.phone)} · <a href="${site.url}" style="color:#64748b">${site.url.replace(/^https?:\/\//, "")}</a></p>
</div></body></html>`;
}

function businessMail(rec: StoredRecord): Omit<Mail, "to"> {
  const items = itemsTable(rec);
  const rows = detailRows(rec);
  const label = KIND_LABEL[rec.kind];
  return {
    subject: `[${rec.reference}] New ${label.toLowerCase()} from ${rec.customer.company}`,
    replyTo: `${rec.customer.name} <${rec.customer.email}>`,
    text: `New ${label.toLowerCase()} on ${site.url}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${items.text}\n`,
    html: layout(
      `New ${label.toLowerCase()}`,
      `<table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:16px">${rows
        .map(([k, v]) => `<tr><td style="padding:4px 8px 4px 0;color:#64748b;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(v)}</td></tr>`)
        .join("")}</table>${items.html}<p style="font-size:13px;color:#64748b">Reply to this email to answer the customer directly.</p>`,
    ),
  };
}

function bankDetails() {
  return (process.env.BANK_DETAILS || "").replace(/\\n/g, "\n").trim();
}

function customerMail(rec: StoredRecord): Omit<Mail, "to"> {
  const items = itemsTable(rec);
  const first = rec.customer.name.split(" ")[0];
  const trackUrl = `${site.url}/track-order/?ref=${encodeURIComponent(rec.reference)}`;
  let lead: string;
  let next: string;
  if (rec.kind === "order") {
    const bank = bankDetails();
    lead = `Thank you for your order. Your order reference is <strong>${esc(rec.reference)}</strong>.`;
    next =
      rec.order?.paymentMethod === "bank_transfer"
        ? `We'll confirm availability and delivery terms, then send a pro-forma invoice. Please don't pay until you've received it.${bank ? `<br><br><strong>Our bank details</strong><br><span style="white-space:pre-wrap">${esc(bank)}</span><br>Please quote ${esc(rec.reference)} as the payment reference.` : ""}`
        : "We'll confirm availability and delivery terms and send you an invoice with our payment terms.";
  } else if (rec.kind === "sell") {
    lead = `Thank you for offering your scrap material to ${esc(site.name)}. Your reference is <strong>${esc(rec.reference)}</strong>.`;
    next = "Our trading team will review the details and photos and contact you with an offer or questions, usually within two working days.";
  } else {
    lead = `Thank you for your quote request. Your reference is <strong>${esc(rec.reference)}</strong>.`;
    next = "Our trading team will review your enquiry and send you a quotation with pricing, availability and shipping terms, usually within two working days.";
  }
  const plainNext = next.replace(/<br>/g, "\n").replace(/<[^>]+>/g, "");
  return {
    subject: `${KIND_LABEL[rec.kind]} received — ${rec.reference}`,
    text: `Hello ${first},\n\n${lead.replace(/<[^>]+>/g, "")}\n\n${items.text}\n\n${plainNext}\n\nTrack your ${rec.kind === "order" ? "order" : "enquiry"}: ${trackUrl}\n\n${site.name}\n${site.email} · ${site.phone}\n`,
    html: layout(
      `Hello ${first},`,
      `<p style="font-size:15px;line-height:1.5">${lead}</p>${items.html}<p style="font-size:15px;line-height:1.5">${next}</p>
<p><a href="${esc(trackUrl)}" style="display:inline-block;background:#15803d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Track your ${rec.kind === "order" ? "order" : "enquiry"}</a></p>
<p style="font-size:14px;color:#64748b">Questions? Just reply to this email.</p>`,
    ),
  };
}

export async function sendRecordEmails(rec: StoredRecord, attachments: Mail["attachments"] = []): Promise<NonNullable<StoredRecord["mail"]>> {
  const c = mailConfig();
  const result: NonNullable<StoredRecord["mail"]> = { business: "skipped", customer: "skipped" };
  try {
    result.business = await send({ to: c.to, bcc: c.bcc, attachments, ...businessMail(rec) });
  } catch (e) {
    result.business = "failed";
    result.error = describeMailError(e);
    console.error(`[mail] business notification failed for ${rec.reference}:`, e);
  }
  try {
    result.customer = await send({ to: rec.customer.email, replyTo: c.to, ...customerMail(rec) });
  } catch (e) {
    result.customer = "failed";
    result.error = (result.error ? result.error + "; " : "") + describeMailError(e);
    console.error(`[mail] customer confirmation failed for ${rec.reference}:`, e);
  }
  return result;
}

export async function sendStatusEmail(rec: StoredRecord, note?: string) {
  const label = STATUS_LABEL[rec.status];
  const trackUrl = `${site.url}/track-order/?ref=${encodeURIComponent(rec.reference)}`;
  return send({
    to: rec.customer.email,
    replyTo: mailConfig().to,
    subject: `${rec.reference} — status updated: ${label}`,
    text: `Hello ${rec.customer.name},\n\nThe status of ${rec.reference} is now: ${label}.${note ? `\n\n${note}` : ""}\n\nTrack it here: ${trackUrl}\n\n${site.name}`,
    html: layout(
      `Status update: ${label}`,
      `<p style="font-size:15px">The status of <strong>${esc(rec.reference)}</strong> is now <strong>${esc(label)}</strong>.</p>${note ? `<p style="font-size:15px;white-space:pre-wrap">${esc(note)}</p>` : ""}<p><a href="${esc(trackUrl)}" style="color:#15803d">Track it online</a></p>`,
    ),
  });
}

export async function verifyAndSendTest(to?: string) {
  const t = getTransport();
  if (!t) throw new Error("SMTP_USER / SMTP_PASS are not set");
  await t.verify();
  const c = mailConfig();
  await t.sendMail({ from: c.from, to: to || c.to, subject: `${site.name} SMTP test`, text: `SMTP test from ${site.url} at ${new Date().toISOString()}` });
}

/** Readable reason for the admin page. Connection failures arrive as an AggregateError with an empty message. */
function describeMailError(e: unknown): string {
  const err = e as { message?: string; code?: string; errors?: { code?: string; message?: string }[] };
  const inner = err.errors?.[0];
  return err.message || err.code || inner?.code || inner?.message || "Unknown SMTP error";
}
