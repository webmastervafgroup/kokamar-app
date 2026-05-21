import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { WebView } from "react-native-webview"
import { Colors, FontSize, Radius } from "@/constants/Colors"

const LOCATIONS: Record<string, any> = {
  "radnja-1-vozdovac-krusevacka": {
    name: "Kokamar Voždovac — Kruševačka",
    type: "KM",
    address: "Kruševačka 1, Voždovac",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7710, lng: 20.5010,
  },
  "mega-kokamar-kaludjerica": {
    name: "Mega Kokamar Kaluđerica",
    type: "MEGA",
    address: "Vojvode Stepe Stepanovića 9, Kaluđerica",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7350, lng: 20.5580,
  },
  "mega-kokamar-ripanj": {
    name: "Mega Kokamar Ripanj",
    type: "MEGA",
    address: "Kragujevački put 118, Ripanj",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.6780, lng: 20.5230,
  },
  "mega-kokamar-makis": {
    name: "Mega Kokamar Makiš",
    type: "MEGA",
    address: "Bore Stankovića 18a, Makiš",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7820, lng: 20.4120,
  },
  "kokamar-kumodraska": {
    name: "Kokamar Kumodraška",
    type: "KM",
    address: "Kumodraška 121",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7520, lng: 20.5150,
  },
  "kokamar-milutenovica": {
    name: "Kokamar Milutinovića",
    type: "KM",
    address: "Ivana Milutinovića 89V",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7650, lng: 20.5200,
  },
  "kokamar-vozdovac-vojvode-stepe": {
    name: "Kokamar Voždovac — Vojvode Stepe",
    type: "KM",
    address: "Vojvode Stepe 224, Voždovac",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7680, lng: 20.5050,
  },
  "kokamar-zvezdara": {
    name: "Kokamar Zvezdara",
    type: "KM",
    address: "Smederevski put 18ž, Zvezdara",
    phone: "063578011",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7830, lng: 20.5390,
  },
  "kokamar-banjica": {
    name: "Kokamar Banjica",
    type: "KM",
    address: "Paunova 3b, Banjica",
    phone: "063578020",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.7560, lng: 20.4730,
  },
  "kokamar-novi-beograd-gagarina": {
    name: "Kokamar Novi Beograd — Gagarina",
    type: "KM",
    address: "Jurija Gagarina 81, Novi Beograd",
    phone: "063578003",
    hours: "Svaki dan: 07:00–21:00",
    lat: 44.8010, lng: 20.3960,
  },
}

function isOpenNow(): boolean {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const total = h * 60 + m
  return total >= 7 * 60 && total < 21 * 60
}

export default function LokacijaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const loc = LOCATIONS[slug]
  const open = isOpenNow()

  if (!loc) return (
    <View style={styles.centered}>
      <Text style={styles.notFound}>Lokacija nije pronađena</Text>
    </View>
  )

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
  const isMega = loc.type === "MEGA"

  const mapHtml = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map', {zoomControl:false, attributionControl:false}).setView([${loc.lat},${loc.lng}], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
