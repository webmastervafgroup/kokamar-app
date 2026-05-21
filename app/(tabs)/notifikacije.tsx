import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useNotificationStore, markAllRead } from "@/hooks/useNotificationStore"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { hapticLight } from "@/hooks/useHaptic"
import Animated, { FadeInDown } from "react-native-reanimated"

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return "Upravo"
  if (diff < 3600) return `Pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Pre ${Math.floor(diff / 3600)} h`
  return `Pre ${Math.floor(diff / 86400)} dana`
}

export default function NotifikacijeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { notifications, unreadCount } = useNotificationStore()

  function handleOpen(url?: string) {
    hapticLight()
    if (url) Linking.openURL(url)
    markAllRead()
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Obaveštenja</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => { hapticLight(); markAllRead() }} activeOpacity={0.7}>
            <Text style={styles.markRead}>Sve pročitano</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {notifications.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.g400} />
            <Text style={styles.emptyTitle}>Nema obaveštenja</Text>
            <Text style={styles.emptySub}>Ovde će se pojaviti obaveštenja o akcijama i novostima</Text>
          </Animated.View>
        ) : (
          notifications.map((n, i) => (
            <Animated.View key={n.id} entering={FadeInDown.delay(i * 30).springify()}>
              <TouchableOpacity
                style={[styles.item, !n.read && styles.itemUnread]}
                onPress={() => handleOpen(n.url)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconBox, !n.read && styles.iconBoxUnread]}>
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color={!n.read ? Colors.white : Colors.muted}
                  />
                </View>
                <View style={styles.content}>
                  <Text style={[styles.title, !n.read && styles.titleUnread]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
                  <Text style={styles.time}>{timeAgo(n.receivedAt)}</Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </TouchableOpacity>
              {i < notifications.length - 1 && <View style={styles.divider} />}
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground },
  markRead: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.primary, paddingRight: 4 },

  empty: {
    alignItems: "center", paddingTop: 80, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.foreground, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20 },

  item: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  itemUnread: { backgroundColor: "#fff5f5" },

  iconBox: {
    width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: Colors.g100, justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  iconBoxUnread: { backgroundColor: Colors.primary },

  content: { flex: 1 },
  title: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground, marginBottom: 2 },
  titleUnread: { fontWeight: "700", color: Colors.primary },
  body: { fontSize: FontSize.xs, color: Colors.muted, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.g400, marginTop: 4 },

  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 6, flexShrink: 0,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },
})
