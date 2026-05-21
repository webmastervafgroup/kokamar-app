function parseNum(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  if (!str) return null
  const normalized = str.replace(",", ".").replace(/[^\d.]/g, "")
  if (!normalized) return null
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0 ? num : null
}

export type ProductPrice = {
  current: number | null
  compare: number | null
  isOnSale: boolean
  pctOff: number | null
  formatted: string | null
  formattedCompare: string | null
}

function fmt(n: number): string {
  return n.toLocaleString("sr-RS", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " RSD"
}

export function resolveProductPrice(product: any): ProductPrice {
  let current: number | null = null
  let compare: number | null = null

  // 1. Primarno: Medusa calculated_price (region_id=reg_rs_srbija)
  const calcPrice = product?.variants?.[0]?.calculated_price
  if (calcPrice) {
    const calc = calcPrice.calculated_amount
    const orig = calcPrice.original_amount
    if (calc != null && calc > 0) {
      // Medusa čuva u najmanjoj jedinici (parama) — ako je > 500 to su pare, inače dinari
      current = calc > 500 ? calc / 100 : calc
      if (orig != null && orig > 0 && orig !== calc) {
        const origDin = orig > 500 ? orig / 100 : orig
        if (origDin > current) compare = origDin
      }
    }
  }

  // 2. Fallback: wp_meta regular/sale price
  if (current === null) {
    const wp = (product?.metadata?.wp_meta || {}) as Record<string, unknown>
    const regular = parseNum(wp["regular_price"]) ?? parseNum(wp["_regular_price"]) ?? parseNum(wp["_price"])
    const sale = parseNum(wp["regular_sale_price"]) ?? parseNum(wp["_sale_price"])
    current = sale ?? regular
    if (sale != null && regular != null && regular > sale) compare = regular
  }

  // 3. Fallback: rank_math_schema_Product.offers.price
  if (current === null) {
    const schemaPrice = product?.metadata?.wp_meta?.rank_math_schema_Product?.offers?.price
      ?? product?.metadata?.rank_math_schema_Product?.offers?.price
    const n = parseNum(schemaPrice)
    if (n != null) current = n
  }

  const isOnSale = compare != null && current != null && compare > current
  const pctOffVal = isOnSale && compare && current
    ? Math.round(((compare - current) / compare) * 100)
    : null

  return {
    current,
    compare,
    isOnSale,
    pctOff: pctOffVal,
    formatted: current != null ? fmt(current) : null,
    formattedCompare: compare != null ? fmt(compare) : null,
  }
}

export function isInAkcija(product: any): boolean {
  const cats: any[] = product?.categories ?? []
  const metaTax: any[] = product?.metadata?.taxonomies ?? []
  const allNames = [
    ...cats.map((c: any) => String(c?.name ?? "").toLowerCase()),
    ...metaTax
      .filter((t: any) => t?.taxonomy === "product_cat")
      .map((t: any) => String(t?.name ?? "").toLowerCase()),
  ]
  return allNames.some(n => n.startsWith("akcija"))
}
