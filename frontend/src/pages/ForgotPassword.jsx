import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendReset() {
    if (!email) { setError('Please enter your email!'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error)
      setError('Error sending reset link. Please try again.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl relative z-10">
        {!sent ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <img
                src="/logo.jpg"
                alt="Budget Tracker Logo"
                className="w-14 h-14 rounded-2xl object-cover border border-violet-500/30 shadow-lg shadow-violet-500/30 mx-auto"
              />
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-slate-400 text-xs md:text-sm">
                Enter your email address to receive a password reset link
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-2xl text-xs font-semibold text-center">
                ❌ {error}
              </div>
            )}

            {/* Email input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReset()}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={sendReset}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Sending...' : '📧 Send Reset Link'}
            </button>

            {/* Back link */}
            <p className="text-center text-xs text-slate-500">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
              >
                Sign In →
              </button>
            </p>
          </div>
        ) : (
          /* Success state */
          <div className="text-center space-y-6">
            <div className="text-5xl">📧</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Check Your Email</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                We sent a password reset link to<br />
                <strong className="text-white">{email}</strong>
              </p>
            </div>
            <p className="text-slate-500 text-xs">
              Didn't receive it? Check your spam folder.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}