export interface EarnedBy {
  user: string;
  earnedAt: string;
}

export interface ApiBadge {
  _id: string;
  name: string;
  description: string;
  image: string;
  course: { _id: string };
  earnedBy: EarnedBy[];
}

export interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface ApiHistory {
  userId: string;
  stats: {
    totalCourses: number;
    totalChapters: number;
    totalTime: number;
    byCategory: {
      category: string;
      count: number;
      lastCompleted: string;
    }[];
  };
  completions: {
    courseId: string;
    completedAt: string;
    category: string;
    timeSpent: number;
  }[];
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'teacher';
  badges: ApiBadge[];
  progress: {
    courseId: string;
    completedChapters: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}