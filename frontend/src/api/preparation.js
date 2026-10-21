import { aiApi, apiFetch } from './client';

export function fetchQuestions(category, options = {}) {
  return apiFetch(`/questions/?category=${encodeURIComponent(category)}`, options);
}

export function fetchAdvice(type, options = {}) {
  return apiFetch(`/advice/?type=${encodeURIComponent(type)}`, options);
}

export function fetchCompanies(options = {}) {
  return apiFetch('/companies/', options);
}

export function generateQuestions(payload) {
  return aiApi.generateQuestions(payload);
}

export function sendChatMessage(message, history) {
  return apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}
