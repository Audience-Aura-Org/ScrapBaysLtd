"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useShop } from "../state/ShopState";
import { formatPrice, QUANTITY_UNITS } from "@/lib/format";
import { AntiSpam, ContactFields, FormAlert, formToObject, SuccessPanel, useSubmit } from "./FormBits";
import { splitName } from "../product/ProductCard";
import { quantityError } from "../product/AddToCart";

/** Quantity box for a cart line: commits on blur/Enter, rejects invalid values with a reason. */
function CartQuantity({ slug, quantity, unit, onChange }: { slug: string; quantity: number; unit: string; onChange: (q: number) => void }) {
  const [value, setValue] = useState(String(quantity));
  const [error, setError] = useState<string | null>(null);
  const commit = () => {
    const err = quantityError(value, unit);
    if (err) {
      setError(`${err} Kept ${quantity}.`);
      setValue(String(quantity));
    } else {
      setError(null);
      if (Number(value) !== quantity) onChange(Number(value));
    }
  };
  return (
    <div>
      <label className="sr-only" htmlFor={`q-${slug}`}>
        Quantity
      </label>
      <input
        id={`q-${slug}`}
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d.-]/g, "").slice(0, 12))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `q-${slug}-err` : undefined}
        className="field w-28"
      />
      {error && (
        <p id={`q-${slug}-err`} role="alert" className="field-error max-w-56">
          {error}
        </p>
      )}
    </div>
  );
}

export function CartView() {
  const { cart, ready, updateLine, removeLine, clearCart } = useShop();
  const { state, submit } = useSubmit();

  if (state.status === "done")
    return <SuccessPanel title="Quote request sent" reference={state.reference} emailed={state.emailed} />;
  if (!ready) return <div className="card h-48 animate-pulse" />;
  if (!cart.length)
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-bold">Your quote list is empty</h2>
        <p className="mx-auto mt-2 max-w-md text-steel-600">Browse our materials and use “Add to quote request” on any product. You can then send one enquiry for everything.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop/" className="btn-primary">
            Browse products
          </Link>
          <Link href="/scrap-material-enquiry/" className="btn-outline">
            Selling scrap? Tell us
          </Link>
        </div>
      </div>
    );

  const allPriced = cart.every((l) => l.product.price != null && l.product.stock !== "out_of_stock");
  const currencies = new Set(cart.map((l) => l.product.currency));
  const subtotal = allPriced ? cart.reduce((s, l) => s + l.product.price! * l.quantity, 0) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start">
      <section aria-labelledby="cart-items">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="cart-items" className="text-2xl font-bold">
            Products ({cart.length})
          </h2>
          <button type="button" onClick={clearCart} className="min-h-14 min-w-14 px-2 text-sm font-medium text-steel-600 underline hover:text-red-700">
            Clear all
          </button>
        </div>
        <ul className="card divide-y divide-steel-200">
          {cart.map((l) => {
            const p = l.product;
            const priced = p.price != null;
            return (
              <li key={p.slug} className="grid grid-cols-[4.5rem_1fr] gap-4 p-4 sm:grid-cols-[6rem_1fr]">
                <Link href={`/product/${p.slug}/`} className="relative aspect-square overflow-hidden rounded-md bg-steel-100">
                  {p.image && <Image src={p.image.src} alt="" fill sizes="96px" className="object-cover" />}
                </Link>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/product/${p.slug}/`} className="inline-flex min-h-14 items-center font-display text-lg leading-snug font-semibold hover:text-brand-700">
                      {splitName(p.name)[0]}
                    </Link>
                    <button type="button" onClick={() => removeLine(p.slug)} className="-mt-2 -mr-2 grid size-14 shrink-0 place-items-center rounded-md text-steel-500 hover:bg-red-50 hover:text-red-700" aria-label={`Remove ${p.name}`}>
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    {/* key: re-mount when the quantity changes elsewhere (e.g. another tab) */}
                    <CartQuantity key={`${p.slug}-${l.quantity}`} slug={p.slug} quantity={l.quantity} unit={l.unit} onChange={(q) => updateLine(p.slug, { quantity: q })} />
                    {priced ? (
                      <span className="pb-3 text-sm text-steel-600">{l.unit}</span>
                    ) : (
                      <div>
                        <label className="sr-only" htmlFor={`u-${p.slug}`}>
                          Unit
                        </label>
                        <select id={`u-${p.slug}`} value={l.unit} onChange={(e) => updateLine(p.slug, { unit: e.target.value })} className="field w-auto">
                          {QUANTITY_UNITS.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <span className="ml-auto pb-3 text-sm font-semibold">
                      {priced ? formatPrice(p.price! * l.quantity, p.currency) : <span className="text-brand-800">Price on request</span>}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {allPriced && currencies.size === 1 && subtotal != null && (
          <div className="card mt-4 flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
            <p className="text-lg">
              Subtotal: <strong>{formatPrice(subtotal, cart[0].product.currency)}</strong>
              <span className="block text-sm text-steel-500">Shipping and taxes confirmed on your invoice.</span>
            </p>
            <Link href="/checkout/" className="btn-primary w-full sm:w-auto">
              Proceed to checkout
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="quote-form" className="card p-5 sm:p-6">
        <h2 id="quote-form" className="text-2xl font-bold">
          {allPriced ? "Or request a quote" : "Request a quote"}
        </h2>
        <p className="mt-1 mb-5 text-sm text-steel-600">One enquiry for all products listed. We reply with pricing, availability and shipping terms — no obligation.</p>
        <form
          noValidate
          className="relative space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = formToObject(e.currentTarget);
            const ok = await submit(
              "/api/enquiry/",
              JSON.stringify({ ...data, items: cart.map((l) => ({ slug: l.product.slug, quantity: l.quantity, unit: l.unit })) }),
            );
            if (ok) clearCart();
          }}
        >
          <ContactFields errors={state.errors} messageLabel="Requirements" messagePlaceholder="Grade, packaging, destination port, delivery timing, Incoterms…" />
          <AntiSpam />
          <FormAlert state={state} />
          <button type="submit" disabled={state.status === "submitting"} className="btn-signal w-full">
            {state.status === "submitting" ? "Sending…" : "Send quote request"}
          </button>
          <p className="text-xs text-steel-500">
            By sending, you agree to our{" "}
            <Link href="/privacy-policy/" className="underline">
              privacy policy
            </Link>
            .
          </p>
        </form>
      </section>
    </div>
  );
}
