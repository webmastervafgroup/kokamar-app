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

/**
 * App podešavanja iz Payload `app-config` globala — prekidači za sekcije početne.
 * Default: sve uključeno osim hero (da ne pukne ako Payload nedostupan).
 */
export async function getAppConfig(): Promise<{
  prikaziHeroKaruzel: boolean
  prikaziNedeljneAkcije: boolean
  prikaziKategorije: boolean
  prikaziMesecnuAkciju: boolean
  prikaziBrendove: boolean
  prikaziBlog: boolean
  maintenanceMode: boolean
  maintenancePoruka?: string
}> {
  const d = await payloadFetch(`/globals/app-config?depth=0`)
  return {
    prikaziHeroKaruzel: d?.prikaziHeroKaruzel ?? false,
    prikaziNedeljneAkcije: d?.prikaziNedeljneAkcije ?? true,
    prikaziKategorije: d?.prikaziKategorije ?? true,
    prikaziMesecnuAkciju: d?.prikaziMesecnuAkciju ?? true,
    prikaziBrendove: d?.prikaziBrendove ?? true,
    prikaziBlog: d?.prikaziBlog ?? true,
    maintenanceMode: d?.maintenanceMode ?? false,
    maintenancePoruka: d?.maintenancePoruka,
  }
}

/** Pun URL za Payload media (apsolutni ili /cms prefiks). */
function payloadMediaUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith("http")) return url
  return `https://kokamar.rs/cms${url}`
}

/**
 * Mega Kokamar letak (flipbook) — global `mega-letak`.
 * Vraća { naslov, pdfUrl, strane[] } ako je aktivan i u periodu (vaziOd–vaziDo), inače null.
 */
export async function getMegaLetak() {
  const data = await payloadFetch(`/globals/mega-letak?depth=1`)
  if (!data?.aktivan) return null
  const now = new Date()
  if (data.vaziOd && new Date(data.vaziOd) > now) return null
  if (data.vaziDo && new Date(data.vaziDo) < now) return null
  const strane = (Array.isArray(data.flipStrane) ? data.flipStrane : [])
    .map((s: any) => payloadMediaUrl(s?.slika?.url))
    .filter((u: string | null): u is string => Boolean(u))
  if (strane.length === 0) return null
  return {
    naslov: data.naslov || "Mega Kokamar letak",
    pdfUrl: payloadMediaUrl(data.pdfFajl?.url),
    strane,
  }
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
  const data = await payloadFetch(`/promo-karuzeli?sort=redosled&limit=10&depth=2`)
  if (!data?.docs) return []
  const now = new Date()
  return data.docs.filter((k: any) => {
    if (k.aktivan === false) return false // ručno isključen override
    if (k.vaziDo && new Date(k.vaziDo) < now) return false
    if (k.vaziOd && new Date(k.vaziOd) > now) return false
    return true
  })
}
