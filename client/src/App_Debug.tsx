import React from 'react';

export default function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1e293b',
      color: 'white',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
        调试页面
      </h1>
      <p style={{ fontSize: '16px' }}>
        如果您看到这个页面，说明基础React工作正常
      </p>
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        background: '#374151',
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        当前时间: {new Date().toLocaleString()}
      </div>
    </div>
  );
}