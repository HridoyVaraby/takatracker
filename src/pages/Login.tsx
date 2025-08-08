import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { LoginCredentials } from '../db/authSchema';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export const Login = ({ onLogin, onSwitchToRegister }: LoginProps) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.login(credentials);
      if (result.success) {
        onLogin();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">💰</div>
            <h1 className="text-2xl font-bold text-primary mb-2">TakaTracker</h1>
            <p className="text-muted">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="input"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="input"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3"
              disabled={loading || !credentials.username || !credentials.password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 text-center">
            <p className="text-muted">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-primary-600 hover:text-primary-700 font-medium"
                disabled={loading}
              >
                Create one
              </button>
            </p>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 pt-6 border-t border-surface-200">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>🔒</span>
              <span>Your data stays on your device - fully offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};