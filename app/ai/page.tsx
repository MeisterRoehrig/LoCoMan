'use client';

import { useChat } from '@ai-sdk/react';
import { Input } from "@/components/ui/input"

export default function Page() {
  const { messages, input, setInput, append } = useChat();

  return (
    <div>
      <h1>AI Chat</h1>

      <Input 
        value={input}
        onChange={event => {
          setInput(event.target.value);
        }}
        onKeyDown={async event => {
          if (event.key === 'Enter') {
            append({ content: input, role: 'user' });
          }
        }}
      />

      {messages.map((message, index) => (
        <div key={index}>{message.content}</div>
      ))}
    </div>
  );
}