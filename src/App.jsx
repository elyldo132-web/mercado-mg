import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import './index.css';

function App() {
  const [accessKey, setAccessKey] = useState(() => {
    const savedKey = localStorage.getItem('mg_access_key');
    return savedKey === 'MG-ALPHA-2026' ? savedKey : null;
  });

  const handleAccess = (key) => {
    if (key === 'MG-ALPHA-2026') {
      localStorage.setItem('mg_access_key', key);
      setAccessKey(key);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mg_access_key');
    setAccessKey(null);
  };

  return (
    <div className="App">
      {!accessKey ? (
        <Login onAccess={handleAccess} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
