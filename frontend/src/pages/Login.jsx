import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter your email and password!')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError('Invalid email or password!')
      setLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Glow ambient background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <form
        onSubmit={e => { e.preventDefault(); handleLogin() }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl relative z-10 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.jpg"
            alt="Budget Tracker Logo"
            className="w-14 h-14 rounded-2xl object-cover border border-violet-500/30 shadow-lg shadow-violet-500/30 mx-auto"
          />
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            Sign in to manage your smart financial budget
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-2xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-base"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Extra links */}
        <div className="space-y-3 text-center text-xs">
          <p>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Forgot your password?
            </button>
          </p>
          <p className="text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}