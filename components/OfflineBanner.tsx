import { View, Text, StyleSheet } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useNetwork } from "@/hooks/useNetwork"

export function OfflineBanner() {
  const isOnline = useNetwork()
  if (isOnline) return null
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>Nema interneta — prikazani su keširani podaci</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1a1a1a",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: { color: "#fff", fontSize: 12, fontWeight: "600", flex: 1 },
})
