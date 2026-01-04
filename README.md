
---

# 🧠 Axiom Math AI

### *The Adaptive, Pedagogy-First Math Tutoring Engine*

**Axiom Math AI** is a full-stack, LLM-powered platform that bridges the gap between raw AI and structured education. It features an adaptive tutoring engine that adjusts its cognitive load based on student needs, all wrapped in a secure, high-performance architecture.

---

## 🚀 Core Features

### 🎓 Adaptive Tutoring Logic

* **Cognitive Slicing:** Dynamically manages LLM context windows based on difficulty.
* *Easy:* Deep history for step-by-step hand-holding.
* *Hard:* Minimal history to challenge student logic.


* **KaTeX Integration:** Native rendering of high-fidelity LaTeX for Calculus, Trigonometry, and Algebra.
* **IQ Warmup:** A pre-login math challenge that sets the academic tone.

### 🛡️ Production-Grade Security

* **PII Scrubbing:** Automated regex filters to protect student privacy before data hits the LLM.
* **Domain Guardrails:** Proprietary logic that restricts the AI to mathematics, preventing off-topic drift.
* **JWT Auth:** Secure, stateless session management using `HS256` symmetric encryption.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Axios, KaTeX, CSS3 (Glassmorphism UI).
* **Backend:** FastAPI (Python), Uvicorn, SQLAlchemy.
* **AI Engine:** OpenAI GPT-4o-mini (via OpenRouter).
* **Deployment:** Render (API) & Vercel (Frontend).

---

## 💻 Local Setup & Installation

Follow these steps to clone and run the project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/axiom-math-ai.git
cd axiom-math-ai

```

### 2. Backend Setup (FastAPI)

```bash
# Navigate to backend
cd math-tutor-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
touch .env

```

**Add the following to your `.env`:**

```text
OPENROUTER_API_KEY=your_key_here
JWT_SECRET_KEY=your_secret_string
ALGORITHM=HS256

```

### 3. Frontend Setup (React/Vite)

```bash
# Open a new terminal in the root folder
cd math-tutor-frontend

# Install dependencies
npm install

# Run the development server
npm run dev

```

---

## 🏗️ Architecture Flow

1. **Request:** Client sends a JWT-authenticated JSON payload.
2. **Safety:** Backend validates math-relevance and scrubs PII.
3. **Inference:** Sliced context is sent to the LLM for step-by-step problem solving.
4. **Response:** Frontend parses the response into interactive step-cards and rendered math blocks.

---

## 📝 Roadmap

* [ ] **Vector Memory:** Implementing a Vector DB (Pinecone) for long-term student progress tracking.
* [ ] **Voice Mode:** Real-time speech-to-math interaction.
* [ ] **Teacher Dashboard:** Analytical view of student struggle-points.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
