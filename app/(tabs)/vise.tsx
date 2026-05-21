import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, StatusBar } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

type MenuItem = {
  icon: IoniconName
  title: string
  sub?: string
  route?: string
  url?: string
  soon?: boolean
}

const MENU_SECTIONS: { title: string; soon?: boolean; items: MenuItem[] }[] = [
  {
    title: "Istraži",
    items: [
      { icon: "newspaper-outline", title: "Blog", sub: "Recepti, saveti i novosti", route: "/(tabs)/blog" },
      { icon: "pricetags-outline", title: "Brendovi", sub: "Brendovi u ponudi", route: "/(tabs)/brendovi" },
      { icon: "location-outline", title: "Lokacije", sub: "10 prodavnica u Beogradu", route: "/(tabs)/lokacije/index" },
      { icon: "information-circle-outline", title: "O kompaniji", url: "https://kokamar.rs/o-kompaniji" },
      { icon: "mail-outline", title: "Kontakt", url: "https://kokamar.rs/kontakt" },
    ],
  },
  {
    title: "Uskoro dostupno",
    soon: true,
    items: [
      { icon: "barcode-outline", title: "Moj Kod", sub: "Loyalty barcode za kasu", soon: true },
      { icon: "gift-outline", title: "Vaučeri", sub: "Digitalni vaučeri i kuponi", soon: true },
      { icon: "receipt-outline", title: "Digitalni račun", sub: "Istorija kupovina", soon: true },
      { icon: "trending-up-outline", title: "Moja ušteda", sub: "Statistika popusta", soon: true },
      { icon: "notifications-outline", title: "Push notifikacije", sub: "Obaveštenja o akcijama", soon: true },
    ],
  },
]

export default function ViseScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  function handlePress(item: MenuItem) {
    if (item.soon) return
    if (item.url) Linking.openURL(item.url)
    else if (item.route) router.push(item.route as any)
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Crveni header sa bijelim logom */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>MOJ PROFIL</Text>
              </View>
              <Image
                source={require("@/assets/images/logo-white.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerSub}>Vaš domaći market u Beogradu</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>10</Text>
              <Text style={styles.countLabel}>lokacija</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Social dugmad */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.socialRow}>
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => Linking.openURL("https://www.instagram.com/kokamar_beograd/")}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-instagram" size={18} color="#E1306C" />
          <Text style={styles.socialText}>Instagram</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => Linking.openURL("https://www.facebook.com/p/Kokamar-100076365541994/")}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-facebook" size={18} color="#1877F2" />
          <Text style={styles.socialText}>Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => Linking.openURL("https://kokamar.rs")}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={18} color={Colors.primary} />
          <Text style={styles.socialText}>Website</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Stat row */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.statsCard}>
        <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/akcije")} activeOpacity={0.7}>
          <Text style={styles.statNum}>%</Text>
          <Text style={styles.statLabel}>Akcije</Text>
        </TouchableOpacity>
        <View style={styles.statDiv} />
        <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/katalog")} activeOpacity={0.7}>
          <Text style={styles.statNum}>833+</Text>
          <Text style={styles.statLabel}>Artikala</Text>
        </TouchableOpacity>
        <View style={styles.statDiv} />
        <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/lokacije/index")} activeOpacity={0.7}>
          <Text style={styles.statNum}>10</Text>
          <Text style={styles.statLabel}>Lokacija</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Menu sekcije */}
      {MENU_SECTIONS.map((section, si) => (
        <Animated.View
          key={si}
          entering={FadeInDown.delay(100 + si * 40).springify()}
          style={styles.menuSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.soon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>U razvoju</Text>
              </View>
            )}
          </View>
          <View style={styles.menuCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.menuItem,
                  i < section.items.length - 1 && styles.menuItemBorder,
                  item.soon && styles.menuItemDisabled,
                ]}
                onPress={() => handlePress(item)}
                activeOpacity={item.soon ? 1 : 0.7}
              >
                <View style={[styles.menuIconBox, item.soon && styles.menuIconBoxSoon]}>
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={item.soon ? Colors.g400 : Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, item.soon && styles.menuTitleDisabled]}>
                    {item.title}
                  </Text>
                  {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                </View>
                {item.soon ? (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Uskoro</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.g400} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ))}

      <Text style={styles.version}>kokamar.rs by Zo! · v1.0.2</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  headerCard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 10,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  headerLogo: { width: 120, height: 38 },
  headerSub: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 6 },
  countBox: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: "center",
  },
  countNum: { fontSize: FontSize.xl, fontWeight: "900", color: "#fff" },
  countLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  socialRow: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
  },
  socialBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, backgroundColor: Colors.white, borderRadius: Radius.lg,
    paddingVertical: 11, borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  socialText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.foreground },

  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statNum: { fontSize: FontSize.lg, fontWeight: "900", color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.muted, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },

  menuSection: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8,
  },
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: "700", color: Colors.muted,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  comingSoonBadge: {
    backgroundColor: Colors.accent + "22",
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.accent + "55",
  },
  comingSoonText: { fontSize: 9, fontWeight: "700", color: Colors.accent },

  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemDisabled: { opacity: 0.5 },
  menuIconBox: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  menuIconBoxSoon: { backgroundColor: Colors.g100 },
  menuTitle: { fontSize: FontSize.base, fontWeight: "600", color: Colors.foreground },
  menuTitleDisabled: { color: Colors.g400 },
  menuSub: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  soonBadge: {
    backgroundColor: Colors.g100, borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  soonText: { fontSize: FontSize.xs, color: Colors.muted, fontWeight: "600" },
  version: {
    textAlign: "center", fontSize: FontSize.xs,
    color: Colors.g400, marginTop: 24,
  },
})
