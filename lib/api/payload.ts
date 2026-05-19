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

export async function getBlogPosts(limit = 10, page = 1) {
  const data = await payloadFetch(`/blog-posts?limit=${limit}&page=${page}&sort=-publishedAt&depth=0`)
  return data ?? { docs: [], totalDocs: 0 }
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
  const data = await payloadFetch(`/brands?limit=100&sort=name&depth=1`)
  return data?.docs ?? []
}
