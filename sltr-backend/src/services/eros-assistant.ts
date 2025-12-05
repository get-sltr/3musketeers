import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../lib/supabase';

interface ChatRequest {
  user_id: string;
  message: string;
  conversation_id?: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id: string;
  intent?: string;
  confidence?: number;
}

interface UserProfile {
  id: string;
  display_name: string;
  age: number;
  bio?: string;
  gender?: string;
  interested_in?: string[];
  looking_for?: string;
  interests?: string[];
  photos?: any[];
  location?: string;
}

export class ErosAssistantService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Main chat handler for EROS
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { user_id, message, conversation_id } = request;

      // Fetch user profile for context
      const userProfile = await this.getUserProfile(user_id);
      if (!userProfile) {
        return {
          success: false,
          response: "I couldn't find your profile. Please complete your profile first.",
          conversation_id: conversation_id || this.generateConversationId(),
        };
      }

      // Detect intent from message
      const intent = this.detectIntent(message);

      // Get conversation history
      const conversationHistory = conversation_id 
        ? await this.getConversationHistory(conversation_id)
        : [];

      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(userProfile, intent);
      
      // Call Claude API
      const claudeResponse = await this.callClaude(
        systemPrompt,
        message,
        conversationHistory
      );

      // Save conversation
      const finalConversationId = conversation_id || this.generateConversationId();
      await this.saveConversation(
        finalConversationId,
        user_id,
        message,
        claudeResponse,
        intent
      );

      return {
        success: true,
        response: claudeResponse,
        conversation_id: finalConversationId,
        intent,
        confidence: 0.9,
      };

    } catch (error) {
      console.error('EROS chat error:', error);
      return {
        success: false,
        response: "I'm having trouble right now. Please try again in a moment.",
        conversation_id: request.conversation_id || this.generateConversationId(),
      };
    }
  }

  /**
   * Build intelligent system prompt based on user context
   */
  private buildSystemPrompt(userProfile: UserProfile, intent: string): string {
    const basePrompt = `You are EROS, an expert AI dating coach and matchmaking assistant for SLTR, a location-based dating app. 

Your personality:
- Warm, supportive, and encouraging
- Direct and honest, but never harsh
- Playful and slightly witty when appropriate
- Deeply knowledgeable about relationships, attraction, and communication
- You understand LGBTQ+ dating and diverse relationship styles

Your role:
- Provide personalized dating advice based on user profiles
- Analyze compatibility between matches
- Suggest conversation starters and icebreakers
- Help users improve their profiles
- Offer relationship guidance and communication tips
- Explain match recommendations

CRITICAL RULES:
- Always be respectful and sex-positive
- Never make assumptions about gender or sexuality
- Keep responses under 200 words unless asked for more detail
- Be specific and actionable, not generic
- Reference the user's actual profile details when relevant
- Stay in character as EROS - you're their personal dating coach`;

    const userContext = `\n\nCURRENT USER PROFILE:
Name: ${userProfile.display_name}
Age: ${userProfile.age}
Gender: ${userProfile.gender || 'Not specified'}
Interested in: ${userProfile.interested_in?.join(', ') || 'Not specified'}
Looking for: ${userProfile.looking_for || 'Not specified'}
Bio: ${userProfile.bio || 'No bio yet'}
Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
Location: ${userProfile.location || 'Not specified'}`;

    const intentContext = this.getIntentContext(intent);

    return basePrompt + userContext + intentContext;
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('match') || lowerMsg.includes('compatible') || lowerMsg.includes('why')) {
      return 'match_analysis';
    }
    if (lowerMsg.includes('message') || lowerMsg.includes('conversation') || lowerMsg.includes('say') || lowerMsg.includes('talk')) {
      return 'conversation_starter';
    }
    if (lowerMsg.includes('profile') || lowerMsg.includes('photo') || lowerMsg.includes('bio')) {
      return 'profile_advice';
    }
    if (lowerMsg.includes('date') || lowerMsg.includes('meet') || lowerMsg.includes('first')) {
      return 'dating_advice';
    }
    
    return 'general_advice';
  }

  /**
   * Get context-specific guidance based on intent
   */
  private getIntentContext(intent: string): string {
    const contexts: Record<string, string> = {
      match_analysis: '\n\nThe user is asking about match compatibility. Analyze their profile against potential matches, explain compatibility factors, and highlight shared interests or complementary traits.',
      conversation_starter: '\n\nThe user needs help starting a conversation. Suggest 2-3 specific, creative opening messages based on the match\'s profile. Make them personal and engaging, not generic.',
      profile_advice: '\n\nThe user wants profile improvement tips. Review their current profile and suggest specific, actionable improvements for photos, bio, or other sections.',
      dating_advice: '\n\nThe user needs dating guidance. Provide practical advice about meeting up, first dates, or relationship progression.',
      general_advice: '\n\nThe user has a general dating question. Provide helpful guidance based on their situation.',
    };

    return contexts[intent] || contexts.general_advice;
  }

  /**
   * Call Claude API with conversation context
   */
  private async callClaude(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    const messages = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages as any,
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent ? (textContent as any).text : "I'm not sure how to respond to that.";
  }

  /**
   * Fetch user profile from Supabase
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Failed to fetch user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Get conversation history from database
   */
  private async getConversationHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      const { data, error } = await supabase
        .from('eros_conversations')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Last 10 messages for context

      if (error || !data) {
        return [];
      }

      return data.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    conversationId: string,
    userId: string,
    userMessage: string,
    assistantResponse: string,
    intent: string
  ): Promise<void> {
    try {
      // Save user message
      await supabase.from('eros_conversations').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: userMessage,
        intent,
      });

      // Save assistant response
      await supabase.from('eros_conversations').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'assistant',
        content: assistantResponse,
        intent,
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
      // Don't throw - conversation saving shouldn't break the chat
    }
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `eros_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Analyze match compatibility (called when user asks about a specific match)
   */
  async analyzeMatch(userId: string, matchUserId: string): Promise<string> {
    try {
      const [userProfile, matchProfile] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserProfile(matchUserId),
      ]);

      if (!userProfile || !matchProfile) {
        return "I couldn't find profile information for this match.";
      }

      const prompt = `Analyze the compatibility between these two users on SLTR:

USER 1:
${JSON.stringify(userProfile, null, 2)}

USER 2:
${JSON.stringify(matchProfile, null, 2)}

Provide a brief compatibility analysis covering:
1. Shared interests or values
2. Complementary traits
3. Potential conversation topics
4. One specific icebreaker suggestion

Keep it under 150 words and be encouraging but honest.`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent ? (textContent as any).text : "I couldn't analyze this match.";
    } catch (error) {
      console.error('Error analyzing match:', error);
      return "I'm having trouble analyzing this match right now.";
    }
  }
}

