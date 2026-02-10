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
        <h3 key={idx} className="text-base font-semibold mt-3 mb-1 tracking-[-0.01em]">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-lg font-semibold mt-3 mb-1 tracking-[-0.01em]">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-xl font-semibold mt-3 mb-1 tracking-[-0.01em]">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '')
      elements.push(
        <div key={idx} className="flex gap-2 ml-1 my-0.5 leading-[1.55]">
          <span className="text-[hsl(160,25%,40%)] font-medium min-w-[1.25rem]">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span>{renderInlineMarkdown(content)}</span>
        </div>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2)
      elements.push(
        <div key={idx} className="flex gap-2 ml-1 my-0.5 leading-[1.55]">
          <span className="text-[hsl(160,85%,35%)] mt-1.5 min-w-[0.5rem]">
            <span className="block w-1.5 h-1.5 rounded-full bg-[hsl(160,85%,35%)]" />
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
      parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>)
    } else if (match[2]) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-[hsl(160,25%,90%)] text-[hsl(160,35%,25%)] text-[0.875em] font-mono">
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

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 md:px-8 lg:px-16 py-2">
      <div className="w-8 h-8 rounded-full bg-[hsl(160,85%,35%)] flex items-center justify-center flex-shrink-0 shadow-sm">
        <BsRobot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-[0.875rem] rounded-tl-sm px-4 py-3 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[hsl(160,85%,35%)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[hsl(160,85%,35%)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[hsl(160,85%,35%)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function WelcomeState({ onStarterClick }: { onStarterClick: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(160,85%,35%)] to-[hsl(160,85%,28%)] flex items-center justify-center mb-6 shadow-lg shadow-[hsl(160,85%,35%)]/20">
        <HiOutlineSparkles className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-[hsl(160,35%,8%)] mb-2 tracking-[-0.01em]">How can I help you today?</h2>
      <p className="text-[hsl(160,25%,40%)] mb-8 text-center max-w-md leading-[1.55]">
        Ask me anything -- I can help with facts, writing, explanations, brainstorming, and much more.
      </p>
      <div className="flex flex-wrap gap-3 justify-center max-w-lg">
        {SUGGESTED_STARTERS.map((starter) => (
          <button
            key={starter}
            onClick={() => onStarterClick(starter)}
            className="px-4 py-2.5 bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-[0.875rem] text-sm font-medium text-[hsl(160,35%,8%)] hover:bg-[hsl(160,85%,35%)] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
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
        <div className="w-8 h-8 rounded-full bg-[hsl(160,30%,93%)] flex items-center justify-center flex-shrink-0 shadow-sm">
          <FaUser className="w-3.5 h-3.5 text-[hsl(160,35%,8%)]" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-[hsl(160,85%,35%)] flex items-center justify-center flex-shrink-0 shadow-sm">
          <BsRobot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={
            isUser
              ? 'px-4 py-3 rounded-[0.875rem] rounded-tr-sm bg-[hsl(160,85%,35%)] text-white shadow-md shadow-[hsl(160,85%,35%)]/10'
              : 'px-4 py-3 rounded-[0.875rem] rounded-tl-sm bg-white/75 backdrop-blur-[16px] border border-white/[0.18] shadow-md text-[hsl(160,35%,8%)]'
          }
        >
          {isUser ? (
            <p className="text-sm leading-[1.55] whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm">{renderMarkdown(message.content)}</div>
          )}
        </div>
        {message.followUp && !isUser && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-[hsl(160,30%,93%)] border border-[hsl(160,28%,88%)] max-w-full">
            <p className="text-xs text-[hsl(160,25%,40%)] italic leading-[1.55]">{message.followUp}</p>
          </div>
        )}
        <span className="text-[10px] text-[hsl(160,25%,40%)] mt-1 px-1 opacity-60">{message.timestamp}</span>
      </div>
    </div>
  )
}

function AgentInfoCard({ isActive }: { isActive: boolean }) {
  return (
    <div className="px-4 md:px-8 lg:px-16 pb-3 pt-1">
      <div className="bg-white/50 backdrop-blur-[16px] border border-white/[0.18] rounded-[0.875rem] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-[hsl(160,85%,35%)]'}`} />
            <span className="text-xs font-medium text-[hsl(160,35%,8%)]">Chatbot Agent</span>
          </div>
          <div className="w-px h-4 bg-[hsl(160,28%,88%)]" />
          <span className="text-xs text-[hsl(160,25%,40%)]">
            {isActive ? 'Processing...' : 'Ready'}
          </span>
          <span className="text-[10px] py-0.5 px-1.5 border border-[hsl(160,28%,88%)] rounded text-[hsl(160,25%,40%)] ml-auto">
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
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-[hsl(160,40%,94%)] via-[hsl(180,35%,93%)] to-[hsl(140,40%,94%)]">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/60 backdrop-blur-[16px] border-b border-white/[0.18] shadow-sm z-10">
        <div className="flex items-center justify-between px-4 md:px-8 lg:px-16 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[0.875rem] bg-gradient-to-br from-[hsl(160,85%,35%)] to-[hsl(160,85%,28%)] flex items-center justify-center shadow-sm">
              <BsChatDots className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[hsl(160,35%,8%)] tracking-[-0.01em] leading-tight">Chat Assistant</h1>
              <p className="text-[11px] text-[hsl(160,25%,40%)]">Powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[0.875rem] bg-white/75 backdrop-blur-[16px] border border-white/[0.18] text-[hsl(160,35%,8%)] hover:bg-[hsl(160,85%,35%)] hover:text-white transition-all duration-200 text-sm font-medium shadow-sm cursor-pointer"
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
      <div className="flex-shrink-0 bg-white/60 backdrop-blur-[16px] border-t border-white/[0.18] px-4 md:px-8 lg:px-16 py-3">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 bg-white/75 backdrop-blur-[16px] border border-[hsl(160,25%,85%)] rounded-[0.875rem] px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[hsl(160,85%,35%)] focus-within:border-transparent transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full bg-transparent text-sm text-[hsl(160,35%,8%)] placeholder:text-[hsl(160,25%,65%)] resize-none outline-none leading-6 max-h-24 tracking-[-0.01em]"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-[hsl(160,85%,35%)] hover:bg-[hsl(160,85%,30%)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-md shadow-[hsl(160,85%,35%)]/20 transition-all duration-200 flex-shrink-0 cursor-pointer"
            title="Send message"
          >
            {isLoading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <IoSend className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-[hsl(160,25%,65%)] mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
