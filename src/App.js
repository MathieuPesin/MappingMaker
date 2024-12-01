import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import MainPage from './MainPage';
import LandingPage from './components/LandingPage';
import './styles/AnimatedBackground.css';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const handleStarted = () => {
    setShowAuth(true);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {!session ? (
          showAuth ? (
            <Auth />
          ) : (
            <LandingPage onStarted={handleStarted} />
          )
        ) : (
          <MainPage session={session} />
        )}
      </div>
    </Router>
  );
}

export default App;
