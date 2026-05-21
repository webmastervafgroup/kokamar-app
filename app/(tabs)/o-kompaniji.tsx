import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Linking } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { hapticLight } from "@/hooks/useHaptic"
import { Colors, FontSize, Radius } from "@/constants/Colors"

const STATS = [
  { num: "1985.", label: "Osnovana" },
  { num: "10", label: "Prodavnica" },
  { num: "500+", label: "Zaposlenih" },
  { num: "50k+", label: "Kupaca" },
]

const VALUES = [
  { icon: "heart-outline" as const, title: "Porodičan pristup", text: "Kokamar je porodična kompanija koja neguje topao odnos prema kupcima i zaposlenima." },
  { icon: "leaf-outline" as const, title: "Svežina i kvalitet", text: "Svakodnevno nabavljamo sveže namirnice od proverenih dobavljača iz Srbije i regiona." },
  { icon: "location-outline" as const, title: "Bliskost zajednici", text: "10 prodavnica u Beogradu — uvek blizu vašeg doma, kvarta i porodice." },
  { icon: "pricetag-outline" as const, title: "Pristupačne cene", text: "Redovne akcije, letaci i loyalty program — jer svaka ušteda je važna." },
]

export default function OKompanijiScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>O KOMPANIJI</Text>
              </View>
              <Image source={require("@/assets/images/logo-white.png")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.headerSub}>Vaš domaći market od 1985.</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>40+</Text>
              <Text style={styles.countLabel}>godina</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* O nama tekst */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Ko smo mi?</Text>
        <Text style={styles.cardText}>
          Kokamar je jedan od vodećih lanaca supermarketa u Beogradu, sa tradicijom dugom više od 40 godina. Osnovani smo kao mala porodična prodavnica, a danas imamo 10 lokacija u različitim delovima grada.{"\n\n"}
          Naša misija je jednostavna — da svakodnevno donесemo svežu, kvalitetnu hranu po pristupačnim cenama što bliže vašem domu. Bilo da tražite svežu piletinu, mlečne proizvode, voće i povrće ili kućnu hemiju — Kokamar je tu za vas.
        </Text>
      </Animated.View>

      {/* Vrednosti */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Naše vrednosti</Text>
        <View style={styles.valuesList}>
          {VALUES.map((v, i) => (
            <View key={v.title} style={[styles.valueItem, i < VALUES.length - 1 && styles.valueDivider]}>
              <View style={styles.valueIconBox}>
                <Ionicons name={v.icon} size={20} color={Colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueSub}>{v.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.ctaCard}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => { hapticLight(); Linking.openURL("https://kokamar.rs/o-kompaniji") }}
          activeOpacity={0.85}
        >
          <Ionicons name="globe-outline" size={18} color={Colors.white} />
          <Text style={styles.ctaBtnText}>Više na kokamar.rs</Text>
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
  headerLeft: {},
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
  countNum: { fontSize: FontSize.xl, fontWeight: "900", color: "#fff" },
  countLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 12, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNum: { fontSize: FontSize.lg, fontWeight: "900", color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.muted, marginTop: 2, fontWeight: "600" },

  card: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: FontSize.base, fontWeight: "800", color: Colors.foreground, marginBottom: 12 },
  cardText: { fontSize: FontSize.sm, color: Colors.muted, lineHeight: 22 },

  valuesList: { gap: 0 },
  valueItem: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "flex-start" },
  valueDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  valueIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff0f0", justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  valueText: { flex: 1 },
  valueTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.foreground, marginBottom: 3 },
  valueSub: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 18 },

  ctaCard: { marginHorizontal: 16, marginBottom: 14 },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaBtnText: { fontSize: FontSize.base, fontWeight: "800", color: Colors.white },
})
