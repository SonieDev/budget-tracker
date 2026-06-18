import { useState } from 'react'
import Drawer from './Drawer'
import { useThemeContext } from './ThemeProvider'
import { useNavigate } from 'react-router-dom'

export default function Layout({ children, user, title }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { theme } = useThemeContext()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
      />

      {/* Top navbar */}
      <header className={`
        sticky top-0 z-30 flex items-center justify-between
        px-4 md:px-6 h-16
        ${isDark ? 'bg-slate-950/90 border-b border-slate-800/50' : 'bg-white/90 border-b border-slate-200/50'}
        backdrop-blur-md
      `}>

        {/* Left — hamburger + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            <div className="space-y-1.5">
              <span className="block w-5 h-0.5 bg-current rounded" />
              <span className="block w-5 h-0.5 bg-current rounded" />
              <span className="block w-5 h-0.5 bg-current rounded" />
            </div>
          </button>

          <h1 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h1>
        </div>

        {/* Right — logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs">
            BT
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  )
}