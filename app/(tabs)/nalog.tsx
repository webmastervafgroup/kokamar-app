"use client"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar, Alert, Linking,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import Animated, { FadeInDown } from "react-native-reanimated"
import { useState } from "react"
import { Colors, FontSize, Radius } from "@/constants/Colors"
import { hapticLight, hapticSelection } from "@/hooks/useHaptic"
import { login, register, requestPasswordReset } from "@/lib/auth"
import { useAuth } from "@/context/AuthContext"

type Screen = "dashboard" | "login" | "register" | "forgot"

const BASE = "https://kokamar.rs"

const COMING_SOON = [
  { icon: "barcode-outline" as const, label: "Moj Kod", desc: "Lični QR kod za brzu identifikaciju" },
  { icon: "gift-outline" as const, label: "Vaučeri", desc: "Digitalni vaučeri i poklon kartice" },
  { icon: "receipt-outline" as const, label: "Digitalni račun", desc: "Pregled i arhiva računa" },
  { icon: "list-outline" as const, label: "Istorija kupovina", desc: "Sve kupovine u Kokamar marketima" },
]

// ─── INPUT ────────────────────────────────────────────────────────────────────
function Input({
  label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, autoComplete,
}: {
  label: string; value: string; onChangeText: (t: string) => void
  secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any; autoComplete?: any
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={inputStyles.wrap}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, focused && inputStyles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "none"}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.g400}
      />
    </View>
  )
}

const inputStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.muted, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.base, color: Colors.foreground,
    backgroundColor: Colors.white,
  },
  inputFocused: { borderColor: Colors.primary },
})

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onSwitch, onSuccess }: { onSwitch: (s: Screen) => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { reload } = useAuth()

  async function handleLogin() {
    if (!email || !pass) { setError("Unesite email i lozinku."); return }
    setLoading(true); setError("")
    try {
      await login(email.trim(), pass)
      await reload()
      hapticLight()
      onSuccess()
    } catch (e: any) {
      setError(e.message || "Greška pri prijavi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
        <View style={s.redBar} />
        <Text style={s.formTitle}>Dobrodošli nazad</Text>
        <Text style={s.formSub}>Prijavite se na vaš Kokamar nalog</Text>

        <Input label="Email adresa" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Input label="Lozinka" value={pass} onChangeText={setPass} secureTextEntry autoComplete="password" />

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <TouchableOpacity style={s.primaryBtn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Prijavite se</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onSwitch("forgot")} style={s.linkBtn}>
          <Text style={s.linkText}>Zaboravili ste lozinku?</Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} /><Text style={s.dividerText}>ili</Text><View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.outlineBtn} onPress={() => onSwitch("register")} activeOpacity={0.85}>
          <Text style={s.outlineBtnText}>Kreirajte novi nalog</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterScreen({ onSwitch }: { onSwitch: (s: Screen) => void }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [pass, setPass] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleRegister() {
    if (!firstName || !lastName || !email || !pass) {
      setError("Popunite sva obavezna polja."); return
    }
    if (pass.length < 8) { setError("Lozinka mora imati najmanje 8 karaktera."); return }
    setLoading(true); setError("")
    try {
      await register({ email: email.trim(), password: pass, first_name: firstName, last_name: lastName, phone: phone || undefined })
      hapticLight()
      setDone(true)
    } catch (e: any) {
      setError(e.message || "Greška pri registraciji.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <ScrollView contentContainerStyle={s.formScroll}>
        <View style={s.successBox}>
          <Ionicons name="mail-outline" size={48} color={Colors.primary} />
          <Text style={s.successTitle}>Potvrdite email</Text>
          <Text style={s.successSub}>
            Poslali smo vam email sa linkom za aktivaciju naloga. Kliknite na dugme u emailu da završite registraciju.
          </Text>
          <Text style={s.successNote}>Link važi 24 sata · Proverite spam folder</Text>
          <TouchableOpacity style={[s.primaryBtn, { marginTop: 24 }]} onPress={() => onSwitch("login")} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Imam potvrdu — Prijavite se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
        <View style={s.redBar} />
        <Text style={s.formTitle}>Kreirajte nalog</Text>
        <Text style={s.formSub}>Registrujte se i pratite akcije i popuste</Text>

        <Input label="Ime *" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" />
        <Input label="Prezime *" value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" />
        <Input label="Email adresa *" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Input label="Telefon (opciono)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
        <Input label="Lozinka * (min. 8 karaktera)" value={pass} onChangeText={setPass} secureTextEntry autoComplete="new-password" />

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <TouchableOpacity style={s.termsRow} onPress={() => Linking.openURL(`${BASE}/politika-privatnosti`)} activeOpacity={0.7}>
          <Text style={s.termsText}>
            Kreiranjem naloga prihvatate{" "}
            <Text style={s.termsLink}>Politiku privatnosti</Text>
            {" "}i{" "}
            <Text style={s.termsLink}>Uslove korišćenja</Text>.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.primaryBtn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Registrujte se</Text>}
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} /><Text style={s.dividerText}>ili</Text><View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.outlineBtn} onPress={() => onSwitch("login")} activeOpacity={0.85}>
          <Text style={s.outlineBtnText}>Već imate nalog? Prijavite se</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
function ForgotScreen({ onSwitch }: { onSwitch: (s: Screen) => void }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleReset() {
    if (!email) { setError("Unesite email adresu."); return }
    setLoading(true); setError("")
    try {
      await requestPasswordReset(email.trim())
      setDone(true)
    } catch (e: any) {
      setError(e.message || "Greška. Pokušajte ponovo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
      <View style={s.redBar} />
      <Text style={s.formTitle}>Zaboravili ste lozinku?</Text>
      <Text style={s.formSub}>Unesite vašu email adresu i poslaćemo vam link za resetovanje</Text>

      {done ? (
        <View style={s.successBox}>
          <Ionicons name="checkmark-circle-outline" size={48} color={Colors.primary} />
          <Text style={s.successTitle}>Email je poslat!</Text>
          <Text style={s.successSub}>Proverite inbox i kliknite na link za resetovanje lozinke.</Text>
          <TouchableOpacity style={[s.primaryBtn, { marginTop: 24 }]} onPress={() => onSwitch("login")} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Nazad na prijavu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Input label="Email adresa" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
          {!!error && <Text style={s.errorText}>{error}</Text>}
          <TouchableOpacity style={s.primaryBtn} onPress={handleReset} activeOpacity={0.85} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Pošalji link</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSwitch("login")} style={s.linkBtn}>
            <Text style={s.linkText}>← Nazad na prijavu</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardScreen() {
  const { customer, logout } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const completion = (() => {
    if (!customer) return 0
    let c = 0
    if (customer.email) c++
    if (customer.first_name && customer.last_name) c++
    if (customer.phone) c++
    return Math.round((c / 3) * 100)
  })()

  const initials = [customer?.first_name?.[0], customer?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "K"

  async function handleLogout() {
    Alert.alert("Odjava", "Da li ste sigurni da se želite odjaviti?", [
      { text: "Otkaži", style: "cancel" },
      { text: "Odjavi se", style: "destructive", onPress: async () => { hapticLight(); await logout() } },
    ])
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Zdravo header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={[d.header, { paddingTop: insets.top + 16 }]}>
          <View style={d.headerRow}>
            <View style={d.avatar}>
              <Text style={d.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={d.greeting}>Dobrodošli nazad</Text>
              <Text style={d.name}>{customer?.first_name} {customer?.last_name}</Text>
              <Text style={d.email}>{customer?.email}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={d.logoutBtn} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={d.progressWrap}>
            <View style={d.progressRow}>
              <Text style={d.progressLabel}>Popunjenost profila</Text>
              <Text style={d.progressPct}>{completion}%</Text>
            </View>
            <View style={d.progressBg}>
              <View style={[d.progressFill, { width: `${completion}%` as any }]} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Akcije baner */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={d.section}>
        <TouchableOpacity
          style={d.akcijeBaner}
          onPress={() => { hapticSelection(); router.push("/(tabs)/akcije") }}
          activeOpacity={0.85}
        >
          <View style={d.akcijeLeft}>
            <View style={d.akcijeIcon}>
              <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={d.akcijeTitle}>Aktuelne akcije</Text>
              <Text style={d.akcijeSub}>Pogledajte sve trenutne popuste</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.g400} />
        </TouchableOpacity>
      </Animated.View>

      {/* Nalog stavke */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={d.section}>
        <Text style={d.sectionLabel}>MOJ NALOG</Text>
        <View style={d.card}>
          {[
            { icon: "person-outline" as const, label: "Lični podaci", desc: "Ime, prezime, email, telefon", url: `${BASE}/account/profile` },
            { icon: "location-outline" as const, label: "Adrese", desc: "Upravljajte sačuvanim adresama", url: `${BASE}/account/addresses` },
          ].map(({ icon, label, desc, url }, i) => (
            <TouchableOpacity
              key={label}
              style={[d.row, i === 0 && d.rowBorder]}
              onPress={() => { hapticLight(); Linking.openURL(url) }}
              activeOpacity={0.7}
            >
              <View style={d.rowIcon}>
                <Ionicons name={icon} size={17} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={d.rowTitle}>{label}</Text>
                <Text style={d.rowDesc}>{desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.g400} />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Uskoro dostupno */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={d.section}>
        <View style={d.sectionLabelRow}>
          <Text style={d.sectionLabel}>USKORO DOSTUPNO</Text>
          <View style={d.sectionLine} />
        </View>
        <View style={d.card}>
          {COMING_SOON.map(({ icon, label, desc }, i) => (
            <View key={label} style={[d.row, d.rowDisabled, i < COMING_SOON.length - 1 && d.rowBorder]}>
              <View style={d.rowIconGray}>
                <Ionicons name={icon} size={17} color={Colors.g400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={d.rowTitleGray}>{label}</Text>
                <Text style={d.rowDesc}>{desc}</Text>
              </View>
              <View style={d.soonBadge}>
                <Ionicons name="lock-closed-outline" size={9} color={Colors.muted} />
                <Text style={d.soonText}>Uskoro</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

    </ScrollView>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function NalogScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { customer, loading } = useAuth()
  const [screen, setScreen] = useState<Screen>("login")

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  // Ulogovan → dashboard
  if (customer) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <DashboardScreen />
      </View>
    )
  }

  // Nije ulogovan → auth ekrani
  const titles: Record<Screen, string> = {
    login: "Moj nalog",
    register: "Registracija",
    forgot: "Resetuj lozinku",
    dashboard: "Moj nalog",
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={s.header}>
        {screen !== "login" ? (
          <TouchableOpacity onPress={() => setScreen("login")} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
        )}
        <Text style={s.headerTitle}>{titles[screen]}</Text>
        <View style={{ width: 40 }} />
      </View>

      {screen === "login" && <LoginScreen onSwitch={setScreen} onSuccess={() => {}} />}
      {screen === "register" && <RegisterScreen onSwitch={setScreen} />}
      {screen === "forgot" && <ForgotScreen onSwitch={setScreen} />}
    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.foreground },
  formScroll: { padding: 24, paddingTop: 32 },
  redBar: { width: 48, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginBottom: 16 },
  formTitle: { fontSize: 22, fontWeight: "900", color: Colors.foreground, marginBottom: 6 },
  formSub: { fontSize: FontSize.sm, color: Colors.muted, marginBottom: 28, lineHeight: 20 },
  errorText: { fontSize: FontSize.xs, color: "#dc2626", marginBottom: 12, textAlign: "center" },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 15, alignItems: "center", marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnText: { color: "#fff", fontSize: FontSize.base, fontWeight: "700" },
  outlineBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: "center",
  },
  outlineBtnText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: "700" },
  linkBtn: { alignItems: "center", paddingVertical: 14 },
  linkText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.xs, color: Colors.muted },
  termsRow: { marginBottom: 16 },
  termsText: { fontSize: 12, color: Colors.muted, lineHeight: 18, textAlign: "center" },
  termsLink: { color: Colors.primary, fontWeight: "600" },
  successBox: { alignItems: "center", paddingTop: 20 },
  successTitle: { fontSize: 20, fontWeight: "900", color: Colors.foreground, marginTop: 16, marginBottom: 8 },
  successSub: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  successNote: { fontSize: 12, color: Colors.g400, textAlign: "center" },
})

const d = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20, paddingBottom: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  greeting: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
  name: { fontSize: 18, fontWeight: "900", color: "#fff" },
  email: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  logoutBtn: { padding: 6 },
  progressWrap: {},
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: FontSize.xs, color: "rgba(255,255,255,0.7)" },
  progressPct: { fontSize: FontSize.xs, fontWeight: "700", color: "#fff" },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: "#fff" },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: {
    fontSize: 10, fontWeight: "700", letterSpacing: 0.8,
    color: Colors.muted, marginBottom: 8,
  },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowDisabled: { opacity: 0.45 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  rowIconGray: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.g100,
    justifyContent: "center", alignItems: "center",
  },
  rowTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.foreground },
  rowTitleGray: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.g400 },
  rowDesc: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  soonBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: Colors.g100, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  soonText: { fontSize: 10, fontWeight: "600", color: Colors.muted },

  akcijeBaner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  akcijeLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  akcijeIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center", alignItems: "center",
  },
  akcijeTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary },
  akcijeSub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
})
