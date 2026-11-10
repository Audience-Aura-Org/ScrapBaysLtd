import type { Metadata } from "next";
import { listRecords, STATUS_LABEL, STATUSES } from "@/lib/server/store";
import { formatPrice } from "@/lib/format";
import { StatusEditor } from "./StatusEditor";

// Protected by HTTP Basic auth (ADMIN_USER / ADMIN_PASSWORD) in src/middleware.ts.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders & enquiries (admin)", robots: { index: false, follow: false } };

const KIND = { quote: "Quote", order: "Order", sell: "Sell offer" } as const;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string }> }) {
  const sp = await searchParams;
  const all = await listRecords();
  const recs = all.filter((r) => (!sp.kind || r.kind === sp.kind) && (!sp.status || r.status === sp.status));
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold">Orders &amp; enquiries</h1>
      <form className="mt-4 flex flex-wrap gap-3">
        <select name="kind" defaultValue={sp.kind || ""} className="field w-auto">
          <option value="">All types</option>
          <option value="quote">Quote requests</option>
          <option value="order">Orders</option>
          <option value="sell">Sell offers</option>
        </select>
        <select name="status" defaultValue={sp.status || ""} className="field w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button className="btn-outline">Filter</button>
      </form>
      <p className="mt-4 text-sm text-steel-600">
        {recs.length} of {all.length} records
      </p>
      <ul className="mt-4 space-y-4">
        {recs.map((r) => (
          <li key={r.reference} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-mono text-xl font-bold">{r.reference}</h2>
              <span className="text-sm text-steel-500">
                {KIND[r.kind]} · {new Date(r.createdAt).toLocaleString("en-GB")}
                {r.mail && ` · mail: business ${r.mail.business}, customer ${r.mail.customer}`}
              </span>
            </div>
            <p className="mt-2 text-sm">
              <strong>{r.customer.company}</strong> — {r.customer.name} · <a href={`mailto:${r.customer.email}`} className="text-brand-700 underline">{r.customer.email}</a> · {r.customer.phone} · {r.customer.country}
            </p>
            {r.items && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {r.items.map((i) => (
                  <li key={i.slug}>
                    {i.name} — {i.quantity} {i.unit} {i.lineTotal != null && `(${formatPrice(i.lineTotal, i.currency)})`}
                  </li>
                ))}
              </ul>
            )}
            {r.totals && <p className="mt-1 text-sm font-semibold">Total {formatPrice(r.totals.subtotal, r.totals.currency)}</p>}
            {r.order && (
              <p className="mt-1 text-sm whitespace-pre-wrap">
                Billing: {r.order.address} · VAT: {r.order.vatNumber || "—"} · {r.order.paymentMethod === "bank_transfer" ? "Bank transfer" : "Invoice"}
              </p>
            )}
            {r.sell && (
              <p className="mt-2 text-sm">
                Selling: <strong>{r.sell.materialType}</strong> · {r.sell.quantity} · {r.sell.location} · {r.sell.photos.length} photo(s) (attached to the notification email)
              </p>
            )}
            {r.message && <p className="mt-2 rounded bg-steel-50 p-3 text-sm whitespace-pre-wrap">{r.message}</p>}
            <StatusEditor reference={r.reference} status={r.status} statuses={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
          </li>
        ))}
      </ul>
    </div>
  );
}
