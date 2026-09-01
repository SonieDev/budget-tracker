import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

const SUGGESTIONS = [
  "How much did I spend yesterday?",
  "What did I buy last week?",
  "Where am I spending the most?",
  "How can I save 100€ more this month?",
  "Give me a personalized savings strategy",
]

const STORAGE_KEY = 'nova_chat_history_v1'

export default function Chat() {
  const navigate = useNavigate()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUser(session.user)

      // 1. Try loading chat history from local persistent storage
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
            setInitializing(false)
            return
          }
        }
      } catch (err) {
        console.error('Error reading local chat history:', err)
      }

      // 2. Fallback to backend chat history
      try {
        const historyRes = await getChatHistory()
        if (historyRes?.history && historyRes.history.length > 0) {
          setMessages(historyRes.history)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(historyRes.history))
        } else {
          const defaultMsg = [{
            role: 'assistant',
            content: "Hi! 👋 I'm **Nova AI**, your personal financial assistant. I have live access to your transactions and spending breakdowns. How can I help you today?"
          }]
          setMessages(defaultMsg)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMsg))
        }
      } catch (e) {
        const defaultMsg = [{
          role: 'assistant',
          content: "Hi! 👋 I'm **Nova AI**, your personal financial assistant. Ask me anything about your finances!"
        }]
        setMessages(defaultMsg)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMsg))
      }

      setInitializing(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleClearHistory() {
    try {
      await clearChatHistory()
      localStorage.removeItem(STORAGE_KEY)
      const resetMsg = [{
        role: 'assistant',
        content: "Chat history cleared! 🔄 How can **Nova AI** assist you today?"
      }]
      setMessages(resetMsg)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetMsg))
    } catch (e) {
      console.error(e)
    }
  }

  async function sendMessage(text) {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMsg = { role: 'user', content: messageText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages))
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.slice(-8)
      const result = await sendChatMessage(messageText, history)
      const updated = [...newMessages, { role: 'assistant', content: result.response }]
      setMessages(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      const updated = [...newMessages, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting to Nova AI servers. Please try again! 🔄"
      }]
      setMessages(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
    setLoading(false)
  }

  if (initializing) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'

  return (
    <Layout user={user} title="Nova AI">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className={`rounded-3xl border p-6 mb-4 ${card}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/ai-avatar.jpg"
                alt="Nova AI Avatar"
                className="w-14 h-14 rounded-2xl object-cover border border-violet-500/30 shadow-lg shadow-violet-500/25"
              />
              <div>
                <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Nova AI Financial Assistant
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-400 text-xs font-semibold">
                    Online · Persistent Memory Active
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:text-red-600 hover:bg-slate-200'}`}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className={`rounded-3xl border overflow-hidden mb-4 ${card}`}>
          <div className="h-[420px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <img
                    src="/ai-avatar.jpg"
                    alt="Nova AI"
                    className="w-8 h-8 rounded-xl object-cover border border-violet-500/30 mr-3 flex-shrink-0 mt-1 shadow-md"
                  />
                )}
                <div className={`
                  max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-sm shadow-md shadow-violet-500/20'
                    : isDark
                      ? 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200'
                  }
                `}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-xs ml-3 flex-shrink-0 mt-1 shadow-md">
                    {user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* Loading animation */}
            {loading && (
              <div className="flex justify-start">
                <img
                  src="/ai-avatar.jpg"
                  alt="Nova AI"
                  className="w-8 h-8 rounded-xl object-cover border border-violet-500/30 mr-3 flex-shrink-0 mt-1 shadow-md"
                />
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'}`}>
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className={`
                px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border
                ${isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-violet-500 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-700'
                }
              `}
            >
              💡 {s}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className={`rounded-2xl border p-2 ${card}`}>
          <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Nova AI anything about your expenses..."
              disabled={loading}
              className={`
                flex-1 px-4 py-3 rounded-xl outline-none text-sm font-medium
                ${isDark ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}
              `}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100"
            >
              Send 🚀
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}