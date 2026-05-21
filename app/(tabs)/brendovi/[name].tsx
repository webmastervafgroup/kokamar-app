import { useEffect, useState, useMemo, useRef } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Dimensions, ScrollView,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getProducts } from "@/lib/api/medusa"

// Memorijski cache — ostaje dok je app otvorena
const brandCache: Record<string, any[]> = {}
import { resolveProductPrice, isInAkcija } from "@/lib/util/price"

const { width } = Dimensions.get("window")
const CARD_W = (width - 48) / 2

function decodeHtml(str: string): string {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ")
}

function getCatNames(product: any): string[] {
  const tax: any[] = product.metadata?.taxonomies ?? []
  return tax
    .filter((t: any) => t.taxonomy === "product_cat")
    .map((t: any) => decodeHtml(String(t.name ?? "")).trim())
    .filter((n: string) => !n.toLowerCase().startsWith("akcija"))
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
          <View style={styles.imgBox}>
            {img
              ? <Image source={{ uri: img }} style={styles.cardImg} resizeMode="contain" />
              : <View style={styles.noImg}><Ionicons name="cart-outline" size={32} color={Colors.g400} /></View>
            }
            {akcija && <View style={styles.akcijaTag}><Text style={styles.akcijaTagText}>AKCIJA</Text></View>}
            {price.pctOff && <View style={styles.pctTag}><Text style={styles.pctTagText}>-{price.pctOff}%</Text></View>}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName} numberOfLines={2}>{decodeHtml(item.title)}</Text>
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                {price.formattedCompare && <Text style={styles.priceOld}>{price.formattedCompare}</Text>}
                {price.formatted
                  ? <Text style={styles.priceCurrent}>{price.formatted}</Text>
                  : <Text style={styles.priceNA}>Cena se formira</Text>
                }
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

export default function BrendSingleScreen() {
  const { name, logoUrl } = useLocalSearchParams<{ name: string; logoUrl?: string }>()
  const insets = useSafeAreaInsets()
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  useEffect(() => {
    if (!name) return
    // Iz cache-a odmah, bez loadera
    if (brandCache[name]) {
      setAllProducts(brandCache[name])
      setLoading(false)
      return
    }
    getProducts({ q: name, limit: 30 }).then((data) => {
      const sorted = (data.products ?? []).sort((a: any, b: any) =>
        (a.title ?? "").localeCompare(b.title ?? "", "sr")
      )
      brandCache[name] = sorted
      setAllProducts(sorted)
    }).finally(() => setLoading(false))
  }, [name])

  const categories = useMemo(() => {
    const set = new Set<string>()
    allProducts.forEach(p => getCatNames(p).forEach(c => set.add(c)))
    return Array.from(set).sort()
  }, [allProducts])

  const products = useMemo(() =>
    selectedCat ? allProducts.filter(p => getCatNames(p).includes(selectedCat)) : allProducts
  , [allProducts, selectedCat])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        removeClippedSubviews={true}
        columnWrapperStyle={{ gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* HEADER — identičan sa Više ekranom */}
            <View style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerTitle}>{name}</Text>
                  <Text style={styles.headerSub}>Artikli brenda u Kokamar ponudi</Text>
                </View>
                <View style={styles.countBox}>
                  <Text style={styles.countNum}>{loading ? "–" : allProducts.length}</Text>
                  <Text style={styles.countLabel}>artikala</Text>
                </View>
              </View>
            </View>

            {/* FILTER KATEGORIJA */}
            {!loading && categories.length > 0 && (
              <FlatList
                data={[{ name: "Sve", val: null }, ...categories.map(c => ({ name: c, val: c }))]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.name}
                contentContainerStyle={styles.catList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.catChip, selectedCat === item.val && styles.catChipActive]}
                    onPress={() => setSelectedCat(item.val)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.catChipText, selectedCat === item.val && styles.catChipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />}
          </>
        }
        ListEmptyComponent={!loading
          ? <View style={styles.empty}><Ionicons name="cube-outline" size={48} color={Colors.g200} /><Text style={styles.emptyText}>Nema artikala</Text></View>
          : null
        }
        renderItem={({ item, index }) => <ProdCard item={item} index={index} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Identično sa vise.tsx
  headerCard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    marginHorizontal: -16,
  },
  headerTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff", marginBottom: 6 },
  headerSub: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  countBox: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: "center",
  },
  countNum: { fontSize: FontSize.xl, fontWeight: "900", color: "#fff" },
  countLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  catList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: "center", marginHorizontal: -16 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, height: 36,
    borderRadius: Radius.full, justifyContent: "center",
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },
  catChipTextActive: { color: Colors.white },

  grid: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, paddingTop: 0 },
  card: {
    width: CARD_W, backgroundColor: Colors.white, borderRadius: Radius.lg,
    overflow: "hidden", borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  imgBox: { width: "100%", height: 150, backgroundColor: Colors.g100, overflow: "hidden" },
  cardImg: { width: "100%", height: "100%" },
  noImg: { flex: 1, justifyContent: "center", alignItems: "center" },
  akcijaTag: {
    position: "absolute", top: 0, left: 0, zIndex: 1,
    backgroundColor: "#ffd400", borderBottomRightRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  akcijaTagText: { color: "#1a1a1a", fontSize: 9, fontWeight: "800" },
  pctTag: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: Colors.accent, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  pctTagText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  cardBody: { padding: 10, minHeight: 82, justifyContent: "space-between" },
  cardName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground, lineHeight: 17, minHeight: 34 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 },
  priceOld: { fontSize: 10, color: Colors.g400, textDecorationLine: "line-through" },
  priceCurrent: { fontSize: FontSize.md, fontWeight: "800", color: Colors.primary },
  priceNA: { fontSize: FontSize.xs, color: Colors.g400, fontStyle: "italic" },
  arrowCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.muted },
})
