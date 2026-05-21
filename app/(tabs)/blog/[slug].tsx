import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity, StatusBar, Share,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getBlogPost } from "@/lib/api/payload"

function formatDate(str: string): string {
  if (!str) return ""
  const d = new Date(str)
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}.`
}

// Parsira Lexical JSON u čist tekst
function lexicalToText(content: any): string {
  if (!content) return ""
  // Ako je string (HTML fallback)
  if (typeof content === "string") {
    return content.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()
  }
  // Lexical JSON
  if (content?.root?.children) {
    return nodesToText(content.root.children)
  }
  return ""
}

function nodesToText(nodes: any[]): string {
  if (!Array.isArray(nodes)) return ""
  return nodes.map(node => {
    if (node.type === "text") return node.text ?? ""
    if (node.type === "linebreak") return "\n"
    if (node.type === "paragraph") {
      const text = nodesToText(node.children ?? [])
      return text ? text + "\n\n" : ""
    }
    if (node.type === "heading") {
      return (nodesToText(node.children ?? [])).toUpperCase() + "\n\n"
    }
    if (node.type === "listitem") {
      return "• " + nodesToText(node.children ?? []) + "\n"
    }
    if (node.type === "list") {
      return nodesToText(node.children ?? []) + "\n"
    }
    if (node.children) return nodesToText(node.children)
    return ""
  }).join("").replace(/\n{3,}/g, "\n\n").trim()
}

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getBlogPost(slug).then(setPost).finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  )

  if (!post) return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Ionicons name="newspaper-outline" size={48} color={Colors.g200} />
      <Text style={styles.notFound}>Post nije pronađen</Text>
    </View>
  )

  const img = post.featuredImage?.url
    ? (post.featuredImage.url.startsWith("http") ? post.featuredImage.url : `https://kokamar.rs/cms${post.featuredImage.url}`)
    : null

  const content = lexicalToText(post.content)
  const excerpt = typeof post.excerpt === "string" ? post.excerpt : ""

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          {post.category && (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{post.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.headerTitle}>{post.title}</Text>
          <View style={styles.headerMeta}>
            {post.publishedAt && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>{formatDate(post.publishedAt)}</Text>
              </View>
            )}
            {post.readingTimeMin && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>{post.readingTimeMin} min čitanja</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => Share.share({ title: post.title, message: `${post.title}\nhttps://kokamar.rs/blog/${post.slug}` })}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={16} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Slika */}
      {img && (
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <Image source={{ uri: img }} style={styles.featuredImg} resizeMode="cover" />
        </Animated.View>
      )}

      {/* Excerpt */}
      {excerpt ? (
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.excerptCard}>
          <Text style={styles.excerptText}>{excerpt}</Text>
        </Animated.View>
      ) : null}

      {/* Sadržaj */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.contentCard}>
        {content ? (
          <Text style={styles.content}>{content}</Text>
        ) : (
          <View style={styles.noContentWrap}>
            <Ionicons name="document-text-outline" size={40} color={Colors.g200} />
            <Text style={styles.noContent}>Sadržaj će biti dostupan uskoro.</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  notFound: { fontSize: FontSize.base, color: Colors.muted },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingBottom: 24 },
  catBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 12,
  },
  catBadgeText: { color: Colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: "900", lineHeight: 30, marginBottom: 14 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  shareBtn: {
    marginLeft: "auto" as any,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },

  featuredImg: { width: "100%", height: 220 },

  excerptCard: {
    margin: 16, marginBottom: 0,
    backgroundColor: "#fff8f0",
    borderRadius: Radius.lg, padding: 16,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  excerptText: { fontSize: FontSize.base, color: Colors.foreground, lineHeight: 24, fontStyle: "italic" },

  contentCard: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  content: { fontSize: FontSize.base, color: Colors.foreground, lineHeight: 28 },
  noContentWrap: { alignItems: "center", paddingVertical: 24, gap: 10 },
  noContent: { fontSize: FontSize.base, color: Colors.muted, textAlign: "center" },
})
