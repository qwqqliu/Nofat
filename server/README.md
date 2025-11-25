# 健身App后端 API

这是一个商用级别的健身应用后端服务，建立在 Node.js/Express + MongoDB 上。

## 功能特性

- ✅ 用户认证（注册/登录/JWT）
- ✅ AI定制计划保存和管理
- ✅ 聊天记录持久化存储
- ✅ 基于索引的高效查询
- ✅ 生产级错误处理
- ✅ CORS支持

## 快速开始

### 前置要求

- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env` 文件（参考 `.env.example`）：

```env
MONGODB_URI=mongodb://localhost:27017/fitness_app
JWT_SECRET=your_secure_secret_key_here
PORT=5000
NODE_ENV=development
```

### 开发模式

```bash
npm run dev
```

服务器将运行在 `http://localhost:5000`

### 生产构建

```bash
npm run build
npm start
```

## API 端点

### 认证 (`/api/auth`)

- `POST /register` - 注册新用户
- `POST /login` - 用户登录
- `GET /me` - 获取当前用户信息

### 计划 (`/api/plans`)

- `GET /` - 获取用户所有计划
- `GET /:id` - 获取单个计划详情
- `POST /` - 创建新计划
- `DELETE /:id` - 删除计划

### 聊天 (`/api/chat`)

- `GET /` - 获取聊天历史（支持分页）
- `POST /` - 保存聊天消息
- `DELETE /` - 清空所有聊天记录
- `DELETE /:id` - 删除单条消息

## 数据库Schema

### User
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  contactPhone: String,
  contactAddress: String,
  createdAt: Date,
  updatedAt: Date
}
```

### AIPlan
```javascript
{
  userId: String (indexed),
  name: String,
  goal: String,
  level: String,
  frequency: String,
  duration: String,
  planData: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### AIChatMessage
```javascript
{
  userId: String (indexed),
  role: String ('user' | 'assistant'),
  content: String,
  imageData: String (base64, optional),
  createdAt: Date
}
```
- 复合索引：(userId, createdAt)

## 安全特性

- ✅ 密码加密（bcryptjs）
- ✅ JWT令牌认证
- ✅ 30天自动过期
- ✅ 用户数据隔离
- ✅ CORS保护

## 支持

有问题？请提交issue或联系开发团队。
