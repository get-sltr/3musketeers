import { IntentClassifier } from './intent-classifier';
import { ResponseGenerator } from './response-generator';
import { ConversationManager } from './conversation-manager';
import { ChatWithErosResponse, ErosConversation } from '../../../shared/types/eros.types';

export class AssistantService {
  private intentClassifier: IntentClassifier;
  private responseGenerator: ResponseGenerator;
  private conversationManager: ConversationManager;

  constructor() {
    this.intentClassifier = new IntentClassifier();
    this.responseGenerator = new ResponseGenerator();
    this.conversationManager = new ConversationManager();
  }

  async chat(
    userId: string,
    message: string,
    conversationHistory: ErosConversation[] = []
  ): Promise<ChatWithErosResponse> {
    try {
      // Classify user intent
      const intent = await this.intentClassifier.classifyIntent(message, conversationHistory);

      // Generate appropriate response
      const response = await this.responseGenerator.generateResponse(
        userId,
        message,
        intent,
        conversationHistory
      );

      // Save conversation
      const conversationId = await this.conversationManager.saveConversation(
        userId,
        message,
        response.text,
        intent
      );

      return {
        success: true,
        response: response.text,
        intent_category: intent,
        suggested_actions: response.suggestedActions,
        conversation_id: conversationId
      };
    } catch (error) {
      return {
        success: false,
        response: "I'm having trouble processing your request right now. Please try again.",
        conversation_id: ''
      };
    }
  }
}
