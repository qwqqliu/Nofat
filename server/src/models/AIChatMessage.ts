import mongoose from 'mongoose';

export interface IAIChatMessage {
  _id?: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string; // base64 encoded image if present
  createdAt: Date;
}

const AIChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, '用户ID不能为空'],
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: [true, '消息内容不能为空'],
    },
    imageData: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // 添加索引以提高查询性能
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false, // 聊天消息不需要更新时间
    },
  }
);

// 添加复合索引用于快速查询特定用户的聊天记录
AIChatMessageSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IAIChatMessage>('AIChatMessage', AIChatMessageSchema);
