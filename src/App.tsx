import './App.css';
import { AppProvider } from './contexts/AppContext';
import { useApp } from './hooks/useApp';
import { AuthScreen } from './components/AuthScreen';
import { EditorLayout } from './components/EditorLayout';

function AppContent() {
  const { isAuthenticated } = useApp();

  return <>{isAuthenticated ? <EditorLayout /> : <AuthScreen />}</>;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;