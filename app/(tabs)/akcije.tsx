import { useEffect, useState, useCallback } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Linking, Image, Dimensions,
  TextInput, StatusBar, RefreshControl,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getAkcijaProducts } from "@/lib/api/medusa"
import { getAkcijaLetak } from "@/lib/api/payload"
import { resolveProductPrice } from "@/lib/util/price"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import { SkeletonGrid } from "@/components/SkeletonCard"
import { SortBottomSheet } from "@/components/SortBottomSheet"
import Animated, {
  FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring,
} from "react-native-reanimated"
import { OfflineBanner } from "@/components/OfflineBanner"

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
          <Text style={styles.akcijaTagText}>AKCIJA</Text>
        </View>
        <View style={styles.imgBox}>
          {img ? (
            <Image source={{ uri: img }} style={styles.cardImage} resizeMode="contain" />
          ) : (
            <View style={styles.noImg}><Ionicons name="cart-outline" size={36} color={Colors.g400} /></View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{decodeHtml(item.title)}</Text>
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              {price.formattedCompare && (
                <Text style={styles.priceOld}>{price.formattedCompare}</Text>
              )}
              {price.formatted ? (
                <Text style={styles.cardPrice}>{price.formatted}</Text>
              ) : (
                <Text style={styles.priceNA}>Cena se formira</Text>
              )}
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
    </Animated.View>
  )
}

export default function AkcijeScreen() {
  const insets = useSafeAreaInsets()
  const [products, setProducts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [letak, setLetak] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default")
  const [showSort, setShowSort] = useState(false)
  const SORT_OPTIONS_AKCIJE = [
    { key: "default", label: "Podrazumevano", icon: "apps-outline" as const },
    { key: "price_asc", label: "Cena rastuće ↑", icon: "trending-up-outline" as const },
    { key: "price_desc", label: "Cena opadajuće ↓", icon: "trending-down-outline" as const },
  ]

  const fetchData = useCallback(() => {
    const t = Date.now()
    return Promise.all([getAkcijaProducts(), getAkcijaLetak()])
      .then(([prods, l]) => {
        setProducts(prods)
        setFiltered(prods)
        setLetak(l)
      })
      .finally(() => {
        const elapsed = Date.now() - t
        const delay = Math.max(0, 600 - elapsed)
        setTimeout(() => { setLoading(false); setRefreshing(false) }, delay)
      })
  }, [])

  useEffect(() => { fetchData() }, [])

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData() }, [])

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <OfflineBanner />
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
          onPress={() => setShowSort(true)}
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

      <SortBottomSheet
        visible={showSort}
        onClose={() => setShowSort(false)}
        options={SORT_OPTIONS_AKCIJE}
        selected={sortBy}
        onSelect={(key) => setSortBy(key as typeof sortBy)}
        title="Sortiraj akcije"
      />

      {/* Products grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          renderItem={({ item, index }) => <AkcijaCard item={item} index={index} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.g200} />
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
    position: "absolute", top: 0, left: 0, zIndex: 1,
    backgroundColor: "#ffd400",
    borderBottomRightRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  akcijaTagText: { color: "#1a1a1a", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  imgBox: { height: 140, backgroundColor: Colors.g100, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  noImg: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 10 },
  cardName: {
    fontSize: FontSize.sm, fontWeight: "600",
    color: Colors.foreground, lineHeight: 17,
    minHeight: 34,
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 },
  priceOld: { fontSize: 10, color: Colors.g400, textDecorationLine: "line-through", lineHeight: 13, marginBottom: 1 },
  cardPrice: { fontSize: FontSize.md, fontWeight: "800", color: Colors.primary },
  priceNA: { fontSize: FontSize.xs, color: Colors.g400, fontStyle: "italic" },
  arrowCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  empty: { padding: 60, alignItems: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.muted },
})
