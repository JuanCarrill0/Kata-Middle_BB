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
  category: 'fullstack' | 'apis' | 'cloud' | 'data';
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
  createdAt: Date;
  updatedAt: Date;
}