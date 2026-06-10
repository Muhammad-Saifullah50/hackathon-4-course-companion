from pydantic import BaseModel


class ErrorPanel(BaseModel):
    message: str = "Service unavailable, please try again"
