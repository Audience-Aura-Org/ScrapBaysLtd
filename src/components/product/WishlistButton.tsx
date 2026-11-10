"use client";

import { Heart } from "lucide-react";
import type { ProductLite } from "@/lib/content";
import { useShop } from "../state/ShopState";

export function WishlistButton({ product, variant = "icon" }: { product: ProductLite; variant?: "icon" | "full" }) {
  const { toggleWishlist, inWishlist, ready } = useShop();
  const active = ready && inWishlist(product.slug);
  const label = active ? "Remove from wishlist" : "Save to wishlist";
  if (variant === "full")
    return (
      <button type="button" onClick={() => toggleWishlist(product)} aria-pressed={active} className="btn-outline">
        <Heart className={`size-5 ${active ? "fill-red-500 text-red-500" : ""}`} aria-hidden />
        {active ? "Saved" : "Save"}
      </button>
    );
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(product)}
      aria-pressed={active}
      aria-label={`${label}: ${product.name}`}
      className="relative grid size-10 place-items-center rounded-full bg-white/95 after:absolute after:-inset-2 after:content-[''] text-steel-700 shadow-sm ring-1 ring-steel-200 transition hover:text-red-500"
    >
      <Heart className={`size-5 ${active ? "fill-red-500 text-red-500" : ""}`} aria-hidden />
    </button>
  );
}
