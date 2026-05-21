import { useEffect, useState, useRef, useCallback } from "react"
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, FlatList, StatusBar, Linking, RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import Animated, {
  FadeInDown, FadeInRight, useAnimatedStyle,
  useSharedValue, withSpring,
} from "react-native-reanimated"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { OfflineBanner } from "@/components/OfflineBanner"
import { getCategories, getAkcijaProducts } from "@/lib/api/medusa"
import { getAkcijaLetak, getPromoKaruzeli } from "@/lib/api/payload"
import { resolveProductPrice } from "@/lib/util/price"

const { width } = Dimensions.get("window")
const CARD_W = (width - 48) / 2
const CAROUSEL_H = 180

// Nedeljna akcija — vikend slike sa sajta (horizontalni scroll, kao PromoImageCarousel na sajtu)
const VIKEND_SLIDES = [
  { src: "https://kokamar.rs/akcije/vikend-01-pileci-file.webp", alt: "Sveži Pileći File 1kg" },
  { src: "https://kokamar.rs/akcije/vikend-02-svinjska-krmenadla.webp", alt: "Svinjska Krmenadla 1kg" },
  { src: "https://kokamar.rs/akcije/vikend-03-svinjska-plecka.webp", alt: "Svinjska Plećka BK 1kg" },
  { src: "https://kokamar.rs/akcije/vikend-04-pileci-batak.webp", alt: "Pileći Batak 1kg" },
  { src: "https://kokamar.rs/akcije/vikend-05-mladi-krompir.webp", alt: "Mladi Krompir 1kg" },
  { src: "https://kokamar.rs/akcije/vikend-06-mladi-kupus.webp", alt: "Mladi Kupus 1kg" },
  { src: "https://kokamar.rs/akcije/vikend-07-mleko.webp", alt: "Dr Milk Mleko 2.8% 1L" },
  { src: "https://kokamar.rs/akcije/vikend-08-voda-gala.webp", alt: "Voda Gala Limun 1.5L" },
  { src: "https://kokamar.rs/akcije/vikend-09-nutella.webp", alt: "Nutella 750ml" },
  { src: "https://kokamar.rs/akcije/vikend-10-plazma-sladoled.webp", alt: "Quattro Plazma Sladoled 800ml" },
  { src: "https://kokamar.rs/akcije/vikend-11-toalet-papir.webp", alt: "Perfex Toalet Papir 10/1" },
  { src: "https://kokamar.rs/akcije/vikend-14-persil.webp", alt: "Persil Prašak 5.325kg" },
]

// Fallback karusel kad nema Payload slika — mega akcija slike
const FALLBACK_SLIDES = [
  { src: "https://kokamar.rs/akcije/mega-01-sladoledi.webp", alt: "Aloma Sladoledi 3u1" },
  { src: "https://kokamar.rs/akcije/mega-02-dijamant-ulje.webp", alt: "Dijamant Ulje 1L" },
  { src: "https://kokamar.rs/akcije/mega-03-secer.webp", alt: "Sunoko Šećer 1kg" },
  { src: "https://kokamar.rs/akcije/mega-04-mleko.webp", alt: "Imlek Mleko 1L" },
  { src: "https://kokamar.rs/akcije/mega-05-testenine.webp", alt: "Danubius Testenine 400g" },
  { src: "https://kokamar.rs/akcije/mega-06-pavlaka.webp", alt: "Imlek Pavlaka 400g" },
]

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ")
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

