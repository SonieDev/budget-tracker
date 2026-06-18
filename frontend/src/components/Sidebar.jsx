import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

function Sidebar({ user }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '💸', label: 'Transazioni', path: '/transactions' },
    { icon: '🎯', label: 'Obiettivi', path: '/goals' },
    { icon: '📊', label: 'Report', path: '/reports' },
  ]

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const username = user?.user_metadata?.username || user?.email

  return (
    <div style={{
      width: '240px',
      minHeight: '100vh',
      background: '#0f172a',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'fixed',
      top: 0,
      left: 0,
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          fontWeight: '800',
          color: 'white',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
        }}>BT</div>
        <span style={{
          fontWeight: '800',
          fontSize: '1rem',
          color: 'white'
        }}>Budget Tracker</span>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map(item => {
          const attivo = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: attivo ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: attivo ? '#818cf8' : '#64748b',
                cursor: 'pointer',
                fontWeight: attivo ? '700' : '500',
                fontSize: '0.9rem',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s',
                borderLeft: attivo ? '3px solid #6366f1' : '3px solid transparent'
              }}
              onMouseEnter={e => {
                if (!attivo) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
              onMouseLeave={e => {
                if (!attivo) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Utente e logout */}
      <div style={{
        borderTop: '1px solid #1e293b',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Info utente */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: '800',
            color: 'white',
            flexShrink: 0
          }}>
            {username ? username[0].toUpperCase() : '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{username}</p>
            <p style={{
              color: '#475569',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>Free plan</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.9rem',
            textAlign: 'left',
            width: '100%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar