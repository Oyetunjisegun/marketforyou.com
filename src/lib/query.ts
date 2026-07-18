import type { ProductQuery } from "./api";

type RawParams = Record<string, string | string[] | undefined>;

/** Parse Next.js searchParams into a typed ProductQuery. */
export function parseProductQuery(sp: RawParams): ProductQuery {
  const str = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = str(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };

  const conditionRaw = sp.condition;
  const condition = conditionRaw
    ? Array.isArray(conditionRaw)
      ? conditionRaw
      : [conditionRaw]
    : undefined;

  const sort = str("sort") as ProductQuery["sort"] | undefined;

  return {
    q: str("q"),
    sort: sort ?? "relevance",
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    condition,
    freeShipping: str("freeShipping") === "1",
    listingType: str("listingType"),
    page: num("page") ?? 1,
  };
}
