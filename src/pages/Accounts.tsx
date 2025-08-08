import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { databaseService } from '../db/database';
import type { Account } from '../db/schema';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [formData, setFormData] = useState({
    name: '',
    type: 'savings',
  });

  const accountTypes = [
    { value: 'savings', label: 'Savings Account' },
    { value: 'checking', label: 'Checking Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'wallet', label: 'Mobile Wallet' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'investment', label: 'Investment' },
  ];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await databaseService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(undefined);
    setFormData({ name: '', type: 'savings' });
    setShowForm(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormData({ name: account.name, type: account.type });
    setShowForm(true);
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account? All associated transactions will also be deleted.')) {
      return;
    }
    
    try {
      await databaseService.deleteAccount(id);
      loadAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingAccount?.id) {
        await databaseService.updateAccount(editingAccount.id, formData);
      } else {
        await databaseService.createAccount(formData);
      }
      
      setShowForm(false);
      setEditingAccount(undefined);
      loadAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    return accountTypes.find(t => t.value === type)?.label || type;
  };

  const getAccountIcon = (type: string) => {
    const icons: Record<string, string> = {
      savings: '🏦',
      checking: '💳',
      cash: '💵',
      wallet: '📱',
      credit: '💳',
      investment: '📈',
    };
    return icons[type] || '🏦';
  };

  if (showForm) {
    return (
      <Layout title={editingAccount ? 'Edit Account' : 'Add Account'}>
        <div className="pb-20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Main Savings, Cash Wallet"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
                required
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={!formData.name.trim()}
              >
                {editingAccount ? 'Update' : 'Create'} Account
              </button>
            </div>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Accounts">
      <div className="space-y-4 pb-20">
        {/* Add Account Button */}
        <button
          onClick={handleAddAccount}
          className="btn btn-primary w-full py-3"
        >
          + Add New Account
        </button>

        {/* Accounts List */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500 mb-4">No accounts found</p>
            <button
              onClick={handleAddAccount}
              className="btn btn-primary"
            >
              Create Your First Account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getAccountIcon(account.type)}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-600">
                        {getAccountTypeLabel(account.type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAccount(account)}
                      className="text-sm text-primary-600 hover:text-primary-800 px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => handleDeleteAccount(account.id!)}
                        className="text-sm text-danger hover:text-red-700 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};