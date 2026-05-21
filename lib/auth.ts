import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE = "https://kokamar.rs"
const PK = "pk_7dd7e4b3a4f4d1ab4dce79026fa2ac3e2a4c77ad7f3c5e0fd0e57ae3f9d47dac"

export type Customer = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  metadata?: Record<string, unknown>
}

const TOKEN_KEY = "kokamar_auth_token"

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY)
}

export async function login(email: string, password: string): Promise<{ token: string; customer: Customer }> {
  const res = await fetch(`${BASE}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(err.message || "Pogrešan email ili lozinka")
  }
  const { token } = await res.json() as { token: string }
  await setToken(token)
  const customer = await getMe(token)
  return { token, customer }
}

export async function getMe(token?: string | null): Promise<Customer> {
  const t = token ?? await getToken()
  if (!t) throw new Error("Nije prijavljen")
  const res = await fetch(`${BASE}/store/customers/me`, {
    headers: {
      Authorization: `Bearer ${t}`,
      "x-publishable-api-key": PK,
    },
  })
  if (!res.ok) throw new Error("Greška pri učitavanju profila")
  const { customer } = await res.json() as { customer: Customer }
  return customer
}

export async function register(data: {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}): Promise<void> {
  // Korak 1 — registracija auth identiteta
  const authRes = await fetch(`${BASE}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password }),
  })
  if (!authRes.ok) {
    const err = await authRes.json().catch(() => ({})) as { message?: string }
    throw new Error(err.message || "Registracija nije uspela")
  }
  const { token } = await authRes.json() as { token: string }

  // Korak 2 — kreiranje customer profila
  const custRes = await fetch(`${BASE}/store/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-publishable-api-key": PK,
    },
    body: JSON.stringify({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || undefined,
    }),
  })
  if (!custRes.ok) {
    const err = await custRes.json().catch(() => ({})) as { message?: string }
    throw new Error(err.message || "Greška pri kreiranju naloga")
  }
  // Ne logujemo automatski — čeka verifikaciju emaila
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/customer/emailpass/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email }),
  })
  if (!res.ok) throw new Error("Greška pri slanju emaila za resetovanje")
}
