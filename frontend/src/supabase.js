import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000 // 5 ore in millisecondi (18.000.000 ms)

/**
 * Controlla se la sessione ha superato la durata massima di 5 ore.
 * Se sono passate 5 ore, effettua il logout automatico.
 */
export async function checkSessionExpiry5Hours() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return false

  const now = Date.now()
  const sessionStart = localStorage.getItem('bt_session_start_time')

  if (!sessionStart) {
    // Se è la prima volta che entriamo, salviamo il timestamp attuale
    localStorage.setItem('bt_session_start_time', now.toString())
    return true
  }

  const elapsed = now - parseInt(sessionStart, 10)

  if (elapsed >= FIVE_HOURS_MS) {
    // Sessione scaduta (superate le 5 ore)
    console.warn('Session expired after 5 hours. Signing out...')
    localStorage.removeItem('bt_session_start_time')
    await supabase.auth.signOut()
    window.location.href = '/login'
    return false
  }

  return true
}

// Ascolta i cambiamenti di autenticazione per gestire il timer delle 5 ore
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    localStorage.setItem('bt_session_start_time', Date.now().toString())
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem('bt_session_start_time')
  }
})