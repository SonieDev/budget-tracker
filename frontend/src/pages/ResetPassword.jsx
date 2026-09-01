import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [isVerifying, setIsVerifying] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    async function initSession() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const tokenHash = params.get('token_hash')
        const type = params.get('type')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            setHasSession(true)
            setIsVerifying(false)
            return
          }
        }

        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
          if (!error) {
            setHasSession(true)
            setIsVerifying(false)
            return
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasSession(true)
        }
      } catch (err) {
        console.error('Error verifying session:', err)
      } finally {
        setIsVerifying(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        setHasSession(true)
        setIsVerifying(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  async function updatePassword() {
    setMsg({ text: '', type: '' })

    if (newPassword.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters long!', type: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'Passwords do not match!', type: 'error' })
      return
    }

    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMsg({
        text: 'Error updating password. Link may be expired.',
        type: 'error'
      })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      console.error('Supabase updateUser error:', error)
      setMsg({ text: 'Error updating password. Please try again.', type: 'error' })
    } else {
      setMsg({ text: 'Password updated successfully! Redirecting to sign in...', type: 'success' })
      setTimeout(() => navigate('/login'), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo.jpg"
            alt="Budget Tracker Logo"
            className="w-14 h-14 rounded-2xl object-cover border border-violet-500/30 shadow-lg shadow-violet-500/30 mx-auto"
          />
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            Choose a new secure password for your account
          </p>
        </div>

        {isVerifying ? (
          <div className="py-8 text-center text-slate-400 text-sm font-semibold animate-pulse">
            Verifying reset token...
          </div>
        ) : (
          <div className="space-y-4">
            {msg.text && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold text-center border ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                {msg.type === 'error' ? '❌' : '✅'} {msg.text}
              </div>
            )}

            {!hasSession && !msg.text && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3.5 rounded-2xl text-xs font-semibold text-center">
                ⚠️ Link may be expired or invalid. Please request a new link from the Sign In page.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && updatePassword()}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-violet-500 transition-colors text-sm placeholder-slate-600"
              />
            </div>

            <button
              onClick={updatePassword}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Updating...' : '🔒 Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}