import React, { useState, useEffect } from 'react';
import { Home, Dumbbell, TrendingUp, User, MessageCircle, LogOut } from 'lucide-react';
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { WorkoutPage } from './components/WorkoutPage';
import { StatsPage } from './components/StatsPage';
import { ProfilePage } from './components/ProfilePage';
import { AIChatPage } from './components/AIChatPage';
import { isAuthenticated, getCurrentUser, logout } from './services/authService';

export default function App() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [isAuth]);

  const handleAuthSuccess = () => {
    setIsAuth(true);
    setCurrentUser(getCurrentUser());
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      setIsAuth(false);
      setCurrentUser(null);
    }
  };

  // 未认证时显示登录页面
  if (!isAuth) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl">Nofat健身</h1>
          <button
            onClick={handleLogout}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 p-3 rounded-lg transition-all"
          >
            退出登录
          </button>
        </div>
        <div className="bg-slate-800/50 border-purple-500/20 rounded-lg p-6">
          <h2 className="text-white text-xl mb-4">欢迎回来！</h2>
          <p className="text-slate-400">
            {currentUser?.isGuest ? '游客模式' : `欢迎 ${currentUser?.email || '用户'}`}
          </p>
          <p className="text-slate-400 mt-2">应用功能正在恢复中...</p>
        </div>
      </div>
    </div>
  );
}