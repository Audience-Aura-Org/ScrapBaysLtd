"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Field } from "./FormBits";
import { formatPrice } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

type TrackRecord = {
  reference: string;
  kind: "quote" | "order" | "sell";
  createdAt: string;
  status: string;
  statusLabel: string;
  history: { status: string; label: string; at: string; note?: string }[];
  items?: { name: string; quantity: number; unit: string; lineTotal: number | null; currency: string }[];
  totals?: { currency: string; subtotal: number } | null;
  sell?: { materialType: string; quantity: string };
};

const KIND = { quote: "Quote request", order: "Order", sell: "Scrap material offer" };
const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function TrackForm() {
  const params = useSearchParams();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState<TrackRecord | null>(null);

  return (
    <div className="space-y-8">
      <form
        noValidate
        className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          setErrors({});
          try {
            const res = await fetch("/api/track/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: fd.get("reference"), email: fd.get("email") }) });
            const data = await res.json();
            if (data.ok) setRec(data.record);
            else {
              setRec(null);
              setErrors(data.errors || {});
              setError(data.error || "");
            }
          } catch {
            setError("We couldn't reach the server. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field name="reference" label="Reference" required defaultValue={params.get("ref") || ""} placeholder="SBQ-261110-AB12C" autoCapitalize="characters" error={errors.reference} />
        <Field name="email" label="Email used" type="email" required autoComplete="email" error={errors.email} />
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Checking…" : "Track"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-3">
            {error}
          </p>
        )}
      </form>

      {rec && (
        <section className="card p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-col justify-between gap-2 border-b border-steel-200 pb-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-steel-500">
                {KIND[rec.kind]} · placed {fmt(rec.createdAt)}
              </p>
              <h2 className="font-mono text-2xl font-bold">{rec.reference}</h2>
            </div>
            <span className="self-start rounded-full bg-brand-100 px-4 py-1.5 font-semibold text-brand-900 sm:self-auto">{rec.statusLabel}</span>
          </div>
          <ol className="mt-5 space-y-3">
            {rec.history.map((h, i) => (
              <li key={i} className="flex gap-3">
                {i === rec.history.length - 1 ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden /> : <Circle className="mt-0.5 size-5 shrink-0 text-steel-300" aria-hidden />}
                <div>
                  <p className="font-semibold">{h.label}</p>
                  <p className="text-sm text-steel-500">{fmt(h.at)}</p>
                  {h.note && <p className="mt-1 text-sm whitespace-pre-wrap text-steel-700">{h.note}</p>}
                </div>
              </li>
            ))}
          </ol>
          {rec.items && (
            <ul className="mt-6 divide-y divide-steel-200 border-t border-steel-200 text-sm">
              {rec.items.map((it) => (
                <li key={it.name} className="flex justify-between gap-3 py-2.5">
                  <span>
                    {it.name}
                    <span className="block text-steel-500">
                      {it.quantity} {it.unit}
                    </span>
                  </span>
                  <span className="font-semibold">{it.lineTotal != null ? formatPrice(it.lineTotal, it.currency) : "Quote"}</span>
                </li>
              ))}
            </ul>
          )}
          {rec.totals && <p className="mt-3 text-right text-lg">Total: <strong>{formatPrice(rec.totals.subtotal, rec.totals.currency)}</strong></p>}
          {rec.sell && (
            <p className="mt-6 border-t border-steel-200 pt-4 text-sm">
              {rec.sell.materialType} — {rec.sell.quantity}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
