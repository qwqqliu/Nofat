import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Send, Loader, Trash2, MessageCircle, Mic, MicOff, Camera, Upload, X } from 'lucide-react';
import { askAIQuestion } from '../services/aiService';
import { getUserProfile, addAIChatMessage, getAIChatHistory, clearAIChatHistory } from '../services/dataService';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function AIChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // 初始化语音识别
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'zh-CN';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue((prev) => prev + transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // 加载聊天历史
  useEffect(() => {
    const history = getAIChatHistory();
    setMessages(history);
    scrollToBottom();
  }, []);

  // 自动滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // 开始/停止语音录音
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputValue('');
      recognitionRef.current.start();
    }
  };

  // 打开相机拍照
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      alert('无法访问摄像头');
    }
  };

  // 拍照
  const takePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setSelectedImage(imageData);
        stopCamera();
      }
    }
  };

  // 停止相机
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 发送消息（包括图片）
  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    // 添加用户消息
    const messageContent = inputValue || '（上传了图片）';
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      imageData: selectedImage || undefined,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    addAIChatMessage('user', messageContent);
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const profile = getUserProfile();
      
      // 构建请求内容
      let requestContent = messageContent;
      if (selectedImage) {
        requestContent = `用户上传了一张图片，并询问：${messageContent || '请分析这张图片'}\n\n请根据图片内容提供详细的分析和建议。`;
      }

      const response = await askAIQuestion(requestContent, {
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        goal: profile.goal,
        level: profile.level,
      });

      // 添加AI回复
      const aiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      addAIChatMessage('assistant', response);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，我暂时无法处理您的请求。请稍后重试。',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有聊天记录吗？')) {
      clearAIChatHistory();
      setMessages([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isCameraActive = videoRef.current?.srcObject !== undefined && videoRef.current?.srcObject !== null;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-400" />
            健身AI助手
          </h1>
          <p className="text-slate-400 text-sm">专业教练 | 营养师 | 医生</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearHistory}
            className="bg-red-500/20 border-red-400/50 text-red-200 hover:bg-red-500/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空记录
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 bg-slate-800/50 border-purple-500/20 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageCircle className="w-16 h-16 text-purple-400/30 mb-4" />
                <p className="text-slate-400 text-lg mb-2">开始与AI交流</p>
                <p className="text-slate-500 text-sm max-w-md">
                  我是您的专业健身教练、营养师和医生。您可以询问关于健身训练、营养建议、动作教学，还可以上传照片让我分析食物热量或纠正您的运动姿态。
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      {msg.imageData && (
                        <img src={msg.imageData} alt="用户上传的图片" className="w-full rounded mb-2 max-h-48 object-cover" />
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI正在思考...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          {/* Image Preview */}
          {selectedImage && (
            <div className="relative">
              <img src={selectedImage} alt="预览" className="w-full rounded max-h-40 object-cover" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-red-500 p-1.5 rounded-full text-white hover:bg-red-600 shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Camera View */}
          {isCameraActive && (
            <div className="relative">
              <video ref={videoRef} autoPlay className="w-full rounded max-h-40 object-cover" />
              <canvas ref={canvasRef} className="hidden" width={320} height={240} />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={takePhoto}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  拍照
                </Button>
                <Button
                  onClick={stopCamera}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题或点击语音/相机..."
              disabled={isLoading || isCameraActive}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
            <Button
              onClick={toggleVoiceInput}
              disabled={isLoading || isCameraActive}
              className={`${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
              size="icon"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={startCamera}
              disabled={isLoading || isCameraActive}
              className="bg-slate-700 hover:bg-slate-600 text-white"
              size="icon"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isCameraActive}
              className="bg-slate-700 hover:bg-slate-600 text-white"
              size="icon"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && !selectedImage) || isCameraActive}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-slate-500">提示：支持语音输入、拍照、图片上传。您可以上传食物照片让AI计算热量和营养，或上传动作视频让AI纠正姿态</p>
        </div>
      </Card>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <Card className="bg-slate-800/30 border-purple-500/20 p-4">
          <p className="text-slate-300 text-sm mb-3">💡 快速提问示例：</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              '怎样正确做深蹲？',
              '这个食物的热量多少？',
              '健身后应该如何饮食？',
              '帮我分析这个动作',
            ].map((question, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputValue(question);
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="text-left text-sm text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 p-2 rounded transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
