import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTransactions, createTransaction, deleteTransaction } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

const EXPENSE_CATEGORIES = [
  { icon: '🍕', name: 'Food & Dining' },
  { icon: '🏠', name: 'Housing' },
  { icon: '🚗', name: 'Transport' },
  { icon: '🛍️', name: 'Shopping' },
  { icon: '💊', name: 'Health' },
  { icon: '🎮', name: 'Entertainment' },
  { icon: '📚', name: 'Education' },
  { icon: '✈️', name: 'Travel' },
]

const INCOME_CATEGORIES = [
  { icon: '💼', name: 'Salary' },
  { icon: '💰', name: 'Freelance' },
  { icon: '📈', name: 'Investments' },
  { icon: '🎁', name: 'Gifts' },
]

export default function Transactions() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      const t = await getTransactions()
      setTransactions(t || [])
      setLoading(false)
    }
    load()
  }, [])

  async function addTransaction() {
  if (!amount || parseFloat(amount) <= 0) return
  setSaving(true)
  const selectedCat = (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)
    .find(c => c.name === categoryId)

  console.log('Category selected:', categoryId)
  console.log('Selected cat:', selectedCat)
  console.log('Sending:', {
    type,
    amount: parseFloat(amount),
    description,
    category_name: selectedCat?.name || null,
    category_icon: selectedCat?.icon || null,
    date
  })

  await createTransaction({
    type,
    amount: parseFloat(amount),
    description,
    category_name: selectedCat?.name || null,
    category_icon: selectedCat?.icon || null,
    date
  })

  const t = await getTransactions()
  setTransactions(t || [])
  setAmount(''); setDescription(''); setCategoryId('')
  setShowForm(false); setSaving(false)
}
  async function remove(id) {
    await deleteTransaction(id)
    setTransactions(transactions.filter(t => t.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const filtered = filter === 'all' ? transactions
    : transactions.filter(t => t.type === filter)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
  const input = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'

  return (
    <Layout user={user} title="Transactions">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Income</p>
          <p className="text-emerald-400 text-2xl font-black">+€{totalIncome.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5">
          <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-red-400 text-2xl font-black">-€{totalExpense.toFixed(2)}</p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Filters */}
        <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {['all', 'income', 'expense'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all
                ${filter === f
                  ? 'bg-violet-600 text-white shadow-lg'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >{f}</button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105"
        >
          + New transaction
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`rounded-3xl border p-6 mb-6 ${card}`}>
          <h3 className={`font-black text-base mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            New Transaction
          </h3>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { value: 'expense', label: '↓ Expense', active: 'bg-red-500/15 border-red-500 text-red-400' },
              { value: 'income', label: '↑ Income', active: 'bg-emerald-500/15 border-emerald-500 text-emerald-400' },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`
                  py-3 rounded-xl border font-bold text-sm transition-all
                  ${type === t.value ? t.active : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-200 text-slate-500'}
                `}
              >{t.label}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount (€)</label>
              <input
                type="number" placeholder="0.00" value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
              <input
                type="date" value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Description <span className="normal-case font-normal">(optional note)</span>
            </label>
            <input
              placeholder={type === 'expense' ? 'e.g. Grocery at schooping' : 'e.g. Monthly salary'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategoryId(cat.name)}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left
                    ${categoryId === cat.name
                      ? type === 'expense'
                        ? 'bg-red-500/15 border-red-500 text-red-400'
                        : 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : isDark
                        ? 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                    }
                  `}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addTransaction} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold shadow-lg shadow-violet-500/25 hover:scale-105 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Save transaction'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={`px-6 py-3 rounded-xl border font-bold transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-200 text-slate-500'}`}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Transactions list */}
      <div className={`rounded-3xl border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <p className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
            <span className="text-5xl">💸</span>
            <p className="font-semibold">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filtered.map(t => (
              <div
                key={t.id}
                className={`group flex items-center justify-between px-6 py-4 transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                    {t.category_icon || (t.type === 'income' ? '↑' : '↓')}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t.description || 'No description'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {t.category_name || 'Uncategorized'} · {t.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => remove(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}