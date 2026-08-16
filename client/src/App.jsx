import React, { useState, useEffect } from 'react';
import useAuthStore from './store/authStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MasterProfile } from './pages/MasterProfile';
import { ResumeBuilder } from './pages/ResumeBuilder';
import { JDIntelligence } from './pages/JDIntelligence';
import { Sparkles } from 'lucide-react';
import { Notifications } from './components/Notifications';

function App() {
  const { isAuthenticated, checkAuth, loading } = useAuthStore();
  const [currentView, setCurrentView] = useState('login');
  const [activeResumeId, setActiveResumeId] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, [checkAuth]);

  // Update view automatically if authenticated status changes
  useEffect(() => {
    if (isAuthenticated) {
      if (currentView === 'login' || currentView === 'register') {
        setCurrentView('dashboard');
      }
    } else {
      if (currentView !== 'login' && currentView !== 'register') {
        setCurrentView('login');
      }
    }
  }, [isAuthenticated, currentView]);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleEditResume = (resumeId) => {
    setActiveResumeId(resumeId);
    setCurrentView('builder');
  };

  if (loading && currentView === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Initializing GenForge...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Notifications />
      {currentView === 'login' && <Login onNavigate={handleNavigate} />}
      {currentView === 'register' && <Register onNavigate={handleNavigate} />}
      
      {isAuthenticated && (
        <>
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} onEditResume={handleEditResume} />
          )}
          {currentView === 'profile' && (
            <MasterProfile onNavigate={handleNavigate} />
          )}
          {currentView === 'builder' && (
            <ResumeBuilder resumeId={activeResumeId} onNavigate={handleNavigate} />
          )}
          {currentView === 'jd-intelligence' && (
            <JDIntelligence onBack={() => handleNavigate('builder')} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
