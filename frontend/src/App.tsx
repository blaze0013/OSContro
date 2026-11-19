import { useEffect } from 'react';
import { MainScreen } from './components/MainScreen';
import { LoginScreen } from './components/LoginScreen';
import { AppAuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { GlobalSwarmCursor } from './components/GlobalSwarmCursor';

function AppContent() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <MainScreen />;
}

function App() {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        document.body.classList.add('animations-paused');
      } else {
        document.body.classList.remove('animations-paused');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <ThemeProvider>
      <GlobalSwarmCursor />
      <AppAuthProvider>
        <AppContent />
      </AppAuthProvider>
    </ThemeProvider>
  );
}

export default App;
