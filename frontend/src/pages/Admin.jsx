import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getAdminStats, getAdminUsers } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

export default function Admin() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)

      try {
        const [s, u] = await Promise.all([getAdminStats(), getAdminUsers()])
        if (s?.detail === 'Access denied!') {
          setError('Access denied!')
          setLoading(false)
          return
        }
        setStats(s)
        setUsers(u || [])
      } catch (e) {
        setError('Access denied — Admin only!')
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">🚫</div>
      <h1 className="text-white text-2xl font-black">Access Denied</h1>
      <p className="text-slate-500">You don't have admin privileges.</p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors"
      >← Back to Dashboard</button>
    </div>
  )

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
  const verifiedUsers = users.filter(u => u.email_confirmed).length

  return (
    <Layout user={user} title="Admin">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-8 mb-6 shadow-2xl shadow-orange-500/20">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚡</span>
            <h2 className="text-3xl font-black text-white">Admin Dashboard</h2>
          </div>
          <p className="text-orange-200 text-sm">
            Full control over Budget Tracker — handle with care!
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Transactions', value: stats?.total_transactions || 0, icon: '↕', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Income Tracked', value: `€${(stats?.total_income_tracked || 0).toFixed(0)}`, icon: '📈', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Expense Tracked', value: `€${(stats?.total_expense_tracked || 0).toFixed(0)}`, icon: '📉', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.icon}</span>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`rounded-2xl border p-5 ${card}`}>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Goals Created</p>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats?.total_goals || 0}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${card}`}>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Verified Users</p>
          <p className="text-2xl font-black text-emerald-400">{verifiedUsers}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${card}`}>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Unverified</p>
          <p className="text-2xl font-black text-amber-400">{users.length - verifiedUsers}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {['users', 'activity'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all
              ${activeTab === tab
                ? 'bg-violet-600 text-white shadow-lg'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }
            `}
          >{tab}</button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className={`rounded-3xl border overflow-hidden ${card}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between`}>
            <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              All Users ({users.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-800/50">
            {users.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center justify-between px-6 py-4 transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {(u.username || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {u.username || 'No username'}
                    </p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-lg font-bold ${u.email_confirmed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {u.email_confirmed ? '✅ Verified' : '⏳ Pending'}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className={`font-black text-base mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Platform Activity
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Total money tracked', value: `€${((stats?.total_income_tracked || 0) + (stats?.total_expense_tracked || 0)).toFixed(2)}`, icon: '💰', color: 'text-violet-400' },
              { label: 'Avg transactions per user', value: users.length > 0 ? Math.round((stats?.total_transactions || 0) / users.length) : 0, icon: '↕', color: 'text-cyan-400' },
              { label: 'Avg goals per user', value: users.length > 0 ? ((stats?.total_goals || 0) / users.length).toFixed(1) : 0, icon: '🎯', color: 'text-amber-400' },
              { label: 'Email verification rate', value: `${users.length > 0 ? Math.round((verifiedUsers / users.length) * 100) : 0}%`, icon: '✅', color: 'text-emerald-400' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-slate-500 text-sm">{item.label}</span>
                </div>
                <span className={`font-black text-base ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}