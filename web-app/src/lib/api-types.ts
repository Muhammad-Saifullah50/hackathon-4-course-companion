export interface ChapterSummary {
  slug: string;
  title: string;
  order: number;
}

export interface ChapterDetail extends ChapterSummary {
  content: string;
  next_slug: string | null;
  prev_slug: string | null;
}

export interface AnswerOption {
  label: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: AnswerOption[];
}

export interface QuizPublic {
  chapter_slug: string;
  questions: QuizQuestion[];
}

export interface GradedResult {
  question_id: string;
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
}

export interface ProgressEntry {
  chapter_slug: string;
  completed_at: string;
  quiz_score: number | null;
}

export interface ProgressResponse {
  user_id: string;
  completions: ProgressEntry[];
  current_streak: number;
  last_active_date: string | null;
}

export interface CompletionResponse {
  user_id: string;
  chapter_slug: string;
  completed_at: string;
  quiz_score: number | null;
  current_streak: number;
}

export interface UserProfile {
  id: string;
  email: string;
  access_tier: string;
  created_at: string;
}

export interface AuthSession {
  user_id: string;
  email: string;
  expires_at: string | null;
}

export interface AccessStatus {
  tier: string;
  resource: string | null;
  allowed: boolean;
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}
