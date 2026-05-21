import { API } from "@/constants/Colors"

async function payloadFetch(path: string) {
  try {
    const url = `${API.payloadBase}${path}`
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    })
    const text = await res.text()
    if (!text || text.trimStart().startsWith("<")) {
      return null
    }
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  } catch {
    return null
  }
}

export async function getBlogPosts(limit = 10, page = 1, category?: string) {
  let path = `/blog-posts?limit=${limit}&page=${page}&sort=-publishedAt&depth=1`
  if (category) path += `&where[categories.slug][equals]=${encodeURIComponent(category)}`
  const data = await payloadFetch(path)
  return data ?? { docs: [], totalDocs: 0 }
}

export async function getBlogCategories() {
  const data = await payloadFetch(`/blog-categories?limit=50&sort=name&depth=0`)
  return data?.docs ?? []
}

export async function getBlogPost(slug: string) {
  const data = await payloadFetch(`/blog-posts?where[slug][equals]=${slug}&depth=1`)
  return data?.docs?.[0] ?? null
}

export async function getLocations() {
  const data = await payloadFetch(`/locations?limit=50&depth=0`)
  return data?.docs ?? []
}

export async function getAkcijaLetak() {
  const data = await payloadFetch(`/globals/akcija-letak?depth=1`)
  return data ?? null
}

export async function getBrands() {
  const data = await payloadFetch(`/brands?limit=200&sort=name&depth=1`)
  return data?.docs ?? []
}

export async function getBrandByName(name: string) {
  const encoded = encodeURIComponent(name)
  const data = await payloadFetch(`/brands?where[name][equals]=${encoded}&limit=1&depth=1`)
  const doc = data?.docs?.[0]
  if (!doc?.logo?.url) return null
  const url = doc.logo.url.startsWith("http")
    ? doc.logo.url
    : `https://kokamar.rs/cms${doc.logo.url}`
  return { name: doc.name, logoUrl: url }
}

export async function getPromoKaruzeli() {
  const data = await payloadFetch(`/promo-karuzeli?where[aktivan][equals]=true&sort=redosled&limit=10&depth=2`)
  if (!data?.docs) return []
  const now = new Date()
  return data.docs.filter((k: any) => {
    if (k.vaziDo && new Date(k.vaziDo) < now) return false
    if (k.vaziOd && new Date(k.vaziOd) > now) return false
    return true
  })
}
