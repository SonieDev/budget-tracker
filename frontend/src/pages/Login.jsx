import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusPassword, setFocusPassword] = useState(false)

  async function accedi() {
    if (!email || !password) {
      setErrore('Inserisci email e password!')
      return
    }
    setCaricamento(true)
    setErrore('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setErrore('Email o password errati!')
      setCaricamento(false)
      return
    }
    navigate('/')
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
      
      <form
        onSubmit={e => { e.preventDefault(); accedi() }}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(15,23,42,0.82)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          padding: '42px',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
        }}
      >

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '1.2rem',
            marginBottom: '22px',
            boxShadow: '0 10px 30px rgba(124,58,237,0.45)'
          }}>
            BT
          </div>

          <h1 
          className="text-red-500"
          style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '8px',
            letterSpacing: '-1px'
            
          }}>
            Welcome back
          </h1>

          <p style={{
            color: '#94a3b8',
            fontSize: '0.95rem'
          }}>
            Sign in to manage your finances securely.
          </p>
        </div>

        {/* Error */}
        {errore && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            padding: '14px',
            borderRadius: '14px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {errore}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{
            display: 'block',
            color: '#cbd5e1',
            marginBottom: '8px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '16px',
              background: '#0f172a',
              border: '1px solid #334155',
              color: 'white',
              outline: 'none',
              fontSize: '0.95rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '26px' }}>
          <label style={{
            display: 'block',
            color: '#cbd5e1',
            marginBottom: '8px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            Password
          </label>

          <div style={{
            position: 'relative',
            width: '100%'
          }}>

            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}

              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  accedi()
                }
              }}
              
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '15px 55px 15px 15px',
                borderRadius: '16px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: 'white',
                outline: 'none',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>

          </div>
        </div>

        {/* Button */}
        <button
          onClick="submit"
          disabled={caricamento}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            color: 'white',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(124,58,237,0.35)'
          }}
        >
          {caricamento ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Forgot Password */}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <span
            onClick={() => navigate('/forgot-password')}
            style={{
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Forgot your password?
          </span>
        </p>

        {/* Footer */}
        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.9rem'
        }}>
          Don’t have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{
              color: '#a78bfa',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Create one
          </span>
        </p>

      </form>
    </div>
  )
}

export default Login