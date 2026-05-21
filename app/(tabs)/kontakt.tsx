import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Linking } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { hapticLight } from "@/hooks/useHaptic"
import { Colors, FontSize, Radius } from "@/constants/Colors"

const CONTACTS = [
  { icon: "call-outline" as const, label: "Centrala", value: "011 123 4567", action: () => Linking.openURL("tel:0111234567") },
  { icon: "mail-outline" as const, label: "Email", value: "info@kokamar.rs", action: () => Linking.openURL("mailto:info@kokamar.rs") },
  { icon: "globe-outline" as const, label: "Website", value: "kokamar.rs", action: () => Linking.openURL("https://kokamar.rs") },
  { icon: "location-outline" as const, label: "Sedište", value: "Beograd, Srbija", action: () => Linking.openURL("https://www.google.com/maps/search/Kokamar+Beograd") },
]

const SOCIAL = [
  { icon: "logo-instagram" as const, label: "Instagram", color: "#E1306C", url: "https://www.instagram.com/kokamar_beograd/" },
  { icon: "logo-facebook" as const, label: "Facebook", color: "#1877F2", url: "https://www.facebook.com/p/Kokamar-100076365541994/" },
]

const HOURS = [
  { day: "Ponedeljak — Petak", time: "07:00 — 21:00" },
  { day: "Subota", time: "07:00 — 21:00" },
  { day: "Nedеlja", time: "07:00 — 21:00" },
]

export default function KontaktScreen() {
  const insets = useSafeAreaInsets()

  function tap(action: () => void) {
    hapticLight()
    action()
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>KONTAKT</Text>
              </View>
              <Image source={require("@/assets/images/logo-white.png")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.headerSub}>Tu smo za vas svakog dana</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>7—21</Text>
              <Text style={styles.countLabel}>radno vreme</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Kontakt info */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Kontaktirajte nas</Text>
        {CONTACTS.map((c, i) => (
          <TouchableOpacity key={c.label} style={[styles.contactRow, i < CONTACTS.length - 1 && styles.contactDivider]} onPress={() => tap(c.action)} activeOpacity={0.7}>
            <View style={styles.contactIconBox}>
              <Ionicons name={c.icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={styles.contactValue}>{c.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Radno vreme */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Radno vreme prodavnica</Text>
        {HOURS.map((h, i) => (
          <View key={h.day} style={[styles.hoursRow, i < HOURS.length - 1 && styles.contactDivider]}>
            <Text style={styles.hoursDay}>{h.day}</Text>
            <Text style={styles.hoursTime}>{h.time}</Text>
          </View>
        ))}
        <View style={styles.openBadge}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>Sve prodavnice su danas otvorene</Text>
        </View>
      </Animated.View>

      {/* Social */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Pratite nas</Text>
        <View style={styles.socialRow}>
          {SOCIAL.map((s) => (
            <TouchableOpacity key={s.label} style={styles.socialBtn} onPress={() => tap(() => Linking.openURL(s.url))} activeOpacity={0.85}>
              <Ionicons name={s.icon} size={22} color={s.color} />
              <Text style={styles.socialLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Mapa CTA */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.ctaCard}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => tap(() => Linking.openURL("https://www.google.com/maps/search/Kokamar+market+Beograd"))}
          activeOpacity={0.85}
        >
          <Ionicons name="map-outline" size={18} color={Colors.white} />
          <Text style={styles.ctaBtnText}>Pronađi prodavnicu</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  logo: { width: 130, height: 38, marginBottom: 8 },
  headerSub: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)" },
  countBox: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: "center",
  },
  countNum: { fontSize: FontSize.lg, fontWeight: "900", color: "#fff" },
  countLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  card: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: FontSize.base, fontWeight: "800", color: Colors.foreground, marginBottom: 14 },

  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  contactDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  contactIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff0f0", justifyContent: "center", alignItems: "center",
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 11, color: Colors.muted, fontWeight: "600", marginBottom: 2 },
  contactValue: { fontSize: FontSize.base, color: Colors.foreground, fontWeight: "600" },

  hoursRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  hoursDay: { fontSize: FontSize.sm, color: Colors.foreground, fontWeight: "500" },
  hoursTime: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "700" },
  openBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f0fdf4", borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 10,
  },
  openDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  openText: { fontSize: FontSize.xs, color: "#16a34a", fontWeight: "600" },

  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.g100, borderRadius: Radius.lg,
    paddingVertical: 12, borderWidth: 1, borderColor: Colors.border,
  },
  socialLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.foreground },

  ctaCard: { marginHorizontal: 16, marginTop: 14 },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaBtnText: { fontSize: FontSize.base, fontWeight: "800", color: Colors.white },
})
