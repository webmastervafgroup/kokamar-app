function parseWpPrice(value: unknown): number | null {
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
  const wp = (product?.metadata?.wp_meta || {}) as Record<string, unknown>

  // Kokamar: regular_price + sale_price
  const regular = parseWpPrice(wp["regular_price"]) ?? parseWpPrice(wp["_regular_price"]) ?? parseWpPrice(wp["_price"])
  const sale = parseWpPrice(wp["regular_sale_price"]) ?? parseWpPrice(wp["_sale_price"])

  let current = sale ?? regular
  let compare = (sale != null && regular != null && regular > sale) ? regular : null

  // Fallback: Medusa variant price
  if (current == null) {
    const raw = product?.variants?.[0]?.prices?.[0]?.amount
    if (raw != null) {
      const v = Number(raw)
      current = v < 500 ? v : v / 100
    }
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
    ...metaTax.map((t: any) => String(t?.name ?? "").toLowerCase()),
  ]
  return allNames.some(n => n.startsWith("akcija"))
}
