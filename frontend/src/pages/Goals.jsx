import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../supabase'
import { getGoals, createGoal, updateGoal, deleteGoal, editGoal, getGoalSuggestion } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '👗', '🎓', '💍', '🏖️', '💪', '🎸', '🎮', '🐕', '🍕', '📷']

export default function Goals() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // User currency symbol preference
  const currencySymbol = user?.user_metadata?.currency_symbol || '€'

  // New goal form
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [emoji, setEmoji] = useState('🎯')

  // Add savings
  const [addingTo, setAddingTo] = useState(null)
  const [addAmount, setAddAmount] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit goal
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // AI suggestions
  const [suggestions, setSuggestions] = useState({})
  const [loadingSuggestion, setLoadingSuggestion] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      const g = await getGoals()
      setGoals(g || [])
      setLoading(false)
    }
    load()
  }, [])

  async function addGoal() {
    if (!name || !targetAmount) {
      toast.error('Please enter a goal name and target amount!')
      return
    }
    setSaving(true)
    try {
      await createGoal({
        name: `${emoji} ${name}`,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || null
      })
      toast.success('🎯 Savings goal created!')
      const g = await getGoals()
      setGoals(g || [])
      setName(''); setTargetAmount(''); setCurrentAmount('')
      setDeadline(''); setEmoji('🎯')
      setShowForm(false)
    } catch (err) {
      toast.error('Failed to create goal')
    } finally {
      setSaving(false)
    }
  }

  async function addSavings(goalId) {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error('Please enter a valid savings amount')
      return
    }
    setAdding(true)
    try {
      await updateGoal(goalId, { amount_to_add: parseFloat(addAmount) })
      toast.success('💰 Savings added to goal!')
      const g = await getGoals()
      setGoals(g || [])
      setAddAmount(''); setAddingTo(null)
    } catch (err) {
      toast.error('Failed to update savings')
    } finally {
      setAdding(false)
    }
  }

  async function removeGoal(goalId) {
    if (!confirm('Delete this goal?')) return

    try {
      await deleteGoal(goalId)
      setGoals(goals.filter(g => g.id !== goalId))
      toast.success('Goal deleted')
    } catch (err) {
      toast.error('Failed to delete goal')
    }
  }

  async function saveEdit(goalId) {
    setEditSaving(true)
    try {
      await editGoal(goalId, {
        name: editName || undefined,
        target_amount: editTarget ? parseFloat(editTarget) : undefined,
        deadline: editDeadline || undefined
      })
      toast.success('Goal updated!')
      const g = await getGoals()
      setGoals(g || [])
      setEditingId(null)
    } catch (err) {
      toast.error('Failed to edit goal')
    } finally {
      setEditSaving(false)
    }
  }

  async function fetchSuggestion(goalId) {
    setLoadingSuggestion(goalId)
    try {
      const result = await getGoalSuggestion(goalId)
      setSuggestions(prev => ({ ...prev, [goalId]: result }))
      toast.success('💡 AI Tip generated!')
    } catch (err) {
      toast.error('Could not generate AI tip')
    } finally {
      setLoadingSuggestion(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
  const input = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'

  const totalSaved = goals.reduce((a, g) => a + g.current_amount, 0)
  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0)

  // Split active goals vs 100% completed goals (completed ones go down to the bottom section)
  const activeGoals = goals.filter(g => g.current_amount < g.target_amount)
  const completedGoals = goals.filter(g => g.current_amount >= g.target_amount)

  const renderGoalCard = (goal, isCompleted = false) => {
    const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    const remaining = goal.target_amount - goal.current_amount
    const done = pct >= 100
    const suggestion = suggestions[goal.id]

    let daysLeft = null
    if (goal.deadline) {
      const diff = new Date(goal.deadline) - new Date()
      daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return (
      <div
        key={goal.id}
        className={`rounded-3xl border p-6 transition-all ${
          done
            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
            : card
        }`}
      >
        {/* Edit mode */}
        {editingId === goal.id ? (
          <div>
            <h4 className={`font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit Goal</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${input}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target ({currencySymbol})</label>
                <input
                  type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${input}`}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deadline</label>
                <input
                  type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${input}`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveEdit(goal.id)} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : '✓ Save changes'}
              </button>
              <button
                onClick={() => setEditingId(null)}
                className={`px-5 py-2.5 rounded-xl border font-bold text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Goal header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {goal.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {goal.deadline && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        daysLeft !== null && daysLeft < 30 && !done
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      📅 Due: {new Date(goal.deadline).toLocaleDateString('en-GB')}
                      {!done && (daysLeft > 0 ? ` • ${daysLeft} days left` : ' • Overdue!')}
                    </span>
                  )}
                  {done && (
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🏆 100% Completed!
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingId(goal.id); setEditName(goal.name); setEditTarget(goal.target_amount.toString()); setEditDeadline(goal.deadline || '') }}
                  className={`p-2 rounded-xl text-sm transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >✏️</button>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-2 rounded-xl text-sm hover:bg-red-500/10 text-red-400 transition-all"
                >🗑️</button>
              </div>
            </div>

            {/* Big percentage & progress */}
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className={`text-5xl font-black ${done ? 'text-emerald-400' : 'text-violet-400'}`}>
                  {Math.round(pct)}%
                </p>
                <p className="text-slate-500 text-xs font-semibold mt-1">
                  {done ? 'Achieved 🏆' : 'in progress'}
                </p>
              </div>
              <div className="flex-1 pb-2">
                <div className="flex justify-between text-sm mb-2 font-bold">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {currencySymbol}{goal.current_amount.toFixed(2)}
                  </span>
                  <span className="text-slate-500">{currencySymbol}{goal.target_amount.toFixed(2)}</span>
                </div>
                <div className={`h-3 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${done ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-gradient-to-r from-violet-600 to-cyan-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!done && (
                  <p className="text-slate-500 text-xs mt-1.5 font-medium">
                    {currencySymbol}{remaining.toFixed(2)} remaining to reach goal
                  </p>
                )}
              </div>
            </div>

            {/* AI Suggestion */}
            {suggestion ? (
              <div className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <p className="text-violet-400 text-xs font-bold mb-1">🤖 AI Insight</p>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {suggestion.suggestion}
                </p>
                {suggestion.monthly_needed && !done && (
                  <p className="text-violet-400 text-xs font-bold mt-2">
                    💡 Save {currencySymbol}{suggestion.monthly_needed.toFixed(2)}/month to reach your goal
                  </p>
                )}
              </div>
            ) : !done && (
              <button
                onClick={() => fetchSuggestion(goal.id)}
                disabled={loadingSuggestion === goal.id}
                className={`w-full py-2.5 rounded-xl border text-sm font-semibold mb-4 transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-400' : 'border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600'}`}
              >
                {loadingSuggestion === goal.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    Getting AI insight...
                  </span>
                ) : '🤖 Get AI insight'}
              </button>
            )}

            {/* Add savings action (only if not 100% completed) */}
            {!done && (
              addingTo === goal.id ? (
                <div className="flex gap-2">
                  <input
                    type="number" placeholder={`Amount (${currencySymbol})`}
                    value={addAmount} onChange={e => setAddAmount(e.target.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none ${input}`}
                  />
                  <button
                    onClick={() => addSavings(goal.id)} disabled={adding}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50"
                  >
                    {adding ? '...' : '+ Add'}
                  </button>
                  <button
                    onClick={() => { setAddingTo(null); setAddAmount('') }}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTo(goal.id)}
                  className={`w-full py-2.5 rounded-xl border text-sm font-bold transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-400' : 'border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600'}`}
                >
                  + Add savings
                </button>
              )
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <Layout user={user} title="Goals">

      {/* Stats KPI Header */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`rounded-2xl border p-5 ${card}`}>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active</p>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeGoals.length}</p>
        </div>
        <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-5">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">Total saved</p>
          <p className="text-violet-400 text-2xl font-black">{currencySymbol}{totalSaved.toFixed(2)}</p>
          <p className="text-slate-500 text-xs mt-1">of {currencySymbol}{totalTarget.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
          <p className="text-emerald-400 text-2xl font-black">{completedGoals.length} 🏆</p>
        </div>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-black text-lg md:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Active Savings Goals ({activeGoals.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
        >
          + New goal
        </button>
      </div>

      {/* New goal form modal/card */}
      {showForm && (
        <div className={`rounded-3xl border p-6 mb-6 ${card}`}>
          <h3 className={`font-black text-base mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>New Goal</h3>

          {/* Emoji picker */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map(e => (
                <button
                  key={e} onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${emoji === e ? 'bg-violet-600 scale-110 shadow-lg' : isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                >{e}</button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Goal name</label>
            <input
              type="text" placeholder="e.g. New Laptop or Trip to Paris" value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target ({currencySymbol})</label>
              <input
                type="number" placeholder="2000" value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial ({currencySymbol})</label>
              <input
                type="number" placeholder="0" value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Date</label>
              <input
                type="date" value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${input}`}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addGoal} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold shadow-lg shadow-violet-500/25 hover:scale-105 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Save goal'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={`px-6 py-3 rounded-xl border font-bold transition-all ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE GOALS SECTION */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className={`rounded-3xl border p-16 text-center ${card}`}>
          <p className="text-5xl mb-4">🎯</p>
          <p className={`font-black text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No active goals</p>
          <p className="text-slate-500 text-sm">Set your first savings goal to get started!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-10">
          {activeGoals.length > 0 ? (
            activeGoals.map(goal => renderGoalCard(goal, false))
          ) : (
            <div className={`rounded-2xl border p-8 text-center ${card}`}>
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-slate-400 text-sm">All set! You have completed all active goals below.</p>
            </div>
          )}
        </div>
      )}

      {/* COMPLETED GOALS SECTION (MOVED TO THE BOTTOM) */}
      {completedGoals.length > 0 && (
        <div className="pt-6 border-t border-slate-800/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
              🏆
            </div>
            <div>
              <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Completed Vault Goals ({completedGoals.length})
              </h3>
              <p className="text-slate-500 text-xs font-semibold">
                Goals that reached 100% target savings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {completedGoals.map(goal => renderGoalCard(goal, true))}
          </div>
        </div>
      )}
    </Layout>
  )
}