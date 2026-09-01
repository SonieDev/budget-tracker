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

  const isDark = theme === 'dark'

  useEffect(() => {
    checkAdmin().then(res => setIsAdmin(res?.is_admin || false))
  }, [])

  const NAV_ITEMS = [
    { icon: '⊞', label: 'Dashboard', path: '/' },
    { icon: '↕', label: 'Transactions', path: '/transactions' },
    { icon: '◎', label: 'Goals', path: '/goals' },
    { icon: '▦', label: 'Reports', path: '/reports' },
    { isImage: true, icon: '/ai-avatar.jpg', label: 'Nova AI', path: '/chat' },
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

  const isSettingsActive = location.pathname === '/profile'

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
        flex flex-col justify-between p-5 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        ${isDark ? 'bg-slate-900 border-r border-slate-800 text-white' : 'bg-white border-r border-slate-200 text-slate-900'}
      `}>
        <div className="space-y-6">
          {/* Header drawer */}
          <div className={`
            flex items-center justify-between pb-4
            border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}
          `}>
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Budget Tracker Logo"
                className="w-9 h-9 rounded-xl object-cover border border-violet-500/30 shadow-md"
              />
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
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                    font-semibold text-sm transition-all duration-150 text-left
                    ${active
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 font-bold'
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  {item.isImage ? (
                    <img src={item.icon} alt={item.label} className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <span className="text-lg">{item.icon}</span>
                  )}
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings, Dark Mode, Logout */}
        <div className={`pt-4 mt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-1`}>
          {/* Settings button */}
          <button
            onClick={() => goTo('/profile')}
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
              font-semibold text-sm transition-all text-left
              ${isSettingsActive
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 font-bold'
                : isDark
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }
            `}
          >
            <span className="text-lg">⚙️</span>
            <span>Settings</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl
              font-semibold text-sm transition-all
              ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
            `}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
              <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
            </span>
            <div className={`w-8 h-4.5 rounded-full transition-colors ${isDark ? 'bg-violet-600' : 'bg-slate-300'} relative`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-red-400 hover:bg-red-500/10 transition-all text-left"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}