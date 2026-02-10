'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { IoSend } from 'react-icons/io5'
import { FiPlus, FiLoader } from 'react-icons/fi'
import { BsRobot, BsChatDots } from 'react-icons/bs'
import { HiOutlineSparkles } from 'react-icons/hi'
import { FaUser } from 'react-icons/fa'

const AGENT_ID = '698b322e8e1f45e6758ebeec'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  followUp?: string
}

const SUGGESTED_STARTERS = [
  'Tell me an interesting fact',
  'Help me write an email',
  'Explain a concept simply',
]

function generateMessageId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

function renderMarkdown(text: string) {
  if (!text) return null
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-base font-semibold mt-3 mb-1 tracking-[-0.01em] text-emerald-50">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-lg font-semibold mt-3 mb-1 tracking-[-0.01em] text-emerald-50">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-xl font-semibold mt-3 mb-1 tracking-[-0.01em] text-emerald-50">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '')
      elements.push(
        <div key={idx} className="flex gap-2 ml-1 my-0.5 leading-[1.55]">
          <span className="text-emerald-400 font-medium min-w-[1.25rem]">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span>{renderInlineMarkdown(content)}</span>
        </div>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2)
      elements.push(
        <div key={idx} className="flex gap-2 ml-1 my-0.5 leading-[1.55]">
          <span className="text-emerald-400 mt-1.5 min-w-[0.5rem]">
            <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
          <span>{renderInlineMarkdown(content)}</span>
        </div>
      )
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-2" />)
    } else {
      elements.push(
        <p key={idx} className="leading-[1.55] my-0.5">
          {renderInlineMarkdown(trimmed)}
        </p>
      )
    }
  })

  return <div className="space-y-0">{elements}</div>
}

