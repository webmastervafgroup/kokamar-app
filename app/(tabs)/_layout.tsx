import { Tabs, useRouter } from "expo-router"
import { Platform, View, Image, StyleSheet, TouchableOpacity, Alert } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
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

function HomeHeaderRight() {
  const router = useRouter()
  return (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/(tabs)/katalog")} activeOpacity={0.7}>
        <Ionicons name="search-outline" size={22} color={Colors.foreground} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={() => Alert.alert("Notifikacije", "Push notifikacije dolaze uskoro.", [{ text: "OK" }])}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={22} color={Colors.foreground} />
      </TouchableOpacity>
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
  return (
    <Tabs
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
        // Sve sekundarne stranice — bez sistemskog headera
        headerShown: false,
      }}
    >
      {/* Početna — jedina sa headerom (logo) */}
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

      {/* Akcije — bez headera, search je unutar ekrana */}
      <Tabs.Screen
        name="akcije"
        options={{
          title: "Akcije",
          tabBarIcon: ({ focused }) => <TabIcon name="pricetag" focused={focused} />,
        }}
      />

      {/* Moj Kod */}
      <Tabs.Screen
        name="moj-kod"
        options={{
          title: "",
          tabBarIcon: () => <FabIcon />,
          tabBarLabel: () => null,
        }}
      />

      {/* Lokacije */}
      <Tabs.Screen
        name="lokacije/index"
        options={{
          title: "Lokacije",
          tabBarIcon: ({ focused }) => <TabIcon name="location" focused={focused} />,
        }}
      />

      {/* Više */}
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
      <Tabs.Screen name="brendovi/[name]" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  logoBtn: { paddingLeft: 16 },
  headerLogo: { width: 100, height: 34 },
  headerRight: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  headerBtn: { padding: 8 },
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
