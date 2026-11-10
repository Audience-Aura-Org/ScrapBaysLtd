"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { PHOTO_LIMITS } from "@/lib/limits";
import { AntiSpam, ContactFields, Field, FormAlert, SuccessPanel, useSubmit } from "./FormBits";

export function SellForm({ materials }: { materials: string[] }) {
  const { state, submit } = useSubmit();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");

  if (state.status === "done") return <SuccessPanel title="Thank you — we've received your offer" reference={state.reference} emailed={state.emailed} />;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...photos];
    let err = "";
    for (const f of Array.from(list)) {
      if (next.length >= PHOTO_LIMITS.maxFiles) {
        err = `You can attach up to ${PHOTO_LIMITS.maxFiles} photos.`;
        break;
      }
      if (!PHOTO_LIMITS.types.includes(f.type)) err = `“${f.name}” isn't a supported image (JPG, PNG, WebP, HEIC).`;
      else if (f.size > PHOTO_LIMITS.maxBytes) err = `“${f.name}” is larger than 5 MB.`;
      else next.push(f);
    }
    setPhotos(next);
    setPhotoError(err);
  }

  return (
    <form
      noValidate
      className="relative space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.delete("photos-picker");
        photos.forEach((p) => fd.append("photos", p, p.name));
        await submit("/api/sell/", fd, false);
      }}
    >
      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-xl font-bold">Your material</legend>
        <Field name="materialType" label="Material type" required list="material-list" maxLength={160} placeholder="e.g. HMS 1&2, copper wire, LDPE film, teak logs" error={state.errors.materialType} />
        <datalist id="material-list">
          {materials.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="quantity" label="Estimated quantity" required maxLength={80} placeholder="e.g. 200 tonnes / month, 3 × 40ft" error={state.errors.quantity} />
          <Field name="location" label="Material location" required maxLength={200} placeholder="City, country (and port if known)" error={state.errors.location} />
        </div>
        <div>
          <p className="field-label">
            Photos <span className="font-normal text-steel-500">(optional, up to {PHOTO_LIMITS.maxFiles}, max 5 MB each)</span>
          </p>
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-steel-300 bg-white p-4 text-center text-sm text-steel-600 hover:border-brand-500">
            <ImagePlus className="size-6 text-brand-600" aria-hidden />
            <span className="font-semibold text-brand-700">Add photos</span>
            <span>JPG, PNG, WebP or HEIC</span>
            <input name="photos-picker" type="file" accept={PHOTO_LIMITS.types.join(",")} multiple className="sr-only" onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
          </label>
          {photos.length > 0 && (
            <ul className="mt-3 space-y-2">
              {photos.map((p, i) => (
                <li key={`${p.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md bg-steel-100 px-3 py-1.5 text-sm">
                  <span className="truncate">{p.name}</span>
                  <button type="button" onClick={() => setPhotos(photos.filter((_, n) => n !== i))} className="grid size-9 shrink-0 place-items-center rounded hover:bg-white" aria-label={`Remove ${p.name}`}>
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(photoError || state.errors.photos) && <p className="field-error">{photoError || state.errors.photos}</p>}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-4 font-display text-xl font-bold">Your details</legend>
        <ContactFields errors={state.errors} messageLabel="Anything else?" messagePlaceholder="Grade, condition, packing, asking price, availability…" />
      </fieldset>
      <AntiSpam />
      <FormAlert state={state} />
      <button type="submit" disabled={state.status === "submitting"} className="btn-primary w-full sm:w-auto sm:px-10">
        {state.status === "submitting" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
