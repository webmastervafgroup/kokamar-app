import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Colors, FontSize, Radius } from "@/constants/Colors"

const LOCATIONS: Record<string, any> = {
  "radnja-1-vozdovac-krusevacka": { name: "Kokamar Voždovac — Kruševačka", address: "Kruševačka 1, Voždovac", phone: "063578011", hours: "07:00–21:00", lat: 44.7710, lng: 20.5010 },
  "mega-kokamar-kaludjerica": { name: "Mega Kokamar Kaluđerica", address: "Vojvode Stepe Stepanovića 9, Kaluđerica", phone: "063578011", hours: "07:00–21:00", lat: 44.7350, lng: 20.5580 },
  "mega-kokamar-ripanj": { name: "Mega Kokamar Ripanj", address: "Kragujevački put 118, Ripanj", phone: "063578011", hours: "07:00–21:00", lat: 44.6780, lng: 20.5230 },
  "mega-kokamar-makis": { name: "Mega Kokamar Makiš", address: "Bore Stankovića 18a, Makiš", phone: "063578011", hours: "07:00–21:00", lat: 44.7820, lng: 20.4120 },
  "kokamar-kumodraska": { name: "Kokamar Kumodraška", address: "Kumodraška 121", phone: "063578011", hours: "07:00–21:00", lat: 44.7520, lng: 20.5150 },
  "kokamar-milutenovica": { name: "Kokamar Milutinovića", address: "Ivana Milutinovića 89V", phone: "063578011", hours: "07:00–21:00", lat: 44.7650, lng: 20.5200 },
  "kokamar-vozdovac-vojvode-stepe": { name: "Kokamar Voždovac — Vojvode Stepe", address: "Vojvode Stepe 224, Voždovac", phone: "063578011", hours: "07:00–21:00", lat: 44.7680, lng: 20.5050 },
  "kokamar-zvezdara": { name: "Kokamar Zvezdara", address: "Smederevski put 18ž, Zvezdara", phone: "063578011", hours: "07:00–21:00", lat: 44.7830, lng: 20.5390 },
  "kokamar-banjica": { name: "Kokamar Banjica", address: "Paunova 3b, Banjica", phone: "063578020", hours: "07:00–21:00", lat: 44.7560, lng: 20.4730 },
  "kokamar-novi-beograd-gagarina": { name: "Kokamar Novi Beograd — Gagarina", address: "Jurija Gagarina 81, Novi Beograd", phone: "063578003", hours: "07:00–21:00", lat: 44.8010, lng: 20.3960 },
}

export default function LokacijaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const loc = LOCATIONS[slug]

  if (!loc) return (
    <View style={styles.centered}>
      <Text style={styles.notFound}>Lokacija nije pronađena</Text>
    </View>
  )

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`

  return (
    <ScrollView style={styles.container}>
      {/* Info kartica */}
      <View style={styles.card}>
        <Text style={styles.name}>{loc.name}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{loc.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoText}>Svaki dan: {loc.hours}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${loc.phone}`)}>
            <Text style={[styles.infoText, styles.phoneLink]}>
              {loc.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1/$2-$3")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA dugmad */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => Linking.openURL(mapsUrl)}
        >
          <Text style={styles.btnTextWhite}>🗺️ Google navigacija</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={() => Linking.openURL(`tel:${loc.phone}`)}
        >
          <Text style={styles.btnTextPrimary}>📞 Pozovi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={() => router.push("/(tabs)/katalog")}
        >
          <Text style={styles.btnTextPrimary}>🛒 Pogledaj katalog</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: FontSize.base, color: Colors.muted },
  card: {
    margin: 16, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  name: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.foreground, marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 10 },
  infoIcon: { fontSize: 18, width: 24 },
  infoText: { flex: 1, fontSize: FontSize.base, color: Colors.foreground, lineHeight: 22 },
  phoneLink: { color: Colors.primary, fontWeight: "600" },
  actions: { paddingHorizontal: 16, gap: 10 },
  btn: { borderRadius: Radius.full, paddingVertical: 14, alignItems: "center" },
  btnPrimary: { backgroundColor: Colors.primary },
  btnOutline: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primary },
  btnTextWhite: { color: Colors.white, fontWeight: "700", fontSize: FontSize.base },
  btnTextPrimary: { color: Colors.primary, fontWeight: "700", fontSize: FontSize.base },
})
