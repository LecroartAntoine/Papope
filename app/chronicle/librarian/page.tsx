'use client'

import { useI18n } from '@/lib/i18n/context'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import styles from './librarian.module.css'

type Message = {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

const STARTER_PROMPTS = [
  'librarian.starter1',
  'librarian.starter2',
  'librarian.starter3',
  'librarian.starter4',
  'librarian.starter5',
]

export default function LibrarianPage() {
  const { t, language } = useI18n()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const sendMessage = async (text?: string) => {
    const msgText = text || input
    if (!msgText.trim() || isLoading) return

    const userMessage: Message = { role: 'user', parts: [{ text: msgText }] }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setIsLoading(true)

    // Add empty assistant message to stream into
    const assistantMessage: Message = { role: 'model', parts: [{ text: '' }] }
    setMessages([...newMessages, assistantMessage])

    try {
      const res = await fetch('/api/chronicle/librarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, language }),
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'model',
            parts: [{ text: fullText }],
          }
          return updated
        })
      }
    } catch (error) {
      console.error('[librarian]', error)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'model',
          parts: [{ text: t('librarian.errorResponse') }],
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles['librarian-root']}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/chronicle" className={styles['back-link']}>
          {t('librarian.backToChronicle')}
        </Link>
        <h1 className={styles.title}>{t('librarian.title')}</h1>
        <p className={styles.subtitle}>{t('librarian.subtitle')}</p>
        <p className={styles.description}>{t('librarian.description')}</p>
      </header>

      {/* Messages area */}
      <div className={styles['messages-container']}>
        {messages.length === 0 && (
          <div className={styles['empty-state']}>
            <div className={styles['empty-icon']}>📚</div>
            <p className={styles['empty-text']}>{t('librarian.emptyHint')}</p>
            <div className={styles['starter-prompts']}>
              {STARTER_PROMPTS.map((key) => (
                <button
                  key={key}
                  className={styles['starter-chip']}
                  onClick={() => sendMessage(t(key))}
                  disabled={isLoading}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          // Check if this is the currently streaming message
          const isStreaming = isLoading && i === messages.length - 1 && msg.role === 'model'
          // Append the cursor directly to the markdown string so it renders inline
          const textToRender = isStreaming ? msg.parts[0].text + ' ▍' : msg.parts[0].text

          return (
            <div
              key={i}
              className={`${styles.message} ${styles[msg.role === 'user' ? 'user' : 'librarian']}`}
            >
              <div className={styles['message-content']}>
                {msg.role === 'model' ? (
                  <div className={styles.markdown}>
                    <ReactMarkdown>{textToRender}</ReactMarkdown>
                  </div>
                ) : (
                  // Display user message as plain text, preserving newlines
                  <div style={{ whiteSpace: 'pre-wrap' }}>{textToRender}</div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className={styles['input-container']}>
        <div className={styles['input-wrapper']}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder={t('librarian.placeholder')}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={isLoading}
          />
          <button
            className={styles['send-btn']}
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
          >
            {t('librarian.send')}
          </button>
        </div>
      </div>
    </div>
  )
}