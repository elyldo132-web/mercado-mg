import React, { useState } from 'react';

const Login = ({ onAccess }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Simulating a "Terminal Handshake"
    setTimeout(() => {
      if (key.toUpperCase() === 'MG-ALPHA-2026') {
        onAccess(key.toUpperCase());
      } else {
        setError(true);
        setIsAuthenticating(false);
        setTimeout(() => setError(false), 2000);
      }
    }, 1200);
  };

  return (
    <div className="portal-container animate-fade-in">
      <div className="portal-bg-effects"></div>
      
      <div className="login-card glass">
        <div className="scanning-line"></div>
        
        <div className="portal-header">
          <div className="portal-logo">🚨</div>
          <h2 className="portal-title">Mercado MG</h2>
          <p className="portal-subtitle">Private Terminal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="access-input-group">
            <input
              type="text"
              className={`access-input ${error ? 'text-red' : ''}`}
              placeholder="ENTER ACCESS KEY"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isAuthenticating}
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="btn-terminal"
            disabled={isAuthenticating || !key.trim()}
          >
            {isAuthenticating ? 'Authenticating...' : 'Connect to Terminal'}
          </button>
        </form>

        {error && (
          <div className="auth-error text-red font-mono animate-fade-in" style={{ marginTop: '1rem', fontSize: '0.7rem' }}>
            ACCESS DENIED: INVALID KEY
          </div>
        )}

        <div className="login-footer">
          <p>System Status: Online</p>
          <p className="font-mono" style={{ fontSize: '0.5rem', marginTop: '4px', opacity: 0.5 }}>
            ENCRYPTED CONNECTION : 256-BIT AES
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
