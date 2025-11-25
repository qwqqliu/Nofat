import mongoose from 'mongoose';

export interface IAIPlan {
  _id?: string;
  userId: string;
  name: string;
  goal: string;
  level: string;
  frequency: string;
  duration: string;
  planData: Record<string, any>; // 完整的计划数据（JSON格式）
  createdAt: Date;
  updatedAt: Date;
}

const AIPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, '用户ID不能为空'],
      index: true,
    },
    name: {
      type: String,
      required: [true, '计划名称不能为空'],
    },
    goal: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    planData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAIPlan>('AIPlan', AIPlanSchema);
