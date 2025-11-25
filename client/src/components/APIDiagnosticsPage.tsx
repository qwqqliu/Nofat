import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { testAPIConnection, testFitnessQuestion } from '../services/apiDiagnostics';

export function APIDiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleTestConnection = async () => {
    setIsLoading(true);
    const result = await testAPIConnection();
    setResults(prev => [{ test: 'API 连接测试', ...result, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    setIsLoading(false);
  };

  const handleTestFitnessQuestion = async () => {
    setIsLoading(true);
    const result = await testFitnessQuestion('怎样做好深蹲？');
    setResults(prev => [{ test: '健身问题测试', ...result, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    setIsLoading(false);
  };

  const handleClearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-white text-2xl">🔍 API 诊断工具</h1>
        <p className="text-slate-400">用于检查 OpenRouter API 连接状态</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleTestConnection}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              测试中...
            </>
          ) : (
            '测试 API 连接'
          )}
        </Button>

        <Button
          onClick={handleTestFitnessQuestion}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              测试中...
            </>
          ) : (
            '测试健身问题'
          )}
        </Button>

        {results.length > 0 && (
          <Button
            onClick={handleClearResults}
            variant="outline"
            className="w-full"
          >
            清空结果
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result, idx) => (
          <Card
            key={idx}
            className={`p-4 border ${
              result.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">{result.test}</h3>
                  <span className="text-xs text-slate-400">{result.timestamp}</span>
                </div>
                <p className={result.success ? 'text-green-300' : 'text-red-300'}>
                  {result.message}
                </p>

                {result.response && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-slate-400 text-sm hover:text-slate-300">
                      查看详细响应
                    </summary>
                    <pre className="mt-2 bg-slate-900/50 p-3 rounded text-xs overflow-auto max-h-60 text-slate-300">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </details>
                )}

                {result.error && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-red-400 text-sm hover:text-red-300">
                      查看错误详情
                    </summary>
                    <pre className="mt-2 bg-slate-900/50 p-3 rounded text-xs overflow-auto max-h-60 text-red-300">
                      {typeof result.error === 'string'
                        ? result.error
                        : JSON.stringify(result.error, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
          <p className="text-slate-400">点击上方按钮开始测试 API 连接</p>
        </Card>
      )}
    </div>
  );
}
