'use client';

import { User, Bot, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  theme?: 'junior' | 'senior';
}

export function ChatMessage({ message, theme = 'junior' }: ChatMessageProps) {
  if (message.role === 'system') return null;

  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3 items-end",
      isUser ? 'flex-row-reverse' : ''
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser
          ? "bg-gradient-to-br from-blue-500 to-blue-600"
          : "bg-gradient-to-br from-purple-500 to-indigo-600"
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
        isUser
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
          : "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 text-foreground rounded-bl-md border border-slate-200 dark:border-slate-700"
      )}>
        {/* AI 标签 */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {theme === 'junior' ? 'Jasper' : 'Logic'}
            </span>
            <span className="text-[10px] text-muted-foreground">· AI 导师</span>
          </div>
        )}

        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

        <p className={cn(
          "text-[10px] mt-2",
          isUser ? "text-blue-100" : "text-muted-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

interface ChatMessageListProps {
  messages: Message[];
  theme?: 'junior' | 'senior';
  isLoading?: boolean;
}

export function ChatMessageList({ messages, theme = 'junior', isLoading }: ChatMessageListProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <Bot className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            {theme === 'junior' ? '开始你的学习之旅吧！🌟' : '准备好开始学习了吗？'}
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage key={message.id} message={message} theme={theme} />
        ))
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-3 items-end">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {theme === 'junior' ? 'Jasper' : 'Logic'}
              </span>
            </div>
            <div className="flex gap-1.5 mt-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
