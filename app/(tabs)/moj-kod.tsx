import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Dimensions } from "react-native"
import { useRouter } from "expo-router"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"

const { width } = Dimensions.get("window")

const FAKE_BARCODE_LINES = [
  3,1,3,1,1,2,3,1,2,1,1,3,2,1,3,2,1,1,2,3,
  1,2,1,3,1,1,2,1,3,2,3,1,1,2,1,3,2,1,2,3,
  1,1,3,1,2,3,1,2,1,1,3,2,1,3,1,2,1,3,2,1,
]

export default function MojKodScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moj Kod</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.content}>

        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Barcode kartica */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.barcodeCard}>
          <View style={styles.cardTop}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>LOYALTY KOD</Text>
            </View>
            <Text style={styles.cardName}>Kokamar Market</Text>
            <Text style={styles.cardSub}>Pokažite kod na kasi</Text>
          </View>

          {/* Fake barcode */}
          <View style={styles.barcodeWrap}>
            <View style={styles.barcodeInner}>
              {FAKE_BARCODE_LINES.map((w, i) => (
                <View
                  key={i}
                  style={[
                    styles.barLine,
                    { width: w * 2.2, backgroundColor: i % 2 === 0 ? "#1a1a1a" : "transparent" }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.barcodeNum}>6 03 0200 04782 6</Text>
          </View>

          {/* Uskoro overlay */}
          <View style={styles.soonOverlay}>
            <View style={styles.soonBox}>
              <Ionicons name="lock-closed" size={28} color={Colors.primary} />
              <Text style={styles.soonTitle}>Uskoro dostupno</Text>
              <Text style={styles.soonSub}>Loyalty program se priprema.{"\n"}Pratite nas za novosti!</Text>
            </View>
          </View>
        </Animated.View>

        {/* Info kartice */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>🎯</Text>
            <Text style={styles.infoTitle}>Personalne akcije</Text>
            <Text style={styles.infoSub}>Popusti za vas</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>🎟️</Text>
            <Text style={styles.infoTitle}>Vaučeri</Text>
            <Text style={styles.infoSub}>Digitalni kuponi</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>📊</Text>
            <Text style={styles.infoTitle}>Moja ušteda</Text>
            <Text style={styles.infoSub}>Statistika</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(160).springify()} style={styles.ctaWrap}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Nazad na početnu</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn: { width: 42, height: 42, justifyContent: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "800", color: "#fff" },

  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 32 },

  logoWrap: { alignItems: "center", marginBottom: 24 },
  logo: { width: 130, height: 42, tintColor: "rgba(255,255,255,0.9)" },

  barcodeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTop: { padding: 20, alignItems: "center" },
  cardBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 10,
  },
  cardBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.primary, letterSpacing: 1 },
  cardName: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.foreground },
  cardSub: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 4 },

  barcodeWrap: {
    backgroundColor: Colors.white,
    paddingVertical: 20, paddingHorizontal: 16,
    alignItems: "center",
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  barcodeInner: {
    flexDirection: "row", height: 70, alignItems: "stretch",
    marginBottom: 10,
  },
  barLine: { height: "100%", marginHorizontal: 0.3 },
  barcodeNum: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.muted, letterSpacing: 2 },

  soonOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center", alignItems: "center",
  },
  soonBox: { alignItems: "center", padding: 24 },
  soonTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.foreground, marginTop: 12, marginBottom: 8 },
  soonSub: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20 },

  infoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  infoCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  infoEmoji: { fontSize: 24, marginBottom: 6 },
  infoTitle: { fontSize: FontSize.xs, fontWeight: "700", color: "#fff", textAlign: "center" },
  infoSub: { fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2, textAlign: "center" },

  ctaWrap: { marginTop: "auto" },
  ctaBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnText: { fontSize: FontSize.base, fontWeight: "800", color: Colors.primary },
})
