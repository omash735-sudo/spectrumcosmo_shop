interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#C96712] text-white rounded-tr-none'
            : 'bg-[var(--background-card)] dark:bg-[var(--background-card)] text-[var(--foreground)] rounded-tl-none shadow-sm border border-[var(--border)]'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
