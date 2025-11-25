import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Image as ImageIcon, Camera, Trash2, Loader2, X, MessageSquare, Bot } from 'lucide-react';

import { API_BASE_URL } from '../services/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getToken = () => localStorage.getItem('auth_token');

  const fetchHistory = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSend = async (overrideContent?: string) => {
    const contentToSend = overrideContent || input;
    if ((!contentToSend.trim() && !selectedImage) || isLoading) return;
    
    const token = getToken();
    if (!token) return alert('请先登录');

    const newMessage: Message = { role: 'user', content: contentToSend, imageUrl: selectedImage };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newMessage),
      });

      if (res.ok) {
        const aiMsg = await res.json();
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ 发送失败，请稍后重试。' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 网络错误。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('确定要清空所有聊天记录吗？')) return;
    const token = getToken();
    await fetch(`${API_BASE_URL}/chat/history`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setMessages([]);
  };

  // --- 语音逻辑 ---
  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setInput(prev => prev + finalTranscript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  };

  const startListening = (e: any) => { e.preventDefault(); recognitionRef.current?.start(); setIsRecording(true); };
  const stopListening = (e: any) => { e.preventDefault(); recognitionRef.current?.stop(); setIsRecording(false); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const quickPrompts = ["怎样正确做深蹲?", "这个食物的热量多少?", "健身后应该如何饮食?", "帮我分析这个动作"];

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-600/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            {/* 👇 修改点：名字只叫 Nofat，字体稍微调大了点 */}
            <h1 className="font-bold text-white text-lg tracking-wide">Nofat</h1>
            {/* 👇 修改点：原本的“专业教练...”删掉了，换成了一句简单的 slogan，或者你可以直接删掉这行 P 标签 */}
            <p className="text-[10px] text-purple-200 opacity-60">Always be with you</p>
          </div>
        </div>
        <button onClick={handleClear} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-full transition-colors">
          <Trash2 size={18} />
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-purple-500/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center pb-10 animate-fade-in">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-purple-500/30">
              <MessageSquare className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">开始与AI交流</h2>
            <p className="text-slate-400 text-sm text-center max-w-xs leading-relaxed mb-8">
              您的对话和AI生成的计划都会被永久保存。试试上传照片分析热量？
            </p>
            <div className="w-full space-y-2">
               {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full py-3 px-4 bg-slate-800/50 hover:bg-purple-600/20 border border-purple-500/10 hover:border-purple-500/40 rounded-xl text-sm text-left text-slate-300 transition-all active:scale-[0.99]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-slate-700/80 text-slate-100 border border-purple-500/10 rounded-tl-none'}`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} className="w-full max-h-60 object-cover rounded-lg mb-2" alt="upload" />
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="flex items-center gap-2 text-purple-400 text-xs pl-2"><Loader2 className="animate-spin" size={12} /> 思考中...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="shrink-0 p-5 pb-6 bg-slate-800/90 border-t border-purple-500/20 backdrop-blur relative">
        
        {selectedImage && (
          <div className="absolute bottom-full left-4 mb-2 p-1 bg-slate-800 border border-purple-500/50 rounded-lg shadow-xl">
            <img src={selectedImage} className="h-16 w-16 object-cover rounded-md" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={12} /></button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="输入问题..."
            rows={1}
            className="flex-1 bg-slate-900/50 border border-purple-500/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none min-h-[46px] max-h-32"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* 语音 */}
            <button
              onMouseDown={startListening} onMouseUp={stopListening} onMouseLeave={stopListening}
              onTouchStart={startListening} onTouchEnd={stopListening}
              className={`p-3 rounded-xl transition-all border border-white/5 ${isRecording ? 'bg-red-500 text-white scale-110 shadow-lg' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
            >
              <Mic size={20} />
            </button>

            {/* 相机按钮：带 capture 属性，优先调起相机 */}
            <label className="p-3 bg-slate-700/50 hover:bg-slate-600 border border-white/5 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all">
              <Camera size={20} />
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" // 👈 核心：这个属性让手机端直接开摄像头
                className="hidden" 
                style={{display:'none'}} 
                onChange={handleImageUpload} 
              />
            </label>

            {/* 上传按钮：无 capture 属性，优先调起相册 */}
            <label className="p-3 bg-slate-700/50 hover:bg-slate-600 border border-white/5 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all">
              <ImageIcon size={20} />
              <input 
                type="file" 
                accept="image/*" 
                // 👈 核心：这里没有 capture，所以打开相册
                className="hidden" 
                style={{display:'none'}} 
                onChange={handleImageUpload} 
              />
            </label>

            {/* 发送 */}
            <button onClick={() => handleSend()} className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95">
              <Send size={20} />
            </button>
          </div>
        </div>
        {isRecording && <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg">正在录音...</div>}
      </div>
    </div>
  );
}