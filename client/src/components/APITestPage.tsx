import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle, Loader, Copy } from 'lucide-react';

export function APITestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState('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');

  const testAPI = async () => {
    setTesting(true);
    setResult(null);

    try {
      console.log('测试 API 连接...');
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': '健身App-API测试',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'user',
              content: '你好',
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      });

      const data = await response.json();

      setResult({
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toLocaleString('zh-CN'),
      });

      if (response.ok && data.choices) {
        console.log('✅ API 成功');
      } else {
        console.error('❌ API 失败', data);
      }
    } catch (error) {
      setResult({
        error: String(error),
        timestamp: new Date().toLocaleString('zh-CN'),
      });
      console.error('❌ 错误:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-white text-2xl mb-2">🔧 API 诊断工具</h1>
        <p className="text-slate-400">检查 OpenRouter API 连接状态</p>
      </div>

      <Card className="bg-slate-800/50 border-purple-500/20 p-4 space-y-4">
        <div>
          <label className="text-white text-sm mb-2 block">API Key：</label>
          <textarea
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded text-sm font-mono"
            rows={3}
          />
        </div>

        <Button
          onClick={testAPI}
          disabled={testing || !apiKey.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {testing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              测试中...
            </>
          ) : (
            '开始测试'
          )}
        </Button>
      </Card>

      {result && (
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.ok || (result.data?.error?.code === 'invalid_api_key') ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="text-white font-semibold">
                {result.ok ? '✅ 连接成功' : `❌ 失败 (${result.status})`}
              </span>
            </div>

            <div className="text-sm space-y-2">
              <p className="text-slate-300">
                <span className="text-slate-400">状态码:</span> {result.status || 'N/A'}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">时间:</span> {result.timestamp}
              </p>
            </div>

            {result.error && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  {result.error}
                </AlertDescription>
              </Alert>
            )}

            {result.data?.error && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400 text-xs">
                  <div>错误代码: {result.data.error.code}</div>
                  <div>错误信息: {result.data.error.message}</div>
                </AlertDescription>
              </Alert>
            )}

            {result.data?.choices?.[0]?.message?.content && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400 text-xs">
                  <div>AI 回复: {result.data.choices[0].message.content}</div>
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4">
              <p className="text-slate-400 text-xs mb-2">完整响应：</p>
              <pre className="bg-slate-900 p-3 rounded text-xs overflow-auto max-h-48 text-slate-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <h3 className="text-white font-semibold mb-2">💡 常见问题</h3>
        <div className="space-y-2 text-sm text-blue-200">
          <p>
            <strong>invalid_api_key:</strong> API Key 无效或已过期，需要从 OpenRouter 获取新的密钥
          </p>
          <p>
            <strong>model_not_found:</strong> 模型不存在，检查模型名称是否正确
          </p>
          <p>
            <strong>网络错误:</strong> 检查网络连接或是否存在 CORS 问题
          </p>
        </div>
      </Card>
    </div>
  );
}
