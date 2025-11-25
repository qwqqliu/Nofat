import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
// 注意：register 函数现在接受 3 个参数 (email, password, name)
import { register, login, loginAsGuest } from '../services/authService';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // 👇 新增：昵称状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        // 注册模式验证
        if (!email || !password || !confirmPassword) {
          setMessage({ type: 'error', text: '请填写所有字段' });
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: '两次输入的密码不一致' });
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setMessage({ type: 'error', text: '密码长度不少于6位' });
          setIsLoading(false);
          return;
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setMessage({ type: 'error', text: '邮箱格式不正确' });
          setIsLoading(false);
          return;
        }

        // 👇 核心修改：传入 name (如果没有填，传空字符串，后端会自动处理为邮箱前缀)
        const result = await register(email, password, name);
        
        if (result.success) {
          setMessage({ type: 'success', text: '注册成功，正在进入应用...' });
          setTimeout(() => {
            onAuthSuccess();
          }, 1500);
        } else {
          setMessage({ type: 'error', text: result.error || '注册失败' });
        }
      } else {
        // 登录模式验证
        if (!email || !password) {
          setMessage({ type: 'error', text: '请输入邮箱和密码' });
          setIsLoading(false);
          return;
        }

        const result = await login(email, password);
        if (result.success) {
          setMessage({ type: 'success', text: '登录成功，正在进入应用...' });
          setTimeout(() => {
            onAuthSuccess();
          }, 1500);
        } else {
          setMessage({ type: 'error', text: result.error || '登录失败' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    onAuthSuccess();
  };

  // 切换模式时重置表单
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
    setName(''); // 清空昵称
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          {/* 👇 修改：更醒目的标题 */}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic tracking-wider">
            Nofat健身
          </h1>
          <p className="text-slate-400">您的专业AI健康管家</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-purple-500/40 p-8">
          <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="flex gap-2 bg-slate-700/50 p-1 rounded-lg">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-4 rounded transition-all ${
                  mode === 'login'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 px-4 rounded transition-all ${
                  mode === 'register'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                注册
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 👇 新增：昵称输入框 (仅注册模式显示) */}
              {mode === 'register' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-slate-300">昵称</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="给自己起个好名字"
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">邮箱</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">密码</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位"
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">确认密码</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再输入一次密码"
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded ${
                    message.type === 'error'
                      ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                      : 'bg-green-500/20 text-green-200 border border-green-500/30'
                  }`}
                >
                  {message.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-900/20"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : mode === 'login' ? (
                  '登录'
                ) : (
                  '立即注册'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">或</span>
              </div>
            </div>

            {/* Guest Login */}
            <Button
              onClick={handleGuestLogin}
              type="button"
              variant="outline"
              className="w-full border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white font-semibold"
            >
              👤 游客试用
            </Button>
          </div>
        </Card>

        {/* Tips */}
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-400">
            💡 游客模式可以体验所有功能，但数据不会被保存。注册后可永久保存您的计划和数据。
          </p>
        </div>
      </div>
    </div>
  );
}