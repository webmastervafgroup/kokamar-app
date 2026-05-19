import { Tabs, useRouter } from "expo-router"
import { Platform, View, Image, StyleSheet, TouchableOpacity, Alert } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Colors } from "@/constants/Colors"

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  const icon = focused ? name : `${name}-outline` as IoniconName
  return <Ionicons name={icon} size={22} color={focused ? Colors.primary : Colors.g400} />
}

function FabIcon() {
  return (
    <View style={styles.fab}>
      <Ionicons name="barcode-outline" size={26} color="#fff" />
    </View>
  )
}

// Header desno — search + notifikacije, uvijek isto
function HeaderRight() {
  const router = useRouter()
  return (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={() => router.push("/(tabs)/katalog")}
        activeOpacity={0.7}
      >
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

// Početna: logo lijevo
function HomeHeaderLeft() {
  const router = useRouter()
  return (
    <TouchableOpacity onPress={() => router.push("/(tabs)")} activeOpacity={0.7} style={styles.logoBtn}>
      <Image source={require("@/assets/images/logo.png")} style={styles.headerLogo} resizeMode="contain" />
    </TouchableOpacity>
  )
}

const baseHeaderStyle = {
  backgroundColor: Colors.white,
  elevation: 0,
  shadowOpacity: 0,
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
          height: Platform.OS === "ios" ? 88 : 62,
          paddingBottom: Platform.OS === "ios" ? 28 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerShadowVisible: false,
      }}
    >
      {/* Početna — logo */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Početna",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          headerStyle: baseHeaderStyle,
          headerTitle: "",
          headerLeft: () => <HomeHeaderLeft />,
          headerRight: () => <HeaderRight />,
        }}
      />

      {/* Akcije — centriran naslov */}
      <Tabs.Screen
        name="akcije"
        options={{
          title: "Akcije",
          tabBarIcon: ({ focused }) => <TabIcon name="pricetag" focused={focused} />,
          headerStyle: baseHeaderStyle,
          headerTitle: "Akcije i popusti",
          headerTitleAlign: "center",
          headerTitleStyle: styles.centeredTitle,
          headerLeft: () => <View style={{ width: 16 }} />,
          headerRight: () => <HeaderRight />,
        }}
      />

      {/* Moj Kod — bez headera (vlastiti) */}
      <Tabs.Screen
        name="moj-kod"
        options={{
          title: "",
          tabBarIcon: () => <FabIcon />,
          tabBarLabel: () => null,
          headerShown: false,
        }}
      />

      {/* Lokacije — bez headera (vlastiti hero) */}
      <Tabs.Screen
        name="lokacije/index"
        options={{
          title: "Lokacije",
          tabBarIcon: ({ focused }) => <TabIcon name="location" focused={focused} />,
          headerShown: false,
        }}
      />

      {/* Više — centriran naslov */}
      <Tabs.Screen
        name="vise"
        options={{
          title: "Više",
          tabBarIcon: ({ focused }) => <TabIcon name="menu" focused={focused} />,
          headerStyle: baseHeaderStyle,
          headerTitle: "Moj profil",
          headerTitleAlign: "center",
          headerTitleStyle: styles.centeredTitle,
          headerLeft: () => <View style={{ width: 16 }} />,
          headerRight: () => <HeaderRight />,
        }}
      />

      {/* Skriveni tabovi */}
      <Tabs.Screen
        name="katalog/index"
        options={{
          href: null,
          headerStyle: baseHeaderStyle,
          headerTitle: "Katalog",
          headerTitleAlign: "center",
          headerTitleStyle: styles.centeredTitle,
          headerLeft: () => <View style={{ width: 16 }} />,
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tabs.Screen name="katalog/[handle]" options={{ href: null }} />
      <Tabs.Screen name="lokacije/[slug]" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  logoBtn: { paddingLeft: 16 },
  headerLogo: { width: 100, height: 34 },
  centeredTitle: { fontSize: 17, fontWeight: "700", color: Colors.foreground },
  headerRight: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  headerBtn: { padding: 8 },
  fab: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
    elevation: 8,
  },
})
