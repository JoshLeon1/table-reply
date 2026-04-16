'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const LS_REPLY  = 'tr_step_reply'
const LS_SYNC   = 'tr_step_sync'
const LS_DONE   = 'tr_welcome_done'

interface Props {
  hasGeneratedReply: boolean
  hasAutoSync: boolean
  onReplyGenerated?: (cb: () => void) => void
}

export default function WelcomeBanner({ hasGeneratedReply, hasAutoSync }: Props) {
  const [steps, setSteps] = useState({ voice: true, reply: false, sync: false })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(LS_DONE)) return

    const replyDone = hasGeneratedReply || localStorage.getItem(LS_REPLY) === '1'
    const syncDone  = hasAutoSync  || localStorage.getItem(LS_SYNC)  === '1'

    if (replyDone) localStorage.setItem(LS_REPLY, '1')
    if (syncDone)  localStorage.setItem(LS_SYNC,  '1')

    const allDone = replyDone && syncDone
    if (allDone) { localStorage.setItem(LS_DONE, '1'); return }

    setSteps({ voice: true, reply: replyDone, sync: syncDone })
    setVisible(true)
  }, [hasGeneratedReply, hasAutoSync])

  const dismiss = () => {
    localStorage.setItem(LS_DONE, '1')
    setVisible(false)
  }

  if (!visible) return null

  const stepList = [
    { done: steps.voice, label: 'Set business voice', href: '/settings' },
    { done: steps.reply, label: 'Generate first reply',  href: '/dashboard' },
    { done: steps.sync,  label: 'Connect Google sync',   href: '/dashboard/reviews' },
  ]

  const doneCount = stepList.filter((s) => s.done).length

  return (
    <div className="bg-white rounded-2xl border border-[#E4DED8] shadow-card p-4 mb-2 animate-fade-up">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-[13px] font-semibold text-[#111]">Get started with Replyfi</p>
          <p className="text-[12px] text-[#A8A29E] mt-0.5">{doneCount} of 3 steps complete</p>
        </div>
        <button onClick={dismiss} className="text-[#C4BEB8] hover:text-[#7C7672] transition-colors flex-shrink-0 mt-0.5 p-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#F3F0EC] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-[#E05A28] rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / 3) * 100}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {stepList.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-150 ${
              step.done
                ? 'bg-[#F3F0EC] border-[#E4DED8] opacity-55 pointer-events-none'
                : 'bg-white border-[#F5C9AD] hover:border-[#E05A28] hover:bg-[#FEF0E8]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.done ? 'bg-emerald-100 text-emerald-600' : 'border-2 border-[#E05A28]/40'
            }`}>
              {step.done && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <span className={`text-[12px] font-medium leading-snug ${step.done ? 'text-[#A8A29E] line-through' : 'text-[#333]'}`}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
