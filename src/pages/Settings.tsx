import { useState } from 'react';
import { Layout } from '../components/Layout';
import { databaseService } from '../db/database';
import { authService } from '../services/authService';

export const Settings = () => {
  const [exporting, setExporting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const currentUser = authService.getCurrentUser();

  const handleExportData = async () => {
    setExporting(true);
    try {
      // Get all data
      const [accounts, transactions] = await Promise.all([
        databaseService.getAccounts(),
        databaseService.getTransactions(),
      ]);

      const exportData = {
        accounts,
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `takatracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = confirm('Are you sure you want to sign out?');
    if (confirmed) {
      await authService.logout();
      window.location.reload(); // Force app to re-initialize
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const result = await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setPasswordSuccess(result.message);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(result.message);
      }
    } catch (error) {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClearAllData = async () => {
    const confirmed = confirm(
      'Are you sure you want to clear all data? This action cannot be undone. Consider exporting your data first.'
    );
    
    if (!confirmed) return;

    const doubleConfirm = confirm(
      'This will permanently delete all your accounts and transactions. Are you absolutely sure?'
    );
    
    if (!doubleConfirm) return;

    try {
      // Get all accounts and transactions
      const accounts = await databaseService.getAccounts();
      const transactions = await databaseService.getTransactions();

      // Delete all transactions first
      for (const transaction of transactions) {
        if (transaction.id) {
          await databaseService.deleteTransaction(transaction.id);
        }
      }

      // Delete all accounts except the default one
      for (const account of accounts) {
        if (account.id && account.id !== 1) {
          await databaseService.deleteAccount(account.id);
        }
      }

      alert('All data has been cleared successfully.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  return (
    <Layout title="Settings">
      <div className="space-y-6 pb-20">
        {/* Account Info */}
        {currentUser && (
          <div className="card">
            <h3 className="text-lg font-semibold text-primary mb-4">Account Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Username</span>
                <span className="font-medium text-primary">{currentUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Email</span>
                <span className="font-medium text-primary">{currentUser.email}</span>
              </div>
              {currentUser.last_login && (
                <div className="flex justify-between">
                  <span className="text-muted">Last Login</span>
                  <span className="font-medium text-sm text-primary">
                    {new Date(currentUser.last_login).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-200">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="btn btn-secondary w-full"
              >
                🔑 Change Password
              </button>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        {showChangePassword && (
          <div className="card">
            <h3 className="text-lg font-semibold text-primary mb-4">Change Password</h3>
            
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg mb-4">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input"
                  required
                  disabled={changingPassword}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input"
                  required
                  minLength={6}
                  disabled={changingPassword}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input"
                  required
                  disabled={changingPassword}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* App Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">App Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">App Name</span>
              <span className="font-medium text-primary">TakaTracker</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Version</span>
              <span className="font-medium text-primary">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Platform</span>
              <span className="font-medium text-primary">Android (Capacitor)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Storage</span>
              <span className="font-medium text-primary">SQLite (Offline)</span>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">Data Management</h3>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="btn btn-primary w-full"
            >
              {exporting ? 'Exporting...' : '📤 Export Data (JSON)'}
            </button>
            <p className="text-sm text-muted">
              Export all your accounts and transactions to a JSON file for backup or transfer.
            </p>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">Privacy & Security</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-medium text-primary">Fully Offline</p>
                <p className="text-sm text-muted">
                  All your data is stored locally on your device. No data is sent to external servers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-medium text-primary">No Tracking</p>
                <p className="text-sm text-muted">
                  TakaTracker doesn't collect any personal information or usage analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="btn btn-secondary w-full"
            >
              🚪 Sign Out
            </button>
            <p className="text-sm text-muted">
              Sign out of your account. You'll need to sign in again to access your data.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>
          <div className="space-y-3">
            <button
              onClick={handleClearAllData}
              className="btn btn-danger w-full"
            >
              🗑️ Clear All Data
            </button>
            <p className="text-sm text-red-600">
              This will permanently delete all your accounts and transactions. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">About</h3>
          <p className="text-sm text-muted leading-relaxed">
            TakaTracker is a simple, privacy-focused expense tracking app built for Android. 
            It helps you manage your personal finances by tracking income, expenses, and account balances 
            - all stored securely on your device.
          </p>
          <div className="mt-4 pt-4 border-t border-surface-200">
            <p className="text-xs text-muted">
              Built with React, Capacitor, and SQLite
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};