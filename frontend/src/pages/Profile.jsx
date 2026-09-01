import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../supabase'
import { getStats, getTransactions, getGoals, exportTransactions, uploadAvatar, deleteAccountApi } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro (EUR €)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD $)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'FCFA', symbol: 'FCFA', label: 'CFA Franc (FCFA)' },
]

const PERSONALITIES = [
  { id: 'warm', icon: '🌟', title: 'Warm & Encouraging', desc: 'Friendly, supportive, empathetic, and cheerful coach (Default).' },
  { id: 'strict', icon: '📊', title: 'Strict Financial Analyst', desc: 'Formal, analytical, data-driven, and focused on strict metrics.' },
  { id: 'gamified', icon: '🎮', title: 'Gamified & Energetic', desc: 'High energy, enthusiastic, playful challenges, and emoji rewards.' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit username
  const [editingName, setEditingName] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Edit avatar
  const [uploading, setUploading] = useState(false)
  const avatarUrl = user?.user_metadata?.avatar_url

  // Currency & Region
  const [currency, setCurrency] = useState('EUR')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [savingCurrency, setSavingCurrency] = useState(false)

  // AI Personality
  const [aiPersonality, setAiPersonality] = useState('warm')
  const [savingPersonality, setSavingPersonality] = useState(false)

  // Password
  const [activeSection, setActiveSection] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' })

  // Reset link
  const [resetSent, setResetSent] = useState(false)

  // Export & Delete
  const [exporting, setExporting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const u = session.user
      setUser(u)
      setCurrency(u?.user_metadata?.currency || 'EUR')
      setDateFormat(u?.user_metadata?.date_format || 'YYYY-MM-DD')
      setAiPersonality(u?.user_metadata?.ai_personality || 'warm')

      const [s, t, g] = await Promise.all([getStats(), getTransactions(), getGoals()])
      setStats(s); setTransactions(t || []); setGoals(g || [])
      setLoading(false)
    }
    load()
  }, [])

  async function updateUsername() {
    if (!newUsername.trim()) return
    setSavingName(true)
    try {
      await supabase.auth.updateUser({ data: { username: newUsername } })
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user)
      toast.success('Username updated!')
      setEditingName(false); setNewUsername('')
    } catch (err) {
      toast.error('Failed to update username')
    } finally {
      setSavingName(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await uploadAvatar(file)
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  async function updateCurrencyPreference(newCurr, newDateFormat) {
    const matched = CURRENCIES.find(c => c.code === newCurr) || CURRENCIES[0]
    setSavingCurrency(true)
    try {
      await supabase.auth.updateUser({
        data: {
          currency: matched.code,
          currency_symbol: matched.symbol,
          date_format: newDateFormat
        }
      })
      setCurrency(matched.code)
      setDateFormat(newDateFormat)
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user)
      toast.success(`Currency set to ${matched.label}!`)
    } catch (err) {
      toast.error('Failed to update currency preference')
    } finally {
      setSavingCurrency(false)
    }
  }

  async function updatePersonality(personaId) {
    setSavingPersonality(true)
    try {
      await supabase.auth.updateUser({
        data: { ai_personality: personaId }
      })
      setAiPersonality(personaId)
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session.user)
      toast.success('AI Advisor personality updated!')
    } catch (err) {
      toast.error('Failed to update AI personality')
    } finally {
      setSavingPersonality(false)
    }
  }

  async function updatePassword() {
    setPasswordMsg({ text: '', type: '' })
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!')
      return setPasswordMsg({ text: 'Password must be at least 6 characters!', type: 'error' })
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match!')
      return setPasswordMsg({ text: 'Passwords do not match!', type: 'error' })
    }

    setSavingPassword(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      toast.error('Current password is incorrect!')
      setPasswordMsg({ text: 'Current password is incorrect!', type: 'error' })
      setSavingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error('Error updating password. Try again.')
      setPasswordMsg({ text: 'Error updating password. Try again.', type: 'error' })
    } else {
      toast.success('Password updated successfully!')
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => { setActiveSection(null); setPasswordMsg({ text: '', type: '' }) }, 2000)
    }
    setSavingPassword(false)
  }

  async function sendResetLink() {
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      toast.success('Reset link sent to your email!')
      setResetSent(true)
      setTimeout(() => setResetSent(false), 5000)
    } catch (err) {
      toast.error('Could not send reset link')
    }
  }

  async function handleExport() {
    setExporting(true)
    await exportTransactions()
    setExporting(false)
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    try {
      await deleteAccountApi()
      toast.success('Account permanently deleted!')
    } catch (err) {
      console.error('Account deletion error:', err)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      await supabase.auth.signOut()
      localStorage.clear()
      navigate('/login')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const memberSince = new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const lastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
  const isEmailVerified = !!user?.email_confirmed_at
  const currentSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '€'

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
  const inputClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'

  return (
    <Layout user={user} title="Settings">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-cyan-600 p-8 shadow-2xl shadow-violet-500/20">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />

          <div className="relative flex items-center gap-6 flex-wrap">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/20 backdrop-blur flex items-center justify-center shadow-xl border border-white/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-white">
                    {username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-slate-950 text-white p-2 rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer shadow-lg transition-transform hover:scale-110">
                ✏️
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-white">{username}</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${isEmailVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {isEmailVerified ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
              <p className="text-violet-200 text-sm mb-3">{email}</p>
              <div className="flex gap-4 text-xs text-violet-200/80 flex-wrap">
                <span>📅 Member since {memberSince}</span>
                <span>🕒 Last login {lastLogin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Username section */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Account Identity
          </h3>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Username</p>
              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{username}</p>
            </div>
            {!editingName ? (
              <button onClick={() => { setEditingName(true); setNewUsername(username) }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >✏️ Change Username</button>
            ) : (
              <div className="flex gap-2 items-center">
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm outline-none ${inputClass}`} placeholder="New username"
                />
                <button onClick={updateUsername} disabled={savingName}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50"
                >{savingName ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setEditingName(false)}
                  className="px-3 py-2 rounded-xl border text-xs font-bold border-slate-700 text-slate-400"
                >Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* 💱 SECTION 1: Currency & Regional Preferences */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-xl">
              💱
            </div>
            <div>
              <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Currency & Regional Preferences
              </h3>
              <p className="text-slate-500 text-xs">Set your preferred display currency and date format</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Primary Currency ({currentSymbol})
              </label>
              <select
                value={currency}
                onChange={e => updateCurrencyPreference(e.target.value, dateFormat)}
                disabled={savingCurrency}
                className={`w-full px-4 py-3 rounded-2xl border outline-none text-sm font-semibold cursor-pointer ${inputClass}`}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Date Format Display
              </label>
              <select
                value={dateFormat}
                onChange={e => updateCurrencyPreference(currency, e.target.value)}
                disabled={savingCurrency}
                className={`w-full px-4 py-3 rounded-2xl border outline-none text-sm font-semibold cursor-pointer ${inputClass}`}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-31)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/08/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (08/31/2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🤖 SECTION 2: AI Advisor Personality Tone */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                AI Advisor Personality Tone
              </h3>
              <p className="text-slate-500 text-xs">Choose how Claude AI interacts with you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {PERSONALITIES.map(p => {
              const active = aiPersonality === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => updatePersonality(p.id)}
                  disabled={savingPersonality}
                  className={`
                    p-4 rounded-2xl border text-left transition-all duration-150 relative
                    ${active
                      ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/15'
                      : isDark
                        ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <p className={`font-bold text-sm mb-1 ${active ? 'text-violet-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                    {p.title}
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {p.desc}
                  </p>
                  {active && (
                    <span className="absolute top-3 right-3 text-xs text-violet-400 font-bold">✓ Active</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Security & Password */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Security & Authentication
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-800/40">
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Change Password</p>
                <p className="text-slate-500 text-xs">Update your password securely</p>
              </div>
              <button
                onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {activeSection === 'password' ? 'Close' : '🔒 Change Password'}
              </button>
            </div>

            {/* Change password form */}
            {activeSection === 'password' && (
              <div className="space-y-3 pt-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${inputClass}`}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min. 6 chars)"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${inputClass}`}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${inputClass}`}
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={updatePassword}
                    disabled={savingPassword}
                    className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg disabled:opacity-50 hover:bg-violet-700 transition-all"
                  >
                    {savingPassword ? 'Updating...' : '🔑 Update Password'}
                  </button>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Send Password Reset Email</p>
                <p className="text-slate-500 text-xs">Receive a password recovery link in your inbox</p>
              </div>
              <button
                onClick={sendResetLink}
                disabled={resetSent}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${resetSent ? 'bg-emerald-500/20 text-emerald-400' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {resetSent ? '✓ Email Sent' : '📧 Send Reset Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Export Data */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Export Data
                </h3>
                <p className="text-slate-500 text-sm">
                  Download {transactions.length} transactions as CSV file
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || transactions.length === 0}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
                ${transactions.length === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 hover:scale-105'
                }
              `}
            >
              {exporting ? '⏳ Exporting...' : '⬇️ transactions.csv'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="font-black text-base text-red-400">Danger Zone</h3>
              <p className="text-slate-500 text-xs">Irreversible actions</p>
            </div>
          </div>

          <p className="text-slate-500 text-sm mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-colors"
            >
              🗑️ Delete my account
            </button>
          ) : (
            <div className={`rounded-2xl border border-red-500/20 p-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <p className="text-red-400 font-bold text-sm mb-1">
                ⚠️ This will permanently delete your account and all data.
              </p>
              <p className="text-slate-500 text-xs mb-4">
                Type <strong className="text-red-400">DELETE</strong> to confirm.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className={`flex-1 px-4 py-2.5 rounded-xl border outline-none text-sm ${inputClass}`}
                />
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== 'DELETE'}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-red-700 transition-colors"
                >
                  Delete forever
                </button>
                <button
                  onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}