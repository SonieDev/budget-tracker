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
      setError('Error sending reset link. Try again.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1e293b 0%, #020617 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15,23,42,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        padding: '42px',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
      }}>
        {!sent ? (
          <>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                width: '56px', height: '56px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '800', fontSize: '1.4rem',
                marginBottom: '22px',
                boxShadow: '0 10px 30px rgba(124,58,237,0.45)'
              }}>🔑</div>
              <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-1px' }}>
                Forgot password?
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
                padding: '14px', borderRadius: '14px',
                marginBottom: '20px', fontSize: '0.9rem'
              }}>❌ {error}</div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                Email address
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReset()}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '15px',
                  borderRadius: '16px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: 'white', outline: 'none',
                  fontSize: '0.95rem', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Button */}
            <button
              onClick={sendReset} disabled={loading}
              style={{
                width: '100%', padding: '15px',
                borderRadius: '16px', border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: 'white', fontWeight: '700',
                fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(124,58,237,0.35)',
                marginBottom: '20px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Sending...' : '📧 Send reset link'}
            </button>

            {/* Back to login */}
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Remember your password?{' '}
              <span
                onClick={() => navigate('/login')}
                style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: '600' }}
              >Sign in →</span>
            </p>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📧</div>
            <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: '800', marginBottom: '12px' }}>
              Check your email!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
              We sent a password reset link to<br />
              <strong style={{ color: 'white' }}>{email}</strong>
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
              Didn't receive it? Check your spam folder.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '15px',
                borderRadius: '16px', border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: 'white', fontWeight: '700',
                fontSize: '1rem', cursor: 'pointer'
              }}
            >← Back to login</button>
          </div>
        )}
      </div>
    </div>
  )
}