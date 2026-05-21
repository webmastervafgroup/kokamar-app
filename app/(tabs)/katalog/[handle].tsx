import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity, StatusBar, Dimensions, Share,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getProduct, getProducts } from "@/lib/api/medusa"
import { resolveProductPrice, isInAkcija } from "@/lib/util/price"
import { getBrandByName } from "@/lib/api/payload"

const { width } = Dimensions.get("window")
const SIMILAR_W = (width - 48) / 2.3

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ")
}

function stripHtml(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ").replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim()
}

const LOCATIONS = [
  { id: "1", name: "Voždovac — Kruševačka", address: "Kruševačka 1", slug: "radnja-1-vozdovac-krusevacka" },
  { id: "2", name: "Mega Kaluđerica", address: "Vojvode Stepe Stepanovića 9", slug: "mega-kokamar-kaludjerica" },
  { id: "3", name: "Mega Ripanj", address: "Kragujevački put 118", slug: "mega-kokamar-ripanj" },
  { id: "4", name: "Mega Makiš", address: "Bore Stankovića 18a", slug: "mega-kokamar-makis" },
  { id: "5", name: "Kumodraška", address: "Kumodraška 121", slug: "kokamar-kumodraska" },
  { id: "6", name: "Milutinovića", address: "Ivana Milutinovića 89V", slug: "kokamar-milutenovica" },
  { id: "7", name: "Voždovac — Vojvode Stepe", address: "Vojvode Stepe 224", slug: "kokamar-vozdovac-vojvode-stepe" },
  { id: "8", name: "Zvezdara", address: "Smederevski put 18ž", slug: "kokamar-zvezdara" },
  { id: "9", name: "Banjica", address: "Paunova 3b", slug: "kokamar-banjica" },
  { id: "10", name: "Novi Beograd — Gagarina", address: "Jurija Gagarina 81", slug: "kokamar-novi-beograd-gagarina" },
]

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [product, setProduct] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null)
  const [showLocPicker, setShowLocPicker] = useState(false)
  const [brandLogo, setBrandLogo] = useState<string | null>(null)

  useEffect(() => {
    if (!handle) return
    getProduct(handle).then((p) => {
      setProduct(p)
      // Učitaj brend logo iz Payload
      const tax = p?.metadata?.taxonomies ?? []
      const bTax = tax.find((t: any) => t.taxonomy === "pa_brand" || t.taxonomy === "product_brand")
      const bMeta = typeof p?.metadata?.brand === "string" ? p.metadata.brand : p?.metadata?.brand?.name
      const bName = bTax?.name || bMeta
      if (bName) getBrandByName(bName).then(b => { if (b?.logoUrl) setBrandLogo(b.logoUrl) })
      // Učitaj slične iz iste kategorije
      const catId = p?.categories?.find((c: any) =>
        !c.name?.toLowerCase().startsWith("akcija")
      )?.id
      if (catId) {
        getProducts({ categoryId: catId, limit: 8 })
          .then((d) => setSimilar((d.products ?? []).filter((x: any) => x.handle !== handle).slice(0, 6)))
      }
    }).finally(() => setLoading(false))
  }, [handle])

  if (loading) return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  )

  if (!product) return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <Text style={styles.notFound}>Proizvod nije pronađen</Text>
    </View>
  )

  const images: any[] = product.images ?? []
  const displayImg = images[imgIdx]?.url || product.thumbnail
  const price = resolveProductPrice(product)
  const akcija = isInAkcija(product)

  // Sve iz metadata.taxonomies — jedini pouzdan izvor
  const taxonomies: any[] = product.metadata?.taxonomies ?? []

  const allCatNames = taxonomies
    .filter((t: any) => t.taxonomy === "product_cat")
    .map((t: any) => decodeHtml(String(t.name ?? "")).trim())
    .filter(Boolean)

  const akcijaCatNames = allCatNames.filter(n => n.toLowerCase().startsWith("akcija"))
  const displayCats = allCatNames.filter(n => !n.toLowerCase().startsWith("akcija"))

  const brandTax = taxonomies.find((t: any) =>
    t.taxonomy === "pa_brand" || t.taxonomy === "product_brand"
  )
  const brandMeta = typeof product.metadata?.brand === "string"
    ? product.metadata.brand : product.metadata?.brand?.name ?? ""
  const brandName = decodeHtml(brandTax?.name || brandMeta || "")

  const marketTypes = taxonomies
    .filter((t: any) => t.taxonomy === "pa_tip-marketa")
    .map((t: any) => decodeHtml(String(t.name ?? "")).trim())
    .filter(Boolean)

  const descText = product.description ? stripHtml(product.description) : ""

  const selectedLocObj = LOCATIONS.find(l => l.id === selectedLoc)

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header — kao Akcije ekran */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            {akcija && (
              <View style={styles.headerAkcijaBadge}>
                <Text style={styles.headerAkcijaTekst}>AKCIJA</Text>
              </View>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {decodeHtml(product.title)}
            </Text>
          </View>
          {displayCats.length > 0 && (
            <Text style={styles.headerCat} numberOfLines={1}>
              {displayCats[0]}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => Share.share({
            title: decodeHtml(product.title),
            message: `${decodeHtml(product.title)}\nhttps://kokamar.rs/products/${product.handle}`,
            url: `https://kokamar.rs/products/${product.handle}`,
          })}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Slika */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.imageSection}>
          {akcija && (
            <View style={styles.akcijaTag}>
              <Text style={styles.akcijaTagText}>AKCIJA</Text>
            </View>
          )}
          {displayImg ? (
            <Image source={{ uri: displayImg }} style={styles.mainImage} resizeMode="contain" />
          ) : (
            <View style={[styles.mainImage, styles.noImage]}>
              <Ionicons name="cart-outline" size={64} color={Colors.g400} />
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.thumbRow}>
              {images.map((im: any, i: number) => (
                <TouchableOpacity key={i} onPress={() => setImgIdx(i)} activeOpacity={0.8}>
                  <Image
                    source={{ uri: im.url }}
                    style={[styles.thumb, imgIdx === i && styles.thumbActive]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Naziv + cijena */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.mainCard}>
          <Text style={styles.prodTitle}>{decodeHtml(product.title)}</Text>
          <View style={styles.priceSection}>
            {price.formattedCompare && (
              <Text style={styles.priceOld}>{price.formattedCompare}</Text>
            )}
            <View style={styles.priceRow}>
              {price.formatted ? (
                <Text style={styles.price}>{price.formatted}</Text>
              ) : (
                <Text style={styles.priceNA}>Cena se formira</Text>
              )}
              {price.pctOff && (
                <View style={styles.pctBadge}>
                  <Text style={styles.pctText}>-{price.pctOff}%</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Dostupnost u prodavnicama */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.availCard}>
          <View style={styles.availHeader}>
            <View style={styles.availDot} />
            <Text style={styles.availTitle}>Dostupno u prodavnicama</Text>
          </View>
          <Text style={styles.availDesc}>
            Proveri dostupnost u prodavnici izborom željene lokacije.{"\n"}
            U meniju pored odaberi radnju — prikazuju se adresa.
          </Text>

          {/* Picker lokacije */}
          <TouchableOpacity
            style={styles.locPicker}
            onPress={() => setShowLocPicker(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={16} color={Colors.primary} />
            <Text style={styles.locPickerText}>
              {selectedLocObj ? selectedLocObj.name : "Izaberite prodavnicu"}
            </Text>
            <Ionicons name={showLocPicker ? "chevron-up" : "chevron-down"} size={16} color={Colors.g400} />
          </TouchableOpacity>

          {showLocPicker && (
            <View style={styles.locList}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.locItem, selectedLoc === loc.id && styles.locItemActive]}
                  onPress={() => {
                    setSelectedLoc(loc.id)
                    setShowLocPicker(false)
                    router.push(`/lokacije/${loc.slug}`)
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={14}
                    color={selectedLoc === loc.id ? Colors.primary : Colors.muted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.locName, selectedLoc === loc.id && { color: Colors.primary }]}>
                      {loc.name}
                    </Text>
                    <Text style={styles.locAddr}>{loc.address}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.g400} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.availNotice}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.muted} />
            <Text style={styles.availNoticeText}>
              Asortiman i stanje variraju po lokaciji. Za tačan izbor posetite najbližu prodavnicu.
            </Text>
          </View>
          <View style={styles.availNotice}>
            <Ionicons name="close-circle-outline" size={14} color={Colors.muted} />
            <Text style={styles.availNoticeText}>
              Online kupovina i dostava na adresu nisu dostupne — kupovina isključivo u prodavnicama.
            </Text>
          </View>
        </Animated.View>

        {/* Info tabela */}
        <Animated.View entering={FadeInDown.delay(110).springify()} style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>Informacije o proizvodu</Text>
          </View>
          {displayCats.length > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Kategorija</Text>
              <Text style={styles.tableValue}>{displayCats.join(", ")}</Text>
            </View>
          )}
          {brandName ? (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Brend</Text>
              <View style={styles.brandRow}>
                {brandLogo && (
                  <Image
                    source={{ uri: brandLogo }}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.tableValue}>{brandName}</Text>
              </View>
            </View>
          ) : null}
          {marketTypes.length > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Tip marketa</Text>
              <Text style={styles.tableValue}>{marketTypes.join(" · ")}</Text>
            </View>
          )}
          {akcijaCatNames.length > 0 && (
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>Akcija</Text>
              <Text style={[styles.tableValue, { color: Colors.primary }]}>
                {akcijaCatNames[0]}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Opis */}
        {descText ? (
          <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.descCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccent} />
              <Text style={styles.cardTitle}>Opis</Text>
            </View>
            <Text style={styles.descText} numberOfLines={descExpanded ? undefined : 5}>
              {decodeHtml(descText)}
            </Text>
            {descText.length > 250 && (
              <TouchableOpacity
                onPress={() => setDescExpanded(v => !v)}
                style={styles.expandBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.expandText}>
                  {descExpanded ? "Prikaži manje" : "Prikaži više"}
                </Text>
                <Ionicons
                  name={descExpanded ? "chevron-up" : "chevron-down"}
                  size={14} color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : null}

        {/* Slični proizvodi */}
        {similar.length > 0 && (
          <Animated.View entering={FadeInDown.delay(170).springify()} style={styles.similarSection}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccent} />
              <Text style={styles.cardTitle}>Slični proizvodi</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
            >
              {similar.map((item: any, i: number) => {
                const p = resolveProductPrice(item)
                const img = item.thumbnail || item.images?.[0]?.url
                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInRight.delay(i * 40).springify()}
                  >
                    <TouchableOpacity
                      style={styles.similarCard}
                      onPress={() => router.push(`/katalog/${item.handle}`)}
                      activeOpacity={0.8}
                    >
                      {isInAkcija(item) && (
                        <View style={styles.simAkcijaTag}>
                          <Text style={styles.simAkcijaText}>AKCIJA</Text>
                        </View>
                      )}
                      <View style={styles.simImgBox}>
                        {img ? (
                          <Image source={{ uri: img }} style={styles.simImg} resizeMode="contain" />
                        ) : (
                          <Ionicons name="cart-outline" size={28} color={Colors.g400} />
                        )}
                      </View>
                      <Text style={styles.simName} numberOfLines={2}>
                        {decodeHtml(item.title)}
                      </Text>
                      {p.formatted ? (
                        <Text style={styles.simPrice}>{p.formatted}</Text>
                      ) : (
                        <Text style={styles.simPriceNA}>Cena se formira</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                )
              })}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: FontSize.base, color: Colors.muted },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 14,
  },
  backBtn: { padding: 8, width: 42 },
  shareBtn: { padding: 8, width: 42, alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", gap: 3 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  headerAkcijaBadge: {
    backgroundColor: "#ffd400",
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    flexShrink: 0,
  },
  headerAkcijaTekst: { fontSize: 9, fontWeight: "800", color: "#1a1a1a", letterSpacing: 0.5 },
  headerTitle: { fontSize: FontSize.sm, fontWeight: "700", color: "#fff", textAlign: "center", flexShrink: 1 },
  headerCat: { fontSize: 10, color: "rgba(255,255,255,0.7)", textAlign: "center" },

  container: { flex: 1 },

  imageSection: {
    backgroundColor: Colors.white,
    paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  akcijaTag: {
    position: "absolute", top: 0, left: 0, zIndex: 2,
    backgroundColor: "#ffd400", borderBottomRightRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  akcijaTagText: { color: "#1a1a1a", fontSize: 11, fontWeight: "800" },
  mainImage: { width: width - 40, height: 250 },
  noImage: { justifyContent: "center", alignItems: "center", backgroundColor: Colors.g100, borderRadius: Radius.lg },
  thumbRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  thumb: { width: 54, height: 54, borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border },
  thumbActive: { borderColor: Colors.primary },

  mainCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    gap: 10,
  },
  prodTitle: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.foreground, lineHeight: 26 },
  priceSection: { gap: 2 },
  priceOld: { fontSize: FontSize.sm, color: Colors.g400, textDecorationLine: "line-through" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontSize: 30, fontWeight: "900", color: Colors.primary },
  pctBadge: { backgroundColor: "#ffd400", borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  pctText: { fontSize: FontSize.sm, fontWeight: "800", color: "#1a1a1a" },
  priceNA: { fontSize: FontSize.base, color: Colors.muted, fontStyle: "italic" },

  availCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    gap: 10,
  },
  availHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  availTitle: { fontSize: FontSize.base, fontWeight: "800", color: Colors.foreground },
  availDesc: { fontSize: FontSize.sm, color: Colors.muted, lineHeight: 18 },
  locPicker: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.primary + "55",
  },
  locPickerText: { flex: 1, fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },
  locList: {
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  locItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  locItemActive: { backgroundColor: Colors.primaryLight },
  locName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },
  locAddr: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  availNotice: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
  availNoticeText: { flex: 1, fontSize: FontSize.xs, color: Colors.muted, lineHeight: 16 },

  infoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.g100,
  },
  cardAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: Colors.primary },
  cardTitle: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.foreground, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: {
    flexDirection: "row", paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableLabel: { width: 100, fontSize: FontSize.sm, color: Colors.muted, fontWeight: "500" },
  tableValue: { flex: 1, fontSize: FontSize.sm, color: Colors.foreground, fontWeight: "600", lineHeight: 18 },
  brandRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo: { width: 36, height: 24, borderRadius: 4, backgroundColor: Colors.g100 },

  descCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  descText: { fontSize: FontSize.sm, color: Colors.muted, lineHeight: 20, padding: 14 },
  expandBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  expandText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "700" },

  similarSection: {
    marginTop: 12,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  similarList: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  similarCard: {
    width: SIMILAR_W,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  simAkcijaTag: {
    position: "absolute", top: 0, left: 0, zIndex: 1,
    backgroundColor: "#ffd400", borderBottomRightRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  simAkcijaText: { fontSize: 8, fontWeight: "800", color: "#1a1a1a" },
  simImgBox: {
    height: 100, backgroundColor: Colors.white,
    justifyContent: "center", alignItems: "center",
  },
  simImg: { width: "100%", height: "100%" },
  simName: {
    fontSize: FontSize.xs, fontWeight: "600", color: Colors.foreground,
    paddingHorizontal: 8, paddingTop: 6, lineHeight: 15, minHeight: 30,
  },
  simPrice: {
    fontSize: FontSize.sm, fontWeight: "800", color: Colors.primary,
    paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2,
  },
  simPriceNA: {
    fontSize: FontSize.xs, color: Colors.g400, fontStyle: "italic",
    paddingHorizontal: 8, paddingBottom: 8,
  },
})
