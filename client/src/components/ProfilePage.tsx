import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronRight, User, Settings, Bell, Heart, Trophy, Moon, LogOut, ChevronLeft, Award, Target, Activity, Flame, Calendar, MapPin, Mail, Phone, Edit, Volume2, Lock, Info, HelpCircle, Star, Medal, Crown, Zap, Camera, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { saveUserProfile, getAchievements, getWeekSummary } from '../services/dataService';
import { getCurrentUser, logout } from '../services/authService';

export function ProfilePage() {
   const [currentView, setCurrentView] = useState<'main' | 'profile' | 'achievements' | 'health' | 'settings'>('main');
  // 使用真实用户数据初始化
  const [userProfile, setUserProfile] = useState<any>(getCurrentUser());
  const [achievements, setAchievements] = useState<any[]>([]);
  const [weekSummary, setWeekSummary] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const presetAvatars = ['👤', '👨', '👩', '🧑', '👦', '👧', '👨‍💼', '👩‍💼'];

  useEffect(() => {
    // 1. 获取真实用户
    const currentUser = getCurrentUser();
    setUserProfile(currentUser);
    setEditingProfile(currentUser);

    // 2. 获取统计数据 (保持原有的 Mock 数据逻辑)
    const achs = getAchievements();
    const summary = getWeekSummary();
    setAchievements(achs);
    setWeekSummary(summary);
  }, []);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      window.location.reload();
    }
  };

  // 真正的头像上传逻辑
  const handleAvatarUploadAPI = async (base64Image: string) => {
    if (userProfile?.isGuest) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: base64Image })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('current_user', JSON.stringify(data.user));
        setUserProfile(data.user);
        setEditingProfile(data.user);
        setAvatarDialogOpen(false);
        alert('头像修改成功');
      }
    } catch (error) {
      console.error(error);
      alert('上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // 调用上传 API
        handleAvatarUploadAPI(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // 辅助逻辑：显示名和头像
  const displayName = userProfile?.isGuest ? "游客" : (userProfile?.name || userProfile?.email?.split('@')[0] || "用户");
  
  const renderAvatarContent = () => {
    if (userProfile?.isGuest) return <span className="text-purple-600 text-2xl font-bold">游</span>;
    if (userProfile?.avatar?.startsWith('data:')) {
      return <img src={userProfile.avatar} alt="头像" className="w-full h-full object-cover" />;
    }
    return <span className="text-purple-600 text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>;
  };

  const userStats = [
    { label: '总锻炼', value: weekSummary?.totalWorkouts || '0', unit: '次' },
    { label: '总时长', value: Math.round((weekSummary?.totalMinutes || 0) / 60), unit: '小时' },
    { label: '总卡路里', value: Math.round((weekSummary?.totalCalories || 0) / 1000), unit: 'k kcal' },
  ];
  // --- 🔺 复制结束 ---

  const healthData = [
    { label: '身高', value: userProfile?.height || '-', unit: 'cm', icon: Activity },
    { label: '体重', value: userProfile?.weight || '-', unit: 'kg', icon: Activity },
    { label: 'BMI', value: userProfile?.height && userProfile?.weight ? (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1) : '-', unit: '', icon: Target },
    { label: '体脂率', value: '-', unit: '%', icon: Target },
    { label: '静息心率', value: '-', unit: 'bpm', icon: Heart },
    { label: '最大心率', value: '-', unit: 'bpm', icon: Heart },
  ];

  const handleMenuClick = (label: string) => {
    switch (label) {
      case '个人资料':
        setCurrentView('profile');
        break;
      case '成就中心':
        setCurrentView('achievements');
        break;
      case '健康数据':
        setCurrentView('health');
        break;
      case '应用设置':
        setCurrentView('settings');
        break;
    }
  };

  const renderMainView = () => (
    <>
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white/20">
            {/* 使用新的头像渲染函数 */}
            {renderAvatarContent()}
          </div>
          <div className="flex-1">
            {/* 使用新的 displayName */}
            <h2 className="text-white text-xl font-bold">{displayName}</h2>
            <p className="text-purple-100 text-sm">健身爱好者 · {userProfile?.isGuest ? '体验账号' : '认证会员'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {userStats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-white text-xl font-bold">{stat.value}</p>
              <p className="text-purple-100 text-xs mt-1">
                {stat.label} <span className="text-purple-200 ml-1">{stat.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Level Card */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-white">等级进度</span>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
            Lv.8
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">距离 Lv.9 还需</span>
            <span className="text-purple-400">1,240 XP</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          </div>
        </div>
      </Card>

      {/* Menu Sections */}
      <div className="space-y-3">
        <h3 className="text-slate-400 text-sm px-1">个人信息</h3>
        <Card className="bg-slate-800/50 border-purple-500/20 divide-y divide-slate-700/50">
          <div
            className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer"
            onClick={() => handleMenuClick('个人资料')}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-400" />
              <span className="text-white">个人资料</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div
            className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer"
            onClick={() => handleMenuClick('成就中心')}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-purple-400" />
              <span className="text-white">成就中心</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                12
              </Badge>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div
            className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer"
            onClick={() => handleMenuClick('健康数据')}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-purple-400" />
              <span className="text-white">健康数据</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-slate-400 text-sm px-1">设置</h3>
        <Card className="bg-slate-800/50 border-purple-500/20 divide-y divide-slate-700/50">
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <span className="text-white">通知提醒</span>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-400" />
              <span className="text-white">深色模式</span>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div
            className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer"
            onClick={() => handleMenuClick('应用设置')}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-400" />
              <span className="text-white">应用设置</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* Logout Button */}
      <button className="w-full bg-slate-800/50 border border-red-500/30 text-red-400 py-4 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
        <LogOut className="w-5 h-5" />
        退出登录
      </button>

      {/* Version */}
      <p className="text-center text-slate-500 text-sm">版本 1.0.0</p>
    </>
  );

  const renderProfileView = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentView('main')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl">个人资料</h1>
      </div>

      {/* Avatar Section */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-purple-500/30">
            {isUploading ? (
              <div className="animate-spin border-2 border-purple-600 border-t-transparent rounded-full w-8 h-8"></div>
            ) : (
              renderAvatarContent()
            )}
          </div>
          
          {!userProfile?.isGuest ? (
            <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <Edit className="w-4 h-4 mr-2" />
                  更换头像
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-purple-500/20 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>选择头像</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                   {/* 这里的预设头像暂不实现，重点是下面的上传 */}
                   <Button variant="outline" className="h-20 flex-col border-slate-600" onClick={() => alert('暂未开放')}>
                      预设头像
                   </Button>
                   <Button variant="outline" className="h-20 flex-col border-slate-600 hover:border-purple-500 hover:text-purple-400" onClick={triggerFileInput}>
                      <Camera size={24} className="mb-2"/>
                      上传照片
                   </Button>
                </div>
                {/* 隐藏的 Input */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-slate-500 text-sm">游客模式无法修改头像</p>
          )}
        </div>
      </Card>

      {/* Personal Info */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-6">
        <h3 className="text-white mb-4">基本信息</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-400">姓名</Label>
            <Input
              className="bg-slate-700/50 border-slate-600 text-white"
              value={editingProfile?.name || ''}
              onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
              placeholder="请输入你的姓名"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">性别</Label>
            <Input
              className="bg-slate-700/50 border-slate-600 text-white"
              value={editingProfile?.gender || ''}
              onChange={(e) => setEditingProfile({...editingProfile, gender: e.target.value})}
              placeholder="请输入性别"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">生日</Label>
            <Input
              className="bg-slate-700/50 border-slate-600 text-white"
              type="date"
              value={editingProfile?.birthday || ''}
              onChange={(e) => setEditingProfile({...editingProfile, birthday: e.target.value})}
            />
          </div>
        </div>
      </Card>

      {/* Body Metrics */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-6">
        <h3 className="text-white mb-4">身体数据</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-400">身高 (cm)</Label>
            <Input
              className="bg-slate-700/50 border-slate-600 text-white"
              type="number"
              value={editingProfile?.height || ''}
              onChange={(e) => setEditingProfile({...editingProfile, height: e.target.value})}
              placeholder="请输入身高"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">体重 (kg)</Label>
            <Input
              className="bg-slate-700/50 border-slate-600 text-white"
              type="number"
              value={editingProfile?.weight || ''}
              onChange={(e) => setEditingProfile({...editingProfile, weight: e.target.value})}
              placeholder="请输入体重"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400">腰围 (cm)</Label>
            <Input
              className="bg-slate-700/50 border-slate-600 text-white"
              type="number"
              value={editingProfile?.waistCircumference || ''}
              onChange={(e) => setEditingProfile({...editingProfile, waistCircumference: e.target.value})}
              placeholder="请输入腰围"
            />
          </div>
        </div>
      </Card>

      {/* Fitness Goal */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-6">
        <h3 className="text-white mb-4">健身目的</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-center p-4 rounded-lg border-2 border-purple-500 bg-purple-500/10 cursor-pointer transition-all">
              <input type="radio" name="fitness-goal" value="weight-loss" className="sr-only" defaultChecked />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">减脂塑形</span>
              </div>
            </label>
            <label className="flex items-center justify-center p-4 rounded-lg border-2 border-slate-600 bg-slate-700/30 hover:border-purple-500/50 cursor-pointer transition-all">
              <input type="radio" name="fitness-goal" value="muscle-gain" className="sr-only" />
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">增肌强壮</span>
              </div>
            </label>
            <label className="flex items-center justify-center p-4 rounded-lg border-2 border-slate-600 bg-slate-700/30 hover:border-purple-500/50 cursor-pointer transition-all">
              <input type="radio" name="fitness-goal" value="endurance" className="sr-only" />
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">提升耐力</span>
              </div>
            </label>
            <label className="flex items-center justify-center p-4 rounded-lg border-2 border-slate-600 bg-slate-700/30 hover:border-purple-500/50 cursor-pointer transition-all">
              <input type="radio" name="fitness-goal" value="health" className="sr-only" />
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">保持健康</span>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-6">
        <h3 className="text-white mb-4">联系方式</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <Mail className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-slate-400 text-xs">邮箱</p>
              <p className="text-white text-sm">{editingProfile?.contactEmail || '未设置'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <Phone className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-slate-400 text-xs">手机号</p>
              <Input
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
                value={editingProfile?.contactPhone || ''}
                onChange={(e) => setEditingProfile({...editingProfile, contactPhone: e.target.value})}
                placeholder="请输入手机号"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-slate-400 text-xs">地址</p>
              <Input
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
                value={editingProfile?.contactAddress || ''}
                onChange={(e) => setEditingProfile({...editingProfile, contactAddress: e.target.value})}
                placeholder="请输入地址"
              />
            </div>
          </div>
        </div>
      </Card>

      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6">
        保存修改
      </Button>
    </>
  );

  const renderAchievementsView = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentView('main')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-2xl">成就中心</h1>
          <p className="text-slate-400 text-sm">已解锁 {achievements.filter(a => a.unlocked).length} / {achievements.length} 个成就</p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-0 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">成就完成度</p>
            <p className="text-white text-2xl">{Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%</p>
          </div>
          <Trophy className="w-12 h-12 text-yellow-300" />
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`p-4 border transition-all ${
              achievement.unlocked
                ? 'bg-slate-800/50 border-purple-500/20'
                : 'bg-slate-800/30 border-slate-700/30 opacity-60'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-full ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                  : 'bg-slate-700'
              }`}>
                <achievement.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-white text-sm mb-1">{achievement.name}</h4>
                <p className="text-slate-400 text-xs">{achievement.description}</p>
                {achievement.unlocked && achievement.date && (
                  <p className="text-purple-400 text-xs mt-2">{achievement.date}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderHealthView = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentView('main')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl">健康数据</h1>
      </div>

      {/* Health Overview */}
      <Card className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-0 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-6 h-6 text-white" />
          <h3 className="text-white text-lg">健康状况</h3>
        </div>
        <p className="text-purple-100 text-sm">整体健康状况良好，请继续保持</p>
      </Card>

      {/* Health Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {healthData.map((data, index) => (
          <Card key={index} className="bg-slate-800/50 border-purple-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <data.icon className="w-4 h-4 text-purple-400" />
              <p className="text-slate-400 text-sm">{data.label}</p>
            </div>
            <p className="text-white text-2xl">
              {data.value}
              <span className="text-slate-400 text-sm ml-1">{data.unit}</span>
            </p>
          </Card>
        ))}
      </div>

      {/* Weekly Activity */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-white">本周活动</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-white text-sm">活动卡路里</p>
                <p className="text-slate-400 text-xs">本周累计</p>
              </div>
            </div>
            <p className="text-white">{weekSummary?.totalCalories || 0} kcal</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white text-sm">活跃时长</p>
                <p className="text-slate-400 text-xs">本周累计</p>
              </div>
            </div>
            <p className="text-white">{(weekSummary?.totalMinutes || 0) / 60} 小时</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white text-sm">训练次数</p>
                <p className="text-slate-400 text-xs">本周累计</p>
              </div>
            </div>
            <p className="text-white">{weekSummary?.totalWorkouts || 0} 次</p>
          </div>
        </div>
      </Card>

      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6">
        <Edit className="w-4 h-4 mr-2" />
        更新健康数据
      </Button>
    </>
  );

  const renderSettingsView = () => (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentView('main')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl">应用设置</h1>
      </div>

      {/* Notification Settings */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            通知设置
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">训练提醒</p>
              <p className="text-slate-400 text-xs">定时提醒你进行训练</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">成就通知</p>
              <p className="text-slate-400 text-xs">获得新成就时通知</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">每日总结</p>
              <p className="text-slate-400 text-xs">每天结束时发送总结</p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </div>
      </Card>

      {/* Sound Settings */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-400" />
            声音设置
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">音效</p>
              <p className="text-slate-400 text-xs">按钮点击音效</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">语音指导</p>
              <p className="text-slate-400 text-xs">训练时的语音提示</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            隐私与安全
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
            <span className="text-white text-sm">修改密码</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
            <span className="text-white text-sm">隐私政策</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
            <span className="text-white text-sm">用户协议</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="bg-slate-800/50 border-purple-500/20">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-400" />
            关于
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
            <span className="text-white text-sm">检查更新</span>
            <Badge className="bg-purple-500/20 text-purple-300 border-0">最新版本</Badge>
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
            <span className="text-white text-sm">帮助中心</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors cursor-pointer">
            <span className="text-white text-sm">意见反馈</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </Card>

      {/* Cache */}
      <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/30">
        清除缓存
      </Button>
    </>
  );

  return (
    <div className="p-6 space-y-6">
      {currentView === 'main' && renderMainView()}
      {currentView === 'profile' && renderProfileView()}
      {currentView === 'achievements' && renderAchievementsView()}
      {currentView === 'health' && renderHealthView()}
      {currentView === 'settings' && renderSettingsView()}
    </div>
  );
}