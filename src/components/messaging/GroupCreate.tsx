'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GroupCreateProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  inviteUserId: string
  inviteUserName: string
  inviteUserPhoto?: string
  onGroupCreated?: (groupId: string) => void
}

interface NearbyUser {
  id: string
  display_name: string
  username: string
  photos: string[]
  online: boolean
}

export default function GroupCreate({
  isOpen,
  onClose,
  currentUserId,
  inviteUserId,
  inviteUserName,
  inviteUserPhoto,
  onGroupCreated
}: GroupCreateProps) {
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([inviteUserId])
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  // Load nearby/recent users
  useEffect(() => {
    if (isOpen) {
      loadNearbyUsers()
    }
  }, [isOpen])

  const loadNearbyUsers = async () => {
    setIsLoading(true)
    try {
      // Get users from recent conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('updated_at', { ascending: false })
        .limit(20)

      const userIds = new Set<string>()
      conversations?.forEach(conv => {
        if (conv.user1_id !== currentUserId) userIds.add(conv.user1_id)
        if (conv.user2_id !== currentUserId) userIds.add(conv.user2_id)
      })

      // Remove the already invited user
      userIds.delete(inviteUserId)

      if (userIds.size > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, display_name, username, photos, online')
          .in('id', Array.from(userIds))
          .limit(15)

        setNearbyUsers(users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 1) return

    setIsCreating(true)
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim() || `Group with ${inviteUserName}`,
          created_by: currentUserId,
          type: 'private'
        })
        .select('id')
        .single()

      if (groupError) throw groupError

      // Add members (including current user)
      const members = [currentUserId, ...selectedUsers].map(userId => ({
        group_id: group.id,
        user_id: userId,
        role: userId === currentUserId ? 'admin' : 'member'
      }))

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(members)

      if (membersError) throw membersError

      onGroupCreated?.(group.id)
      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredUsers = nearbyUsers.filter(user =>
    !searchQuery ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Start a Group</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Group Name Input */}
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name (optional)"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Already Invited User */}
        <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Starting with</p>
          <div className="flex items-center gap-3 p-3 bg-lime-400/10 border border-lime-400/20 rounded-xl">
            <img
              src={inviteUserPhoto || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23333" width="40" height="40"/%3E%3C/svg%3E'}
              alt={inviteUserName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{inviteUserName}</p>
              <p className="text-lime-400 text-xs">Will be invited</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Add More Users */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex-shrink-0">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Add more people</p>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-white/40 text-sm">No contacts found</p>
                <p className="text-white/30 text-xs mt-1">Start more conversations to see contacts here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.includes(user.id)
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                        ${isSelected
                          ? 'bg-lime-400/10 border border-lime-400/30'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="relative">
                        <img
                          src={user.photos?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23333" width="40" height="40"/%3E%3C/svg%3E'}
                          alt={user.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {user.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-zinc-900" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium text-sm">{user.display_name || user.username}</p>
                        {user.username && user.display_name && (
                          <p className="text-white/40 text-xs">@{user.username}</p>
                        )}
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected
                          ? 'bg-lime-400 border-lime-400'
                          : 'border-white/20'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleCreateGroup}
            disabled={selectedUsers.length < 1 || isCreating}
            className="w-full py-3.5 bg-lime-400 text-black rounded-2xl font-semibold hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Create Group ({selectedUsers.length + 1} members)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
