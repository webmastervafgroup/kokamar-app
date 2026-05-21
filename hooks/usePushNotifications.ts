import { useEffect } from "react"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const PROJECT_ID = "95470c74-2b04-421a-a08c-2fe4a609038b"
const API_URL = "https://kokamar.rs/api/notifications/register"

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Kokamar obaveštenja",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#da2128",
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== "granted") return null

  try {
    // Expo Push Token — radi sa addNotificationReceivedListener
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    })
    return tokenData.data
  } catch (e) {
    console.error("[push] getExpoPushTokenAsync failed", e)
    return null
  }
}

export function usePushNotifications() {
  useEffect(() => {
    registerForPushNotifications().then(async (token) => {
      if (!token) return
      try {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, platform: Platform.OS }),
        })
      } catch {}
    })

    return () => {}
  }, [])
}
