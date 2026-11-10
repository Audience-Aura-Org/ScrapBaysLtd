export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

export const QUANTITY_UNITS = ["tonnes", "kg", "units", "m³", "containers (20ft)", "containers (40ft)"] as const;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const STOCK_LABEL: Record<string, string> = {
  in_stock: "Available",
  out_of_stock: "Currently unavailable",
  on_request: "Available on request",
};
