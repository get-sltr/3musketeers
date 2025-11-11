'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Modal from '@/app/components/ui/Modal'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

export default function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const t = useTranslations('welcome')
  const tCommon = useTranslations('common')
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setSending(true)
    try {
      await fetch('/api/feedback/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, email: email || undefined })
      })
      setSubmitted(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {!submitted && (
          <>
            <div className="space-y-3">
              <div className="text-4xl font-black tracking-wider" style={{
                background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                SLTR
              </div>
              <h2 className="text-2xl font-bold text-white">
                {t('title')}{userName ? `, ${userName}` : ''}
              </h2>
              <p className="text-white/60 text-sm">
                {t('subtitle')}
              </p>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-white/90 text-sm leading-relaxed">
                {t('message1')}
              </p>

              <p className="text-white/80 text-sm leading-relaxed">
                {t('message2')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  {t('question')}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 resize-none"
                  placeholder={t('placeholder')}
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
                >
                  {t('skipForNow')}
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? tCommon('loading') : feedback.trim() ? t('shareThoughts') : t('letsGo')}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-xs text-white/50">
                <span className="font-semibold text-white/70">Kevin</span><br />
                {t('founder')}
              </p>
              <p className="text-xs text-white/40">
                {t('gotThoughts')} <a href="mailto:info@getsltr.com" className="text-cyan-400 hover:text-cyan-300">info@getsltr.com</a>
              </p>
            </div>
          </>
        )}

        {submitted && (
          <div className="py-8 space-y-4">
            <div className="text-5xl">✨</div>
            <h3 className="text-xl font-bold text-white">{t('thankYou')}</h3>
            <p className="text-white/70 text-sm">
              {t('thankYouMessage')}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
