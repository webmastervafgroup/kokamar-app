import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { getProduct } from "@/lib/api/medusa"

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (handle) getProduct(handle).then(setProduct).finally(() => setLoading(false))
  }, [handle])

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  )

  if (!product) return (
    <View style={styles.centered}>
      <Text style={styles.notFound}>Proizvod nije pronađen</Text>
    </View>
  )

  const images = product.images ?? []
  const price = product.variants?.[0]?.prices?.[0]?.amount
  const brand = product.metadata?.brand?.name || product.metadata?.brand

  const descText = product.description
    ? product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : ""

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Slike */}
      <View style={styles.imageBox}>
        {images.length > 0 ? (
          <Image source={{ uri: images[imgIdx]?.url }} style={styles.mainImage} resizeMode="contain" />
        ) : (
          <View style={[styles.mainImage, styles.noImage]}>
            <Text style={{ fontSize: 64 }}>🛒</Text>
          </View>
        )}
        {images.length > 1 && (
          <View style={styles.thumbRow}>
            {images.map((img: any, i: number) => (
              <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
                <Image
                  source={{ uri: img.url }}
                  style={[styles.thumb, i === imgIdx && styles.thumbActive]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Brend */}
        {brand && <Text style={styles.brand}>{brand}</Text>}

        {/* Naziv */}
        <Text style={styles.title}>{product.title}</Text>

        {/* Cena */}
        {price && (
          <Text style={styles.price}>{(price / 100).toLocaleString("sr-RS")} RSD</Text>
        )}

        <View style={styles.divider} />

        {/* Opis */}
        {descText ? (
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>Opis</Text>
            <Text style={styles.descText}>{descText}</Text>
          </View>
        ) : null}

        {/* Dostupnost */}
        <View style={styles.infoCard}>
          <Text style={styles.infoRow}>📍 Dostupno u svim Kokamar marketima</Text>
          <Text style={styles.infoRow}>🕐 Radno vreme: svaki dan 07:00–21:00</Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: FontSize.base, color: Colors.muted },
  imageBox: { backgroundColor: Colors.white, padding: 16 },
  mainImage: { width: "100%", height: 280, backgroundColor: Colors.g100, borderRadius: Radius.md },
  noImage: { justifyContent: "center", alignItems: "center" },
  thumbRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border },
  thumbActive: { borderColor: Colors.primary },
  body: { padding: 16 },
  brand: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  title: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.foreground, lineHeight: 28 },
  price: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.primary, marginTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.foreground, marginBottom: 8 },
  descSection: { marginBottom: 16 },
  descText: { fontSize: FontSize.base, color: Colors.muted, lineHeight: 22 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 6,
  },
  infoRow: { fontSize: FontSize.sm, color: Colors.foreground, lineHeight: 20 },
})
