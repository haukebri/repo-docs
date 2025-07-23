import './App.css';
import { AppProvider, useApp } from './contexts/AppContext';
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