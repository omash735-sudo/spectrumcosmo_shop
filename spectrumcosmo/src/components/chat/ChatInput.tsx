'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 sm:p-3 border-t border-[var(--border)] bg-[var(--background-card)] dark:bg-[var(--background-card)] rounded-b-2xl">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? 'Ella is thinking...' : 'Type your message...'}
          disabled={disabled}
          className="flex-1 min-h-[44px] px-3 sm:px-4 py-2 border border-[var(--border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[#C96712] focus:border-transparent disabled:opacity-50 bg-[var(--background)] dark:bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] text-sm sm:text-base min-w-0"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="bg-[#C96712] text-white rounded-full p-2 sm:px-4 sm:py-2 min-h-[44px] min-w-[44px] hover:bg-[#E27716] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </form>
  );
}
