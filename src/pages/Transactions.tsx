import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { TransactionForm } from './TransactionForm';
import { databaseService } from '../db/database';
import type { Transaction, Account } from '../db/schema';

export const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>();

  useEffect(() => {
    loadData();
  }, [selectedAccount]);

  const loadData = async () => {
    try {
      const [transactionsData, accountsData] = await Promise.all([
        databaseService.getTransactions(selectedAccount),
        databaseService.getAccounts(),
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await databaseService.deleteTransaction(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingTransaction(undefined);
    loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(undefined);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAccountName = (accountId: number) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Unknown';
  };

  if (showForm) {
    return (
      <TransactionForm
        transaction={editingTransaction}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <Layout title="Transactions">
      <div className="space-y-4 pb-20">
        {/* Filter and Add Button */}
        <div className="flex gap-3">
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value ? parseInt(e.target.value) : undefined)}
            className="input flex-1"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddTransaction}
            className="btn btn-primary px-6"
          >
            + Add
          </button>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500 mb-4">No transactions found</p>
            <button
              onClick={handleAddTransaction}
              className="btn btn-primary"
            >
              Add Your First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {transaction.type === 'income' ? '💰' : '💸'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {transaction.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {getAccountName(transaction.account_id)} • {formatDate(transaction.date)}
                    </p>
                    {transaction.notes && (
                      <p className="text-sm text-gray-500">{transaction.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-danger'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id!)}
                        className="text-xs text-danger hover:text-red-700 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
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