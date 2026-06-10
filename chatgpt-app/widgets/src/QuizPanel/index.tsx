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
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  if (error) {
    return <ErrorPanel error={error} />;
  }

  const allAnswered = Object.keys(answers).length === total_questions;
  const currentQuestion = questions[currentIndex];

  function handleOptionClick(questionId: string, option: string) {
    if (answered.has(questionId)) return;

    const newAnswers = { ...answers, [questionId]: option };
    const newAnswered = new Set(answered).add(questionId);

    setAnswers(newAnswers);
    setAnswered(newAnswered);

    // Auto-advance if not on the last question
    if (currentIndex < total_questions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handleSubmit() {
    onSubmit(answers);
  }

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 640,
        margin: "0 auto",
        padding: "1.5rem",
      }}
    >
      <h2 style={{ marginBottom: "0.25rem" }}>Quiz: {chapter_title}</h2>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Chapter: {chapter_slug}
      </p>

      {!allAnswered ? (
        <div>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
            Question {currentIndex + 1} of {total_questions}
          </p>
          <p style={{ fontWeight: 600, marginBottom: "1rem" }}>
            {currentQuestion.text}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.question_id] === option;
              return (
                <li key={option} style={{ marginBottom: "0.5rem" }}>
                  <button
                    onClick={() => handleOptionClick(currentQuestion.question_id, option)}
                    disabled={answered.has(currentQuestion.question_id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.375rem",
                      border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                      background: isSelected ? "#eff6ff" : "#fff",
                      cursor: answered.has(currentQuestion.question_id) ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {isSelected && <span style={{ color: "#3b82f6" }}>&#10003;</span>}
                    {option}
                    {isSelected && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#3b82f6" }}>
                        Answer recorded
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: "1rem" }}>Quiz Summary</h3>
          <p style={{ marginBottom: "1rem", color: "#374151" }}>
            You answered all {total_questions} questions.
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.5rem" }}>
            {questions.map((q, idx) => (
              <li
                key={q.question_id}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  marginBottom: "0.5rem",
                  background: "#f9fafb",
                }}
              >
                <span style={{ fontWeight: 600 }}>Q{idx + 1}:</span>{" "}
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>{q.text}</span>
                <br />
                <span style={{ fontSize: "0.875rem" }}>
                  Your answer:{" "}
                  <strong>{answers[q.question_id]}</strong>{" "}
                  <span style={{ color: "#3b82f6" }}>&#10003;</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubmit}
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export function QuizResult({
  chapter_slug,
  score,
  total,
  percentage,
  per_question,
  onViewProgress,
}: QuizResultProps) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 640,
        margin: "0 auto",
        padding: "1.5rem",
      }}
    >
      <h2 style={{ marginBottom: "0.5rem" }}>Quiz Results</h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Chapter: {chapter_slug}</p>

      <div
        style={{
          background: percentage >= 70 ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${percentage >= 70 ? "#86efac" : "#fca5a5"}`,
          borderRadius: "0.5rem",
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: percentage >= 70 ? "#16a34a" : "#dc2626" }}>
          {score}/{total}
        </p>
        <p style={{ color: "#374151", marginTop: "0.25rem" }}>
          {percentage.toFixed(1)}%
        </p>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.5rem" }}>
        {per_question.map((result, idx) => (
          <li
            key={result.question_id}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              marginBottom: "0.5rem",
              background: result.correct ? "#f0fdf4" : "#fef2f2",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontWeight: 600 }}>Q{idx + 1}</span>
            <span style={{ color: result.correct ? "#16a34a" : "#dc2626", fontSize: "1.25rem" }}>
              {result.correct ? "✓" : "✗"}
            </span>
            {!result.correct && (
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Correct answer: <strong>{result.correct_answer}</strong>
              </span>
            )}
          </li>
        ))}
      </ul>

      <button
        onClick={onViewProgress}
        style={{
          background: "#6b7280",
          color: "#fff",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.375rem",
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        View Progress
      </button>
    </div>
  );
}
