import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, Dumbbell, Target, Zap, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../services/config';

export function AICustomPlanPage() {
  const [goal, setGoal] = useState('loss'); // loss, muscle, endurance
  const [level, setLevel] = useState('beginner'); // beginner, intermediate, advanced
  const [days, setDays] = useState(3);
  const [equipment, setEquipment] = useState('home'); // home, gym
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // 1. 构建专业的 Prompt
    const prompt = `请为我定制一个专业的健身计划。
    - 我的目标：${goal === 'loss' ? '减脂' : goal === 'muscle' ? '增肌' : '增强耐力'}
    - 当前水平：${level === 'beginner' ? '新手' : level === 'intermediate' ? '进阶' : '专业'}
    - 每周锻炼：${days} 天
    - 锻炼场所：${equipment === 'home' ? '在家 (无器械/小器械)' : '健身房 (器械齐全)'}
    
    请按以下格式输出：
    1. 🎯 核心目标分析
    2. 📅 周计划表 (周一到周日)
    3. 🥗 饮食建议重点
    4. ⚠️ 注意事项`;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('请先登录');
        setIsGenerating(false);
        return;
      }

      // 2. 调用发送消息接口
      const res = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: prompt }),
      });

      if (res.ok) {
        // 3. 生成成功后，跳转到聊天页面看结果
        // 触发自定义事件切换 Tab
        (window as any).dispatchEvent(new CustomEvent('changeTab', { detail: 'chat' }));
      } else {
        alert('生成失败，请检查网络');
      }
    } catch (e) {
      console.error(e);
      alert('生成出错');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-full pb-24 p-4 space-y-6 animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => (window as any).dispatchEvent(new CustomEvent('changeTab', { detail: 'home' }))}
          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-white text-xl font-bold">AI 定制计划</h1>
      </div>

      <div className="space-y-1 text-slate-400 text-sm">
        <p>Nofat AI 将根据您的身体数据和目标，</p>
        <p>为您量身打造未来4周的专属训练方案。</p>
      </div>

      {/* 1. 选择目标 */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-5 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" /> 第一步：您的目标是？
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'loss', label: '减脂瘦身', icon: '🔥' },
            { id: 'muscle', label: '增肌塑形', icon: '💪' },
            { id: 'endurance', label: '增强体能', icon: '🏃' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setGoal(item.id)}
              className={`p-3 rounded-xl border text-sm flex flex-col items-center gap-2 transition-all ${
                goal === item.id 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
                  : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 2. 选择场所 & 频率 */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-5 space-y-6">
        <div className="space-y-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-400" /> 锻炼场所
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setEquipment('home')}
              className={`flex-1 py-3 rounded-xl border text-sm transition-all ${
                equipment === 'home' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700/30 border-slate-600 text-slate-400'
              }`}
            >
              🏠 在家训练
            </button>
            <button
              onClick={() => setEquipment('gym')}
              className={`flex-1 py-3 rounded-xl border text-sm transition-all ${
                equipment === 'gym' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700/30 border-slate-600 text-slate-400'
              }`}
            >
              🏋️ 健身房
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" /> 当前水平
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['beginner', 'intermediate', 'advanced'].map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`py-2 rounded-lg text-xs border transition-all ${
                  level === l ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-700/30 border-slate-600 text-slate-400'
                }`}
              >
                {l === 'beginner' ? '零基础' : l === 'intermediate' ? '有经验' : '专业'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> 每周频次: <span className="text-yellow-400 text-lg">{days} 天</span>
          </h3>
          <input 
            type="range" min="1" max="7" step="1" 
            value={days} 
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400" 
          />
          <div className="flex justify-between text-xs text-slate-500 px-1">
            <span>佛系 (1天)</span>
            <span>狂热 (7天)</span>
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <Button 
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-900/40 rounded-2xl transition-all active:scale-[0.98]"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <Sparkles className="animate-spin" /> Nofat 正在思考方案...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            生成专属计划 <ArrowRight />
          </span>
        )}
      </Button>
    </div>
  );
}