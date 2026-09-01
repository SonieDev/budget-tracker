import { useState } from 'react'
import Drawer from './Drawer'
import Sidebar from './Sidebar'
import { useThemeContext } from './ThemeProvider'
import { useNavigate } from 'react-router-dom'

export default function Layout({ children, user, title }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { theme } = useThemeContext()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-sans`}>

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>

      {/* Mobile Drawer (visible on mobile tap) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
      />

      {/* Main Container Wrapper */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className={`
          sticky top-0 z-20 flex items-center justify-between
          px-4 md:px-8 h-16
          ${isDark ? 'bg-slate-950/80 border-b border-slate-800/60' : 'bg-white/80 border-b border-slate-200/60'}
          backdrop-blur-xl transition-colors
        `}>

          {/* Left — Hamburger (mobile) + Page Title */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Menu"
              className={`md:hidden p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
            >
              <div className="space-y-1.5">
                <span className="block w-5 h-0.5 bg-current rounded" />
                <span className="block w-5 h-0.5 bg-current rounded" />
                <span className="block w-5 h-0.5 bg-current rounded" />
              </div>
            </button>

            <h1 className={`font-black text-lg md:text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h1>
          </div>

          {/* Right — Brand Logo & Quick Action */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-8 h-8 rounded-xl object-cover border border-violet-500/30 shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="hidden sm:inline font-bold text-xs text-slate-400 group-hover:text-white transition-colors">
              Budget Tracker
            </span>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}