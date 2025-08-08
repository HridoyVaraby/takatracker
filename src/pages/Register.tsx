import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { RegisterData } from '../db/authSchema';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export const Register = ({ onRegister, onSwitchToLogin }: RegisterProps) => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.register(formData);
      if (result.success) {
        // Auto-login after successful registration
        const loginResult = await authService.login({
          username: formData.username,
          password: formData.password,
        });
        
        if (loginResult.success) {
          onRegister();
        } else {
          setError('Account created but login failed. Please try logging in manually.');
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
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
            <p className="text-muted">Create your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="Choose a username"
                required
                disabled={loading}
                minLength={3}
              />
              <p className="text-xs text-muted mt-1">At least 3 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="Enter your email"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Create a password"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-muted mt-1">At least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3"
              disabled={loading || !formData.username || !formData.email || !formData.password || !confirmPassword}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center">
            <p className="text-muted">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary-600 hover:text-primary-700 font-medium"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 pt-6 border-t border-surface-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>🔒</span>
                <span>Your data stays on your device - fully offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>🛡️</span>
                <span>No data is sent to external servers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};