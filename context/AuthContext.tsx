import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getMe, getToken, clearToken, type Customer } from "@/lib/auth"

type AuthState = {
  customer: Customer | null
  loading: boolean
  reload: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  customer: null,
  loading: true,
  reload: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const token = await getToken()
      if (!token) { setCustomer(null); return }
      const c = await getMe(token)
      setCustomer(c)
    } catch {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  async function reload() {
    setLoading(true)
    await load()
  }

  async function logout() {
    await clearToken()
    setCustomer(null)
  }

  useEffect(() => { load() }, [])

  return (
    <AuthContext.Provider value={{ customer, loading, reload, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
