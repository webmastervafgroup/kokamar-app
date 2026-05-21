import { Tabs, useRouter } from "expo-router"
import { Platform, View, Image, StyleSheet, TouchableOpacity, Text } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { hapticSelection, hapticLight } from "@/hooks/useHaptic"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useNotificationStore, useNotificationListener } from "@/hooks/useNotificationStore"
import { Colors } from "@/constants/Colors"

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  const icon = focused ? name : `${name}-outline` as IoniconName
  return <Ionicons name={icon} size={24} color={focused ? Colors.primary : Colors.g400} />
}

function FabIcon() {
  return (
    <View style={styles.fab}>
      <Ionicons name="barcode-outline" size={26} color="#fff" />
    </View>
  )
}

function HomeHeaderLeft() {
  const router = useRouter()
  return (
    <TouchableOpacity onPress={() => router.push("/(tabs)")} activeOpacity={0.7} style={styles.logoBtn}>
      <Image source={require("@/assets/images/logo.png")} style={styles.headerLogo} resizeMode="contain" />
    </TouchableOpacity>
  )
}

function NotificationBell() {
  const router = useRouter()
  const { unreadCount } = useNotificationStore()

  return (
    <TouchableOpacity
      style={styles.headerBtn}
      onPress={() => { hapticLight(); router.push("/(tabs)/notifikacije") }}
      activeOpacity={0.7}
    >
      <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={22} color={Colors.foreground} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

function HomeHeaderRight() {
  const router = useRouter()
  return (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/(tabs)/katalog")} activeOpacity={0.7}>
        <Ionicons name="search-outline" size={22} color={Colors.foreground} />
      </TouchableOpacity>
      <NotificationBell />
    </View>
  )
}

const baseHeaderStyle = {
  backgroundColor: Colors.white,
  elevation: 0, shadowOpacity: 0,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
} as any

export default function TabLayout() {
  usePushNotifications()
  useNotificationListener()

  return (
    <Tabs
      screenListeners={{ tabPress: () => hapticSelection() }}
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.g400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 66,
          paddingBottom: Platform.OS === "ios" ? 28 : 6,
          paddingTop: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerShadowVisible: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Početna",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          headerShown: true,
          headerStyle: baseHeaderStyle,
          headerTitle: "",
          headerLeft: () => <HomeHeaderLeft />,
          headerRight: () => <HomeHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="akcije"
        options={{
          title: "Akcije",
          tabBarIcon: ({ focused }) => <TabIcon name="pricetag" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="moj-kod"
        options={{
          title: "",
          tabBarIcon: () => <FabIcon />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="lokacije/index"
        options={{
          title: "Lokacije",
          tabBarIcon: ({ focused }) => <TabIcon name="location" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vise"
        options={{
          title: "Više",
          tabBarIcon: ({ focused }) => <TabIcon name="menu" focused={focused} />,
        }}
      />

      <Tabs.Screen name="katalog/index" options={{ href: null }} />
      <Tabs.Screen name="katalog/[handle]" options={{ href: null }} />
      <Tabs.Screen name="lokacije/[slug]" options={{ href: null }} />
      <Tabs.Screen name="blog/index" options={{ href: null }} />
      <Tabs.Screen name="blog/[slug]" options={{ href: null }} />
      <Tabs.Screen name="brendovi/index" options={{ href: null }} />
      <Tabs.Screen name="o-kompaniji" options={{ href: null }} />
      <Tabs.Screen name="kontakt" options={{ href: null }} />
      <Tabs.Screen name="brendovi/[name]" options={{ href: null }} />
      <Tabs.Screen name="nalog" options={{ href: null }} />
      <Tabs.Screen name="notifikacije" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  logoBtn: { paddingLeft: 16 },
  headerLogo: { width: 100, height: 34 },
  headerRight: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  headerBtn: { padding: 8, position: "relative" },
  badge: {
    position: "absolute", top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.white,
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 22,
    borderWidth: 2, borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8,
    elevation: 10,
  },
})
