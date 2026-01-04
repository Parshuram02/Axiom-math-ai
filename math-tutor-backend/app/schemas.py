from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    user_id: Optional[int] = None
    topic: Optional[str] = "algebra"
    difficulty: Optional[str] = "easy"
    message: str
    history: List[ChatMessage] = []


class Step(BaseModel):
    index: int
    text: str


class ChatResponse(BaseModel):
    reply: str
    steps: List[Step]
    final_answer: Optional[str] = None
    correctness: Optional[bool] = None

# ... existing imports and models ...

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str