var icon = L.divIcon({
  html: '<div style="background:#da2128;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
  iconSize:[28,28], iconAnchor:[14,28], className:''
});
L.marker([${loc.lat},${loc.lng}], {icon:icon}).addTo(map);
</script></body></html>`

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Crveni header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
            <Text style={styles.backText}>Lokacije</Text>
          </TouchableOpacity>

          <View style={styles.headerBody}>
            <View style={[styles.typeBadge, isMega && styles.typeBadgeMega]}>
              <Text style={styles.typeText}>{isMega ? "MEGA KOKAMAR" : "KOKAMAR"}</Text>
            </View>
            <Text style={styles.headerName}>{loc.name}</Text>
            <View style={styles.headerMeta}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
              <Text style={styles.headerAddress}>{loc.address}</Text>
              <View style={[styles.statusBox, open ? styles.statusOpen : styles.statusClosed]}>
                <View style={[styles.statusDot, open ? styles.dotOpen : styles.dotClosed]} />
                <Text style={[styles.statusText, open ? styles.statusTextOpen : styles.statusTextClosed]}>
                  {open ? "Otvoreno" : "Zatvoreno"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* OpenStreetMap */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.mapContainer}>
        <WebView
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
          javaScriptEnabled
        />
        <TouchableOpacity style={styles.mapOverlayBtn} onPress={() => Linking.openURL(mapsUrl)} activeOpacity={0.85}>
          <Ionicons name="navigate" size={14} color={Colors.white} />
          <Text style={styles.mapOverlayText}>Otvori navigaciju</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* CTA dugmad */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.ctaRow}>
        <TouchableOpacity style={styles.ctaPrimary} onPress={() => Linking.openURL(mapsUrl)} activeOpacity={0.85}>
          <Ionicons name="navigate-outline" size={18} color={Colors.white} />
          <Text style={styles.ctaPrimaryText}>Navigacija</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaSecondary} onPress={() => Linking.openURL(`tel:${loc.phone}`)} activeOpacity={0.85}>
          <Ionicons name="call-outline" size={18} color={Colors.primary} />
          <Text style={styles.ctaSecondaryText}>Pozovi</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Info kartica */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Informacije</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Adresa</Text>
            <Text style={styles.infoValue}>{loc.address}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Radno vreme</Text>
            <Text style={styles.infoValue}>{loc.hours}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity onPress={() => Linking.openURL(`tel:${loc.phone}`)} activeOpacity={0.7}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={[styles.infoValue, styles.phoneLink]}>
                {loc.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1/$2-$3")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Katalog dugme */}
      <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.catalogRow}>
        <TouchableOpacity
          style={styles.catalogBtn}
          onPress={() => router.push("/(tabs)/katalog")}
          activeOpacity={0.85}
        >
          <Ionicons name="grid-outline" size={18} color={Colors.primary} />
          <Text style={styles.catalogBtnText}>Pogledaj katalog</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: FontSize.base, color: Colors.muted },

  // Header
  headerCard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: "600", opacity: 0.9 },
  headerBody: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  typeBadgeMega: { backgroundColor: "#f5a623" },
  typeText: { color: Colors.white, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  headerName: { color: Colors.white, fontSize: 22, fontWeight: "800", lineHeight: 28, marginBottom: 10 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  headerAddress: { color: "rgba(255,255,255,0.75)", fontSize: 12, flex: 1 },

  // Status box
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginLeft: 12,
    marginBottom: 2,
  },
  statusOpen: { backgroundColor: "rgba(34,197,94,0.18)" },
  statusClosed: { backgroundColor: "rgba(255,255,255,0.15)" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  dotOpen: { backgroundColor: "#22c55e" },
  dotClosed: { backgroundColor: "rgba(255,255,255,0.7)" },
  statusText: { fontSize: 12, fontWeight: "700" },
  statusTextOpen: { color: "#22c55e" },
  statusTextClosed: { color: "rgba(255,255,255,0.8)" },

  // Mapa
  mapContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: Radius.lg,
    overflow: "hidden",
    height: 200,
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: { flex: 1 },
  mapOverlayBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapOverlayText: { color: Colors.white, fontSize: 12, fontWeight: "700" },

  // CTA
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 13,
  },
  ctaPrimaryText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.base },
  ctaSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ctaSecondaryText: { color: Colors.primary, fontWeight: "700", fontSize: FontSize.base },

  // Info card
  card: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.muted, fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: FontSize.base, color: Colors.foreground, fontWeight: "500" },
  phoneLink: { color: Colors.primary, fontWeight: "700" },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },

  // Catalog
  catalogRow: { paddingHorizontal: 16, paddingTop: 12 },
  catalogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catalogBtnText: { flex: 1, color: Colors.primary, fontWeight: "700", fontSize: FontSize.base },
})
