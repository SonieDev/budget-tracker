import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getStats, getTransactions, getGoals, exportTransactions, uploadAvatar} from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'


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

  //edit avatar
const [uploading, setUploading] = useState(false)
const avatarUrl = user?.user_metadata?.avatar_url

  // Password
  const [activeSection, setActiveSection] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' })

  // Reset link
  const [resetSent, setResetSent] = useState(false)

  // Export
  const [exporting, setExporting] = useState(false)

  // Delete
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      const [s, t, g] = await Promise.all([getStats(), getTransactions(), getGoals()])
      setStats(s); setTransactions(t || []); setGoals(g || [])
      setLoading(false)
    }
    load()
  }, [])

  async function updateUsername() {
    if (!newUsername.trim()) return
    setSavingName(true)
    await supabase.auth.updateUser({ data: { username: newUsername } })
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session.user)
    setEditingName(false); setSavingName(false); setNewUsername('')
  }

  async function updatePassword() {
    setPasswordMsg({ text: '', type: '' })
    if (newPassword.length < 6) return setPasswordMsg({ text: 'Password must be at least 6 characters!', type: 'error' })
    if (newPassword !== confirmPassword) return setPasswordMsg({ text: 'Passwords do not match!', type: 'error' })

    setSavingPassword(true)

    // Verifica password attuale
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      setPasswordMsg({ text: 'Current password is incorrect!', type: 'error' })
      setSavingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ text: 'Error updating password. Try again.', type: 'error' })
    } else {
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => { setActiveSection(null); setPasswordMsg({ text: '', type: '' }) }, 2000)
    }
    setSavingPassword(false)
  }

  async function sendResetLink() {
    await supabase.auth.resetPasswordForEmail(user.email)
    setResetSent(true)
    setTimeout(() => setResetSent(false), 5000)
  }

  async function handleExport() {
    setExporting(true)
    await exportTransactions()
    setExporting(false)
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    await supabase.auth.signOut()
    navigate('/login')
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

  const income = stats?.totale_entrate || 0
  const expense = stats?.totale_uscite || 0
  const balance = stats?.saldo || 0
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
  const completedGoals = goals.filter(g => g.current_amount >= g.target_amount).length

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
  const inputClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'

  return (
    <Layout user={user} title="Profile">

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-cyan-600 p-8 mb-6 shadow-2xl shadow-violet-500/20">
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
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white text-violet-700 flex items-center justify-center text-sm font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer">
              {uploading ? '⏳' : '📷'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    await uploadAvatar(file)
                    const { data: { session } } = await supabase.auth.getSession()
                    setUser(session.user)
                  } catch (err) {
                    console.error(err)
                  }
                  setUploading(false)
                }}
              />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-white truncate">{username}</h2>
              <button
                onClick={() => { setEditingName(true); setNewUsername(username) }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm flex-shrink-0"
              >✏️</button>
            </div>
            <p className="text-violet-200 text-sm mb-2">{email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${isEmailVerified ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30' : 'bg-red-500/25 text-red-200 border border-red-400/30'}`}>
                {isEmailVerified ? '✅ Email verified' : '❌ Email not verified'}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-violet-200 border border-white/10 font-semibold">
                📅 Since {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* Edit username */}
        {editingName && (
          <div className="relative mt-5 flex gap-2">
            <input
              type="text" value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="New display name"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none text-sm backdrop-blur"
            />
            <button onClick={updateUsername} disabled={savingName}
              className="px-5 py-3 rounded-xl bg-white text-violet-700 font-bold text-sm hover:bg-violet-50 transition-colors disabled:opacity-50"
            >{savingName ? '...' : '✓ Save'}</button>
            <button onClick={() => setEditingName(false)}
              className="px-4 py-3 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
            >✕</button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Net Balance', value: `€${balance.toFixed(2)}`, color: balance >= 0 ? 'text-emerald-400' : 'text-red-400', bg: balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20' },
          { label: 'Total Income', value: `€${income.toFixed(2)}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Total Expenses', value: `€${expense.toFixed(2)}`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 20 ? 'text-violet-400' : 'text-amber-400', bg: 'bg-violet-500/10 border-violet-500/20' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${s.bg}`}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Account info */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className={`font-black text-base mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Account Information
          </h3>
          <div className="space-y-2">
            {[
              { icon: '📧', label: 'Email', value: email },
              { icon: '✅', label: 'Email verified', value: isEmailVerified ? 'Yes' : 'No' },
              { icon: '🗓️', label: 'Member since', value: memberSince },
              { icon: '↕', label: 'Transactions', value: `${transactions.length} total` },
              { icon: '🏆', label: 'Goals completed', value: `${completedGoals} / ${goals.length}` },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-slate-500 text-sm">{item.label}</span>
                </div>
                <span className={`font-semibold text-sm truncate max-w-32 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className={`font-black text-base mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            🔒 Password & Security
          </h3>

          {/* Change password button */}
          {activeSection !== 'password' && (
            <div className="space-y-3">
              <button
                onClick={() => setActiveSection('password')}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-2xl border
                  font-semibold text-sm transition-all hover:border-violet-500 group
                  ${isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-900 hover:bg-slate-50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    🔑
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Change password</p>
                    <p className="text-slate-500 text-xs font-normal">Update your current password</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-violet-400 transition-colors">→</span>
              </button>


              <button
                onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-2xl border
                  font-semibold text-sm transition-all hover:border-red-500 group
                  ${isDark ? 'border-slate-700 text-white hover:bg-red-500/5' : 'border-slate-200 text-slate-900 hover:bg-red-50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                    🚪
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-400">Sign out</p>
                    <p className="text-slate-500 text-xs font-normal">Sign out from all devices</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-red-400 transition-colors">→</span>
              </button>
            </div>
          )}

          {/* Change password form */}
          {activeSection === 'password' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Current password
                </label>
                <input
                  type="password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  New password
                </label>
                <input
                  type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Confirm new password
                </label>
                <input
                  type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${inputClass}`}
                />
              </div>

              {passwordMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${passwordMsg.type === 'error' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
                  {passwordMsg.type === 'error' ? '❌' : '✅'} {passwordMsg.text}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={updatePassword} disabled={savingPassword}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm shadow-lg disabled:opacity-50 hover:scale-105 transition-all"
                >{savingPassword ? 'Updating...' : '🔑 Update password'}</button>
                <button
                  onClick={() => { setActiveSection(null); setPasswordMsg({ text: '', type: '' }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}
                  className={`px-5 py-3 rounded-xl border font-bold text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className={`rounded-3xl border p-6 mb-6 ${card}`}>
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

        <p className="text-slate-500 text-sm mb-4 ml-13">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-colors"
          >🗑️ Delete my account</button>
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
                type="text" value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                className={`flex-1 px-4 py-2.5 rounded-xl border outline-none text-sm ${inputClass}`}
              />
              <button onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE'}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-red-700 transition-colors"
              >Delete forever</button>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                className={`px-4 py-2.5 rounded-xl border text-sm font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
              >Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}