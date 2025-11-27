"use client"

import { useState } from 'react'

interface GroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { name: string; time: string; description?: string }) => Promise<void>
}

export default function GroupModal({ isOpen, onClose, onSave }: GroupModalProps) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/90 border border-white/10 rounded-2xl p-4 text-white space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Host a Group</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <div>
          <label className="text-sm text-white/70">Group Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"/>
        </div>
        <div>
          <label className="text-sm text-white/70">Time</label>
          <input type="datetime-local" value={time} onChange={e=>setTime(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"/>
        </div>
        <div>
          <label className="text-sm text-white/70">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"/>
        </div>
        <button disabled={saving} onClick={async()=>{ setSaving(true); try { await onSave({ name, time, description }); onClose(); } finally { setSaving(false); } }} className="w-full py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/40 hover:bg-indigo-600/40 transition disabled:opacity-50">{saving?'Publishing…':'Publish Group'}</button>
      </div>
    </div>
  )
}
