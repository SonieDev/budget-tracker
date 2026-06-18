import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState(false)
  const [caricamento, setCaricamento] = useState(false)

  async function registrati() {
    if (!username || !email || !password) {
      setErrore('Compila tutti i campi!')
      return
    }
    if (password.length < 6) {
      setErrore('La password deve avere almeno 6 caratteri!')
      return
    }

    setCaricamento(true)
    setErrore('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (error) {
      setErrore(error.message)
      setCaricamento(false)
      return
    }

    setSuccesso(true)
    setCaricamento(false)
  }

  if (successo) {
    return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Segoe UI', sans-serif"
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            borderRadius: '28px',
            padding: '48px 40px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📧</div>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>
              Controlla la tua email!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
              Abbiamo inviato un link di verifica a <strong style={{ color: 'white' }}>{email}</strong>
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              🔓 Vai al login
            </button>
          </div>
        </div>
      )
    }

    return (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #0f172a 0%, #020617 70%)',
    fontFamily: 'Inter, sans-serif',
    padding: '24px'
  }}>

    {/* CARD */}
    <div style={{
      width: '100%',
      maxWidth: '440px',
      background: 'rgba(15,23,42,0.9)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px',
      padding: '36px',
      boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
      backdropFilter: 'blur(14px)'
    }}>

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '800',
          fontSize: '1.1rem',
          marginBottom: '18px'
        }}>
          BT
        </div>

        <h1 style={{
          color: 'white',
          fontSize: '2rem',
          fontWeight: '800',
          letterSpacing: '-0.5px'
        }}>
          Create your account
        </h1>

        <p style={{
          color: '#94a3b8',
          marginTop: '6px',
          fontSize: '0.95rem'
        }}>
          Start tracking your finances in seconds.
        </p>
      </div>

      {/* ERROR */}
      {errore && (
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5',
          padding: '12px 14px',
          borderRadius: '14px',
          marginBottom: '18px',
          fontSize: '0.9rem'
        }}>
          {errore}
        </div>
      )}

      {/* INPUT USERNAME */}
      <input
        placeholder="Enter your username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{
          width: '100%',
          padding: '15px',
          marginBottom: '12px',
          borderRadius: '14px',
          background: '#0b1220',
          border: '1px solid #1f2937',
          color: 'white',
          outline: 'none',
          fontSize: '0.95rem'
        }}
      />

      {/* INPUT EMAIL */}
      <input
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{
          width: '100%',
          padding: '15px',
          marginBottom: '12px',
          borderRadius: '14px',
          background: '#0b1220',
          border: '1px solid #1f2937',
          color: 'white',
          outline: 'none',
          fontSize: '0.95rem'
        }}
      />

      {/* INPUT PASSWORD */}
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={e => setPassword(e.target.value)}

        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            accedi()
          }
        }}
        
        style={{
          width: '100%',
          padding: '15px',
          marginBottom: '22px',
          borderRadius: '14px',
          background: '#0b1220',
          border: '1px solid #1f2937',
          color: 'white',
          outline: 'none',
          fontSize: '0.95rem'
        }}
      />

      {/* BUTTON */}
      <button
        onClick={registrati}
        disabled={caricamento}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: '14px',
          border: 'none',
          background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
          color: 'white',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(99,102,241,0.35)'
        }}
      >
        {caricamento ? 'Creating account...' : 'Create account'}
      </button>

      {/* FOOTER */}
      <p style={{
        marginTop: '18px',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '0.9rem'
      }}>
        Already have an account?{' '}
        <span
          onClick={() => navigate('/login')}
          style={{
            color: '#818cf8',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Sign in
        </span>
      </p>

    </div>
  </div>
)
}

export default Register