import { StatusBar } from "expo-status-bar"
import { StyleSheet, Text, View } from "react-native"
import { Colors } from "@/constants/Colors"

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kokamar</Text>
      <Text style={styles.sub}>Vaš domaći market u Beogradu</Text>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: "800", color: Colors.primary },
  sub: { fontSize: 14, color: Colors.muted, marginTop: 8 },
})
