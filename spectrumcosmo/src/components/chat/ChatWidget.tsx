'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { MessageCircle, Bot, Headphones, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WHATSAPP_NUMBER = '265893160202';
const WHATSAPP_MESSAGE = 'Hi, I need assistance with SpectrumCosmo.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

interface ChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ChatWidget({ isOpen: externalIsOpen, onToggle }: ChatWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;

  useEffect(() => {
    let id = localStorage.getItem('ella_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('ella_session_id', id);
    }
    setSessionId(id);
  }, []);

  useEffect(() => {
    if (sessionId && isOpen) {
      fetch(`/api/ella/chat?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(console.error);
    }
  }, [sessionId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ella/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      if (data.requiresEscalation) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I have escalated this to Omash for review. You will hear back soon.'
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-[#C96712] text-white rounded-full p-4 shadow-lg hover:bg-[#E27716] transition-all duration-200 flex items-center justify-center w-14 h-14 chat-bubble-float"
          aria-label="Chat with Ella"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed bottom-20 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)]">
          <div className="bg-[var(--background-card)] dark:bg-[var(--background-card)] rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col max-h-[600px] h-[500px] overflow-hidden manga-bg cards-manga">
            <div className="bg-[#C96712] text-white p-4 rounded-t-2xl flex justify-between items-center flex-shrink-0 relative z-10">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <div>
                  <h3 className="font-bold">Ella</h3>
                  <p className="text-xs opacity-80">SpectrumCosmo AI Assistant</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="hover:bg-[#E27716] p-1.5 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--background)] dark:bg-[var(--background)] relative z-10">
              {messages.length === 0 && (
                <div className="text-center text-[var(--foreground-muted)] mt-8">
                  <Bot size={40} className="mx-auto text-[#C96712] mb-3" />
                  <p className="text-lg font-medium text-[var(--foreground)]">Hi 👋</p>
                  <p className="mt-2">I'm Ella, your SpectrumCosmo assistant.</p>
                  <p className="text-sm">How can I help you today?</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--background-card)] dark:bg-[var(--background-card)] text-[var(--foreground)] rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] shadow-sm border border-[var(--border)]">
                    <span className="inline-block animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-[var(--border)] bg-[var(--background-card)] dark:bg-[var(--background-card)] rounded-b-2xl flex-shrink-0 relative z-10">
              <div className="flex justify-center mb-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-6 rounded-full transition-colors min-h-[44px] min-w-[44px] w-full max-w-[200px]"
                >
                  <Headphones size={16} />
                  Chat with Team
                </a>
              </div>
              <ChatInput onSend={sendMessage} disabled={isLoading} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
