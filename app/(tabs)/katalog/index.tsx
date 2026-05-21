import { useEffect, useState, useRef, useCallback } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, TextInput, Dimensions, Image, StatusBar, RefreshControl,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getCategories, getProducts } from "@/lib/api/medusa"
import { resolveProductPrice, isInAkcija } from "@/lib/util/price"
import { OfflineBanner } from "@/components/OfflineBanner"
import { useSearchHistory } from "@/hooks/useSearchHistory"
import { SkeletonGrid } from "@/components/SkeletonCard"
import { hapticLight } from "@/hooks/useHaptic"
import { SortBottomSheet } from "@/components/SortBottomSheet"

const { width } = Dimensions.get("window")
const CARD_W = (width - 48) / 2
const IMG_H = 150

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ")
}

type SortKey = "default" | "price_asc" | "price_desc" | "name_asc"

function sortProducts(arr: any[], sort: SortKey): any[] {
  const copy = [...arr]
  if (sort === "price_asc") return copy.sort((a, b) => {
    const pa = resolveProductPrice(a).current ?? 99999
    const pb = resolveProductPrice(b).current ?? 99999
    return pa - pb
  })
  if (sort === "price_desc") return copy.sort((a, b) => {
    const pa = resolveProductPrice(a).current ?? 0
    const pb = resolveProductPrice(b).current ?? 0
    return pb - pa
  })
  if (sort === "name_asc") return copy.sort((a, b) =>
    decodeHtml(a.title ?? "").localeCompare(decodeHtml(b.title ?? ""), "sr")
  )
  // default: akcija prve
  return copy.sort((a, b) => {
    const ia = isInAkcija(a) ? 0 : 1
    const ib = isInAkcija(b) ? 0 : 1
    return ia - ib
  })
}

