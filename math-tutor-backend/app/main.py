from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import os

# Internal Imports
# Ensure ChatRequest is imported from your schemas
from .schemas import ChatRequest, ChatResponse, UserCreate, UserOut, Token 
from .models import User
from .db import Base, engine, get_db
from .auth import (
    get_current_user, create_access_token, verify_password, 
    get_password_hash, rate_limit_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .llm import call_openai, is_safe_math_query, scrub_pii 

app = FastAPI(
    title="Axiom Math AI API",
    description="LLM-based math tutor with security guardrails",
    version="0.1.0"
)

# 1. CORS Configuration
origins = [
    "https://axiom-math-ai.vercel.app",   # Your production frontend
    "https://axiom-math-ai.com",          # Your custom domain (if active)             # THIS IS THE MISSING PIECE for your local testing
    "http://127.0.0.1:5173",              # Sometimes browsers use the IP instead
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
Base.metadata.create_all(bind=engine)

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/auth/register", response_model=UserOut)
def register(user: UserCreate, db=Depends(get_db)):
    if len(user.password) > 72:
        raise HTTPException(status_code=400, detail="Password too long")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- CHAT ENDPOINT (JSON VERSION) ---

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest, 
    current_user: User = Depends(get_current_user)
):
    # 1. Security: Rate Limiting
    rate_limit_user(current_user.id, limit=5, window=60)
    
    # 2. Security: Basic Validation
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    
    if len(req.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long")
        
    # 3. Security: Safety Guardrails
    if not is_safe_math_query(req.message):
        raise HTTPException(
            status_code=400, 
            detail="I can only assist with math questions. Please rephrase."
        )

    # 4. Security: PII Redaction
    req.message = scrub_pii(req.message)
    
    # 5. Call LLM Logic
    try:
        # Use call_openai for JSON ChatRequest
        return call_openai(req)
    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI processing failed")

@app.get("/health")
def health():
    return {"status": "ok"}
@app.get("/")
def read_root():
    return {"status": "online", "message": "Axiom Math AI Backend is running!"}