from pydantic import BaseModel


class QuizQuestion(BaseModel):
    question_id: str
    text: str
    options: list[str]


class QuizPanel(BaseModel):
    chapter_slug: str
    chapter_title: str
    questions: list[QuizQuestion]
    total_questions: int


class QuestionResult(BaseModel):
    question_id: str
    correct: bool
    correct_answer: str


class QuizResult(BaseModel):
    chapter_slug: str
    score: int
    total: int
    percentage: float
    per_question: list[QuestionResult]
