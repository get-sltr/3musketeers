import { Intent } from './intent-classifier';
import { ErosConversation, MessageRole } from '../../../shared/types/eros.types';

export class ConversationManager {
  async saveConversation(
    userId: string,
    userMessage: string,
    assistantResponse: string,
    intent: Intent
  ): Promise<string> {
    // TODO: Implement conversation storage
    // This should:
    // - Save user message to database
    // - Save assistant response to database
    // - Track token usage
    // - Return conversation ID

    return `conv_${Date.now()}`;
  }

  async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<ErosConversation[]> {
    // TODO: Implement conversation retrieval
    // This should fetch recent conversation history for context

    return [];
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    // TODO: Implement conversation deletion
    return true;
  }
}
