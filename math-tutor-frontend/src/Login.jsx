import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('login'); 
  const [quote, setQuote] = useState('');

  // Tricky Math State
  const [mathChallenge, setMathChallenge] = useState({ q: '', a: '', options: [] });
  const [userAnswer, setUserAnswer] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const quotes = [
    "“Mathematics is the music of reason.” — James Joseph Sylvester",
    "“Pure mathematics is the poetry of logical ideas.” — Albert Einstein",
    "“Nature is written in mathematical language.” — Galileo Galilei"
  ];

  const generateTrickyMath = () => {
    const challenges = [
      { q: "2 + 2 * 2 = ?", a: "6", options: ["6", "8", "4"] },
      { q: "√144 = ?", a: "12", options: ["10", "12", "14"] },
      { q: "Next in sequence: 2, 4, 8, ?", a: "16", options: ["10", "12", "16"] },
      { q: "If f(x) = 2x + 3, what is f(f(1))?", a: "13", options: ["5", "10", "13"] },
    { q: "Solve for x: log₂(x) = 5", a: "32", options: ["25", "32", "10"] },
    // Geometry / Trigonometry
    { q: "In a 3-4-5 triangle, what is sin(θ) for the smallest angle?", a: "0.6", options: ["0.6", "0.8", "1.0"] },
    { q: "Interior angles of a hexagon sum to?", a: "720° formula is (n-2)*180°", options: ["540°", "720°", "360°"] },
    // Calculus / Advanced
    { q: "Derivative of x² at x=3?", a: "6", options: ["3", "6", "9"] },
    { q: "Limit of 1/x as x → ∞?", a: "0", options: ["1", "0", "∞"] },
    // Probability
    { q: "Probability of rolling a prime number on a 6-sided die?", a: "1/2", options: ["1/3", "1/2", "2/3"] }
    ];
    const picked = challenges[Math.floor(Math.random() * challenges.length)];
    setMathChallenge(picked);
    setUserAnswer('');
    setIsCorrect(false);
  };

  useEffect(() => { 
    generateTrickyMath();
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // Real-time check for the Tick Mark
  useEffect(() => {
    if (userAnswer === mathChallenge.a) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  }, [userAnswer, mathChallenge.a]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let url, data, headers;
      if (step === 'register') {
        url = 'http://localhost:8000/auth/register';
        data = { email, password };
        headers = { 'Content-Type': 'application/json' };
      } else {
        url = 'http://localhost:8000/auth/token';
        data = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      }

      const response = await axios.post(url, data, { headers });

      if (step === 'register') {
        setError('Account created! Please sign in.');
        setStep('login');
      } else {
        localStorage.setItem('token', response.data.access_token);
        onLogin(response.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="math-bg-overlay">
        <span>$x^2 + y^2 = z^2$</span>
        <span>$\pi \approx 3.14$</span>
        <span>$\sum n$</span>
      </div>

      <div className="login-card">
        <div style={{ textAlign: 'center' }}>
          <div className="logo-icon-large">Σ</div>
          <h2 style={{ color: '#1e293b', fontSize: '24px', margin: '10px 0 5px' }}>
            {step === 'register' ? 'Create Account' : 'Axiom Math AI'}
          </h2>
          <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#64748b', marginBottom: '15px' }}>
            {quote}
          </p>
        </div>

        {error && <div className="error-toast">{error}</div>}

        <form onSubmit={submit} style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label className="form-group label" style={{ color: '#64748b' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="styled-input" required />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label className="form-group label" style={{ color: '#64748b' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="styled-input" required />
          </div>

          {/* Tricky Optional Verification */}
          <div className="verify-section" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '10px', borderRadius: '8px' }}>
            <button type="button" onClick={() => setShowVerify(!showVerify)} className="logout-link" style={{ color: '#6366f1', fontWeight: 'bold' }}>
              {showVerify ? "- Close Warmup" : "+ Quick Math IQ (Optional)"}
            </button>
            
            {showVerify && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#1e293b', fontSize: '0.9rem', marginBottom: '8px' }}>{mathChallenge.q}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {mathChallenge.options.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setUserAnswer(opt)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: userAnswer === opt ? '#6366f1' : 'white',
                        color: userAnswer === opt ? 'white' : '#1e293b',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                  <div style={{ marginLeft: '10px', fontSize: '1.2rem' }}>
                    {userAnswer && (isCorrect ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Correct is {mathChallenge.a}</span>)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="primary-btn" style={{ marginTop: '20px' }}>
            {loading ? '...' : (step === 'register' ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="footer-toggle" style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => setStep(step === 'login' ? 'register' : 'login')} className="logout-link" style={{ color: '#64748b' }}>
            {step === 'login' ? "New here? Create account" : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}