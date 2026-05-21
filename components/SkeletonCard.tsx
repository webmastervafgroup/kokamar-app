import { View, StyleSheet, Dimensions } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from "react-native-reanimated"
import { useEffect } from "react"
import { Colors, Radius } from "@/constants/Colors"

const { width } = Dimensions.get("window")
const CARD_W = (width - 48) / 2

function SkeletonBox({ style }: { style?: any }) {
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true)
  }, [])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.View style={[styles.box, style, animStyle]} />
}

export function SkeletonProductCard() {
  return (
    <View style={styles.card}>
      <View style={styles.imgBox} />
      <View style={styles.body}>
        <SkeletonBox style={{ height: 12, width: "90%", marginBottom: 6 }} />
        <SkeletonBox style={{ height: 12, width: "70%", marginBottom: 14 }} />
        <SkeletonBox style={{ height: 18, width: "50%" }} />
      </View>
    </View>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  const pairs = Array.from({ length: Math.ceil(count / 2) })
  return (
    <View style={styles.grid}>
      {pairs.map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonProductCard />
          <SkeletonProductCard />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  card: {
    width: CARD_W,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1, borderColor: Colors.border,
  },
  imgBox: { width: "100%", height: 150, backgroundColor: Colors.g100 },
  body: { padding: 10 },
  box: { backgroundColor: Colors.g200, borderRadius: 6 },
})
