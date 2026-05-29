import { useState } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Linking, Modal, Dimensions, StatusBar,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Colors, FontSize, Radius } from "@/constants/Colors"

const { width } = Dimensions.get("window")

/** Mega Kokamar letak — flipbook modal (swipe strane + Preuzmi PDF). Deli ga home i akcije ekran. */
export function MegaLetakFlipbook({
  visible, onClose, naslov, strane, pdfUrl,
}: {
  visible: boolean; onClose: () => void; naslov: string; strane: string[]; pdfUrl: string | null
}) {
  const insets = useSafeAreaInsets()
  const [active, setActive] = useState(0)
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={s.topBar}>
          <Text style={s.topTitle} numberOfLines={1}>{naslov}</Text>
          <Text style={s.counter}>{active + 1} / {strane.length}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {pdfUrl ? (
              <TouchableOpacity style={s.pdfBtn} onPress={() => Linking.openURL(pdfUrl)} activeOpacity={0.8}>
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={s.pdfText}>PDF</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={strane}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={s.page}>
              <Image source={{ uri: item }} style={s.pageImg} resizeMode="contain" />
            </View>
          )}
        />
        <View style={s.dots}>
          {strane.map((_, i) => (
            <View key={i} style={[s.dot, i === active && s.dotActive]} />
          ))}
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  topTitle: { flex: 1, color: "#fff", fontSize: FontSize.base, fontWeight: "800" },
  counter: { color: "rgba(255,255,255,0.6)", fontSize: FontSize.xs },
  pdfBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  pdfText: { color: "#fff", fontSize: FontSize.xs, fontWeight: "700" },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  page: { width, flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  pageImg: { width: width - 16, height: "92%" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
})
