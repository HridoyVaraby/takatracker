import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { databaseService } from '../db/database';
import type { DashboardSummary } from '../db/schema';

export const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    accountBalances: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await databaseService.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  };

  if (loading) {
    return (
      <Layout title="TakaTracker">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="TakaTracker">
      <div className="space-y-6 pb-20">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="card">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Balance</h2>
              <p className={`text-3xl font-bold ${
                summary.balance >= 0 ? 'text-success' : 'text-danger'
              }`}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Income</h3>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Expenses</h3>
                <p className="text-xl font-bold text-danger">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Balances */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Balances</h3>
          {summary.accountBalances.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No accounts found</p>
          ) : (
            <div className="space-y-3">
              {summary.accountBalances.map((account) => (
                <div key={account.account_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium text-gray-700">{account.account_name}</span>
                  <span className={`font-bold ${
                    account.balance >= 0 ? 'text-success' : 'text-danger'
                  }`}>
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="btn btn-success py-4">
            <span className="text-lg">💰</span>
            <span className="ml-2">Add Income</span>
          </button>
          <button className="btn btn-danger py-4">
            <span className="text-lg">💸</span>
            <span className="ml-2">Add Expense</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};