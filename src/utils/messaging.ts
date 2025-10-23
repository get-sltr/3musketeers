import { createClient } from '@/lib/supabase/client'

export async function startConversation(otherUserId: string): Promise<string | null> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return null
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .single()

    if (existingConversation) {
      return existingConversation.id
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: user.id,
        user2_id: otherUserId
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return newConversation.id
  } catch (err) {
    console.error('Error starting conversation:', err)
    return null
  }
}

export async function sendFirstMessage(conversationId: string, content: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return false
    }

    // Get the other user ID from the conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      console.error('Conversation not found')
      return false
    }

    const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: content.trim()
      })

    if (error) {
      console.error('Error sending message:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error sending first message:', err)
    return false
  }
}
