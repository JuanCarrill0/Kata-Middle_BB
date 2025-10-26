import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: 'fullstack' | 'apis' | 'cloud' | 'data';
  chapters: {
    title: string;
    description: string;
    content: {
      type: 'video' | 'pdf' | 'presentation';
      url: string;
    }[];
  }[];
  badge: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['fullstack', 'apis', 'cloud', 'data'],
      required: true,
    },
    chapters: [{
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      content: [{
        type: {
          type: String,
          enum: ['video', 'pdf', 'presentation'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      }],
    }],
    badge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Course = model<ICourse>('Course', courseSchema);