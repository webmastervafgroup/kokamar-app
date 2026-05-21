import { API } from "@/constants/Colors"

const BASE_HEADERS = {
  "x-publishable-api-key": API.medusaKey,
  "Accept": "application/json",
  "Content-Type": "application/json",
}

// Region Srbija — potreban za calculated_price u RSD
const REGION_ID = "reg_rs_srbija"

async function apiFetch(url: string) {
  try {
    const res = await fetch(url, { headers: BASE_HEADERS })
    const text = await res.text()
    if (text.trimStart().startsWith("<")) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function getCategories() {
  const data = await apiFetch(
    `${API.medusaBase}/store/product-categories?limit=100&fields=id,name,handle,metadata`
  )
  const cats = data?.product_categories ?? []
  return cats.filter((c: any) => !c.name?.toLowerCase().includes("akcij"))
}

export async function getProducts(params: {
  categoryId?: string
  limit?: number
  offset?: number
  q?: string
}) {
  const limit = params.limit ?? 20
  const offset = params.offset ?? 0
  let url = `${API.medusaBase}/store/products?limit=${limit}&offset=${offset}&region_id=${REGION_ID}`
  if (params.categoryId) url += `&category_id%5B%5D=${params.categoryId}`
  if (params.q) url += `&q=${encodeURIComponent(params.q)}`
  const data = await apiFetch(url)
  return data ?? { products: [], count: 0 }
}

export async function getProduct(handle: string) {
  const fields = "id,title,handle,thumbnail,description,subtitle,images,categories,metadata,variants,market_type,attributes,taxonomies,sort_order,short_description,wp_attributes_raw"
  const data = await apiFetch(
    `${API.medusaBase}/store/products?handle=${encodeURIComponent(handle)}&region_id=${REGION_ID}&fields=${fields}`
  )
  return data?.products?.[0] ?? null
}

export async function getAkcijaProducts() {
  const catData = await apiFetch(
    `${API.medusaBase}/store/product-categories?limit=200&fields=id,name`
  )
  const allCats: any[] = catData?.product_categories ?? []
  const akcijaCat = allCats.find((c: any) =>
    c.name?.toLowerCase().startsWith("akcija od")
  )

  if (!akcijaCat) return []

  const data = await apiFetch(
    `${API.medusaBase}/store/products?category_id%5B%5D=${akcijaCat.id}&limit=100&region_id=${REGION_ID}`
  )
  return data?.products ?? []
}
