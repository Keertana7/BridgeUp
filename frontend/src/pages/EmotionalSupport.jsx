import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage } from '../api/preparation';
import './Preparation.css';

const STARTERS = [
  'I’m feeling anxious about interviews.',
  'I had a tough day and could use some encouragement.',
  'I don’t know where to start with preparation.',
];

export default function EmotionalSupport() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const result = await sendChatMessage(message, history);
      setMessages((current) => [...current, { role: 'assistant', content: result.response }]);
    } catch (requestError) {
      setMessages((current) => current.slice(0, -1));
      setInput(message);
      setError(requestError.message);
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container emotional-page">
      <button className="btn-ghost emotional-back" onClick={() => navigate('/ask-generate')}>
        ← Back to interview practice
      </button>
      <header className="emotional-heading">
        <span className="prep-eyebrow">A KIND, JUDGMENT-FREE SPACE</span>
        <h1>Talk it through.</h1>
        <p>You can talk about interview stress, a tough day, or whatever is on your mind. We’ll take it one step at a time.</p>
      </header>

      <section className="emotional-chat" aria-label="Emotional support conversation">
        <div className="emotional-chat-header">
          <div className="emotional-avatar" aria-hidden="true">✳</div>
          <div>
            <strong>Your BridgeUp support companion</strong>
            <span><i /> Here to listen and help you think things through</span>
          </div>
          <span className="emotional-ai-badge">AI COMPANION</span>
        </div>

        <div className="emotional-messages" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="emotional-welcome">
              <div className="emotional-welcome-icon" aria-hidden="true">♡</div>
              <span className="prep-eyebrow">NO QUESTION IS TOO SMALL</span>
              <h2>You don’t have to go through it alone.</h2>
              <p>Start wherever feels right. You can share as much or as little as you like.</p>
              <div className="emotional-starters">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => {
                      setInput(starter);
                      inputRef.current?.focus();
                    }}
                  >
                    {starter} <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((message, index) => (
            <article className={`emotional-message ${message.role === 'user' ? 'from-user' : 'from-assistant'}`} key={`${index}-${message.role}`}>
              <span className="emotional-message-avatar" aria-hidden="true">
                {message.role === 'user' ? 'You' : '✳'}
              </span>
              <div className="emotional-message-body">
                <strong>{message.role === 'user' ? 'You' : 'BridgeUp companion'}</strong>
                <p>{message.content}</p>
              </div>
            </article>
          ))}
          {loading && (
            <article className="emotional-message from-assistant" role="status" aria-label="BridgeUp companion is responding">
              <span className="emotional-message-avatar" aria-hidden="true">✳</span>
              <div className="emotional-message-body">
                <strong>BridgeUp companion</strong>
                <span className="emotional-typing"><i /><i /><i /></span>
              </div>
            </article>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="emotional-compose-area">
          {error && <p className="emotional-error" role="alert">{error}</p>}
          <form className="emotional-compose" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Write what’s on your mind…"
              aria-label="Write a message to your BridgeUp support companion"
              rows={1}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
              {loading ? '…' : '↑'}
            </button>
          </form>
          <p className="emotional-safety-note">
            This AI can offer support, but it isn’t a therapist or emergency service. If you’re in immediate danger, contact local emergency services or someone you trust.
          </p>
        </div>
      </section>
    </div>
  );
}
