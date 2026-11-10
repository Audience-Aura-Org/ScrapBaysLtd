"use client";

import Link from "next/link";
import { useShop } from "../state/ShopState";
import { ProductCard, ProductGrid } from "./ProductCard";

export function WishlistView() {
  const { wishlist, ready, addToCart } = useShop();
  if (!ready) return <div className="card h-48 animate-pulse" />;
  if (!wishlist.length)
    return (
      <div className="card p-10 text-center">
        <h2 className="text-2xl font-bold">No saved products yet</h2>
        <p className="mt-2 text-steel-600">Tap the heart on any product to save it here.</p>
        <Link href="/shop/" className="btn-primary mt-6">
          Browse products
        </Link>
      </div>
    );
  return (
    <>
      <div className="mb-6 flex justify-center md:justify-end">
        <button type="button" className="btn-signal" onClick={() => wishlist.forEach((p) => addToCart(p, 1, p.unit))}>
          Add all to quote list
        </button>
      </div>
      <ProductGrid>
        {wishlist.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductGrid>
    </>
  );
}
