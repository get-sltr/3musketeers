import { AssistantService } from './assistant.service';

const assistant = new AssistantService();

export { assistant, AssistantService };
export * from './intent-classifier';
export * from './response-generator';
export * from './conversation-manager';
