"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, Star } from "lucide-react";
import { useAuth } from "./auth-provider";
import { uploadProductImage, validateImage } from "@/lib/storage";
import { cn } from "@/lib/cn";

/**
 * Multi-image uploader for product listings. Uploads straight to Supabase
 * Storage on selection and reports the resulting public URLs upward via
 * onChange. The first image is the cover; images can be removed or promoted.
 */
export function ImageUploader({
  value,
  onChange,
  max = 10,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const { supabase } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const room = max - value.length;
    const picked = Array.from(files).slice(0, room);
    if (!picked.length) {
      setError(`You can upload up to ${max} images.`);
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of picked) {
        const bad = validateImage(file);
        if (bad) {
          setError(bad);
          continue;
        }
        uploaded.push(await uploadProductImage(supabase, file));
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function makeCover(i: number) {
    if (i === 0) return;
    const next = [...value];
    const [pick] = next.splice(i, 1);
    next.unshift(pick);
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  title="Make cover"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-foreground hover:bg-white"
                >
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                title="Remove"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-danger hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border text-muted",
              "hover:border-primary hover:text-primary disabled:opacity-60",
            )}
          >
            <span className="text-center text-xs">
              {uploading ? (
                <Loader2 className="mx-auto mb-1 h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="mx-auto mb-1 h-6 w-6" />
              )}
              {uploading ? "Uploading" : "Add photo"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <p className="mt-1.5 text-xs text-muted">
        Up to {max} images, 5 MB each. The first image is the cover — hover to remove or
        set a new cover.
      </p>
    </div>
  );
}