// Ikonice 1:1 kao na sajtu kokamar.rs (Lucide → Ionicons ekvivalenti)
const CAT_MAP: { key: string; icon: IoniconName; color: string }[] = [
  { key: "mlecni",    icon: "water-outline",       color: "#3182ce" },
  { key: "mlecn",     icon: "water-outline",       color: "#3182ce" },
  { key: "jaja",      icon: "ellipse-outline",     color: "#d69e2e" },
  { key: "pekara",    icon: "cafe-outline",        color: "#d69e2e" },
  { key: "torte",     icon: "gift-outline",        color: "#d53f8c" },
  { key: "kolaci",    icon: "gift-outline",        color: "#d53f8c" },
  { key: "meso",      icon: "nutrition-outline",   color: "#e53e3e" },
  { key: "riba",      icon: "fish-outline",        color: "#3182ce" },
  { key: "pakovana",  icon: "cube-outline",        color: "#744210" },
  { key: "namirni",   icon: "cube-outline",        color: "#744210" },
  { key: "smrznut",   icon: "snow-outline",        color: "#2b6cb0" },
  { key: "zamrznut",  icon: "snow-outline",        color: "#2b6cb0" },
  { key: "pice",      icon: "wine-outline",        color: "#6b46c1" },
  { key: "kafa",      icon: "cafe-outline",        color: "#744210" },
  { key: "caj",       icon: "cafe-outline",        color: "#38a169" },
  { key: "slani",     icon: "star-outline",        color: "#d69e2e" },
  { key: "slatkisi",  icon: "star-outline",        color: "#d53f8c" },
  { key: "konditor",  icon: "star-outline",        color: "#d53f8c" },
  { key: "higijen",   icon: "heart-outline",       color: "#e53e3e" },
  { key: "kozmetik",  icon: "heart-outline",       color: "#d53f8c" },
  { key: "hemija",    icon: "flask-outline",       color: "#2d3748" },
  { key: "papirn",    icon: "flask-outline",       color: "#2d3748" },
  { key: "voce",      icon: "leaf-outline",        color: "#38a169" },
  { key: "povrce",    icon: "leaf-outline",        color: "#2f855a" },
  { key: "bebi",      icon: "happy-outline",       color: "#ed8936" },
  { key: "decij",     icon: "happy-outline",       color: "#ed8936" },
  { key: "domacinst", icon: "home-outline",        color: "#4a5568" },
  { key: "elektron",  icon: "phone-portrait-outline", color: "#2d3748" },
  { key: "ljubimci",  icon: "paw-outline",         color: "#744210" },
  { key: "snacks",    icon: "fast-food-outline",   color: "#e53e3e" },
  { key: "grickalic", icon: "fast-food-outline",   color: "#e53e3e" },
]

function getCatIcon(name: string): { icon: IoniconName; color: string } {
  const lower = name.toLowerCase()
    .replace(/š/g, "s").replace(/č/g, "c").replace(/ć/g, "c")
    .replace(/ž/g, "z").replace(/đ/g, "d").replace(/lj/g, "l").replace(/nj/g, "n")
  for (const entry of CAT_MAP) {
    if (lower.includes(entry.key)) return { icon: entry.icon, color: entry.color }
  }
  return { icon: "grid-outline", color: Colors.primary }
}

// Karusel sa slikama iz Payload, fallback na statičke slike sa sajta
function PromoCarousel({ karuzeli }: { karuzeli: any[] }) {
  const [active, setActive] = useState(0)
  const flatRef = useRef<FlatList>(null)

  // Skupi slike iz Payload
  const payloadSlides: { src: string; alt: string }[] = []
  for (const k of karuzeli) {
    for (const s of (k.slike ?? [])) {
      const url = s.slika?.url
      if (url) {
        const fullUrl = url.startsWith("http") ? url : `https://kokamar.rs/cms${url}`
        payloadSlides.push({ src: fullUrl, alt: s.alt ?? k.naslov ?? "" })
      }
    }
  }

  // Ako nema Payload slika, koristi statičke sa sajta
  const slides = payloadSlides.length > 0 ? payloadSlides : FALLBACK_SLIDES

  return (
    <Animated.View entering={FadeInDown.delay(30).springify()} style={styles.carouselWrap}>
      <FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          setActive(Math.round(e.nativeEvent.contentOffset.x / width))
        }}
        renderItem={({ item }) => (
          <View style={styles.carouselSlide}>
            <Image source={{ uri: item.src }} style={styles.carouselImg} resizeMode="cover" />
          </View>
        )}
      />
      {/* Dots */}
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      )}
    </Animated.View>
  )
}

