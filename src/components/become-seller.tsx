"use client";

import { useState } from "react";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { becomeSeller } from "@/lib/seller";

/**
 * Seller onboarding. Calls the become_seller() RPC, which atomically creates
 * the store row and promotes the user's role to 'seller'. On success it calls
 * onDone so the parent can reload into the product manager.
 */
export function BecomeSeller({ onDone }: { onDone: () => void }) {
  const { supabase } = useAuth();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanHandle.length < 3) {
      setError("Handle must be at least 3 characters (letters, numbers, hyphens).");
      return;
    }
    setSaving(true);
    try {
      await becomeSeller(supabase, {
        handle: cleanHandle,
        displayName: displayName.trim() || cleanHandle,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open your store. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Open your store</h1>
        <p className="mt-1 text-muted">
          Set up a seller profile to start listing items. It only takes a moment.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="handle" className="mb-1 block text-sm font-medium">
            Store handle
          </label>
          <div className="flex items-center rounded-lg border border-border bg-surface px-3 focus-within:ring-2 focus-within:ring-ring">
            <span className="text-sm text-muted">@</span>
            <input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your-store"
              required
              className="w-full bg-transparent px-1 py-2.5 text-sm outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-muted">Your public store URL: /seller/{handle.trim().toLowerCase() || "your-store"}</p>
        </div>

        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            Display name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What buyers see"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium">
            Location (optional)
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lagos, NG"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">
            Bio (optional)
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell buyers about your store"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Open store
        </Button>
      </form>
    </div>
  );
}
