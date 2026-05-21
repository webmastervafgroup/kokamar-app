import { useState, useEffect, useCallback } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Linking, TextInput, StatusBar, ActivityIndicator, RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, {
  FadeInDown, useAnimatedStyle, useSharedValue, withSpring,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Location from "expo-location"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getLocations } from "@/lib/api/payload"
import { OfflineBanner } from "@/components/OfflineBanner"

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Hardkodovane lokacije — fallback dok se ne unesu u Payload
const FALLBACK_LOCATIONS = [
  { id: "1", name: "Kokamar Voždovac — Kruševačka", address: "Kruševačka 1, Voždovac", phone: "063/578-011", hours: "07:00–21:00", slug: "radnja-1-vozdovac-krusevacka", type: "kokamar", lat: 44.7710, lng: 20.5010 },
  { id: "2", name: "Mega Kokamar Kaluđerica", address: "Vojvode Stepe Stepanovića 9, Kaluđerica", phone: "063/578-011", hours: "07:00–21:00", slug: "mega-kokamar-kaludjerica", type: "mega", lat: 44.7350, lng: 20.5580 },
  { id: "3", name: "Mega Kokamar Ripanj", address: "Kragujevački put 118, Ripanj", phone: "063/578-011", hours: "07:00–21:00", slug: "mega-kokamar-ripanj", type: "mega", lat: 44.6780, lng: 20.5230 },
  { id: "4", name: "Mega Kokamar Makiš", address: "Bore Stankovića 18a, Makiš", phone: "063/578-011", hours: "07:00–21:00", slug: "mega-kokamar-makis", type: "mega", lat: 44.7820, lng: 20.4120 },
  { id: "5", name: "Kokamar Kumodraška", address: "Kumodraška 121", phone: "063/578-011", hours: "07:00–21:00", slug: "kokamar-kumodraska", type: "kokamar", lat: 44.7520, lng: 20.5150 },
  { id: "6", name: "Kokamar Milutinovića", address: "Ivana Milutinovića 89V", phone: "063/578-011", hours: "07:00–21:00", slug: "kokamar-milutenovica", type: "kokamar", lat: 44.7650, lng: 20.5200 },
  { id: "7", name: "Kokamar Voždovac — Vojvode Stepe", address: "Vojvode Stepe 224, Voždovac", phone: "063/578-011", hours: "07:00–21:00", slug: "kokamar-vozdovac-vojvode-stepe", type: "kokamar", lat: 44.7680, lng: 20.5050 },
  { id: "8", name: "Kokamar Zvezdara", address: "Smederevski put 18ž, Zvezdara", phone: "063/578-011", hours: "07:00–21:00", slug: "kokamar-zvezdara", type: "kokamar", lat: 44.7830, lng: 20.5390 },
  { id: "9", name: "Kokamar Banjica", address: "Paunova 3b, Banjica", phone: "063/578-020", hours: "07:00–21:00", slug: "kokamar-banjica", type: "kokamar", lat: 44.7560, lng: 20.4730 },
  { id: "10", name: "Kokamar Novi Beograd — Gagarina", address: "Jurija Gagarina 81, Novi Beograd", phone: "063/578-003", hours: "07:00–21:00", slug: "kokamar-novi-beograd-gagarina", type: "kokamar", lat: 44.8010, lng: 20.3960 },
]

type LocationItem = {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  slug: string
  type: string
}

function mapPayloadLocation(doc: any): LocationItem {
  return {
    id: String(doc.id),
    name: doc.name ?? "",
    address: doc.address ?? "",
    phone: doc.phone ?? "",
    hours: doc.workingHours ?? "07:00–21:00",
    slug: doc.slug ?? "",
    type: doc.marketType === "mega-kokamar" ? "mega" : "kokamar",
  }
}

