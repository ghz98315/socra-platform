// =====================================================
// Auth Modal - 登录/注册模态框
// =====================================================

import React, { useState } from 'react';
import { X, Phone, Lock, Loader2, Eye, EyeOff, BookOpenCheck, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

 type AuthMode = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError('');
    setLoading(false);
    setRegisterSuccess(false);
  };

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 基础验证
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }

    // 手机号验证（11位：1开头 + 第二位3-9 + 后9位数字）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('请输入正确的11位手机号');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    // 注册时验证确认密码
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);

    try {
      // 手机号转换为邮箱格式
      const email = `${phone}@student.local`;

      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message || '登录失败，请检查手机号和密码');
        } else {
          onAuthSuccess();
          onClose();
          resetForm();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
            data: {
              phone: phone,
              display_name: displayName || phone,
            },
          },
        });
        if (error) {
          setError(error.message || '注册失败，请稍后重试');
        } else {
          // 注册成功
          setRegisterSuccess(true);
        }
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-warm-500 to-warm-600 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <BookOpenCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {registerSuccess ? '注册成功' : mode === 'login' ? '欢迎回来' : '创建账户'}
              </h2>
              <p className="text-white/80 text-sm">
                {registerSuccess ? '' : mode === 'login' ? '登录以保存批改记录' : '开始你的写作之旅'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 注册成功提示 */}
          {registerSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">注册成功！</h3>
              <p className="text-gray-600 text-sm mb-4">
                您现在可以使用手机号 <span className="font-medium text-warm-600">{phone}</span> 登录。
              </p>
              <button
                onClick={() => {
                  setMode('login');
                  resetForm();
                }}
                className="w-full py-2.5 bg-warm-500 text-white rounded-xl font-medium hover:bg-warm-600 transition-colors"
              >
                前往登录
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                  {error}
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  手机号
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Display Name (Register only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                    昵称（选填）
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="您的昵称"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? '输入密码' : '至少6个字符'}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-warm-500 text-white rounded-xl font-medium hover:bg-warm-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {mode === 'login' ? '登录中...' : '注册中...'}
                  </>
                ) : (
                  mode === 'login' ? '登录' : '注册'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Switch Mode */}
        {!registerSuccess && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                还没有账户？{' '}
                <button
                  onClick={handleSwitchMode}
                  className="text-warm-600 hover:text-warm-700 font-medium ml-1"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账户？{' '}
                <button
                  onClick={handleSwitchMode}
                  className="text-warm-600 hover:text-warm-700 font-medium ml-1"
                >
                  立即登录
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-4 text-center">
        <p className="text-xs text-gray-400">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
