import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "./icon";

export function CategoryRail() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center transition-colors hover:border-primary hover:bg-surface-2"
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-full transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${c.accent}1a`, color: c.accent }}
            >
              <CategoryIcon name={c.icon} className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium leading-tight text-foreground">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
