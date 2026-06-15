import { useState } from "react";

import { ErrorPanel } from "../ErrorPanel";
import type { ErrorState } from "../types";

interface QuizQuestion {
  question_id: string;
  text: string;
  options: string[];
}

interface QuestionResult {
  question_id: string;
  correct: boolean;
  correct_answer: string;
}

interface QuizPanelProps {
  chapter_slug: string;
  chapter_title: string;
  questions: QuizQuestion[];
  total_questions: number;
  onSubmit: (answers: Record<string, string>) => void;
  error?: ErrorState;
}

interface QuizResultProps {
  chapter_slug: string;
  score: number;
  total: number;
  percentage: number;
  per_question: QuestionResult[];
  saved?: boolean;
  upgrade_url?: string | null;
  onViewProgress: () => void;
}

export function QuizPanel({
  chapter_slug,
  chapter_title,
  questions,
  total_questions,
  onSubmit,
  error,
}: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingAnswer, setEditingAnswer] = useState(false);

  if (error) {
    return <ErrorPanel error={error} />;
  }

  if (questions.length === 0) {
    return <QuizEmptyState chapterTitle={chapter_title} />;
  }

  const questionCount = total_questions || questions.length;
  const answeredCount = questions.filter(
    (question) => answers[question.question_id] !== undefined,
  ).length;
  const allAnswered = answeredCount === questions.length;
  const currentQuestion = questions[currentIndex] ?? questions[0];

  function handleOptionClick(questionId: string, option: string) {
    setAnswers((current) => ({ ...current, [questionId]: option }));
  }

  function handleContinue() {
    if (allAnswered) {
      setEditingAnswer(false);
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
    }
  }

  return (
    <main className="widget-shell">
      <section className="surface" aria-labelledby="quiz-title">
        <header className="surface-header">
          <p className="eyebrow">Knowledge check</p>
          <h1 id="quiz-title" className="title mt-1">
            {chapter_title || "Chapter quiz"}
          </h1>
          <p className="muted mt-1">{formatSlug(chapter_slug)}</p>
        </header>

        <div className="border-b border-zinc-200/80 px-4 py-3 sm:px-5 dark:border-zinc-700">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>
              {allAnswered
                ? "Ready to submit"
                : `Question ${currentIndex + 1} of ${questionCount}`}
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-zinc-800 transition-[width] duration-300 motion-reduce:transition-none dark:bg-zinc-100"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {allAnswered && !editingAnswer ? (
          <QuizSummary
            questions={questions}
            answers={answers}
            onEdit={(index) => {
              setCurrentIndex(index);
              setEditingAnswer(true);
            }}
            onSubmit={() => onSubmit(answers)}
          />
        ) : (
          <div className="p-4 sm:p-5">
            <fieldset>
              <legend className="text-base font-semibold leading-6 text-zinc-950 dark:text-zinc-50">
                {currentQuestion.text}
              </legend>
              <div className="mt-4 grid gap-2.5">
                {currentQuestion.options.map((option, index) => {
                  const selected =
                    answers[currentQuestion.question_id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        handleOptionClick(currentQuestion.question_id, option)
                      }
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800 dark:focus-visible:outline-zinc-200 ${
                        selected
                          ? "border-zinc-800 bg-zinc-100 text-zinc-950 dark:border-zinc-200 dark:bg-zinc-800 dark:text-zinc-50"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
                      }`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          selected
                            ? "border-zinc-800 bg-zinc-800 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                            : "border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="pt-0.5 leading-5">{option}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                className="button-secondary"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => index - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={answers[currentQuestion.question_id] === undefined}
                onClick={handleContinue}
              >
                {allAnswered ? "Save answer" : "Continue"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function QuizSummary({
  questions,
  answers,
  onEdit,
  onSubmit,
}: {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  onEdit: (index: number) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="p-4 sm:p-5">
      <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Review your answers
      </h2>
      <p className="muted mt-1">You can edit an answer before submitting.</p>
      <ol className="mt-4 grid gap-2">
        {questions.map((question, index) => (
          <li key={question.question_id}>
            <button
              type="button"
              onClick={() => onEdit(index)}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-200"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {question.text}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {answers[question.question_id]}
                </span>
              </span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Edit
              </span>
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="button-primary mt-5 w-full" onClick={onSubmit}>
        Submit quiz
      </button>
    </div>
  );
}

export function QuizResult({
  chapter_slug,
  score,
  total,
  percentage,
  per_question,
  saved = false,
  upgrade_url,
  onViewProgress,
}: QuizResultProps) {
  const passed = percentage >= 70;

  return (
    <main className="widget-shell">
      <section className="surface" aria-labelledby="result-title">
        <header className="surface-header">
          <p className="eyebrow">Quiz complete</p>
          <h1 id="result-title" className="title mt-1">
            {formatSlug(chapter_slug)}
          </h1>
        </header>

        <div className="p-4 sm:p-5">
          <div
            className={`rounded-2xl border p-5 text-center ${
              passed
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
                : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
            }`}
          >
            <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {score}/{total}
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                passed
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-amber-900 dark:text-amber-200"
              }`}
            >
              {percentage.toFixed(1)}% · {passed ? "Passed" : "Keep learning"}
            </p>
          </div>

          <h2 className="mt-5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Answer breakdown
          </h2>
          <ul className="mt-2 grid gap-2">
            {per_question.map((result, index) => (
              <li
                key={result.question_id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <ResultIcon correct={result.correct} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Question {index + 1}
                  </p>
                  {!result.correct && (
                    <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Correct answer: {result.correct_answer}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {saved ? (
            <button
              type="button"
              className="button-primary mt-5 w-full"
              onClick={onViewProgress}
            >
              View progress
            </button>
          ) : upgrade_url ? (
            <a
              className="button-primary mt-5 w-full"
              href={upgrade_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Upgrade to save progress
            </a>
          ) : (
            <p className="muted mt-5 text-center">
              Upgrade to Premium to save this score.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function QuizEmptyState({ chapterTitle }: { chapterTitle: string }) {
  return (
    <main className="widget-shell">
      <section className="surface px-5 py-10 text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          No quiz questions available
        </p>
        <p className="muted mt-1">
          {chapterTitle
            ? `The quiz for ${chapterTitle} is not ready yet.`
            : "This quiz is not ready yet."}
        </p>
      </section>
    </main>
  );
}

function ResultIcon({ correct }: { correct: boolean }) {
  return (
    <span
      aria-label={correct ? "Correct" : "Incorrect"}
      className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
        correct
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {correct ? "✓" : "×"}
    </span>
  );
}

function formatSlug(slug: string): string {
  if (!slug) {
    return "Chapter quiz";
  }
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
