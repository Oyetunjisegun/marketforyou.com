import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

/**
 * Product-image uploads to the public "product-images" Storage bucket.
 * Files are stored under "<uid>/<random>.<ext>", which the Storage RLS policy
 * requires: an authenticated user may only write inside a folder named after
 * their own uid. Reads are public, so we can hand the public URL straight to
 * an <img> or the product_images table.
 */

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Client = SupabaseClient<Database>;

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Use a JPEG, PNG, WebP, or AVIF image.";
  if (file.size > MAX_BYTES) return "Image must be 5 MB or smaller.";
  return null;
}

/** Upload one image; returns its public URL. Throws on failure. */
export async function uploadProductImage(supabase: Client, file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to upload images.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort delete of an uploaded image by its public URL (ignores errors). */
export async function deleteProductImage(supabase: Client, publicUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
