import * as Haptics from "expo-haptics"
import { Platform } from "react-native"

/** Najblazi — za tab navigaciju i list item selekciju */
export function hapticSelection() {
  Haptics.selectionAsync()
}

/** Lagan — za dugmad, kartice, otvaranje sekcija */
export function hapticLight() {
  if (Platform.OS === "android") {
    Haptics.selectionAsync()
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
}

/** Medium — za bottom sheet otvaranje, potvrde */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}

/** Success — za uspesne akcije */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}
