import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getStats, getTransactions } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

export default function Home() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      const [s, t] = await Promise.all([getStats(), getTransactions()])
      setStats(s)
      setTransactions(t || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading your finances...</p>
      </div>
    </div>
  )

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const balance = stats?.saldo || 0
  const income = stats?.totale_entrate || 0
  const expense = stats?.totale_uscite || 0
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  return (
    <Layout user={user} title="Dashboard">

      {/* Welcome */}
      <div className="mb-8">
        <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Good day, {username} 👋
        </h2>
        <p className="text-slate-500 text-sm">Here's your financial overview</p>
      </div>

      {/* Balance card — hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-cyan-600 p-8 mb-6 shadow-2xl shadow-violet-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative">
          <p className="text-violet-200 text-sm font-semibold mb-2 uppercase tracking-wider">
            Total Balance
          </p>
          <h2 className="text-5xl font-black text-white mb-6">
            €{balance.toFixed(2)}
          </h2>
          <div className="flex gap-6">
            <div>
              <p className="text-violet-300 text-xs font-semibold mb-1">↑ Income</p>
              <p className="text-white font-bold text-lg">€{income.toFixed(2)}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-violet-300 text-xs font-semibold mb-1">↓ Expenses</p>
              <p className="text-white font-bold text-lg">€{expense.toFixed(2)}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-violet-300 text-xs font-semibold mb-1">📊 Savings rate</p>
              <p className="text-white font-bold text-lg">{savingsRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Add expense', icon: '↓', color: 'from-red-500 to-rose-600', path: '/transactions' },
          { label: 'Add income', icon: '↑', color: 'from-emerald-500 to-teal-600', path: '/transactions' },
          { label: 'New goal', icon: '◎', color: 'from-blue-500 to-cyan-600', path: '/goals' },
          { label: 'View reports', icon: '▦', color: 'from-amber-500 to-orange-600', path: '/reports' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-2xl
              bg-gradient-to-br ${action.color}
              text-white font-bold text-sm
              shadow-lg hover:scale-105 transition-transform duration-150
            `}
          >
            <span className="text-2xl font-black">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Recent transactions */}
      <div className={`rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Recent Transactions
          </h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-colors"
          >
            View all →
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
            <span className="text-5xl">💸</span>
            <p className="font-semibold">No transactions yet</p>
            <button
              onClick={() => navigate('/transactions')}
              className="text-violet-400 text-sm font-semibold hover:text-violet-300"
            >
              Add your first transaction →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {transactions.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center text-lg
                    ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}
                  `}>
                    {t.categories?.icon || (t.type === 'income' ? '↑' : '↓')}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t.description || 'No description'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {t.categories?.name || 'Uncategorized'} · {t.date}
                    </p>
                  </div>
                </div>
                <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}