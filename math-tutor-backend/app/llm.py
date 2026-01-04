import os
import base64
import re
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import HTTPException
from .schemas import ChatRequest, ChatResponse, Step

load_dotenv()

# --- Configuration & Security Checks ---
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_KEY or len(OPENROUTER_KEY) < 20:
    raise RuntimeError("CRITICAL SECURITY ERROR: Valid API Key missing from Environment.")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_KEY,
)

SYSTEM_PROMPT = """
You are a friendly math tutor for middle and high school students.
ALWAYS:
- Solve problems step by step.
- Label each step clearly (Step 1, Step 2, ...).
- Ask short check questions occasionally.
- Prefer hints before giving the full solution, unless the student asks directly.
- Use LaTeX-style math notation inside $...$.
- Be encouraging and patient.
- Refuse unsafe or irrelevant requests.
"""

# --- Utility Functions ---

def scrub_pii(text: str) -> str:
    """Redacts potential PII like emails and phone numbers."""
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    phone_pattern = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    
    text = re.sub(email_pattern, "[EMAIL_REDACTED]", text)
    text = re.sub(phone_pattern, "[PHONE_REDACTED]", text)
    return text

def parse_steps(text: str):
    """Parses LLM response into structured Step cards."""
    lines = text.splitlines()
    steps = []
    current = []
    step_num = 1

    for line in lines:
        if line.strip().lower().startswith("step"):
            if current:
                steps.append(Step(index=step_num-1, text=" ".join(current).strip()))
            current = [line]
            step_num += 1
        else:
            current.append(line)

    if current:
        steps.append(Step(index=step_num-1, text=" ".join(current).strip()))
    return steps

def is_safe_math_query(text: str) -> bool:
    """Detects if the query is math-related and not a prompt injection."""
    math_patterns = [
        r'[0-9]', r'[\+\-\*\/\=\^\√]', r'x', r'y', r'solve', 
        r'calculate', r'derivative', r'integral', r'equation'
    ]
    has_math = any(re.search(pattern, text.lower()) for pattern in math_patterns)
    
    injection_keywords = ["ignore", "system prompt", "bypass", "admin", "password"]
    is_not_injection = not any(word in text.lower() for word in injection_keywords)
    
    return has_math and is_not_injection

# --- Core LLM Logic ---

def call_openai_vision_logic(message, image, topic, difficulty, history):
    """
    Handles Multi-modal (Text + Image) tutoring requests.
    Used by the multipart/form-data endpoint.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Adaptive Slicing: Determines context depth based on difficulty
    history_limit = -12 if difficulty == "easy" else -2 if difficulty == "hard" else -6
    for msg in history[history_limit:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Build multi-modal content list
    user_content = [
        {
            "type": "text", 
            "text": f"Topic: {topic} | Difficulty: {difficulty}\n\nQuestion: {message}"
        }
    ]

    if image:
        # Convert binary data to base64 for API transmission
        base64_image = base64.b64encode(image).decode('utf-8')
        user_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
        })

    messages.append({"role": "user", "content": user_content})

    response = client.chat.completions.create(
        model="openai/gpt-4o-mini", 
        messages=messages,
        temperature=0.3,
        max_tokens=1000,
    )

    text = response.choices[0].message.content.strip()
    return ChatResponse(reply=text, steps=parse_steps(text))

def call_openai(req: ChatRequest) -> ChatResponse:
    """
    Handles standard JSON-based text requests.
    Used by the standard /api/chat endpoint.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Adaptive Slicing
    history_limit = -12 if req.difficulty == "easy" else -2 if req.difficulty == "hard" else -6
    for msg in req.history[history_limit:]:
        messages.append({"role": msg.role, "content": msg.content})

    clean_message = scrub_pii(req.message)
    messages.append({
        "role": "user",
        "content": f"Topic: {req.topic} | Difficulty: {req.difficulty}\n\n{clean_message}"
    })

    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=messages,
        temperature=0.3,
        max_tokens=800,
    )

    text = response.choices[0].message.content.strip()
    return ChatResponse(reply=text, steps=parse_steps(text))