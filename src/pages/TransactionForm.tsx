import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { databaseService } from '../db/database';
import type { Account, Transaction } from '../db/schema';

interface TransactionFormProps {
  transaction?: Transaction;
  onSave: () => void;
  onCancel: () => void;
}

export const TransactionForm = ({
  transaction,
  onSave,
  onCancel,
}: TransactionFormProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || 1,
    type: transaction?.type || 'expense' as 'income' | 'expense',
    amount: transaction?.amount?.toString() || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    category: transaction?.category || '',
    notes: transaction?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'],
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await databaseService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    setLoading(true);
    try {
      const transactionData = {
        account_id: formData.account_id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        notes: formData.notes,
        synced: false,
      };

      if (transaction?.id) {
        await databaseService.updateTransaction(transaction.id, transactionData);
      } else {
        await databaseService.createTransaction(transactionData);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <div className="pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                className={`btn ${
                  formData.type === 'income' ? 'btn-success' : 'btn-secondary'
                }`}
              >
                💰 Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                className={`btn ${
                  formData.type === 'expense' ? 'btn-danger' : 'btn-secondary'
                }`}
              >
                💸 Expense
              </button>
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account
            </label>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
              className="input"
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (৳)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              placeholder="0.00"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              <option value="">Select category</option>
              {categories[formData.type].map((category: string) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading || !formData.amount || !formData.category}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};