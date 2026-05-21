import { useState, useEffect, useRef } from "react"
import * as Notifications from "expo-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AppState, AppStateStatus } from "react-native"

export type StoredNotification = {
  id: string
  title: string
  body: string
  url?: string
  receivedAt: number
  read: boolean
}

const STORAGE_KEY = "kokamar_notifications"
const BADGE_KEY = "kokamar_badge_count"

let _notifications: StoredNotification[] = []
let _badgeCount = 0
let _loaded = false
let _listeners: Array<() => void> = []

function notifyListeners() {
  _listeners.forEach(fn => fn())
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_notifications))
    await AsyncStorage.setItem(BADGE_KEY, String(_badgeCount))
  } catch {}
}

export async function loadNotifications() {
  if (_loaded) return
  _loaded = true
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) _notifications = JSON.parse(raw) as StoredNotification[]
    const badge = await AsyncStorage.getItem(BADGE_KEY)
    if (badge) _badgeCount = parseInt(badge) || 0
    notifyListeners()
  } catch {}
}

export async function addNotification(n: StoredNotification) {
  if (_notifications.find(x => x.id === n.id)) return
  _notifications = [n, ..._notifications].slice(0, 50)
  if (!n.read) {
    _badgeCount++
    await Notifications.setBadgeCountAsync(_badgeCount).catch(() => {})
  }
  notifyListeners()
  await persist()
}

export async function markAllRead() {
  _notifications = _notifications.map(n => ({ ...n, read: true }))
  _badgeCount = 0
  await Notifications.setBadgeCountAsync(0).catch(() => {})
  notifyListeners()
  await persist()
}

export function getUnreadCount() {
  return _badgeCount
}

export function useNotificationStore() {
  const [, setTick] = useState(0)

  useEffect(() => {
    loadNotifications()
    const fn = () => setTick(v => v + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(l => l !== fn) }
  }, [])

  return {
    notifications: _notifications,
    unreadCount: _badgeCount,
    markAllRead,
  }
}

export function useNotificationListener() {
  const foregroundSub = useRef<Notifications.EventSubscription>()
  const responseSub = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    loadNotifications()

    // Primljena dok je app u FOREGROUNDU
    foregroundSub.current = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content
      addNotification({
        id: notification.request.identifier,
        title: title ?? "Kokamar",
        body: body ?? "",
        url: (data?.url as string) ?? undefined,
        receivedAt: Date.now(),
        read: false,
      })
    })

    // Kliknuta notifikacija (background/killed)
    responseSub.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { title, body, data } = response.notification.request.content
      addNotification({
        id: response.notification.request.identifier,
        title: title ?? "Kokamar",
        body: body ?? "",
        url: (data?.url as string) ?? undefined,
        receivedAt: Date.now(),
        read: true,
      })
      const url = data?.url as string | undefined
      if (url) import("expo-linking").then(({ openURL }) => openURL(url).catch(() => {}))
    })

    // App se vratio u foreground — provjeri badge sa sistema i sinkronizuj
    const appStateSub = AppState.addEventListener("change", async (state: AppStateStatus) => {
      if (state === "active") {
        const sysBadge = await Notifications.getBadgeCountAsync().catch(() => 0)
        if (sysBadge !== _badgeCount) {
          _badgeCount = sysBadge
          notifyListeners()
        }
      }
    })

    // Cold start — app otvoren klikom na notifikaciju
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return
      const { title, body, data } = response.notification.request.content
      addNotification({
        id: response.notification.request.identifier + "_cs",
        title: title ?? "Kokamar",
        body: body ?? "",
        url: (data?.url as string) ?? undefined,
        receivedAt: Date.now(),
        read: true,
      })
    })

    return () => {
      foregroundSub.current?.remove()
      responseSub.current?.remove()
      appStateSub.remove()
    }
  }, [])
}
