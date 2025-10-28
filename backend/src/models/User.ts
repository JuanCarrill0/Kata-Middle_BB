import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'teacher';
  progress: {
    courseId: Schema.Types.ObjectId;
    completedChapters: string[];
  }[];
  completedCourses: Schema.Types.ObjectId[];
  badges: Schema.Types.ObjectId[];
  // Modules (categories) the user is subscribed to for in-app notifications
  subscribedModules?: string[];
  // In-app notifications
  notifications?: {
    message: string;
    link?: string;
    module?: string;
    course?: Schema.Types.ObjectId;
    read?: boolean;
    createdAt?: Date;
  }[];
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
        required: true,
      },
      completedChapters: [{ type: String }],
    }],
  completedCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    badges: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    }],
  subscribedModules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    notifications: [{
      message: { type: String, required: true },
      link: { type: String },
      module: { type: String },
      course: { type: Schema.Types.ObjectId, ref: 'Course' },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],
    // (course progress stored in `progress` above)
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);