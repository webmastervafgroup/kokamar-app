import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Share,
} from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getBlogPosts } from "@/lib/api/payload"

const CATEGORIES = [
  { slug: null, name: "Sve" },
  { slug: "recepti", name: "Recepti" },
  { slug: "saveti", name: "Saveti" },
  { slug: "novosti", name: "Novosti" },
  { slug: "akcije", name: "Akcije" },
]

function formatDate(str: string): string {
  if (!str) return ""
  const d = new Date(str)
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim() ?? ""
}

async function sharePost(post: any) {
  const url = `https://kokamar.rs/blog/${post.slug}`
  await Share.share({ title: post.title, message: `${post.title}\n${url}`, url })
}

export default function BlogScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [posts, setPosts] = useState<any[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => { loadPosts(null, 1, true) }, [])

  function loadPosts(cat: string | null, p: number, reset: boolean) {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    // Filtriranje po category stringu
    getBlogPostsFiltered(cat, p).then((data) => {
      if (reset) setPosts(data.docs ?? [])
      else setPosts(prev => [...prev, ...(data.docs ?? [])])
      setTotalDocs(data.totalDocs ?? 0)
      setPage(p)
    }).finally(() => { setLoading(false); setLoadingMore(false) })
  }

  function selectCategory(slug: string | null) {
    setSelectedCat(slug)
    loadPosts(slug, 1, true)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* HEADER */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerName}>Blog</Text>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>{loading ? "–" : totalDocs}</Text>
              <Text style={styles.countLabel}>postova</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Recepti, saveti i novosti</Text>
        </View>
      </Animated.View>

      {/* FILTER KATEGORIJA */}
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.slug ?? "all")}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCat === item.slug && styles.catChipActive]}
              onPress={() => selectCategory(item.slug)}
              activeOpacity={0.75}
            >
              <Text style={[styles.catChipText, selectedCat === item.slug && styles.catChipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {/* LISTA */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (!loadingMore && posts.length < totalDocs) loadPosts(selectedCat, page + 1, false) }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.g200} />
              <Text style={styles.emptyText}>Nema postova</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const imgUrl = item.featuredImage?.url
            const img = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `https://kokamar.rs/cms${imgUrl}`) : null
            const excerpt = stripHtml(item.excerpt || "").slice(0, 120)
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push({ pathname: "/(tabs)/blog/[slug]", params: { slug: item.slug } })}
                  activeOpacity={0.88}
                >
                  {img ? (
                    <Image source={{ uri: img }} style={styles.cardImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                      <Ionicons name="newspaper-outline" size={40} color={Colors.g200} />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <View style={styles.cardMeta}>
                      {item.publishedAt && (
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar-outline" size={12} color={Colors.muted} />
                          <Text style={styles.cardDate}>{formatDate(item.publishedAt)}</Text>
                        </View>
                      )}
                      {item.category && (
                        <View style={styles.catTag}>
                          <Text style={styles.catTagText}>{item.category}</Text>
                        </View>
                      )}
                      {item.readingTimeMin && (
                        <Text style={styles.readTime}>{item.readingTimeMin} min</Text>
                      )}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {excerpt ? <Text style={styles.cardExcerpt} numberOfLines={2}>{excerpt}</Text> : null}
                    <View style={styles.cardFooter}>
                      <View style={styles.readMore}>
                        <Text style={styles.readMoreText}>Pročitaj više</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                      </View>
                      <TouchableOpacity style={styles.shareBtn} onPress={() => sharePost(item)} activeOpacity={0.7}>
                        <Ionicons name="share-outline" size={18} color={Colors.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          }}
        />
      )}
    </View>
  )
}

async function getBlogPostsFiltered(cat: string | null, page: number) {
  const { API } = await import("@/constants/Colors")
  let url = `${API.payloadBase}/blog-posts?limit=10&page=${page}&sort=-publishedAt&depth=1`
  if (cat) url += `&where[category][equals]=${cat}`
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } })
    const text = await res.text()
    if (!text || text.trimStart().startsWith("<")) return { docs: [], totalDocs: 0 }
    return JSON.parse(text)
  } catch { return { docs: [], totalDocs: 0 } }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  headerName: { color: Colors.white, fontSize: 28, fontWeight: "900" },
  countBox: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: "center", minWidth: 60,
  },
  countNum: { color: Colors.white, fontSize: 20, fontWeight: "900" },
  countLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "600" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: FontSize.sm },
  catList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: "center" },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, height: 36,
    borderRadius: Radius.full, justifyContent: "center",
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },
  catChipTextActive: { color: Colors.white },
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardImg: { width: "100%", height: 180 },
  cardImgPlaceholder: { backgroundColor: Colors.g100, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 14 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDate: { fontSize: 11, color: Colors.muted },
  catTag: { backgroundColor: "#fff0f0", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  catTagText: { fontSize: 10, color: Colors.primary, fontWeight: "700" },
  readTime: { fontSize: 10, color: Colors.muted },
  cardTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.foreground, lineHeight: 24, marginBottom: 6 },
  cardExcerpt: { fontSize: FontSize.sm, color: Colors.muted, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  readMore: { flexDirection: "row", alignItems: "center", gap: 4 },
  readMoreText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.g100, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.muted },
})
