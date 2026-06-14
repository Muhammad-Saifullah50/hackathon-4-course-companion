"use client";

import { CheckCircle2, LogIn, RotateCcw, Save, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Spinner } from "@/components/loading-ui";
import type { GradedResult, QuizPublic } from "@/lib/api-types";
import { submitAnswer } from "@/lib/client-api";

type Phase = "intro" | "quiz" | "results";
interface Answer {
  selected: string;
  result: GradedResult;
}

export function QuizRunner({
  quiz,
  title,
  order,
  authenticated,
}: {
  quiz: QuizPublic;
  title: string;
  order: number;
  authenticated: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [grading, setGrading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const question = quiz.questions[current];
  const answer = answers[current];

  function start() {
    setPhase("quiz");
    setCurrent(0);
    setSelected("");
    setAnswers([]);
    setSaved(false);
    setError("");
  }

  async function check() {
    if (!selected) return;
    setGrading(true);
    setError("");
    try {
      const result = await submitAnswer(quiz.chapter_slug, question.id, selected);
      setAnswers((existing) => [...existing, { selected, result }]);
    } catch {
      setError("This answer could not be graded. Please try again.");
    } finally {
      setGrading(false);
    }
  }

  function next() {
    if (current === quiz.questions.length - 1) {
      setPhase("results");
    } else {
      setCurrent((value) => value + 1);
      setSelected("");
    }
  }

  const correct = answers.filter((item) => item.result.is_correct).length;
  const score = Math.round((correct / quiz.questions.length) * 100);

  async function save() {
    if (!authenticated) return;
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_slug: quiz.chapter_slug,
          quiz_score: score,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      setSaved(true);
    } catch {
      setError("Your score could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "intro") {
    return (
      <div className="quiz-panel surface-card">
        <p className="eyebrow">Chapter {order} quiz</p>
        <h1>{title}</h1>
        <p className="muted">Answer {quiz.questions.length} questions one at a time. Each answer is graded by the course API with an immediate explanation.</p>
        <ul>
          <li><CheckCircle2 size={14} /> No time limit</li>
          <li><CheckCircle2 size={14} /> Choices lock after grading</li>
          {!authenticated && <li><LogIn size={14} /> Sign in to save your final score</li>}
        </ul>
        <button className="button-primary w-full" onClick={start}>Begin quiz</button>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="quiz-panel surface-card">
        <div className="quiz-result">
          {score >= 60 ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
          <p className="eyebrow">Quiz complete</p>
          <h1>{score}%</h1>
          <p className="muted">{correct} of {quiz.questions.length} correct</p>
        </div>
        <div className="result-list">
          {quiz.questions.map((item, index) => (
            <div key={item.id}>
              {answers[index].result.is_correct ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        {authenticated ? (
          <button className="button-primary w-full" onClick={save} disabled={saved || saving} aria-busy={saving}>
            {saving ? <Spinner label="Saving score" /> : <Save size={14} />}
            {saved ? "Score saved" : saving ? "Saving score..." : "Save score"}
          </button>
        ) : (
          <Link className="button-primary w-full" href={`/login?return_to=${encodeURIComponent(`/quiz/${quiz.chapter_slug}`)}`}>
            <LogIn size={14} /> Sign in to save
          </Link>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button className="button-secondary" onClick={start}><RotateCcw size={14} /> Retake</button>
          <Link className="button-secondary" href={`/course/${quiz.chapter_slug}`}>Review chapter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-wrap">
      <div className="quiz-step">
        <span>Question {current + 1} of {quiz.questions.length}</span>
        <div>{quiz.questions.map((item, index) => <i key={item.id} data-done={index < answers.length} />)}</div>
      </div>
      <div className="quiz-panel surface-card">
        <p className="eyebrow">Chapter {order}</p>
        <h1>{question.text}</h1>
        <div className="quiz-options" role="radiogroup">
          {question.options.map((option) => {
            const graded = Boolean(answer);
            const isCorrect = answer?.result.correct_answer === option.label;
            const isWrong = graded && answer.selected === option.label && !answer.result.is_correct;
            return (
              <button
                key={option.label}
                disabled={graded}
                data-selected={selected === option.label}
                data-correct={isCorrect}
                data-wrong={isWrong}
                onClick={() => setSelected(option.label)}
              >
                <span>{option.label}</span>{option.text}
              </button>
            );
          })}
        </div>
      </div>
      {answer && (
        <div className={`quiz-feedback ${answer.result.is_correct ? "correct" : "wrong"}`}>
          <strong>{answer.result.is_correct ? "Correct" : `Incorrect · Answer ${answer.result.correct_answer}`}</strong>
          <p>{answer.result.explanation}</p>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {answer ? (
        <button className="button-primary w-full" onClick={next}>
          {current === quiz.questions.length - 1 ? "See results" : "Next question"}
        </button>
      ) : (
        <button className="button-primary w-full" disabled={!selected || grading} onClick={check} aria-busy={grading}>
          {grading && <Spinner label="Checking answer" />}
          {grading ? "Checking..." : "Check answer"}
        </button>
      )}
    </div>
  );
}
