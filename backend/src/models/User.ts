import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'teacher';
  progress: {
    courseId: Schema.Types.ObjectId;
    completedChapters: Schema.Types.ObjectId[];
  }[];
  completedCourses: Schema.Types.ObjectId[];
  badges: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'teacher'],
      default: 'user',
    },
    progress: [{
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    completedChapters: [{
      type: Schema.Types.ObjectId,
      required: true
    }]
  }],
  completedCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    badges: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    }],
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);