function LocationCard({ item, index }: { item: LocationItem; index: number }) {
  const router = useRouter()
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const isOpen = () => {
    const h = new Date().getHours()
    return h >= 7 && h < 21
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(16)}>
      <Animated.View style={animStyle}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/lokacije/${item.slug}`)}
          onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }) }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
          activeOpacity={1}
        >
          <View style={[styles.typeBox, item.type === "mega" && styles.typeBoxMega]}>
            <Text style={[styles.typeText, item.type === "mega" && styles.typeTextMega]}>
              {item.type === "mega" ? "MEGA" : "KM"}
            </Text>
          </View>
          <View style={styles.cardMid}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={12} color={Colors.muted} />
              <Text style={styles.infoText} numberOfLines={1}>{item.address}</Text>
            </View>
            <View style={styles.bottomRow}>
              <View style={[styles.infoRow, { flex: 1 }]}>
                <Ionicons name="time-outline" size={12} color={Colors.muted} />
                <Text style={styles.infoText}>{item.hours}</Text>
              </View>
              <View style={[styles.openBadge, !isOpen() && styles.closedBadge]}>
                <View style={[styles.openDot, !isOpen() && styles.closedDot]} />
                <Text style={[styles.openText, !isOpen() && styles.closedText]}>
                  {isOpen() ? "Otvoreno" : "Zatvoreno"}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.g400} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

export default function LokacijeScreen() {
  const insets = useSafeAreaInsets()
  const [locations, setLocations] = useState<LocationItem[]>(FALLBACK_LOCATIONS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [locating, setLocating] = useState(false)

  const fetchData = useCallback(() => {
    return getLocations().then((docs: any[]) => {
      if (docs && docs.length > 0) setLocations(docs.map(mapPayloadLocation))
    }).finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { fetchData() }, [])
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData() }, [])

  async function findNearest() {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") return
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = pos.coords
      const sorted = [...locations].sort((a, b) => {
        if (!a.lat || !a.lng) return 1
        if (!b.lat || !b.lng) return -1
        return getDistance(latitude, longitude, a.lat, a.lng) - getDistance(latitude, longitude, b.lat, b.lng)
      })
      setLocations(sorted)
      setSearch("")
    } finally {
      setLocating(false)
    }
  }

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <OfflineBanner />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>LOKACIJE</Text>
              </View>
              <Text style={styles.headerTitle}>Naše prodavnice</Text>
              <Text style={styles.headerPeriod}>
                {filtered.length} lokacija · 07:00–21:00 svaki dan
              </Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>{filtered.length}</Text>
              <Text style={styles.countLabel}>prodavnica</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Search + Mapa */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.toolbarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={Colors.g400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Upiši naziv ili adresu..."
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
        <TouchableOpacity style={styles.mapBtn} onPress={findNearest} activeOpacity={0.8}>
          {locating
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="navigate" size={18} color={Colors.white} />
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: Colors.foreground }]}
          onPress={() => Linking.openURL("https://www.google.com/maps/search/Kokamar+market+Beograd")}
          activeOpacity={0.8}
        >
          <Ionicons name="map" size={18} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          renderItem={({ item, index }) => <LocationCard item={item} index={index} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={48} color={Colors.g200} />
              <Text style={styles.emptyText}>Nema lokacija</Text>
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
    paddingHorizontal: 20, paddingBottom: 16,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 8,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "900", color: "#fff", lineHeight: 28 },
  headerPeriod: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  countBox: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: "center",
  },
  countNum: { fontSize: FontSize.xl, fontWeight: "900", color: "#fff" },
  countLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  toolbarRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.foreground },
  mapBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  typeBox: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.primary, flexShrink: 0,
  },
  typeBoxMega: { backgroundColor: "#1a1a2e", borderColor: "#1a1a2e" },
  typeText: { fontSize: 9, fontWeight: "900", color: Colors.primary, letterSpacing: 0.5 },
  typeTextMega: { color: "#fff" },
  cardMid: { flex: 1, gap: 4 },
  cardName: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: FontSize.xs, color: Colors.muted, flex: 1 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  openBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#e8f5e9", borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  closedBadge: { backgroundColor: Colors.g100 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  closedDot: { backgroundColor: Colors.g400 },
  openText: { fontSize: 9, fontWeight: "700", color: Colors.green },
  closedText: { color: Colors.g400 },
  empty: { padding: 60, alignItems: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.muted },
})
