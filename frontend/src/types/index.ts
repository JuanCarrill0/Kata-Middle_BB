export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  courseId: string;
  earnedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  // module may be returned as an Object (populated) or just an id string
  module?: string | { id: string; name: string };
  category?: 'fullstack' | 'apis' | 'cloud' | 'data';
  chapters: Chapter[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  content: {
    type: 'video' | 'pdf' | 'presentation' | 'image';
    url: string;
  }[];
  order: number;
  isCompleted?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'teacher';
  badges: Badge[];
  progress: {
    courseId: string;
    completedChapters: string[];
  }[];
  // Subscribed module names (category strings)
  subscribedModules?: string[];
  // In-app notifications
  notifications?: {
    _id?: string;
    message: string;
    link?: string;
    module?: string;
    course?: string;
    read?: boolean;
    createdAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface History {
  userId: string;
  stats: {
    totalCourses: number;
    totalChapters: number;
    totalTime: number;
    byCategory: {
      category: string;
      count: number;
      lastCompleted: Date;
    }[];
  };
  completions: {
    courseId: string;
    completedAt: Date;
    category: string;
    timeSpent: number;
  }[];
}