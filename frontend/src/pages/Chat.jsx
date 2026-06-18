import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { sendChatMessage } from '../api'
import Layout from '../components/Layout'
import { useThemeContext } from '../components/ThemeProvider'

const SUGGESTIONS = [
  "How can I save more money this month?",
  "Analyze my spending habits",
  "How long to reach my goals?",
  "Where am I spending the most?",
  "Give me a savings plan",
]

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
      setInitializing(false)

      // Messaggio di benvenuto
      setMessages([{
        role: 'assistant',
        content: "Hi! 👋 I'm your AI financial advisor. I have access to your real financial data and I'm here to help you make better money decisions. What would you like to know?"
      }])
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMsg = { role: 'user', content: messageText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.slice(-6)
      const result = await sendChatMessage(messageText, history)
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again! 🔄"
      }])
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
    <Layout user={user} title="AI Advisor">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className={`rounded-3xl border p-6 mb-4 ${card}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25">
              🤖
            </div>
            <div>
              <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                AI Financial Advisor
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-emerald-400 text-xs font-semibold">
                  Online · Powered by Claude AI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={`rounded-3xl border overflow-hidden mb-4 ${card}`}>
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-1">
                    🤖
                  </div>
                )}
                <div className={`
                  max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-sm'
                    : isDark
                      ? 'bg-slate-800 text-slate-200 rounded-bl-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }
                `}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-xs ml-3 flex-shrink-0 mt-1">
                    {user?.user_metadata?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                  🤖
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
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

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className={`px-6 pb-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-4 mb-3">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105
                      ${isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-violet-600 hover:text-white border border-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-600 hover:text-white border border-slate-200'
                      }
                    `}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about your finances..."
                disabled={loading}
                className={`
                  flex-1 px-4 py-3 rounded-xl border outline-none transition-colors text-sm
                  ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'
                  }
                  disabled:opacity-50
                `}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100"
              >
                {loading ? '⏳' : '→'}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-slate-600 text-xs text-center">
          🔒 Your financial data is used only to personalize responses and is never stored by the AI.
        </p>
      </div>
    </Layout>
  )
}