// Nedeljna akcija — horizontalni scroll kartica, kao PromoImageCarousel na sajtu
function NedeljnaAkcija() {
  const router = useRouter()
  const THUMB = (width - 48) / 2.4
  return (
    <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionAccent} />
          <View>
            <Text style={styles.sectionTitle}>Akcije ove nedelje</Text>
            <Text style={styles.sectionPeriod}>Sveže namirnice po posebnim cenama</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/akcije")} style={styles.seeAllBtn}>
          <Text style={styles.seeAll}>Sve akcije</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={VIKEND_SLIDES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 30).springify()}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/akcije")}
              activeOpacity={0.85}
              style={[styles.vikendCard, { width: THUMB }]}
            >
              <Image source={{ uri: item.src }} style={styles.vikendImg} resizeMode="cover" />
              <Text style={styles.vikendAlt} numberOfLines={2}>{item.alt}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </Animated.View>
  )
}

// Kartica akcijskog proizvoda — FIKSNA VISINA
function ProdCard({ item, index }: { item: any; index: number }) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const img = item.thumbnail || item.images?.[0]?.url
  const price = resolveProductPrice(item)

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify().damping(14)}
      style={styles.prodCardOuter}
    >
      <Animated.View style={[styles.prodCard, animStyle]}>
        <TouchableOpacity
          onPress={() => router.push(`/katalog/${item.handle}`)}
          onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }) }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
          activeOpacity={1}
          style={styles.prodCardInner}
        >
          {/* Žuti badge — kao na sajtu */}
          <View style={styles.akcijaTag}>
            <Text style={styles.akcijaTagText}>AKCIJA</Text>
          </View>
          <View style={styles.prodImgBox}>
            {img ? (
              <Image source={{ uri: img }} style={styles.prodImg} resizeMode="contain" />
            ) : (
              <Ionicons name="cart-outline" size={40} color={Colors.g400} />
            )}
          </View>
          <Text style={styles.prodName} numberOfLines={2}>{decodeHtml(item.title)}</Text>
          {/* Cijena + crveni krug sa strelicom */}
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
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

