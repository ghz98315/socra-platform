'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Mic, MicOff, Sigma } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MathSymbolPicker } from '@/components/MathSymbolPicker';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  autoFocusKey?: string | number;
}

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
  autoFocusKey,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showMathPicker, setShowMathPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    setIsSupported(true);
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN';

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setMessage(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setMessage('');
    recognitionRef.current.start();
    setIsListening(true);
  }, [isListening]);

  const handleSymbolInsert = useCallback(
    (symbol: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setMessage((prev) => prev + symbol);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextMessage = message.slice(0, start) + symbol + message.slice(end);
      setMessage(nextMessage);

      window.setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
        textarea.focus();
      }, 0);
    },
    [message],
  );

  const handleSubmit = () => {
    if (!message.trim() || disabled || isLoading) {
      return;
    }

    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

  useEffect(() => {
    if (disabled || isLoading) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    window.setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }, 0);
  }, [autoFocusKey, disabled, isLoading]);

  return (
    <Card className="shadow-warm-500/30">
      <CardContent className="p-3">
        {showMathPicker ? (
          <div className="mb-2 rounded-lg bg-warm-100/30 p-2">
            <MathSymbolPicker onSymbolSelect={handleSymbolInsert} variant="compact" />
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant={showMathPicker ? 'default' : 'outline'}
            onClick={() => setShowMathPicker((current) => !current)}
            disabled={disabled || isLoading}
            className={cn(
              'h-11 w-11 flex-shrink-0 rounded-full transition-all duration-200',
              showMathPicker && 'bg-warm-500',
            )}
            title="数学符号"
          >
            <Sigma className="h-4 w-4" />
          </Button>

          {isSupported ? (
            <Button
              type="button"
              size="icon"
              variant={isListening ? 'default' : 'outline'}
              onClick={toggleListening}
              disabled={disabled || isLoading}
              className={cn(
                'h-11 w-11 flex-shrink-0 rounded-full transition-all duration-200',
                isListening && 'animate-pulse bg-red-500 hover:bg-red-600',
              )}
              title={isListening ? '停止录音' : '语音输入'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          ) : null}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '正在听...' : placeholder}
            disabled={disabled || isLoading}
            className={cn(
              'min-h-[40px] max-h-32 flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isListening && 'border-red-300 dark:border-red-700',
            )}
            rows={1}
          />

          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={disabled || isLoading || !message.trim()}
            className="btn-press h-11 w-11 flex-shrink-0 rounded-full bg-warm-500 transition-transform hover:bg-warm-600 active:scale-95"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <p className="mt-2 hidden text-center text-xs text-warm-600 sm:block">
          {isSupported ? (
            <>
              按 <kbd className="rounded bg-warm-100 px-1 py-0.5 text-[10px]">Enter</kbd> 发送
              {' · '}
              <kbd className="rounded bg-warm-100 px-1 py-0.5 text-[10px]">Σ</kbd> 数学符号
              {' · '}
              <kbd className="rounded bg-warm-100 px-1 py-0.5 text-[10px]">麦克风</kbd> 语音输入
            </>
          ) : (
            '按 Enter 发送，Shift + Enter 换行'
          )}
        </p>
      </CardContent>
    </Card>
  );
}
