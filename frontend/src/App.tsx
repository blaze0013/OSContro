import { MainScreen } from './components/MainScreen';
import { LoginScreen } from './components/LoginScreen';
import { AppAuthProvider, useAuth } from './lib/auth';

function AppContent() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <MainScreen />;
}

function App() {
  return (
    <AppAuthProvider>
      <AppContent />
    </AppAuthProvider>
  );
}

export default App;
