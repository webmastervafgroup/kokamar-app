import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getBrands } from "@/lib/api/payload"

export default function BrendoviScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [brands, setBrands] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getBrands().then((data) => {
      const withLogo = data.filter((b: any) => b.logo?.url)
      setBrands(withLogo)
      setFiltered(withLogo)
    }).finally(() => setLoading(false))
  }, [])

  function handleSearch(text: string) {
    setSearch(text)
    if (!text.trim()) setFiltered(brands)
    else {
      const q = text.toLowerCase()
      setFiltered(brands.filter((b: any) => b.name?.toLowerCase().includes(q)))
    }
  }

  function getLogoUrl(brand: any): string {
    const url = brand.logo?.url ?? ""
    return url.startsWith("http") ? url : `https://kokamar.rs/cms${url}`
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Brendovi</Text>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>{loading ? "–" : brands.length}</Text>
              <Text style={styles.countLabel}>brendova</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Brendovi u ponudi Kokamar-a</Text>
        </View>
      </Animated.View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.g400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži brendove..."
            placeholderTextColor={Colors.g400}
            value={search}
            onChangeText={handleSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.g400} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="pricetags-outline" size={48} color={Colors.g200} />
              <Text style={styles.emptyText}>Nema brendova</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 20).springify()} style={styles.brandCard}>
              <TouchableOpacity
                style={styles.brandInner}
                onPress={() => router.push({
                  pathname: "/(tabs)/brendovi/[name]",
                  params: { name: item.name, logoUrl: getLogoUrl(item) }
                })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: getLogoUrl(item) }} style={styles.brandLogo} resizeMode="contain" />
                <Text style={styles.brandName} numberOfLines={2}>{item.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  headerTitle: { color: Colors.white, fontSize: 28, fontWeight: "900" },
  countBox: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: "center", minWidth: 60,
  },
  countNum: { color: Colors.white, fontSize: 20, fontWeight: "900" },
  countLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "600" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: FontSize.sm },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.foreground },
  grid: { padding: 16, paddingTop: 8, gap: 10 },
  brandCard: { flex: 1 },
  brandInner: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: Colors.border,
    gap: 8, minHeight: 100, justifyContent: "center",
  },
  brandLogo: { width: "100%", height: 50 },
  brandName: { fontSize: 10, fontWeight: "600", color: Colors.muted, textAlign: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.muted },
})
