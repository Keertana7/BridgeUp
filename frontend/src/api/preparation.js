import { aiApi, chatApi } from './client';

export function generateQuestions(payload) {
  return aiApi.generateQuestions(payload);
}

export function sendChatMessage(message, history) {
  return chatApi.send({ message, history });
}
