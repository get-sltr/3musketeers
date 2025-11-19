import { anthropic } from '../lib/anthropic.js';
import { supabase } from '../lib/supabase.js';
import type { ChatRequest, ChatResponse } from '../types/eros.types.js';

const SYSTEM_PROMPT = `You are EROS, an AI assistant for SLTR, a dating app for the LGBTQ+ community. Your role is to help users find matches and navigate dating.

Personality:
- Direct and honest, but friendly
- Supportive and non-judgmental
- Focused on helping users make real connections

Guidelines:
- Keep responses concise (2-3 sentences max)
- Use casual, conversational language
- Never ask for sensitive personal info
- If you don't know something, say so

SLTR's tagline is "Rules Don't Apply" - we're about authentic connections without judgment.`;

export class ErosAssistantService {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { user_id, message } = request;

    try {
      // Get recent conversation history
      const history = await this.getHistory(user_id, 10);

      // Build messages for Claude
      const messages = [
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.message
        })),
        {
          role: 'user' as const,
          content: message
        }
      ];

      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages
      });

      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Save user message
      await this.saveMessage(user_id, message, 'user');

      // Save assistant response
      const conversationId = await this.saveMessage(
        user_id,
        assistantMessage,
        'assistant'
      );

      return {
        success: true,
        response: assistantMessage,
        conversation_id: conversationId
      };

    } catch (error) {
      console.error('EROS chat error:', error);
      throw error;
    }
  }

  private async getHistory(userId: string, limit: number) {
    const { data, error } = await supabase
      .from('eros_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse(); // Chronological order
  }

  private async saveMessage(
    userId: string,
    message: string,
    role: 'user' | 'assistant'
  ): Promise<string> {
    const { data, error } = await supabase
      .from('eros_conversations')
      .insert({
        user_id: userId,
        message,
        role,
        conversation_context: {}
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }
}
