import { supabase } from './supabase'

const BASE_URL = 'https://budget-tracker-3w2d.onrender.com'

// Funzione base — aggiunge il token automaticamente
async function chiamaAPI(endpoint, opzioni = {}) {
  // Prende il token dalla sessione Supabase
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    window.location.href = '/login'
    return
  }

  const risposta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opzioni,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...opzioni.headers
    }
  })

  if (risposta.status === 401) {
    window.location.href = '/login'
    return
  }

  return risposta.json()
}

// -------------------------
// TRANSAZIONI
// -------------------------
export const getTransactions = () => chiamaAPI('/transactions')

export const createTransaction = (dati) => chiamaAPI('/transactions', {
  method: 'POST',
  body: JSON.stringify(dati)
})

export const deleteTransaction = (id) => chiamaAPI(`/transactions/${id}`, {
  method: 'DELETE'
})



// -------------------------
// OBIETTIVI
// -------------------------
export const getGoals = () => chiamaAPI('/goals')

export const createGoal = (dati) => chiamaAPI('/goals', {
  method: 'POST',
  body: JSON.stringify(dati)
})

export const updateGoal = (id, data) => chiamaAPI(`/goals/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(data)
})

export const editGoal = (id, data) => chiamaAPI(`/goals/${id}/edit`, {
  method: 'PATCH',
  body: JSON.stringify(data)
})

export const deleteGoal = (id) => chiamaAPI(`/goals/${id}`, {
  method: 'DELETE'
})

export const getGoalSuggestion = (id) => chiamaAPI(`/goals/${id}/suggestion`)

export const generateAiReport = () => chiamaAPI('/ai/report', {
  method: 'POST'
})

export const exportTransactions = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch('https://budget-tracker-3w2d.onrender.com/export/transactions', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}



// -------------------------
// STATISTICHE
// -------------------------
export const getStats = () => chiamaAPI('/stats')

// -------------------------
// ADMIN
// -------------------------
export const checkAdmin = () => chiamaAPI('/admin/check')
export const getAdminStats = () => chiamaAPI('/admin/stats')
export const getAdminUsers = () => chiamaAPI('/admin/users')

// -------------------------
// AI
// -------------------------
export const sendChatMessage = (message, history) => chiamaAPI('/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message, history })
})


// -------------------------
// AVATAR
// -------------------------
export const uploadAvatar = async (file) => {
  const { data: { session } } = await supabase.auth.getSession()
  const fileExt = file.name.split('.').pop()
  const filePath = `${session.user.id}/avatar.${fileExt}`
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })
  
  if (error) throw error
  
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)
  
  // Salva URL nel profilo utente
  await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl }
  })
  
  return data.publicUrl
}