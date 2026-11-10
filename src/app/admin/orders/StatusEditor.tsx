"use client";

import { useState } from "react";

export function StatusEditor({ reference, status, statuses }: { reference: string; status: string; statuses: { value: string; label: string }[] }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 grid gap-3 border-t border-steel-200 pt-4 md:grid-cols-[12rem_1fr_auto_auto] md:items-center"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setMsg("");
        const res = await fetch("/api/admin/orders/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, status: fd.get("status"), note: fd.get("note"), notify: fd.get("notify") === "on" }),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        setMsg(data.ok ? `Saved${data.mailed ? " and customer emailed" : ""}.${data.error ? " " + data.error : ""}` : data.error || "Failed");
      }}
    >
      <select name="status" defaultValue={status} className="field" aria-label="Status">
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <input name="note" placeholder="Note shown to customer (optional)" className="field" aria-label="Note" />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="notify" className="size-5 accent-brand-700" /> Email customer
      </label>
      <button className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Update"}
      </button>
      {msg && <p className="text-sm text-brand-800 md:col-span-4">{msg}</p>}
    </form>
  );
}
