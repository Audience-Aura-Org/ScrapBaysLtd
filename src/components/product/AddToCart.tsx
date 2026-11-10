"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { ProductLite } from "@/lib/content";
import { QUANTITY_UNITS } from "@/lib/format";
import { MAX_QUANTITY } from "@/lib/limits";
import { useShop } from "../state/ShopState";
import { WishlistButton } from "./WishlistButton";

export function AddToCart({ product }: { product: ProductLite }) {
  const { addToCart, cart, ready } = useShop();
  const id = useId();
  const priced = product.price != null;
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<string>(product.unit);
  const inCart = ready && cart.some((l) => l.product.slug === product.slug);
  const unavailable = product.stock === "out_of_stock";
  const n = Number(qty);
  const qtyError = quantityError(qty, priced ? product.unit : unit);
  const valid = !qtyError;
  const step = (d: number) => setQty(String(Math.min(MAX_QUANTITY, Math.max(1, Math.round(((Number(qty) || 0) + d) * 100) / 100))));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !unavailable) addToCart(product, n, priced ? product.unit : unit);
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`${id}-qty`} className="field-label">
            Quantity
          </label>
          <div className="flex items-stretch">
            <button type="button" onClick={() => step(-1)} className="grid w-11 place-items-center rounded-l-md border border-r-0 border-steel-300 bg-white hover:bg-steel-100" aria-label="Decrease quantity">
              <Minus className="size-4" aria-hidden />
            </button>
            <input
              id={`${id}-qty`}
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^\d.-]/g, "").slice(0, 12))}
              className="field w-24 rounded-none text-center"
              aria-invalid={!valid}
              aria-describedby={qtyError ? `${id}-qty-err` : undefined}
            />
            <button type="button" onClick={() => step(1)} className="grid w-11 place-items-center rounded-r-md border border-l-0 border-steel-300 bg-white hover:bg-steel-100" aria-label="Increase quantity">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor={`${id}-unit`} className="field-label">
            Unit
          </label>
          {priced ? (
            <p id={`${id}-unit`} className="field flex items-center bg-steel-50 text-steel-600">
              {product.unit}
            </p>
          ) : (
            <select id={`${id}-unit`} value={unit} onChange={(e) => setUnit(e.target.value)} className="field">
              {QUANTITY_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      {qtyError && (
        <p id={`${id}-qty-err`} className="field-error" role="alert">
          {qtyError}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!valid || unavailable} className={`${priced ? "btn-primary" : "btn-signal"} min-w-52 flex-1 sm:flex-none`}>
          {unavailable ? "Currently unavailable" : priced ? "Add to cart" : "Add to quote request"}
        </button>
        <WishlistButton product={product} variant="full" />
      </div>
      {inCart && (
        <p className="flex items-center gap-2 text-sm text-brand-800">
          <Check className="size-4" aria-hidden /> In your {priced ? "cart" : "quote list"}.{" "}
          <Link href="/cart/" className="font-semibold underline">
            View and submit →
          </Link>
        </p>
      )}
    </form>
  );
}

/** Human-readable reason a quantity can't be added, or null if it's fine. */
export function quantityError(raw: string, unit: string): string | null {
  const v = raw.trim();
  if (!v) return "Enter a quantity.";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Enter a number, e.g. 25 or 2.5.";
  if (n <= 0) return "Quantity must be more than 0.";
  if (n > MAX_QUANTITY) return `For more than ${MAX_QUANTITY.toLocaleString("en-GB")} ${unit}, please contact our trading team directly.`;
  return null;
}
