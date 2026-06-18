import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase gestisce il token dall'URL automaticamente
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
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
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMsg({ text: 'Error updating password. Try again.', type: 'error' })
    } else {
      setMsg({ text: 'Password updated! Redirecting...', type: 'success' })
      setTimeout(() => navigate('/login'), 2000)
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
      </div>
    </div>
  )
}