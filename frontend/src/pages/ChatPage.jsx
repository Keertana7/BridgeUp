import { useState, useRef, useEffect } from 'react';
import { chatApi } from '../api/client';
import './ChatPage.css';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm BridgeUp's placement preparation assistant. Feel free to talk about anything — interview anxiety, study plans, company prep, or just how you're feeling. I'm here to listen. 💬",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    // Build history for the API (last 10 exchanges, excluding the new message)
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await chatApi.send({ message: text, history });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.response },
      ]);
    } catch (err) {
      setError(
        err?.status === 0
          ? 'The chat assistant is currently unavailable. Make sure the secondary backend (backend/main.py) is running.'
          : err?.message || 'Failed to get a response. Please try again.'
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1 className="chat-title">💬 Talk to Me</h1>
        <p className="chat-subtitle">
          A supportive space to talk through placement prep, interview anxiety, or anything on your mind.
        </p>
      </div>

      <div className="chat-window" aria-live="polite" aria-label="Conversation">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {loading && (
          <div className="chat-bubble chat-bubble--assistant">
            <div className="bubble-typing" aria-label="Typing…">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}

      <form className="chat-input-row" onSubmit={handleSend}>
        <textarea
          ref={inputRef}
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          aria-label="Message input"
          disabled={loading}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ role, content }) {
  return (
    <div className={`chat-bubble chat-bubble--${role}`}>
      <p className="bubble-content">{content}</p>
    </div>
  );
}
