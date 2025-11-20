import { ErosConversation } from '../../../shared/types/eros.types';

export type Intent =
  | 'match_inquiry'
  | 'profile_help'
  | 'conversation_advice'
  | 'preference_update'
  | 'general_question'
  | 'feedback';

export class IntentClassifier {
  async classifyIntent(
    message: string,
    conversationHistory: ErosConversation[]
  ): Promise<Intent> {
    // TODO: Implement AI-based intent classification
    // This should analyze the message and context to determine:
    // - What the user is asking about
    // - What action they want to take
    // - What information they need

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('match') || lowerMessage.includes('compatible')) {
      return 'match_inquiry';
    }
    if (lowerMessage.includes('profile') || lowerMessage.includes('bio')) {
      return 'profile_help';
    }
    if (lowerMessage.includes('message') || lowerMessage.includes('talk') || lowerMessage.includes('conversation')) {
      return 'conversation_advice';
    }
    if (lowerMessage.includes('prefer') || lowerMessage.includes('looking for')) {
      return 'preference_update';
    }

    return 'general_question';
  }
}
