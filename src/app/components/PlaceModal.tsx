"use client"

import { useState } from 'react'

interface PlaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { name: string; type: string; notes?: string }) => Promise<void>
}

export default function PlaceModal({ isOpen, onClose, onSave }: PlaceModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('Park')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/90 border border-white/10 rounded-2xl p-4 text-white space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Add a Place</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <div>
          <label className="text-sm text-white/70">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"/>
        </div>
        <div>
          <label className="text-sm text-white/70">Type</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-400">
            <option>Park</option>
            <option>Club</option>
            <option>Gym</option>
            <option>Sauna</option>
            <option>Event</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70">Notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"/>
        </div>
        <button disabled={saving} onClick={async()=>{ setSaving(true); try { await onSave({ name, type, notes }); onClose(); } finally { setSaving(false); } }} className="w-full py-2 rounded-xl bg-emerald-600/30 border border-emerald-400/40 hover:bg-emerald-600/40 transition disabled:opacity-50">{saving?'Saving…':'Save Place'}</button>
      </div>
    </div>
  )
}