function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return text
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|`(.+?)`|_(.+?)_/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold text-emerald-300">{match[1]}</strong>)
    } else if (match[2]) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[0.875em] font-mono">
          {match[2]}
        </code>
      )
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>)
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function DancingBall() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute w-3 h-3 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #fde68a, #eab308)',
          boxShadow: '0 0 12px 4px rgba(234, 179, 8, 0.3)',
          animation: 'dancingBall 8s ease-in-out infinite',
          left: '20%',
          top: '30%',
        }}
      />
      <style>{`
        @keyframes dancingBall {
          0% { transform: translate(0, 0) scale(1); }
          10% { transform: translate(60px, -40px) scale(1.15); }
          20% { transform: translate(120px, 20px) scale(0.9); }
          30% { transform: translate(80px, 80px) scale(1.1); }
          40% { transform: translate(-20px, 100px) scale(0.85); }
          50% { transform: translate(-60px, 50px) scale(1.2); }
          60% { transform: translate(-40px, -30px) scale(0.95); }
          70% { transform: translate(30px, -70px) scale(1.05); }
          80% { transform: translate(90px, -20px) scale(0.9); }
          90% { transform: translate(40px, 40px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 md:px-8 lg:px-16 py-2">
      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-900/30">
        <BsRobot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/[0.07] backdrop-blur-[16px] border border-white/[0.1] rounded-[0.875rem] rounded-tl-sm px-4 py-3 shadow-md shadow-black/20">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function WelcomeState({ onStarterClick }: { onStarterClick: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
        <HiOutlineSparkles className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-100 mb-2 tracking-[-0.01em]">How can I help you today?</h2>
      <p className="text-gray-400 mb-8 text-center max-w-md leading-[1.55]">
        Ask me anything -- I can help with facts, writing, explanations, brainstorming, and much more.
      </p>
      <div className="flex flex-wrap gap-3 justify-center max-w-lg">
        {SUGGESTED_STARTERS.map((starter) => (
          <button
            key={starter}
            onClick={() => onStarterClick(starter)}
            className="px-4 py-2.5 bg-white/[0.07] backdrop-blur-[16px] border border-white/[0.1] rounded-[0.875rem] text-sm font-medium text-gray-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500/50 transition-all duration-200 shadow-sm shadow-black/10 hover:shadow-emerald-500/10 cursor-pointer"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 px-4 md:px-8 lg:px-16 py-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <FaUser className="w-3.5 h-3.5 text-emerald-300" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-900/30">
          <BsRobot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={
            isUser
              ? 'px-4 py-3 rounded-[0.875rem] rounded-tr-sm bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
              : 'px-4 py-3 rounded-[0.875rem] rounded-tl-sm bg-white/[0.07] backdrop-blur-[16px] border border-white/[0.1] shadow-md shadow-black/20 text-gray-200'
          }
        >
          {isUser ? (
            <p className="text-sm leading-[1.55] whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm">{renderMarkdown(message.content)}</div>
          )}
        </div>
        {message.followUp && !isUser && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/30 max-w-full">
            <p className="text-xs text-emerald-400/80 italic leading-[1.55]">{message.followUp}</p>
          </div>
        )}
        <span className="text-[10px] text-gray-500 mt-1 px-1 opacity-70">{message.timestamp}</span>
      </div>
    </div>
  )
}

function AgentInfoCard({ isActive }: { isActive: boolean }) {
  return (
    <div className="px-4 md:px-8 lg:px-16 pb-3 pt-1">
      <div className="bg-white/[0.05] backdrop-blur-[16px] border border-white/[0.08] rounded-[0.875rem] px-4 py-3 shadow-sm shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs font-medium text-gray-300">Chatbot Agent</span>
          </div>
          <div className="w-px h-4 bg-white/[0.1]" />
          <span className="text-xs text-gray-500">
            {isActive ? 'Processing...' : 'Ready'}
          </span>
          <span className="text-[10px] py-0.5 px-1.5 border border-white/[0.1] rounded text-gray-500 ml-auto">
            {AGENT_ID.slice(0, 8)}...
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const displayMessages = messages

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [displayMessages, isLoading, scrollToBottom])

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 4 * 24
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText ?? input).trim()
    if (!text || isLoading) return

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: text,
      timestamp: userTimestamp,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const result = await callAIAgent(text, AGENT_ID, { session_id: sessionId })

      let botContent = ''
      let followUp = ''

      if (result?.success && result?.response?.status === 'success') {
        const responseData = result?.response?.result

        if (typeof responseData === 'string') {
          botContent = responseData
        } else if (responseData?.data?.response) {
          botContent = responseData.data.response
        } else if (responseData?.response) {
          botContent = responseData.response
        } else if (responseData?.text) {
          botContent = responseData.text
        } else if (responseData?.message) {
          botContent = responseData.message
        } else if (responseData?.summary) {
          botContent = responseData.summary
        } else {
          botContent = typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : String(responseData ?? '')
        }

        if (responseData?.data?.follow_up) {
          followUp = responseData.data.follow_up
        } else if (responseData?.follow_up) {
          followUp = responseData.follow_up
        }

        if (result?.session_id) {
          setSessionId(result.session_id)
        }
      } else {
        botContent = result?.response?.message ?? result?.error ?? 'Sorry, something went wrong. Please try again.'
      }

      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: botContent,
        timestamp: assistantTimestamp,
        followUp: followUp || undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'An unexpected error occurred. Please check your connection and try again.',
        timestamp: errorTimestamp,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, sessionId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setSessionId(undefined)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleStarterClick = (text: string) => {
    sendMessage(text)
  }

  const showWelcome = displayMessages.length === 0

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-[hsl(160,30%,8%)] via-[hsl(170,25%,10%)] to-[hsl(150,20%,7%)]">
      {/* Dancing Ball Background */}
      <DancingBall />

      {/* Header */}
      <header className="flex-shrink-0 bg-white/[0.04] backdrop-blur-[16px] border-b border-white/[0.08] shadow-sm shadow-black/20 z-10">
        <div className="flex items-center justify-between px-4 md:px-8 lg:px-16 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[0.875rem] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shadow-emerald-900/40">
              <BsChatDots className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-100 tracking-[-0.01em] leading-tight">Chat Assistant</h1>
              <p className="text-[11px] text-gray-500">Powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[0.875rem] bg-white/[0.07] backdrop-blur-[16px] border border-white/[0.1] text-gray-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500/50 transition-all duration-200 text-sm font-medium shadow-sm shadow-black/10 cursor-pointer"
              title="New Chat"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        {showWelcome ? (
          <WelcomeState onStarterClick={handleStarterClick} />
        ) : (
          <div className="py-4 space-y-1">
            {displayMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Agent Info */}
      <AgentInfoCard isActive={isLoading} />

      {/* Input Bar */}
      <div className="flex-shrink-0 bg-white/[0.04] backdrop-blur-[16px] border-t border-white/[0.08] px-4 md:px-8 lg:px-16 py-3">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 bg-white/[0.07] backdrop-blur-[16px] border border-white/[0.1] rounded-[0.875rem] px-4 py-2 shadow-sm shadow-black/10 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/30 transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 resize-none outline-none leading-6 max-h-24 tracking-[-0.01em]"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-md shadow-emerald-900/30 transition-all duration-200 flex-shrink-0 cursor-pointer"
            title="Send message"
          >
            {isLoading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <IoSend className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
