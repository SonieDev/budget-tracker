import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!username || !email || !password) {
      setError('Please fill in all fields!')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long!')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-5xl mb-2">📧</div>
          <h1 className="text-2xl font-black text-white">Check Your Email</h1>
          <p className="text-slate-400 text-sm">
            We sent a verification link to <strong className="text-white">{email}</strong>. Please confirm your email to activate your account!
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            🔓 Proceed to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.jpg"
            alt="Budget Tracker Logo"
            className="w-14 h-14 rounded-2xl object-cover border border-violet-500/30 shadow-lg shadow-violet-500/30 mx-auto"
          />
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Create Account
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            Start tracking your smart budget in seconds
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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
            />
          </div>

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              placeholder="At least 6 characters"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}