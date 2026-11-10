import { formatPrice } from "@/lib/format";

export function PriceTag({ price, currency, unit, size = "md" }: { price: number | null; currency: string; unit: string; size?: "md" | "lg" }) {
  if (price == null)
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-brand-800 ${size === "lg" ? "text-xl" : "text-sm"}`}>
        <span className="size-2 rounded-full bg-signal-400" aria-hidden />
        Request a quote
      </span>
    );
  return (
    <span className={`font-sans font-bold text-steel-900 ${size === "lg" ? "text-3xl" : "text-lg"}`}>
      {formatPrice(price, currency)}
      <span className={`ml-1 font-sans font-normal text-steel-500 ${size === "lg" ? "text-base" : "text-sm"}`}>/ {unit === "units" ? "unit" : unit.replace(/s$/, "")}</span>
    </span>
  );
}
