export const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    synced BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
  );

  -- Insert default account if none exists
  INSERT OR IGNORE INTO accounts (id, name, type) VALUES (1, 'Cash', 'cash');
`;

export interface Account {
  id?: number;
  name: string;
  type: string;
  created_at?: string;
}

export interface Transaction {
  id?: number;
  account_id: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: string;
  notes?: string;
  synced?: boolean;
  created_at?: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  accountBalances: Array<{
    account_id: number;
    account_name: string;
    balance: number;
  }>;
}