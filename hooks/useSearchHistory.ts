import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "kokamar_search_history"
const MAX = 8

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(val => {
      if (val) setHistory(JSON.parse(val))
    })
  }, [])

  async function addToHistory(term: string) {
    const trimmed = term.trim()
    if (!trimmed) return
    const updated = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, MAX)
    setHistory(updated)
    await AsyncStorage.setItem(KEY, JSON.stringify(updated))
  }

  async function clearHistory() {
    setHistory([])
    await AsyncStorage.removeItem(KEY)
  }

  async function removeItem(term: string) {
    const updated = history.filter(h => h !== term)
    setHistory(updated)
    await AsyncStorage.setItem(KEY, JSON.stringify(updated))
  }

  return { history, addToHistory, clearHistory, removeItem }
}
