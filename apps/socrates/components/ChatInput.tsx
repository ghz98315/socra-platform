'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = '输入你的问题...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setMessage(''); // Clear previous message
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleSubmit = () => {
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  return (
    <Card className="shadow-apple">
      <CardContent className="p-3">
        <div className="flex gap-2">
          {/* Voice Input Button */}
          {isSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? 'default' : 'outline'}
              onClick={toggleListening}
              disabled={disabled || isLoading}
              className={cn(
                "rounded-full h-11 w-11 flex-shrink-0 transition-all duration-200",
                isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
              )}
              title={isListening ? '停止录音' : '语音输入'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '正在听...' : placeholder}
            disabled={disabled || isLoading}
            className={`
              flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm
              focus:outline-none focus:ring-1 focus:ring-ring
              disabled:opacity-50 disabled:cursor-not-allowed
              max-h-32 min-h-[40px]
              ${isListening ? 'border-red-300 dark:border-red-700' : ''}
            `}
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={disabled || isLoading || !message.trim()}
            className="rounded-full h-11 w-11 flex-shrink-0 btn-press active:scale-95 transition-transform"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
          {isSupported ? (
            <>
              按 <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> 发送
              {' · '}
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">麦克风</kbd> 语音输入
            </>
          ) : (
            '按 Enter 发送，Shift + Enter 换行'
          )}
        </p>
      </CardContent>
    </Card>
  );
}
