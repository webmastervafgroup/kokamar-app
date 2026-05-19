import { useEffect, useState } from "react"
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, FlatList, StatusBar,
} from "react-native"
import { useRouter } from "expo-router"
import Animated, {
  FadeInDown, FadeInRight, useAnimatedStyle,
  useSharedValue, withSpring, withTiming, interpolate,
} from "react-native-reanimated"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getCategories, getAkcijaProducts } from "@/lib/api/medusa"
import { getAkcijaLetak } from "@/lib/api/payload"

const { width } = Dimensions.get("window")
const CARD_W = (width - 48) / 2

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`
}

const CAT_EMOJIS: Record<string, string> = {
  "meso": "🥩", "mlecni": "🧀", "mlecn": "🧀", "mleko": "🥛", "pekara": "🥖",
  "torte": "🎂", "kolaci": "🍰", "voce": "🍎", "povrce": "🥦",
  "pice": "🥤", "kafa": "☕", "caj": "🍵", "konditorski": "🍫",
  "zamrznuta": "🧊", "hemija": "🧴", "higijen": "🧼", "decija": "👶",
  "snacks": "🍿", "grickalice": "🍿", "delikatesi": "🫙",
  "zacini": "🌶️", "ulje": "🫙", "brasno": "🌾", "secer": "🍬",
  "testenina": "🍝", "zitarice": "🌾", "riba": "🐟", "jaja": "🥚",
  "supe": "🍲", "konzerv": "🥫", "slatkisi": "🍬", "griz": "🌾",
}

function getCatEmoji(name: string): string {
  const lower = name.toLowerCase()
    .replace(/š/g, "s").replace(/č/g, "c").replace(/ć/g, "c")
    .replace(/ž/g, "z").replace(/đ/g, "d").replace(/ñ/g, "n")
  for (const [key, emoji] of Object.entries(CAT_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return "🛒"
}

function ProdCard({ item, index }: { item: any; index: number }) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const img = item.thumbnail || item.images?.[0]?.url
  const price = item.variants?.[0]?.prices?.[0]?.amount

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(14)}>
    <Animated.View style={[styles.prodCard, animStyle]}>
      <TouchableOpacity
        onPress={() => router.push(`/katalog/${item.handle}`)}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
        activeOpacity={1}
      >
        <View style={styles.akcijaTag}>
          <Text style={styles.akcijaTagText}>% AKCIJA</Text>
        </View>
        <View style={styles.prodImgBox}>
          {img ? (
            <Image source={{ uri: img }} style={styles.prodImg} resizeMode="contain" />
          ) : (
            <Text style={{ fontSize: 44 }}>🛒</Text>
          )}
        </View>
        <Text style={styles.prodName} numberOfLines={2}>{decodeHtml(item.title)}</Text>
        {price && (
          <View style={styles.priceRow}>
            <Text style={styles.prodPrice}>{(price / 100).toLocaleString("sr-RS")}</Text>
            <Text style={styles.prodPriceCur}> RSD</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
    </Animated.View>
  )
}

function CategoryItem({ item, index }: { item: any; index: number }) {
  const router = useRouter()

  return (
    <Animated.View entering={FadeInRight.delay(index * 35).springify().damping(16)}>
      <TouchableOpacity
        style={styles.catItem}
        onPress={() => router.push(`/katalog/${item.handle}`)}
        activeOpacity={0.7}
      >
        <View style={styles.catCircle}>
          <Text style={styles.catEmoji}>{getCatEmoji(item.name)}</Text>
        </View>
        <Text style={styles.catName} numberOfLines={2}>
          {decodeHtml(item.name)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [akcijaProducts, setAkcijaProducts] = useState<any[]>([])
  const [letak, setLetak] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCategories(), getAkcijaLetak(), getAkcijaProducts()])
      .then(([cats, l, prods]) => {
        setCategories(cats.slice(0, 14))
        setLetak(l)
        setAkcijaProducts(prods.slice(0, 10))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Akcija promo bar */}
      <Animated.View entering={FadeInDown.delay(40).springify().damping(16)} style={styles.promoWrap}>
        <TouchableOpacity
          style={styles.promoBar}
          onPress={() => router.push("/(tabs)/akcije")}
          activeOpacity={0.88}
        >
          <View style={styles.promoLeft}>
            <View style={styles.promoPercent}>
              <Text style={styles.promoPercentText}>%</Text>
            </View>
            <View>
              <Text style={styles.promoTitle}>
                {letak?.naslov || "Aktuelne akcije"}
              </Text>
              {letak?.vaziDo && (
                <Text style={styles.promoSub}>Važi do {formatDate(letak.vaziDo)}</Text>
              )}
            </View>
          </View>
          <View style={styles.promoCta}>
            <Text style={styles.promoCtaText}>POGLEDAJ</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Hero baner */}
      <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={styles.heroWrap}>
        <TouchableOpacity
          style={styles.heroBaner}
          onPress={() => router.push("/(tabs)/katalog")}
          activeOpacity={0.88}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>SVJEŽE SVAKI DAN</Text>
            <Text style={styles.heroTitle}>Domaći ukusi{"\n"}blizu vas</Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Istraži katalog</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.white} />
            </View>
          </View>
          <View style={styles.heroIllustration}>
            <Text style={styles.heroEmoji}>🛒</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Kategorije */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategorije</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/katalog")}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAll}>Sve</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
        ) : (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.catList}
            renderItem={({ item, index }) => (
              <CategoryItem item={item} index={index} />
            )}
          />
        )}
      </Animated.View>

      {/* Akcije grid */}
      {akcijaProducts.length > 0 && (
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Akcije i popusti</Text>
              {letak?.vaziDo && (
                <Text style={styles.sectionPeriod}>do {formatDate(letak.vaziDo)}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/akcije")}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>Sve akcije</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {akcijaProducts.map((item, i) => (
              <ProdCard key={item.id} item={item} index={i} />
            ))}
          </View>
        </Animated.View>
      )}

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: Colors.primary }]}
            onPress={() => router.push("/(tabs)/lokacije/index")}
            activeOpacity={0.85}
          >
            <Text style={styles.quickEmoji}>📍</Text>
            <Text style={styles.quickTitle}>10 lokacija</Text>
            <Text style={styles.quickSub}>u Beogradu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: "#1a1a2e" }]}
            onPress={() => router.push("/(tabs)/katalog")}
            activeOpacity={0.85}
          >
            <Text style={styles.quickEmoji}>🛒</Text>
            <Text style={styles.quickTitle}>Katalog</Text>
            <Text style={styles.quickSub}>svi artikli</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: "#1e5c1e" }]}
            onPress={() => router.push("/(tabs)/vise")}
            activeOpacity={0.85}
          >
            <Text style={styles.quickEmoji}>☕</Text>
            <Text style={styles.quickTitle}>Blog</Text>
            <Text style={styles.quickSub}>recepti i saveti</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Radno vreme baner */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={{ paddingHorizontal: 16, marginTop: 4 }}>
        <View style={styles.hoursCard}>
          <View style={styles.hoursLeft}>
            <Text style={styles.hoursIcon}>🕐</Text>
            <View>
              <Text style={styles.hoursTitle}>Radno vreme</Text>
              <Text style={styles.hoursSub}>Svaki dan 07:00 – 21:00</Text>
            </View>
          </View>
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Otvoreno</Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  promoWrap: { paddingHorizontal: 16, marginTop: 14 },
  promoBar: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  promoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  promoPercent: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
  },
  promoPercentText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  promoTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground, maxWidth: 180 },
  promoSub: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  promoCta: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  promoCtaText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: "800", letterSpacing: 0.5 },

  section: { paddingHorizontal: 16, marginTop: 28 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.foreground },
  sectionPeriod: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: "600", marginTop: 2 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "600" },

  catList: { gap: 10, paddingRight: 4 },
  catItem: { alignItems: "center", width: 74 },
  catCircle: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.white,
    justifyContent: "center", alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.g100,
  },
  catEmoji: { fontSize: 26 },
  catName: {
    fontSize: 10, color: Colors.foreground, textAlign: "center",
    fontWeight: "600", lineHeight: 13,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  prodCard: {
    width: CARD_W,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  akcijaTag: {
    position: "absolute", top: 8, left: 8, zIndex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  akcijaTagText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },
  prodImgBox: {
    height: 120,
    backgroundColor: Colors.g100,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  prodImg: { width: "100%", height: "100%" },
  prodName: {
    fontSize: FontSize.sm, fontWeight: "600",
    color: Colors.foreground, lineHeight: 17, marginBottom: 6,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  prodPrice: { fontSize: FontSize.md, fontWeight: "800", color: Colors.primary },
  prodPriceCur: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.muted },

  quickGrid: { flexDirection: "row", gap: 10 },
  quickCard: {
    flex: 1, borderRadius: Radius.lg, padding: 16,
    minHeight: 90, justifyContent: "flex-end",
  },
  quickEmoji: { fontSize: 24, marginBottom: 6 },
  quickTitle: { fontSize: FontSize.base, fontWeight: "800", color: "#fff", lineHeight: 18 },
  quickSub: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.72)", marginTop: 1 },

  hoursCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  hoursLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  hoursIcon: { fontSize: 28 },
  hoursTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground },
  hoursSub: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
  openBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#e8f5e9",
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  openDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.green,
  },
  openText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.green },

  heroWrap: { paddingHorizontal: 16, marginTop: 12 },
  heroBaner: {
    backgroundColor: Colors.foreground,
    borderRadius: Radius.lg,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    minHeight: 110,
  },
  heroContent: { flex: 1 },
  heroEyebrow: {
    fontSize: 9, fontWeight: "800", color: Colors.primary,
    letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: {
    fontSize: FontSize.xl, fontWeight: "900", color: "#fff",
    lineHeight: 26,
  },
  heroCta: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 12,
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  heroCtaText: { fontSize: FontSize.xs, fontWeight: "800", color: "#fff" },
  heroIllustration: {
    width: 80, height: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 40,
    justifyContent: "center", alignItems: "center",
    marginLeft: 12,
  },
  heroEmoji: { fontSize: 42 },
})
