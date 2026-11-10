#!/usr/bin/env node
/**
 * Checks the SMTP settings and sends a test email.
 *   npm run mail:test                  # sends to MAIL_TO (or the contact address)
 *   npm run mail:test -- you@example.com
 * Reads .env, .env.local etc. the same way Next.js does.
 */
import nextEnv from "@next/env";
import nodemailer from "nodemailer";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const port = Number(process.env.SMTP_PORT || 465);
const cfg = {
  host: process.env.SMTP_HOST || "smtp.titan.email",
  port,
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
};
const from = process.env.MAIL_FROM || (cfg.user ? `Scrap Bay Limited <${cfg.user}>` : "");
const to = process.argv[2] || process.env.MAIL_TO || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@scrapbaysltd.com";

console.log(`SMTP ${cfg.host}:${cfg.port} secure=${cfg.secure} user=${cfg.user || "(not set)"}`);
if (!cfg.user || !cfg.pass) {
  console.error("✗ SMTP_USER and SMTP_PASS must be set (in .env.local locally, or in Hostinger's environment variables).");
  process.exit(1);
}

const t = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: cfg.user, pass: cfg.pass } });
try {
  await t.verify();
  console.log("✓ Connected and authenticated");
  const info = await t.sendMail({
    from,
    to,
    subject: "Scrap Bay Limited — SMTP test",
    text: `This is a test email from the Scrap Bay Limited website.\nSent ${new Date().toISOString()} via ${cfg.host}.`,
  });
  console.log(`✓ Test email sent to ${to} (${info.messageId})`);
} catch (e) {
  console.error(`✗ ${e.message}`);
  if (/auth/i.test(e.message)) console.error("  Check SMTP_USER is the full mailbox address and SMTP_PASS is that mailbox's password.");
  if (/sender|from/i.test(e.message)) console.error("  Titan requires MAIL_FROM to use the same address as SMTP_USER.");
  process.exit(1);
}
