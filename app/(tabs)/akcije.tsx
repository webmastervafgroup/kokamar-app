import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Linking, Image, Dimensions,
  TextInput,
} from "react-native"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getAkcijaProducts } from "@/lib/api/medusa"
import { getAkcijaLetak } from "@/lib/api/payload"
import { resolveProductPrice } from "@/lib/util/price"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, {
  FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring,
} from "react-native-reanimated"

const { width } = Dimensions.get("window")
const CARD_W = (width - 48) / 2

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ")
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`
}

function AkcijaCard({ item, index }: { item: any; index: number }) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const img = item.thumbnail || item.images?.[0]?.url
  const price = resolveProductPrice(item)

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(14)}>
    <Animated.View style={[styles.card, animStyle]}>
      <TouchableOpacity
        onPress={() => router.push(`/katalog/${item.handle}`)}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
        activeOpacity={1}
      >
        <View style={styles.akcijaTag}>
          <Text style={styles.akcijaTagText}>% POPUST</Text>
        </View>
        <View style={styles.imgBox}>
          {img ? (
            <Image source={{ uri: img }} style={styles.cardImage} resizeMode="contain" />
          ) : (
            <View style={styles.noImg}><Text style={{ fontSize: 36 }}>🛒</Text></View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{decodeHtml(item.title)}</Text>
          <View style={styles.priceBlock}>
            {price.formatted ? (
              <>
                {price.formattedCompare && (
                  <Text style={styles.priceOld}>{price.formattedCompare}</Text>
                )}
                <Text style={[styles.cardPrice, price.isOnSale && { color: Colors.primary }]}>
                  {price.formatted}
                </Text>
              </>
            ) : (
              <Text style={styles.priceNA}>Cena se formira</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    </Animated.View>
  )
}

export default function AkcijeScreen() {
  const [products, setProducts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [letak, setLetak] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default")

  useEffect(() => {
    Promise.all([getAkcijaProducts(), getAkcijaLetak()])
      .then(([prods, l]) => {
        setProducts(prods)
        setFiltered(prods)
        setLetak(l)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = [...products]
    if (search) result = result.filter(p =>
      decodeHtml(p.title ?? "").toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === "price_asc") result.sort((a, b) =>
      (a.variants?.[0]?.prices?.[0]?.amount ?? 0) - (b.variants?.[0]?.prices?.[0]?.amount ?? 0)
    )
    if (sortBy === "price_desc") result.sort((a, b) =>
      (b.variants?.[0]?.prices?.[0]?.amount ?? 0) - (a.variants?.[0]?.prices?.[0]?.amount ?? 0)
    )
    setFiltered(result)
  }, [search, sortBy, products])

  const letakUrl = letak?.pdfFajl?.url
    ? (letak.pdfFajl.url.startsWith("/api/")
      ? `https://kokamar.rs/cms${letak.pdfFajl.url}`
      : letak.pdfFajl.url)
    : null

  const cycleSortBy = () => {
    setSortBy(s => s === "default" ? "price_asc" : s === "price_asc" ? "price_desc" : "default")
  }

  return (
    <View style={styles.container}>
      {/* Header card */}
      <Animated.View entering={FadeInDown.delay(20).springify()}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>AKCIJE</Text>
              </View>
              <Text style={styles.headerTitle}>Akcije i popusti</Text>
              {letak?.vaziDo && (
                <Text style={styles.headerPeriod}>Važi do {formatDate(letak.vaziDo)}</Text>
              )}
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>{filtered.length}</Text>
              <Text style={styles.countLabel}>artikala</Text>
            </View>
          </View>

          {letakUrl && (
            <TouchableOpacity
              style={styles.letakBtn}
              onPress={() => Linking.openURL(letakUrl)}
              activeOpacity={0.85}
            >
              <View style={styles.letakIcon}>
                <Ionicons name="document-text-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.letakTitle}>{letak?.naslov || "Preuzmi letak"}</Text>
                <Text style={styles.letakSub}>
                  Otvori PDF{letak?.pdfFajl?.filesize
                    ? ` · ${(letak.pdfFajl.filesize / 1024 / 1024).toFixed(1)} MB`
                    : ""}
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Search + sort */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.toolbarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={Colors.g400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži promocije..."
            placeholderTextColor={Colors.g400}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color={Colors.g400} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.sortBtn, sortBy !== "default" && styles.sortBtnActive]}
          onPress={cycleSortBy}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={18}
            color={sortBy !== "default" ? Colors.white : Colors.foreground}
          />
          <Text style={[styles.sortBtnText, sortBy !== "default" && { color: Colors.white }]}>
            {sortBy === "price_asc" ? "Jeftinije" : sortBy === "price_desc" ? "Skuplje" : "Sortiraj"}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Products grid */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <AkcijaCard item={item} index={index} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Nema rezultata</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  headerCard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 8,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "900", color: "#fff", lineHeight: 28 },
  headerPeriod: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  countBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: "center",
  },
  countNum: { fontSize: FontSize.xl, fontWeight: "900", color: "#fff" },
  countLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  letakBtn: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: Radius.md,
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  letakIcon: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  letakTitle: { color: "#fff", fontWeight: "700", fontSize: FontSize.base },
  letakSub: { color: "rgba(255,255,255,0.7)", fontSize: FontSize.xs, marginTop: 2 },

  toolbarRow: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.foreground },
  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },

  grid: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 },
  card: {
    width: CARD_W, backgroundColor: Colors.white,
    borderRadius: Radius.lg, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  akcijaTag: {
    position: "absolute", top: 8, left: 8, zIndex: 1,
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  akcijaTagText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },
  imgBox: { height: 140, backgroundColor: Colors.g100, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  noImg: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 10 },
  cardName: {
    fontSize: FontSize.sm, fontWeight: "600",
    color: Colors.foreground, lineHeight: 17,
    minHeight: 34,
  },
  priceBlock: { marginTop: 6 },
  priceOld: { fontSize: 11, color: Colors.g400, textDecorationLine: "line-through", lineHeight: 14 },
  cardPrice: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.foreground },
  priceNA: { fontSize: FontSize.xs, color: Colors.g400, fontStyle: "italic" },
  empty: { padding: 60, alignItems: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.muted },
})
