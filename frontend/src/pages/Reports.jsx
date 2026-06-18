import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTransactions, getStats, generateAiReport } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

export default function Reports() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiReport, setAiReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      const [t, s] = await Promise.all([getTransactions(), getStats()])
      setTransactions(t || [])
      setStats(s)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const income = stats?.totale_entrate || 0
  const expense = stats?.totale_uscite || 0
  const balance = stats?.saldo || 0
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  // Data per Pie chart — spese per categoria
  const byCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const key = t.category_name || 'Other'
      const icon = t.category_icon || '💸'
      if (!acc[key]) acc[key] = { amount: 0, icon }
      acc[key].amount += t.amount
      return acc
    }, {})

  const pieData = Object.entries(byCategory)
    .map(([name, data]) => ({ name, value: data.amount, icon: data.icon }))
    .sort((a, b) => b.value - a.value)

  // Data per Bar chart — entrate vs uscite per mese
  const byMonth = transactions.reduce((acc, t) => {
    const month = t.date?.slice(0, 7) || 'Unknown'
    if (!acc[month]) acc[month] = { month: month.slice(5), income: 0, expense: 0 }
    if (t.type === 'income') acc[month].income += t.amount
    else acc[month].expense += t.amount
    return acc
  }, {})

  const barData = Object.values(byMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)

  // Data per Line chart — saldo cumulativo nel tempo
  let cumulative = 0
  const lineData = [...transactions]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => {
      cumulative += t.type === 'income' ? t.amount : -t.amount
      return { date: t.date?.slice(5), balance: parseFloat(cumulative.toFixed(2)) }
    })

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#84cc16']

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'

  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#fff',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#fff' : '#0f172a',
    fontSize: '12px'
  }

  async function generateAiReportHandler() {
    setGenerating(true)
    try {
      const result = await generateAiReport()
      setAiReport(result.report)
    } catch (e) {
      setAiReport('Error generating report. Please try again.')
    }
    setGenerating(false)
  }

  return (
    <Layout user={user} title="Reports">

      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Net Balance', value: `€${balance.toFixed(2)}`, gradient: true },
          { label: 'Total Income', value: `+€${income.toFixed(2)}`, color: 'text-emerald-400', sub: `${transactions.filter(t => t.type === 'income').length} transactions` },
          { label: 'Total Expenses', value: `-€${expense.toFixed(2)}`, color: 'text-red-400', sub: `${transactions.filter(t => t.type === 'expense').length} transactions` },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 20 ? 'text-emerald-400' : 'text-red-400', sub: savingsRate >= 20 ? '🎯 On track' : '📈 Improve this' },
        ].map((s, i) => (
          <div key={i} className={`
            rounded-2xl p-5 border
            ${s.gradient ? 'bg-gradient-to-br from-violet-600 to-cyan-600 border-transparent shadow-xl' : card}
          `}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${s.gradient ? 'text-white/70' : 'text-slate-500'}`}>
              {s.label}
            </p>
            <p className={`text-2xl font-black ${s.gradient ? 'text-white' : s.color}`}>
              {s.value}
            </p>
            {s.sub && <p className="text-slate-500 text-xs mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {['overview', 'categories', 'trends', 'ai insights'].map(tab => (
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

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bar chart */}
          <div className={`rounded-3xl border p-6 ${card}`}>
            <h3 className={`font-black text-base mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Income vs Expenses
            </h3>
            {barData.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                <span className="text-4xl">📊</span>
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`€${v.toFixed(2)}`]} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Line chart */}
          <div className={`rounded-3xl border p-6 ${card}`}>
            <h3 className={`font-black text-base mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Balance Over Time
            </h3>
            {lineData.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                <span className="text-4xl">📈</span>
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [`€${v.toFixed(2)}`, 'Balance']} />
                  <Line
                    type="monotone" dataKey="balance" stroke="#8b5cf6"
                    strokeWidth={2.5} dot={false}
                    activeDot={{ r: 5, fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Activity */}
          <div className={`rounded-3xl border p-6 mt-6 ${card}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Activity
              </h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-colors"
              >
                View all →
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                <span className="text-4xl">💸</span>
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 8).map(t => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0
                        ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}
                      `}>
                        {t.category_icon || (t.type === 'income' ? '↑' : '↓')}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {t.description || t.category_name || 'Transaction'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {t.category_name || 'Uncategorized'} · {t.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`
                        font-black text-sm
                        ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}
                      `}>
                        {t.type === 'income' ? '+' : '-'}€{t.amount.toFixed(2)}
                      </span>
                      <span className={`
                        px-2 py-1 rounded-lg text-xs font-bold
                        ${t.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                        }
                      `}>
                        {t.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>  
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Pie chart */}
          <div className={`rounded-3xl border p-6 ${card}`}>
            <h3 className={`font-black text-base mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Spending Distribution
            </h3>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                <span className="text-4xl">🥧</span>
                <p className="text-sm">No expense data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name) => [`€${v.toFixed(2)}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category list */}
          <div className={`rounded-3xl border p-6 ${card}`}>
            <h3 className={`font-black text-base mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              By Category
            </h3>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                <span className="text-4xl">📊</span>
                <p className="text-sm">No expense data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pieData.map((cat, i) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cat.icon} {cat.name}
                        </span>
                      </div>
                      <span className="font-black text-sm" style={{ color: COLORS[i % COLORS.length] }}>
                        €{cat.value.toFixed(2)}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{
                          width: `${(cat.value / pieData[0].value) * 100}%`,
                          background: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h3 className={`font-black text-base mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Monthly Trends
          </h3>
          {barData.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
              <span className="text-5xl">📈</span>
              <p className="font-semibold">No trend data yet</p>
              <p className="text-sm">Add transactions across multiple months</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`€${v.toFixed(2)}`]} />
                <Legend
                  wrapperStyle={{ fontSize: '13px', paddingTop: '16px' }}
                  formatter={value => <span style={{ color: '#94a3b8' }}>{value}</span>}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* AI INSIGHTS TAB */}
      {activeTab === 'ai insights' && (
        <div className={`rounded-3xl border p-6 ${card}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className={`font-black text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                🤖 AI Financial Insights
              </h3>
              <p className="text-slate-500 text-sm">Powered by Claude AI</p>
            </div>
            <button
              onClick={generateAiReportHandler}
              disabled={generating || transactions.length === 0}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                ${transactions.length === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/25 hover:scale-105'
                }
              `}
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : '✨ Generate insights'}
            </button>
          </div>

          {!aiReport && !generating && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center text-3xl">
                🤖
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {transactions.length === 0 ? 'Add transactions first' : 'Ready to analyze'}
              </p>
              <p className="text-slate-500 text-sm text-center max-w-sm">
                {transactions.length === 0
                  ? 'Add some transactions to get AI-powered insights.'
                  : 'Click "Generate insights" to get a detailed analysis of your finances.'
                }
              </p>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Claude is analyzing your finances...
              </p>
            </div>
          )}

          {aiReport && (
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {aiReport}
              </p>
              <button
                onClick={() => setAiReport(null)}
                className="mt-4 text-slate-500 text-xs hover:text-slate-400 transition-colors"
              >
                Clear report
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}