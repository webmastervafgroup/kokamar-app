import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeIn, SlideInDown, SlideOutDown } from "react-native-reanimated"
import { hapticSelection } from "@/hooks/useHaptic"
import { Colors, FontSize, Radius } from "@/constants/Colors"

type Option = { key: string; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }

type Props = {
  visible: boolean
  onClose: () => void
  options: Option[]
  selected: string
  onSelect: (key: string) => void
  title?: string
}

export function SortBottomSheet({ visible, onClose, options, selected, onSelect, title = "Sortiraj" }: Props) {
  function pick(key: string) {
    hapticSelection()
    onSelect(key)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={SlideInDown.springify().damping(20)} exiting={SlideOutDown.duration(200)} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, selected === opt.key && styles.optionActive]}
              onPress={() => pick(opt.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, selected === opt.key && styles.optionIconActive]}>
                <Ionicons name={opt.icon} size={18} color={selected === opt.key ? Colors.white : Colors.muted} />
              </View>
              <Text style={[styles.optionLabel, selected === opt.key && styles.optionLabelActive]}>
                {opt.label}
              </Text>
              {selected === opt.key && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Otkaži</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.g200, alignSelf: "center", marginBottom: 16,
  },
  title: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.foreground, marginBottom: 16, textAlign: "center" },

  option: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: Radius.lg, marginBottom: 8,
    backgroundColor: Colors.g100,
  },
  optionActive: { backgroundColor: "#fff0f0" },
  optionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.g200, justifyContent: "center", alignItems: "center",
  },
  optionIconActive: { backgroundColor: Colors.primary },
  optionLabel: { flex: 1, fontSize: FontSize.base, fontWeight: "600", color: Colors.foreground },
  optionLabelActive: { color: Colors.primary },

  cancelBtn: {
    marginTop: 8, paddingVertical: 14,
    backgroundColor: Colors.g100, borderRadius: Radius.full, alignItems: "center",
  },
  cancelText: { fontSize: FontSize.base, fontWeight: "700", color: Colors.muted },
})
