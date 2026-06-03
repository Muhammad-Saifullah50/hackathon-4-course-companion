from pydantic import BaseModel, model_validator


class AnswerOption(BaseModel):
    label: str
    text: str


class Question(BaseModel):
    id: str
    text: str
    options: list[AnswerOption]
    correct_answer: str
    explanation: str

    @model_validator(mode="after")
    def correct_answer_in_options(self) -> "Question":
        labels = {opt.label for opt in self.options}
        if self.correct_answer not in labels:
            raise ValueError(
                f"correct_answer '{self.correct_answer}' not in option labels {labels}"
            )
        return self


class QuizFile(BaseModel):
    chapter_slug: str
    questions: list[Question]

    @model_validator(mode="after")
    def unique_question_ids(self) -> "QuizFile":
        ids = [q.id for q in self.questions]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate question IDs found in quiz")
        return self


class QuestionPublic(BaseModel):
    id: str
    text: str
    options: list[AnswerOption]


class QuizPublic(BaseModel):
    chapter_slug: str
    questions: list[QuestionPublic]


class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: str


class GradedResult(BaseModel):
    question_id: str
    is_correct: bool
    correct_answer: str
    explanation: str