function ProdCard({ item, index }: { item: any; index: number }) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const img = item.thumbnail || item.images?.[0]?.url
  const price = resolveProductPrice(item)
  const akcija = isInAkcija(item)

  return (
    <Animated.View entering={FadeInDown.delay(index * 25).springify().damping(16)}>
      <Animated.View style={animStyle}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/katalog/${item.handle}`)}
          onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }) }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
          activeOpacity={1}
        >
          {/* Slika — fiksna visina */}
          <View style={styles.imgBox}>
            {img ? (
              <Image source={{ uri: img }} style={styles.cardImage} resizeMode="contain" />
            ) : (
              <View style={styles.noImg}><Ionicons name="cart-outline" size={32} color={Colors.g400} /></View>
            )}
            {/* Akcija badge - GORE LIJEVO */}
            {akcija && (
              <View style={styles.akcijaTag}>
                <Text style={styles.akcijaTagText}>AKCIJA</Text>
              </View>
            )}
            {/* % popust badge - GORE DESNO */}
            {price.pctOff && (
              <View style={styles.pctTag}>
                <Text style={styles.pctTagText}>-{price.pctOff}%</Text>
              </View>
            )}
          </View>

          {/* Naziv — fiksne 2 linije uvijek */}
          <View style={styles.cardBody}>
            <Text style={styles.cardName} numberOfLines={2}>{decodeHtml(item.title)}</Text>

            {/* Cijena */}
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                {price.formattedCompare && (
                  <Text style={styles.priceOld}>{price.formattedCompare}</Text>
                )}
                {price.formatted ? (
                  <Text style={styles.priceCurrent}>{price.formatted}</Text>
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

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Akcije prve" },
  { key: "price_asc", label: "Cena ↑" },
  { key: "price_desc", label: "Cena ↓" },
  { key: "name_asc", label: "A–Z" },
]

export default function KatalogScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string; q?: string }>()
  const [categories, setCategories] = useState<any[]>([])
  const [rawProducts, setRawProducts] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("default")
  const [showSort, setShowSort] = useState(false)
  const SORT_SHEET_OPTIONS = [
    { key: "default", label: "Akcije prve", icon: "pricetag-outline" as const },
    { key: "price_asc", label: "Cena rastuće ↑", icon: "trending-up-outline" as const },
    { key: "price_desc", label: "Cena opadajuće ↓", icon: "trending-down-outline" as const },
    { key: "name_asc", label: "Naziv A–Z", icon: "text-outline" as const },
  ]
  const [loading, setLoading] = useState(true)
  const [prodLoading, setProdLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { history, addToHistory, clearHistory, removeItem } = useSearchHistory()

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats)
      // Ako je prosleđen q param (npr. sa Brendovi), uradi search
      if (params.q) {
        setSearch(params.q)
        setProdLoading(true)
        getProducts({ q: params.q, limit: 60 })
          .then((data) => setRawProducts(data.products ?? []))
          .finally(() => { setProdLoading(false); setLoading(false) })
        return
      }
      // Ako je prosleđen categoryId (npr. sa početne), selektuj tu kategoriju
      const initId = params.categoryId ?? (cats.length > 0 ? cats[0].id : null)
      const initName = params.categoryName ?? (cats.length > 0 ? cats[0].name : "")
      if (initId) {
        setSelected(initId)
        setSelectedName(initName)
        fetchProducts(initId)
      } else {
        setLoading(false)
      }
    })
  }, [])

  // Reaguj na promenu params (kad se naviguje iz početne sa drugom kategorijom)
  useEffect(() => {
    if (params.categoryId && params.categoryId !== selected) {
      setSelected(params.categoryId)
      setSelectedName(params.categoryName ?? "")
      setSearch("")
      fetchProducts(params.categoryId)
    }
  }, [params.categoryId])

  function fetchProducts(categoryId: string) {
    setProdLoading(true)
    const t = Date.now()
    getProducts({ categoryId, limit: 100 })
      .then((data) => setRawProducts(data.products ?? []))
      .finally(() => {
        const elapsed = Date.now() - t
        const delay = Math.max(0, 600 - elapsed)
        setTimeout(() => { setProdLoading(false); setLoading(false); setRefreshing(false) }, delay)
      })
  }

  const onRefresh = useCallback(() => {
    if (selected) { setRefreshing(true); fetchProducts(selected) }
  }, [selected])

  function handleSearch(text: string) {
    setSearch(text)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (text.length === 0 && selected) {
      fetchProducts(selected)
      return
    }
    if (text.length < 3) return
    searchTimer.current = setTimeout(() => {
      addToHistory(text)
      setProdLoading(true)
      getProducts({ q: text, limit: 60 })
        .then((data) => setRawProducts(data.products ?? []))
        .finally(() => setProdLoading(false))
    }, 400)
  }

  function selectCategory(id: string, name: string) {
    setSelected(id)
    setSelectedName(name)
    setSearch("")
    fetchProducts(id)
  }

  const products = sortProducts(rawProducts, sort)

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.g400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži artikle..."
            placeholderTextColor={Colors.g400}
            value={search}
            onChangeText={handleSearch}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(""); setShowHistory(false); if (selected) fetchProducts(selected) }}>
              <Ionicons name="close-circle" size={18} color={Colors.g400} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sort dugme */}
        <TouchableOpacity
          style={[styles.sortBtn, sort !== "default" && styles.sortBtnActive]}
          onPress={() => setShowSort(v => !v)}
        >
          <Ionicons name="funnel-outline" size={17} color={sort !== "default" ? "#fff" : Colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Search istorija */}
      {showHistory && !search && history.length > 0 && (
        <View style={styles.historyBox}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Poslednje pretrage</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.historyClear}>Obriši sve</Text>
            </TouchableOpacity>
          </View>
          {history.map((term) => (
            <TouchableOpacity
              key={term}
              style={styles.historyItem}
              onPress={() => { setShowHistory(false); handleSearch(term); }}
            >
              <Ionicons name="time-outline" size={15} color={Colors.muted} />
              <Text style={styles.historyTerm}>{term}</Text>
              <TouchableOpacity onPress={() => removeItem(term)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={14} color={Colors.g400} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sort bottom sheet */}
      <SortBottomSheet
        visible={showSort}
        onClose={() => setShowSort(false)}
        options={SORT_SHEET_OPTIONS}
        selected={sort}
        onSelect={(key) => setSort(key as SortKey)}
        title="Sortiraj artikle"
      />

      {/* Kategorije chip scroll */}
      {!loading && (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selected === item.id && styles.catChipActive]}
              onPress={() => selectCategory(item.id, item.name)}
              activeOpacity={0.75}
            >
              <Text style={[styles.catChipText, selected === item.id && styles.catChipTextActive]}>
                {decodeHtml(item.name)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Info row */}
      {!loading && !search && selectedName && (
        <View style={styles.infoRow}>
          <Text style={styles.infoTitle}>{decodeHtml(selectedName)}</Text>
          {!prodLoading && (
            <Text style={styles.infoCount}>{products.length} art.</Text>
          )}
        </View>
      )}
      {search && !prodLoading && (
        <View style={styles.infoRow}>
          <Text style={styles.infoTitle}>Rezultati: "{search}"</Text>
          <Text style={styles.infoCount}>{products.length}</Text>
        </View>
      )}

      {/* Products */}
      {(loading || prodLoading) ? (
        <SkeletonGrid count={6} />
      ) : (
        <FlatList
          key={selected ?? "search"}
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <ProdCard item={item} index={index} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.g200} />
              <Text style={styles.emptyText}>Nema artikala</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  searchWrap: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.foreground },
  sortBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    justifyContent: "center", alignItems: "center",
  },
  sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  historyBox: {
    marginHorizontal: 16, marginBottom: 6,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 6,
    zIndex: 100,
  },
  historyHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  historyTitle: { fontSize: 11, fontWeight: "700", color: Colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  historyClear: { fontSize: 11, color: Colors.primary, fontWeight: "600" },
  historyItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  historyTerm: { flex: 1, fontSize: FontSize.base, color: Colors.foreground },

  sortDropdown: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
  },
  sortOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sortOptionActive: { backgroundColor: Colors.primaryLight },
  sortOptionText: { fontSize: FontSize.base, color: Colors.foreground, fontWeight: "500" },
  sortOptionTextActive: { color: Colors.primary, fontWeight: "700" },

  catList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: "center" },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    height: 38, justifyContent: "center",
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },
  catChipTextActive: { color: Colors.white },

  infoRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 8,
  },
  infoTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground },
  infoCount: { fontSize: FontSize.xs, color: Colors.muted },

  grid: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  // Kartica — FIKSNA VISINA
  card: {
    width: CARD_W,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  imgBox: {
    width: "100%", height: IMG_H,
    backgroundColor: Colors.g100,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%" },
  noImg: { flex: 1, justifyContent: "center", alignItems: "center" },

  akcijaTag: {
    position: "absolute", top: 0, left: 0, zIndex: 1,
    backgroundColor: "#ffd400",
    borderBottomRightRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  akcijaTagText: { color: "#1a1a1a", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  pctTag: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: Colors.accent,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  pctTagText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  cardBody: {
    padding: 10,
    // Fiksna visina tijela: 2 linije naziva + cijena = uvijek iste kartice
    minHeight: 82,
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: FontSize.sm, fontWeight: "600",
    color: Colors.foreground, lineHeight: 17,
    minHeight: 34, // 2 linije uvijek
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 },
  priceOld: { fontSize: 10, color: Colors.g400, textDecorationLine: "line-through", lineHeight: 13, marginBottom: 1 },
  priceCurrent: { fontSize: FontSize.md, fontWeight: "800", color: Colors.primary, lineHeight: 20 },
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
