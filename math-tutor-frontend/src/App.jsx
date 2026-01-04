import { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import axios from 'axios';
import Login from './Login';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('algebra');
  const [difficulty, setDifficulty] = useState('easy');
  const [stats, setStats] = useState({ problems: 0, accuracy: 85 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  // AUTH LOGIC
  const onLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoggedIn(true);
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
    setMessages([]);
  };

  // FULLSCREEN LOGIC - Sync with browser
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!chatRef.current) return;
    if (!document.fullscreenElement) {
      chatRef.current.requestFullscreen().catch(err => {
        console.error(`Error enabling focus mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // SCROLL LOGIC
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (isLoggedIn) inputRef.current?.focus();
  }, [isLoggedIn]);

  // CHAT LOGIC
  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // 1. Update UI for User Message
    const userMessage = { role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 2. Single POST request with correct 3-argument structure
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: trimmedInput,
        topic,
        difficulty,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000000000
      });

      // 3. Handle Assistant Response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.reply,
        steps: response.data.steps || []
      }]);
      
      setStats(prev => ({ ...prev, problems: prev.problems + 1 }));

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Tutor is momentarily unavailable. Check your connection.',
        error: true
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // MATH RENDERING LOGIC
  const renderContent = (content) => {
    if (!content) return null;
    const regex = /(\$\$.+?\$\$|\\\[.+?\\\]|\$.+?\$|\\\(.+?\\\))/gs;
    const parts = content.split(regex);

    return (
      <div className="rendered-text">
        {parts.map((part, i) => {
          if (/^(\$\$|\\\[)/.test(part)) {
            const math = part.replace(/^(\$\$|\\\[)|(\$\$|\\\])$/g, '');
            return <div key={i} className="math-block"><BlockMath math={math.trim()} /></div>;
          }
          if (/^(\$|\\\()/.test(part)) {
            const math = part.replace(/^(\$|\\\()|(\$|\\\))$/g, '');
            return <InlineMath key={i} math={math.trim()} />;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

// App.jsx
if (!isLoggedIn) return <Login onLogin={onLoginSuccess} />;  return (
    <div className="app-container">
      <div className="main-layout">
        <header className="glass-header">
          <div className="header-brand">
            <div className="logo-sq">Σ</div>
            <h1>Axiom Math AI</h1>
          </div>
          <div className="header-meta">
            <div className="status-pills">
              <span className="pill-topic">{topic}</span>
              <span className={`pill-diff ${difficulty}`}>{difficulty.toUpperCase()}</span>
            </div>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </header>

        <div className="app-body">
          <aside className="app-sidebar">
            <div className="side-card">
              <h3>Preferences</h3>
              <div className="form-group">
                <label>Topic</label>
                <select value={topic} onChange={e => setTopic(e.target.value)}>
                  <option value="algebra">Algebra</option>
                  <option value="geometry">Geometry</option>
                  <option value="calculus">Calculus</option>
                </select>
              </div>
              <div className="form-group">
                <label>Level</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="side-card stats">
              <h3>Learning Progress</h3>
              <div className="stat-row">
                <span>Solved</span>
                <strong>{stats.problems}</strong>
              </div>
              <div className="prog-bar-bg">
                <div 
                  className="prog-bar-fill" 
                  style={{
                    width: `${stats.accuracy}%`,
                    backgroundColor: stats.accuracy > 80 ? '#22c55e' : stats.accuracy > 50 ? '#eab308' : '#ef4444',
                  }}
                ></div>
              </div>
              <div className="stat-meta">
                <small>{stats.accuracy}% Accuracy</small>
                {stats.accuracy > 80 && <span className="rank-badge">Master</span>}
              </div>
            </div>
          </aside>

          <main className="chat-window" ref={chatRef}>
            <button onClick={toggleFullScreen} className="fs-btn-corner" title="Toggle Focus Mode">
              {isFullscreen ? '✕ Exit' : '⛶ Focus Mode'}
            </button>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">∫</div>
                  <h2>Math Assistant Ready</h2>
                  <p>Ask a question or try: <b>"How do I solve $2x^2 - 8 = 0$?"</b></p>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div key={i} className={`message-row ${m.role}`}>
                      <div className="bubble">
                        {m.steps?.length > 0 ? (
                          <div className="math-steps">
                            {m.steps.map((s, idx) => (
                              <div key={idx} className="step-box">
                                <div className="step-label">STEP {s.index || idx + 1}</div>
                                {renderContent(s.text)}
                              </div>
                            ))}
                          </div>
                        ) : renderContent(m.content)}
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="message-row assistant">
                      <div className="bubble thinking-v2">
                        <div className="math-loader">
                          <span className="math-text">Math is happening</span>
                          <div className="dots-container">
                            <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-sticky">
              <div className="input-bar">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Enter math problem..."
                  disabled={loading}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={loading || !input.trim()}
                  className="send-btn"
                >
                  {loading ? '...' : 'Solve'}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;