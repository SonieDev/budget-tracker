import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useThemeContext } from './ThemeProvider'
import { checkAdmin } from '../api'


export default function Drawer({ open, onClose, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useThemeContext()
  const [isAdmin, setIsAdmin] = useState(false)

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''

  const isDark = theme === 'dark'

  useEffect(() => {
    checkAdmin().then(res => setIsAdmin(res?.is_admin || false))
  }, [])


const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard', path: '/' },
  { icon: '↕', label: 'Transactions', path: '/transactions' },
  { icon: '◎', label: 'Goals', path: '/goals' },
  { icon: '▦', label: 'Reports', path: '/reports' },
  { icon: '🤖', label: 'AI Advisor', path: '/chat' },
  { icon: '👤', label: 'Profile', path: '/profile' },
  ...(isAdmin ? [{ icon: '⚡', label: 'Admin', path: '/admin' }] : [])
]



  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function goTo(path) {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-72
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        ${isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-200'}
      `}>

        {/* Header drawer */}
        <div className={`
          flex items-center justify-between p-6
          border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}
        `}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm">
              BT
            </div>
            <span className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Budget Tracker
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  font-semibold text-sm transition-all duration-150
                  ${active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Settings section */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>

          {/* User info */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {username}
              </p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-xl
              font-semibold text-sm transition-all
              ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
            `}
          >
            <span className="flex items-center gap-3">
              <span>{isDark ? '🌙' : '☀️'}</span>
              {isDark ? 'Dark mode' : 'Light mode'}
            </span>
            <div className={`w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-violet-600' : 'bg-slate-200'} relative`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </>
  )
}