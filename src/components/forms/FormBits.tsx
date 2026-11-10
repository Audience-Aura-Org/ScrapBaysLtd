"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FieldErrors } from "@/lib/validation";
import { site } from "@/lib/site";

export function Field({
  name,
  label,
  error,
  hint,
  required,
  textarea,
  rows = 4,
  ...rest
}: { name: string; label: string; error?: string; hint?: string; textarea?: boolean; rows?: number } & InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="text-red-700"> *</span> : <span className="font-normal text-steel-500"> (optional)</span>}
      </label>
      {textarea ? (
        <textarea id={id} name={name} rows={rows} required={required} aria-invalid={!!error} aria-describedby={describedBy} className="field" placeholder={rest.placeholder} defaultValue={rest.defaultValue as string} maxLength={rest.maxLength} />
      ) : (
        <input id={id} name={name} required={required} aria-invalid={!!error} aria-describedby={describedBy} className="field" {...rest} />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-steel-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactFields({ errors, messageLabel = "Message", messagePlaceholder }: { errors: FieldErrors; messageLabel?: string; messagePlaceholder?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="company" label="Company name" required autoComplete="organization" maxLength={160} error={errors.company} />
      <Field name="name" label="Contact name" required autoComplete="name" maxLength={120} error={errors.name} />
      <Field name="email" label="Email" type="email" required autoComplete="email" maxLength={200} error={errors.email} />
      <Field name="phone" label="Phone" type="tel" required autoComplete="tel" maxLength={40} placeholder="+44 …" error={errors.phone} />
      <div className="sm:col-span-2">
        <Field name="country" label="Country" required autoComplete="country-name" maxLength={80} error={errors.country} />
      </div>
      <div className="sm:col-span-2">
        <Field name="message" label={messageLabel} textarea maxLength={4000} placeholder={messagePlaceholder} error={errors.message} />
      </div>
    </div>
  );
}

/** Hidden honeypot + time trap. Bots that fill "website" or submit instantly are silently discarded. */
export function AntiSpam() {
  const [startedAt, setStartedAt] = useState("");
  useEffect(() => setStartedAt(String(Date.now())), []);
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="f-website">Leave this field empty</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
    </>
  );
}

export type SubmitState = { status: "idle" | "submitting" | "done" | "error"; errors: FieldErrors; message?: string; reference?: string; emailed?: boolean };

export function useSubmit() {
  const [state, setState] = useState<SubmitState>({ status: "idle", errors: {} });
  // Synchronous lock: a double-click fires twice before React re-renders the disabled button.
  const inFlight = useRef(false);
  async function submit(url: string, body: BodyInit, json = true) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setState({ status: "submitting", errors: {} });
    try {
      const res = await fetch(url, { method: "POST", body, headers: json ? { "Content-Type": "application/json" } : undefined });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState({ status: "done", errors: {}, reference: data.reference, emailed: data.emailed });
        window.scrollTo({ top: 0 }); // the success panel replaces the form; show it from the top
        return true;
      }
      setState({
        status: "error",
        errors: data.errors || {},
        message: data.error || (data.errors ? "Please check the highlighted fields." : `Something went wrong on our side. Please try again, or email us at ${site.email}.`),
      });
    } catch {
      setState({ status: "error", errors: {}, message: "We couldn't reach the server. Check your connection and try again." });
    } finally {
      inFlight.current = false;
    }
    // Move focus to the first invalid field.
    setTimeout(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(), 50);
    return false;
  }
  return { state, submit };
}

export function FormAlert({ state }: { state: SubmitState }) {
  if (state.status !== "error") return null;
  const general = state.errors.items || state.errors.photos || state.errors.form;
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {general || state.message}
    </div>
  );
}

export function SuccessPanel({ title, reference, emailed, children }: { title: string; reference?: string; emailed?: boolean; children?: ReactNode }) {
  return (
    <div role="status" className="card p-6 text-center sm:p-10">
      <CheckCircle2 className="mx-auto size-14 text-brand-600" aria-hidden />
      <h2 className="mt-4 text-3xl font-bold">{title}</h2>
      {reference && (
        <p className="mt-3 text-lg">
          Your reference: <strong className="rounded bg-steel-100 px-2 py-0.5 font-mono tracking-wide">{reference}</strong>
        </p>
      )}
      <p className="mx-auto mt-3 max-w-lg text-steel-600">
        {emailed === false
          ? "We've received it. Our confirmation email may be delayed, so please keep a note of your reference."
          : "We've emailed you a confirmation. Our trading team will be in touch shortly, usually within two working days."}
      </p>
      {children}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {reference && (
          <Link href={`/track-order/?ref=${encodeURIComponent(reference)}`} className="btn-primary">
            Track status
          </Link>
        )}
        <Link href="/shop/" className="btn-outline">
          Continue browsing
        </Link>
      </div>
    </div>
  );
}

export function formToObject(form: HTMLFormElement) {
  const fd = new FormData(form);
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}
