import React, { useState, useEffect } from 'react';
import { Home, Dumbbell, TrendingUp, User, MessageCircle, LogOut } from 'lucide-react';
import { HomePage } from './components/HomePage';
import { WorkoutPage } from './components/WorkoutPage';
import { StatsPage } from './components/StatsPage';
import { ProfilePage } from './components/ProfilePage';
// 👇 关键修改：这里引入 Chat 而不是 AIChatPage
import Chat from './components/Chat';
import { AuthPage } from './components/AuthPage';
import { isAuthenticated, getCurrentUser, logout } from './services/authService';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      if (e.detail && typeof e.detail === 'string') {
        setActiveTab(e.detail);
      }
    };

    window.addEventListener('changeTab', handleTabChange as EventListener);

    return () => {
      window.removeEventListener('changeTab', handleTabChange as EventListener);
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuth(true);
    setCurrentUser(getCurrentUser());
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      setIsAuth(false);
      setCurrentUser(null);
      setActiveTab('home');
    }
  };

  // 未认证时显示登录页面
  if (!isAuth) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20 text-white">
      {/* Header with User Info */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-purple-500/20 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            {/* 👇 修改点：字体从 text-xs 改为 text-2xl，加粗，加斜体，让它像个 Logo */}
            <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-black tracking-widest mb-1 italic">
              Nofat健身
            </div>
            
            <h2 className="text-white font-medium flex items-center gap-2 text-sm opacity-90">
              {/* 这里会显示昵称 */}
              👋 {currentUser?.isGuest ? '游客' : currentUser?.name || currentUser?.email?.split('@')[0]}
            </h2>
          </div>
          <button
            onClick={handleLogout}
            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 p-2.5 rounded-xl transition-all"
            title="退出登录"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto min-h-[calc(100vh-140px)]">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'workout' && <WorkoutPage />}
        {activeTab === 'stats' && <StatsPage />}
        
        {activeTab === 'chat' && (
        
          <div className="h-[calc(100vh-140px)]">
            <Chat />
          </div>
        )}
        
        {activeTab === 'profile' && <ProfilePage />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-purple-500/20 z-50">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'home' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">首页</span>
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'workout' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Dumbbell className="w-6 h-6" />
              <span className="text-xs">锻炼</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'stats' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs">统计</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'chat' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">AI助手</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'profile' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">我的</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}