import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { createTablesSQL, type Account, type Transaction, type DashboardSummary } from './schema';
import { createAuthTablesSQL } from './authSchema';
import { webFallbackDatabase } from './webFallback';

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if platform is supported
      if (Capacitor.getPlatform() === 'web') {
        // For web development, use fallback database
        await webFallbackDatabase.initialize();
        this.isInitialized = true;
        return;
      }

      // Create or open database
      this.db = await this.sqlite.createConnection(
        'takatracker.db',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();

      // Create tables
      await this.db.execute(createTablesSQL);
      await this.db.execute(createAuthTablesSQL);

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  private isWebPlatform(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.getAccounts();
    }
    const result = await this.db!.query('SELECT * FROM accounts ORDER BY name');
    return result.values || [];
  }

  async createAccount(account: Omit<Account, 'id'>): Promise<number> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.createAccount(account);
    }
    const result = await this.db!.run(
      'INSERT INTO accounts (name, type) VALUES (?, ?)',
      [account.name, account.type]
    );
    return result.changes?.lastId || 0;
  }

  async updateAccount(id: number, account: Omit<Account, 'id'>): Promise<void> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.updateAccount(id, account);
    }
    await this.db!.run(
      'UPDATE accounts SET name = ?, type = ? WHERE id = ?',
      [account.name, account.type, id]
    );
  }

  async deleteAccount(id: number): Promise<void> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.deleteAccount(id);
    }
    await this.db!.run('DELETE FROM accounts WHERE id = ?', [id]);
  }

  // Transaction operations
  async getTransactions(accountId?: number): Promise<Transaction[]> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.getTransactions(accountId);
    }
    let query = 'SELECT * FROM transactions';
    const params: any[] = [];

    if (accountId) {
      query += ' WHERE account_id = ?';
      params.push(accountId);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const result = await this.db!.query(query, params);
    return result.values || [];
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<number> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.createTransaction(transaction);
    }
    const result = await this.db!.run(
      'INSERT INTO transactions (account_id, type, amount, date, category, notes, synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        transaction.account_id,
        transaction.type,
        transaction.amount,
        transaction.date,
        transaction.category,
        transaction.notes || '',
        transaction.synced || false
      ]
    );
    return result.changes?.lastId || 0;
  }

  async updateTransaction(id: number, transaction: Omit<Transaction, 'id'>): Promise<void> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.updateTransaction(id, transaction);
    }
    await this.db!.run(
      'UPDATE transactions SET account_id = ?, type = ?, amount = ?, date = ?, category = ?, notes = ?, synced = ? WHERE id = ?',
      [
        transaction.account_id,
        transaction.type,
        transaction.amount,
        transaction.date,
        transaction.category,
        transaction.notes || '',
        transaction.synced || false,
        id
      ]
    );
  }

  async deleteTransaction(id: number): Promise<void> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.deleteTransaction(id);
    }
    await this.db!.run('DELETE FROM transactions WHERE id = ?', [id]);
  }

  // Dashboard summary
  async getDashboardSummary(): Promise<DashboardSummary> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.getDashboardSummary();
    }

    // Get total income and expenses
    const summaryResult = await this.db!.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
      FROM transactions
    `);

    const summary = summaryResult.values?.[0] || { total_income: 0, total_expenses: 0 };

    // Get account balances
    const balancesResult = await this.db!.query(`
      SELECT 
        a.id as account_id,
        a.name as account_name,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      GROUP BY a.id, a.name
      ORDER BY a.name
    `);

    return {
      totalIncome: summary.total_income || 0,
      totalExpenses: summary.total_expenses || 0,
      balance: (summary.total_income || 0) - (summary.total_expenses || 0),
      accountBalances: balancesResult.values || []
    };
  }

  // Generic query execution for auth service
  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    this.ensureInitialized();
    if (this.isWebPlatform()) {
      return webFallbackDatabase.executeQuery(query, params);
    }

    if (query.trim().toUpperCase().startsWith('INSERT')) {
      const result = await this.db!.run(query, params);
      return [result.changes?.lastId || 0];
    } else if (query.trim().toUpperCase().startsWith('UPDATE') || query.trim().toUpperCase().startsWith('DELETE')) {
      await this.db!.run(query, params);
      return [];
    } else {
      const result = await this.db!.query(query, params);
      return result.values || [];
    }
  }

  async close(): Promise<void> {
    if (this.isWebPlatform()) {
      await webFallbackDatabase.close();
    } else if (this.db) {
      await this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
  }
}

export const databaseService = new DatabaseService();