function CategoryItem({ item, index }: { item: any; index: number }) {
  const router = useRouter()
  const { icon, color } = getCatIcon(item.name)
  return (
    <Animated.View entering={FadeInRight.delay(index * 35).springify().damping(16)}>
      <TouchableOpacity
        style={styles.catItem}
        onPress={() => router.push({ pathname: "/(tabs)/katalog", params: { categoryId: item.id, categoryName: item.name } })}
        activeOpacity={0.7}
      >
        <View style={[styles.catCircle, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={24} color={color} />
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
  const [karuzeli, setKaruzeli] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(() => {
    return Promise.all([getCategories(), getAkcijaLetak(), getAkcijaProducts(), getPromoKaruzeli()])
      .then(([cats, l, prods, kar]) => {
        setCategories(cats.slice(0, 14))
        setLetak(l)
        setAkcijaProducts(prods.slice(0, 10))
        setKaruzeli(kar)
      })
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { fetchData() }, [])
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData() }, [])

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <OfflineBanner />

      {/* Promo karuzel slika */}
      {karuzeli.length > 0 && <PromoCarousel karuzeli={karuzeli} />}

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
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle} numberOfLines={1}>
                {letak?.naslov || "Aktuelne akcije"}
              </Text>
              {letak?.vaziDo && (
                <Text style={styles.promoSub}>Važi do {formatDate(letak.vaziDo)}</Text>
              )}
            </View>
          </View>
          <View style={styles.promoCta}>
            <Text style={styles.promoCtaText}>POGLEDAJ</Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Nedeljna akcija — horizontalni scroll */}
      <NedeljnaAkcija />

      {/* Kategorije */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Kategorije</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/katalog")} style={styles.seeAllBtn}>
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
            renderItem={({ item, index }) => <CategoryItem item={item} index={index} />}
          />
        )}
      </Animated.View>

      {/* Mesečna akcija grid ili empty state */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <View>
              <Text style={styles.sectionTitle}>Mesečna akcija</Text>
              {letak?.vaziDo && (
                <Text style={styles.sectionPeriod}>do {formatDate(letak.vaziDo)}</Text>
              )}
            </View>
          </View>
          {akcijaProducts.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/akcije")} style={styles.seeAllBtn}>
              <Text style={styles.seeAll}>Sve akcije</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {!loading && akcijaProducts.length === 0 ? (
          /* Empty state — isti tekst kao na sajtu */
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nove akcije uskoro!</Text>
            <Text style={styles.emptySub}>
              Pratite nas na društvenim mrežama i budite prvi obavešteni o popustima.
            </Text>
            <View style={styles.emptyBtns}>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => Linking.openURL("https://www.instagram.com/kokamar_beograd/")}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-instagram" size={18} color={Colors.primary} />
                <Text style={styles.emptyBtnText}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => Linking.openURL("https://www.facebook.com/p/Kokamar-100076365541994/")}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-facebook" size={18} color={Colors.primary} />
                <Text style={styles.emptyBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.grid}>
            {akcijaProducts.map((item, i) => (
              <ProdCard key={item.id} item={item} index={i} />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
        <View style={styles.quickGrid}>
          {[
            { icon: "pricetags" as const, color: "#7c3aed", title: "Brendovi", sub: "Brendovi u ponudi", route: "/(tabs)/brendovi" },
            { icon: "location" as const, color: Colors.primary, title: "Lokacije", sub: "10 prodavnica u Beogradu", route: "/(tabs)/lokacije/index" },
            { icon: "grid" as const, color: "#1a1a2e", title: "Katalog", sub: "Svi artikli i kategorije", route: "/(tabs)/katalog" },
            { icon: "newspaper" as const, color: "#2d6a2d", title: "Blog", sub: "Recepti, saveti i novosti", route: "/(tabs)/blog" },
          ].map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.quickCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconBox, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={20} color="#fff" />
              </View>
              <View style={styles.quickText}>
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.g400} />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Karusel
  carouselWrap: { marginBottom: 4 },
  carouselSlide: { width, height: CAROUSEL_H },
  carouselImg: { width: "100%", height: "100%" },
  dots: {
    flexDirection: "row", justifyContent: "center", gap: 6,
    position: "absolute", bottom: 10, left: 0, right: 0,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },

  // Promo bar
  promoWrap: { paddingHorizontal: 16, marginTop: 12 },
  promoBar: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  promoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  promoPercent: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
  },
  promoPercentText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  promoTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground },
  promoSub: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  promoCta: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6,
  },
  promoCtaText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: "800", letterSpacing: 0.4 },

  // Sekcije
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  sectionAccent: { width: 3, borderRadius: 2, backgroundColor: Colors.primary, alignSelf: "stretch", marginTop: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.foreground },
  sectionPeriod: { fontSize: FontSize.xs, color: Colors.muted, fontWeight: "500", marginTop: 2 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "600" },

  // Kategorije
  catList: { gap: 10, paddingRight: 4 },
  catItem: { alignItems: "center", width: 72 },
  catCircle: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
    marginBottom: 7,
  },
  catName: { fontSize: 10, color: Colors.foreground, textAlign: "center", fontWeight: "600", lineHeight: 13 },

  // Grid akcija — FIKSNE KARTICE ISTE VISINE
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  prodCardOuter: { width: CARD_W },
  prodCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  prodCardInner: { padding: 10 },
  akcijaTag: {
    position: "absolute", top: 0, left: 0, zIndex: 1,
    backgroundColor: "#ffd400",
    borderRadius: 0,
    borderBottomRightRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  akcijaTagText: { color: "#1a1a1a", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  prodImgBox: {
    height: 130,
    backgroundColor: Colors.g100,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    marginBottom: 10, overflow: "hidden",
  },
  prodImg: { width: "100%", height: "100%" },
  prodName: {
    fontSize: FontSize.sm, fontWeight: "600",
    color: Colors.foreground, lineHeight: 17,
    minHeight: 34,
    marginBottom: 6,
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

  // Quick actions
  quickGrid: { gap: 10 },
  quickCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: Radius.lg, padding: 14,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  quickText: { flex: 1 },
  quickTitle: { fontSize: FontSize.base, fontWeight: "800", color: Colors.foreground },
  quickSub: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },

  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center",
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.foreground, marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  emptyBtns: { flexDirection: "row", gap: 12 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.primary + "44",
  },
  emptyBtnText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary },

  vikendCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  vikendImg: { width: "100%", aspectRatio: 1 },
  vikendAlt: {
    fontSize: 10, fontWeight: "600", color: Colors.foreground,
    padding: 7, lineHeight: 13,
  },
})
