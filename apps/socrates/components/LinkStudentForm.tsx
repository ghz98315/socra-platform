// =====================================================
// Project Socrates - Link Student Form Component
// 家长关联已有学生的表单组件
// =====================================================

'use client';

import { useState } from 'react';
import { Phone, Loader2, Send, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LinkStudentFormProps {
  onSuccess?: () => void;
  className?: string;
}

interface LinkRequestResult {
  id: string;
  status: string;
  student: {
    id: string;
    display_name: string;
    grade_level: number | null;
  };
}

export function LinkStudentForm({ onSuccess, className }: LinkStudentFormProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestData, setRequestData] = useState<LinkRequestResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.replace(/\D/g, '').length !== 11) {
      setResult('error');
      setErrorMessage('请输入正确的11位手机号');
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorMessage('');
    setRequestData(null);

    try {
      const response = await fetch('/api/link-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult('error');
        setErrorMessage(data.error || '发送请求失败');
        return;
      }

      setResult('success');
      setRequestData(data.data);
      setPhone('');
      setMessage('');
      onSuccess?.();
    } catch (error) {
      console.error('Error sending link request:', error);
      setResult('error');
      setErrorMessage('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // 只保留数字
    const numbers = value.replace(/\D/g, '');
    // 限制11位
    return numbers.slice(0, 11);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-500" />
        </div>
        <h3 className="font-medium">关联已有学生账号</h3>
        <p className="text-sm text-muted-foreground mt-1">
          输入学生的手机号，发送关联请求
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">学生手机号</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="请输入学生手机号"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="pl-10"
              maxLength={11}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            请输入学生注册时使用的手机号
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">留言（可选）</label>
          <Input
            type="text"
            placeholder="例如：我是你的爸爸"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={50}
          />
        </div>

        {result === 'success' && requestData && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">请求已发送</p>
              <p className="text-sm">
                已向 {requestData.student.display_name} 发送关联请求，
                请等待学生确认。
              </p>
            </div>
          </div>
        )}

        {result === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || phone.length !== 11}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              发送关联请求
            </>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          关联请求发送后，学生需要在设置页面确认接受。
          <br />
          学生接受后，您就可以查看该学生的学习数据。
        </p>
      </div>
    </div>
  );
}
