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
          if (error) console.error('exchangeCodeForSession error:', error)
          else {
            setHasSession(true)
            setIsVerifying(false)
            return
          }
        }

        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
          if (error) console.error('verifyOtp error:', error)
          else {
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
      setMsg({ text: 'Password must be at least 6 characters!', type: 'error' })
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
        text: 'Session not found or reset link expired. Please request a new link from "Forgot Password".',
        type: 'error'
      })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      console.error('Supabase updateUser exact error:', error)
      const errDetails = [error.message, error.code, error.status].filter(Boolean).join(' | ')
      setMsg({ text: `Error updating password: ${errDetails}`, type: 'error' })
    } else {
      setMsg({ text: 'Password updated successfully! Redirecting to login...', type: 'success' })
      setTimeout(() => navigate('/login'), 2500)
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1e293b 0%, #020617 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'rgba(15,23,42,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px', padding: '42px',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '1.4rem',
            marginBottom: '22px', boxShadow: '0 10px 30px rgba(124,58,237,0.45)'
          }}>🔒</div>
          <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-1px' }}>
            Reset password
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Choose a new secure password for your account.
          </p>
        </div>

        {isVerifying ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
            Verifying reset link...
          </div>
        ) : (
          <>
            {msg.text && (
              <div style={{
                background: msg.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                color: msg.type === 'error' ? '#fca5a5' : '#6ee7b7',
                padding: '14px', borderRadius: '14px',
                marginBottom: '20px', fontSize: '0.9rem'
              }}>
                {msg.type === 'error' ? '❌' : '✅'} {msg.text}
              </div>
            )}

            {!hasSession && !msg.text && (
              <div style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#fcd34d',
                padding: '14px', borderRadius: '14px',
                marginBottom: '20px', fontSize: '0.9rem'
              }}>
                ⚠️ This link may be expired or invalid. Make sure to click the link in the latest email received.
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                New password
              </label>
              <input
                type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                style={{
                  width: '100%', padding: '15px', borderRadius: '16px',
                  background: '#0f172a', border: '1px solid #334155',
                  color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                Confirm new password
              </label>
              <input
                type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && updatePassword()}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '15px', borderRadius: '16px',
                  background: '#0f172a', border: '1px solid #334155',
                  color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={updatePassword} disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: '16px', border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: 'white', fontWeight: '700', fontSize: '1rem',
                cursor: 'pointer', boxShadow: '0 10px 30px rgba(124,58,237,0.35)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Updating...' : '🔒 Update password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}