import { useState, useEffect } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Accounts } from './pages/Accounts';
import { Settings } from './pages/Settings';
import { databaseService } from './db/database';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await databaseService.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitError('Failed to initialize the app. Please restart the application.');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'accounts':
        return <Accounts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-primary mb-2">Initialization Error</h2>
          <p className="text-muted mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Restart App
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-primary mb-2">TakaTracker</h2>
          <p className="text-muted">Initializing your expense tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-surface-50">
        {renderCurrentPage()}
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </AuthWrapper>
  );
}

export default App;