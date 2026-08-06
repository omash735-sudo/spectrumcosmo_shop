interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
          isUser
            ? 'bg-[#F97316] text-white rounded-tr-none'
            : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
