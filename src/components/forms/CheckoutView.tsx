"use client";

import Link from "next/link";
import { useShop } from "../state/ShopState";
import { formatPrice } from "@/lib/format";
import { AntiSpam, ContactFields, Field, FormAlert, formToObject, SuccessPanel, useSubmit } from "./FormBits";
import { splitName } from "../product/ProductCard";

export function CheckoutView() {
  const { cart, ready, clearCart } = useShop();
  const { state, submit } = useSubmit();

  if (state.status === "done")
    return (
      <SuccessPanel title="Order placed" reference={state.reference} emailed={state.emailed}>
        <p className="mx-auto mt-3 max-w-lg text-steel-600">No payment has been taken. We&apos;ll confirm availability and send a pro-forma invoice with payment instructions.</p>
      </SuccessPanel>
    );
  if (!ready) return <div className="card h-48 animate-pulse" />;

  const unpriced = cart.filter((l) => l.product.price == null || l.product.stock === "out_of_stock");
  const currencies = new Set(cart.map((l) => l.product.currency));
  if (!cart.length || unpriced.length || currencies.size > 1)
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-bold">{cart.length ? "Some items need a quote" : "Your cart is empty"}</h2>
        <p className="mx-auto mt-2 max-w-lg text-steel-600">
          {cart.length
            ? "Checkout is only available when every product in your cart has a listed price. Send a quote request instead — we'll come back with pricing for everything."
            : "Add priced products to your cart, or request a quote for any material."}
        </p>
        <Link href={cart.length ? "/cart/" : "/shop/"} className="btn-primary mt-6">
          {cart.length ? "Back to quote list" : "Browse products"}
        </Link>
      </div>
    );

  const currency = cart[0].product.currency;
  const subtotal = cart.reduce((s, l) => s + l.product.price! * l.quantity, 0);

  return (
    <form
      noValidate
      className="relative grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = formToObject(e.currentTarget);
        const ok = await submit(
          "/api/order/",
          JSON.stringify({
            ...data,
            acceptTerms: data.acceptTerms === "on",
            items: cart.map((l) => ({ slug: l.product.slug, quantity: l.quantity, unit: l.unit })),
          }),
        );
        if (ok) clearCart();
      }}
    >
      <div className="space-y-8">
        <fieldset className="card p-5 sm:p-6">
          <legend className="px-1 font-heading text-xl font-bold">Company &amp; contact</legend>
          <div className="mt-2">
            <ContactFields errors={state.errors} messageLabel="Order notes" messagePlaceholder="Delivery address if different, port, timing…" />
          </div>
        </fieldset>
        <fieldset className="card space-y-4 p-5 sm:p-6">
          <legend className="px-1 font-heading text-xl font-bold">Billing</legend>
          <Field name="address" label="Billing address" textarea rows={3} required autoComplete="street-address" maxLength={600} error={state.errors.address} />
          <Field name="vatNumber" label="VAT / company registration number" maxLength={40} error={state.errors.vatNumber} />
        </fieldset>
        <fieldset className="card p-5 sm:p-6">
          <legend className="px-1 font-heading text-xl font-bold">Payment</legend>
          <p className="mb-3 text-sm text-steel-600">No card payment is taken online. Choose how you&apos;d like to pay once we confirm your order:</p>
          <div className="space-y-2">
            {[
              { v: "bank_transfer", t: "Bank transfer", d: "We send a pro-forma invoice with our bank details." },
              { v: "invoice", t: "Invoice (approved accounts)", d: "Pay on agreed terms after we confirm the order." },
            ].map((o, n) => (
              <label key={o.v} className="flex min-h-14 cursor-pointer gap-3 rounded-md border border-steel-300 p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                <input type="radio" name="paymentMethod" value={o.v} defaultChecked={n === 0} className="mt-1 size-5 accent-brand-700" />
                <span>
                  <span className="block font-semibold">{o.t}</span>
                  <span className="text-sm text-steel-600">{o.d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="card p-5 sm:p-6 lg:sticky lg:top-28">
        <h2 className="text-2xl font-bold">Order summary</h2>
        <ul className="mt-4 divide-y divide-steel-200 text-sm">
          {cart.map((l) => (
            <li key={l.product.slug} className="flex justify-between gap-3 py-2.5">
              <span>
                {splitName(l.product.name)[0]}
                <span className="block text-steel-500">
                  {l.quantity} {l.unit} × {formatPrice(l.product.price!, currency)}
                </span>
              </span>
              <span className="font-semibold whitespace-nowrap">{formatPrice(l.product.price! * l.quantity, currency)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-steel-300 pt-3 text-lg">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal, currency)}</strong>
        </p>
        <p className="mt-1 text-xs text-steel-500">Final prices are confirmed on your invoice; shipping and any taxes are added there.</p>
        <label className="mt-5 flex min-h-14 items-start gap-3 text-sm">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 size-5 accent-brand-700" aria-invalid={!!state.errors.acceptTerms} />
          <span>
            I accept the{" "}
            <Link href="/condition-of-use/" className="underline" target="_blank">
              conditions of use
            </Link>{" "}
            and{" "}
            <Link href="/refund_returns/" className="underline" target="_blank">
              refund policy
            </Link>
            .
          </span>
        </label>
        {state.errors.acceptTerms && <p className="field-error">{state.errors.acceptTerms}</p>}
        <AntiSpam />
        <div className="mt-4 space-y-3">
          <FormAlert state={state} />
          <button type="submit" disabled={state.status === "submitting"} className="btn-primary w-full">
            {state.status === "submitting" ? "Placing order…" : "Place order"}
          </button>
        </div>
      </aside>
    </form>
  );
}
