import { Schema, model, Document } from 'mongoose';

export interface IHistory extends Document {
  user: Schema.Types.ObjectId;
  course: Schema.Types.ObjectId;
  completedAt: Date;
  completedChapters: {
    chapterId: Schema.Types.ObjectId;
    completedAt: Date;
    title: string;
  }[];
  totalTime?: number; // tiempo total en minutos
  category: string;
}

const historySchema = new Schema<IHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    completedChapters: [{
      chapterId: Schema.Types.ObjectId,
      completedAt: Date,
      title: String,
    }],
    totalTime: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas eficientes
historySchema.index({ user: 1, completedAt: -1 });
historySchema.index({ user: 1, course: 1 }, { unique: true });

export const History = model<IHistory>('History', historySchema);