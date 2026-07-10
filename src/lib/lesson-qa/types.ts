export interface LessonQuestionAuthor {
  id: string;
  nama: string;
  role: string;
}

export interface LessonQuestionReply {
  id: string;
  questionId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  isMine?: boolean;
  user: LessonQuestionAuthor;
}

export interface LessonQuestion {
  id: string;
  lessonId: string;
  content: string;
  timestampSeconds: number | null;
  isPinned: boolean;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  user: LessonQuestionAuthor;
  replies: LessonQuestionReply[];
}
