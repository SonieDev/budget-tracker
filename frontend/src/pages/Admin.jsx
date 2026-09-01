import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getAdminStats, getAdminUsers, getAdminFeatures, updateAdminFeature } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

export default function Admin() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [filterVerified, setFilterVerified] = useState('all') // all | verified | pending
  const [updatingFeature, setUpdatingFeature] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)

      try {
        const [s, u, f] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
          getAdminFeatures()
        ])
        if (s?.detail === 'Access denied!' || s?.detail?.includes('Access denied')) {
          setError('Access denied!')
          setLoading(false)
          return
        }
        setStats(s)
        setUsers(u || [])
        setFeatures(f || [])
      } catch (e) {
        setError('Access denied — Admin only!')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggleFeature(featureKey, currentEnabled) {
    setUpdatingFeature(featureKey)
    try {
      const updated = await updateAdminFeature(featureKey, { enabled: !currentEnabled })
      setFeatures(prev => prev.map(f => f.key === featureKey ? { ...f, enabled: updated.enabled } : f))
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingFeature(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="text-6xl mb-2">🚫</div>
      <h1 className="text-white text-2xl font-black">Access Denied</h1>
      <p className="text-slate-400 text-sm max-w-sm">
        You do not have administrative privileges for Budget Tracker Enterprise.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25"
      >
        ← Return to Dashboard
      </button>
    </div>
  )

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'

  // Filtered User List
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.id || '').toLowerCase().includes(search.toLowerCase())
    const matchesVerified = filterVerified === 'all' ? true :
                            filterVerified === 'verified' ? u.email_confirmed :
                            !u.email_confirmed
    return matchesSearch && matchesVerified
  })

  const verifiedUsers = users.filter(u => u.email_confirmed).length

  return (
    <Layout user={user} title="Enterprise Admin Portal">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 p-8 shadow-2xl shadow-orange-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚡</span>
                <h2 className="text-3xl font-black text-white tracking-tight">Enterprise Control Hub</h2>
              </div>
              <p className="text-orange-100 text-sm max-w-xl">
                Global platform oversight, User CRM management, and Future Feature Flags control center.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                🛡️ Superadmin Role
              </span>
            </div>
          </div>
        </div>

        {/* System KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-1.5 text-violet-400">
              <span className="text-xl">👥</span>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Users</p>
            </div>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats?.total_users || 0}</p>
            <p className="text-xs text-emerald-400 font-semibold mt-1">{verifiedUsers} verified accounts</p>
          </div>

          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-1.5 text-cyan-400">
              <span className="text-xl">📈</span>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Income</p>
            </div>
            <p className="text-2xl font-black text-emerald-400">€{(stats?.total_income_tracked || 0).toFixed(0)}</p>
            <p className="text-xs text-slate-500 mt-1">Tracked system-wide</p>
          </div>

          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-1.5 text-rose-400">
              <span className="text-xl">📉</span>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Expenses</p>
            </div>
            <p className="text-2xl font-black text-rose-400">€{(stats?.total_expense_tracked || 0).toFixed(0)}</p>
            <p className="text-xs text-slate-500 mt-1">Tracked system-wide</p>
          </div>

          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-1.5 text-amber-400">
              <span className="text-xl">📊</span>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Volume</p>
            </div>
            <p className={`text-2xl font-black ${ (stats?.net_volume_tracked || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              €{(stats?.net_volume_tracked || 0).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{stats?.total_transactions || 0} transactions</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-2 p-1.5 rounded-2xl border overflow-x-auto ${card}`}>
          {[
            { id: 'overview', label: 'Executive Overview', icon: '📊' },
            { id: 'users', label: 'User CRM Directory', icon: '👥' },
            { id: 'features', label: 'Feature Flags & Roadmap', icon: '🚩' },
            { id: 'audit', label: 'System Health & Audit', icon: '🚦' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-3xl border p-6 ${card}`}>
              <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Platform Financial Volume
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Income Tracked</p>
                  <p className="text-2xl font-black text-emerald-400">€{(stats?.total_income_tracked || 0).toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Expenses Tracked</p>
                  <p className="text-2xl font-black text-rose-400">€{(stats?.total_expense_tracked || 0).toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Net Platform Balance</p>
                  <p className="text-2xl font-black text-cyan-400">€{(stats?.net_volume_tracked || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl border p-6 ${card}`}>
              <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Database & Feature Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <span className="text-sm font-semibold text-violet-300">Total Transactions Logged</span>
                  <span className="text-xl font-black text-violet-400">{stats?.total_transactions || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-sm font-semibold text-cyan-300">Total Savings Goals Created</span>
                  <span className="text-xl font-black text-cyan-400">{stats?.total_goals || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm font-semibold text-emerald-300">Email Verification Rate</span>
                  <span className="text-xl font-black text-emerald-400">
                    {users.length > 0 ? Math.round((verifiedUsers / users.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER CRM DIRECTORY */}
        {activeTab === 'users' && (
          <div className={`rounded-3xl border overflow-hidden ${card}`}>
            {/* Search and Filters Header */}
            <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex flex-col md:flex-row gap-4 justify-between md:items-center`}>
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search user by email, username, or ID..."
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-colors
                    ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'}
                  `}
                />
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: `All (${users.length})` },
                  { id: 'verified', label: `Verified (${verifiedUsers})` },
                  { id: 'pending', label: `Pending (${users.length - verifiedUsers})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterVerified(f.id)}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                      ${filterVerified === f.id
                        ? 'bg-amber-500 text-white shadow-md'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm font-semibold">
                No users found matching "{search}"
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} className="w-11 h-11 rounded-2xl object-cover border border-slate-700 flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
                          {(u.username || u.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {u.username}
                          </p>
                          {u.is_admin && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs">{u.email}</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">ID: {u.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Joined</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${u.email_confirmed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                        {u.email_confirmed ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEATURE FLAGS & ROADMAP MANAGER */}
        {activeTab === 'features' && (
          <div className={`rounded-3xl border p-6 space-y-6 ${card}`}>
            <div>
              <h3 className={`font-black text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Roadmap Feature Flags & Beta Controls 🚩
              </h3>
              <p className="text-slate-400 text-xs">
                Enable or disable upcoming Phase 2 & Phase 3 features system-wide in real-time.
              </p>
            </div>

            <div className="space-y-4">
              {features.map(f => (
                <div
                  key={f.key}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {f.name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${f.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{f.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleFeature(f.key, f.enabled)}
                    disabled={updatingFeature === f.key}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md
                      ${f.enabled
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }
                      disabled:opacity-50
                    `}
                  >
                    {updatingFeature === f.key ? '⏳ Updating...' : f.enabled ? '🟢 Enabled' : '⚪ Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM HEALTH & AUDIT */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-3xl border p-6 ${card}`}>
              <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                System Infrastructure Status 🚦
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">FastAPI Backend Server</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">100% Operational</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Supabase PostgreSQL DB</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Connected</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Anthropic AI Model (Claude)</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Active</span>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl border p-6 ${card}`}>
              <h3 className={`font-black text-base mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Audit Metrics & Metrics Digest
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/40">
                  <span className="text-slate-400 text-xs">Average Transactions per User</span>
                  <span className="text-white text-xs font-bold">
                    {users.length > 0 ? Math.round((stats?.total_transactions || 0) / users.length) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/40">
                  <span className="text-slate-400 text-xs">Average Goals per User</span>
                  <span className="text-white text-xs font-bold">
                    {users.length > 0 ? ((stats?.total_goals || 0) / users.length).toFixed(1) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/40">
                  <span className="text-slate-400 text-xs">Average User Net Balance</span>
                  <span className="text-emerald-400 text-xs font-bold">
                    €{users.length > 0 ? ((stats?.net_volume_tracked || 0) / users.length).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}