/**
 * Widget prop type interfaces for Claude Teacher ChatGPT visual panels.
 * Each widget corresponds to one or two MCP tools.
 */

// ── Shared ─────────────────────────────────────────────────────────────────

export interface PanelAction {
  label: string;
  /** MCP tool name to invoke when the button is clicked */
  tool: string;
  /** Arguments to pass to the tool */
  args: Record<string, unknown>;
}

export interface ErrorState {
  message: string; // Always: "Service unavailable, please try again"
}

// ── ChapterList ──────────────────────────────────────────────────────────────

export interface ChapterSummary {
  slug: string;
  title: string;
  chapter_number: number;
  completed: boolean;
}

export interface ChapterListProps {
  chapters: ChapterSummary[];
  /** Called when user clicks a chapter row — triggers get_chapter tool */
  onSelectChapter: (slug: string) => void;
  error?: ErrorState;
}

// ── ChapterReader ────────────────────────────────────────────────────────────

export interface ChapterReaderProps {
  slug: string;
  title: string;
  /** Full chapter markdown rendered as HTML */
  content_html: string;
  chapter_number: number;
  next_slug: string | null;
  prev_slug: string | null;
  has_quiz: boolean;
  /** Called when user clicks "Next Chapter" or "Prev Chapter" */
  onNavigate: (slug: string) => void;
  /** Called when user clicks "Take Quiz" — triggers get_quiz tool */
  onStartQuiz: (chapter_slug: string) => void;
  error?: ErrorState;
}

// ── QuizPanel ────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question_id: string;
  text: string;
  options: string[]; // 2–4 options
}

export interface QuizPanelProps {
  chapter_slug: string;
  chapter_title: string;
  questions: QuizQuestion[];
  total_questions: number;
  /** Called with final answers map when user submits — triggers submit_quiz tool */
  onSubmit: (answers: Record<string, string>) => void;
  error?: ErrorState;
}

export interface QuestionResult {
  question_id: string;
  correct: boolean;
  correct_answer: string;
}

export interface QuizResultProps {
  chapter_slug: string;
  score: number;
  total: number;
  percentage: number;
  per_question: QuestionResult[];
  /** Called when user clicks "View Progress" — triggers get_progress tool */
  onViewProgress: () => void;
}

// ── ProgressDashboard ────────────────────────────────────────────────────────

export interface ChapterProgressItem {
  slug: string;
  title: string;
  completed: boolean;
  quiz_score: number | null;
}

export interface ProgressDashboardProps {
  user_id: string;
  current_streak: number;
  completion_percentage: number;
  total_chapters: number;
  completed_chapters: number;
  chapter_list: ChapterProgressItem[];
  /** Called when user clicks a chapter in the list — triggers get_chapter tool */
  onSelectChapter: (slug: string) => void;
  error?: ErrorState;
}

// ── SearchResults ────────────────────────────────────────────────────────────

export interface SearchResult {
  chapter_slug: string;
  chapter_title: string;
  excerpt: string;
}

export interface SearchResultsProps {
  query: string;
  total_matches: number;
  results: SearchResult[];
  /** Called when user clicks "Read Chapter" on a result — triggers get_chapter tool */
  onSelectChapter: (slug: string) => void;
  error?: ErrorState;
}

// ── AccessStatus ─────────────────────────────────────────────────────────────

export type AccessTier = "free" | "premium";

export interface AccessStatusProps {
  user_id: string;
  tier: AccessTier;
  is_premium: boolean;
  /** Present for free-tier users; null for premium */
  upgrade_url: string | null;
  error?: ErrorState;
}
