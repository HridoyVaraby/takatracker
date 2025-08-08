// Simple in-memory fallback for web development
import type { Account, Transaction, DashboardSummary } from './schema';

class WebFallbackDatabase {
  private accounts: Account[] = [
    { id: 1, name: 'Cash', type: 'cash', created_at: new Date().toISOString() }
  ];
  private transactions: Transaction[] = [];
  private users: any[] = [];
  private sessions: any[] = [];
  private nextAccountId = 2;
  private nextTransactionId = 1;
  private nextUserId = 1;
  private nextSessionId = 1;

  async initialize(): Promise<void> {
    console.log('Using web fallback database (in-memory)');
  }

  async getAccounts(): Promise<Account[]> {
    return [...this.accounts];
  }

  async createAccount(account: Omit<Account, 'id'>): Promise<number> {
    const newAccount: Account = {
      ...account,
      id: this.nextAccountId++,
      created_at: new Date().toISOString()
    };
    this.accounts.push(newAccount);
    return newAccount.id!;
  }

  async updateAccount(id: number, account: Omit<Account, 'id'>): Promise<void> {
    const index = this.accounts.findIndex(acc => acc.id === id);
    if (index !== -1) {
      this.accounts[index] = { ...account, id, created_at: this.accounts[index].created_at };
    }
  }

  async deleteAccount(id: number): Promise<void> {
    this.accounts = this.accounts.filter(acc => acc.id !== id);
    this.transactions = this.transactions.filter(trans => trans.account_id !== id);
  }

  async getTransactions(accountId?: number): Promise<Transaction[]> {
    let filtered = [...this.transactions];
    if (accountId) {
      filtered = filtered.filter(trans => trans.account_id === accountId);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<number> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.nextTransactionId++,
      created_at: new Date().toISOString()
    };
    this.transactions.push(newTransaction);
    return newTransaction.id!;
  }

  async updateTransaction(id: number, transaction: Omit<Transaction, 'id'>): Promise<void> {
    const index = this.transactions.findIndex(trans => trans.id === id);
    if (index !== -1) {
      this.transactions[index] = { 
        ...transaction, 
        id, 
        created_at: this.transactions[index].created_at 
      };
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    this.transactions = this.transactions.filter(trans => trans.id !== id);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const accountBalances = this.accounts.map(account => {
      const accountTransactions = this.transactions.filter(t => t.account_id === account.id);
      const balance = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);

      return {
        account_id: account.id!,
        account_name: account.name,
        balance
      };
    });

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      accountBalances
    };
  }

  // Generic query execution for auth
  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    const queryUpper = query.trim().toUpperCase();
    

    
    // Handle user queries
    if (queryUpper.includes('SELECT') && queryUpper.includes('USERS')) {
      // Check for duplicate username/email during registration
      if (queryUpper.includes('USERNAME') && queryUpper.includes('EMAIL') && queryUpper.includes('OR')) {
        const [username, email] = params;
        const user = this.users.find(u => u.username === username || u.email === email);
        console.log('Duplicate check result:', user ? [user] : []);
        return user ? [user] : [];
      }
      
      // Login query - get user by username
      if (queryUpper.includes('SELECT *') && queryUpper.includes('USERNAME = ?') && queryUpper.includes('IS_ACTIVE = 1') && params.length === 1) {
        const username = params[0];
        const user = this.users.find(u => u.username === username && u.is_active);
        console.log('Login lookup result:', user ? [user] : []);
        return user ? [user] : [];
      }
      
      // Get user by ID
      if (queryUpper.includes('WHERE ID = ?') && params.length === 1) {
        const id = params[0];
        const user = this.users.find(u => u.id === id);
        return user ? [user] : [];
      }
      
      // Get user password data for password change
      if (queryUpper.includes('PASSWORD_HASH') && queryUpper.includes('SALT') && queryUpper.includes('WHERE ID = ?')) {
        const id = params[0];
        const user = this.users.find(u => u.id === id);
        return user ? [{ password_hash: user.password_hash, salt: user.salt }] : [];
      }
    }
    
    // Insert new user
    if (queryUpper.includes('INSERT') && queryUpper.includes('users') && params.length === 4) {
      const [username, email, password_hash, salt] = params;
      const newUser = {
        id: this.nextUserId++,
        username,
        email,
        password_hash,
        salt,
        created_at: new Date().toISOString(),
        last_login: null,
        is_active: true
      };
      this.users.push(newUser);
      console.log('Created user:', newUser);
      return [newUser.id];
    }
    
    // Insert new session
    if (queryUpper.includes('INSERT') && queryUpper.includes('user_sessions') && params.length === 3) {
      const [user_id, session_token, expires_at] = params;
      const newSession = {
        id: this.nextSessionId++,
        user_id,
        session_token,
        expires_at,
        created_at: new Date().toISOString()
      };
      this.sessions.push(newSession);
      console.log('Created session:', newSession);
      return [newSession.id];
    }
    
    // Get session
    if (queryUpper.includes('SELECT') && queryUpper.includes('user_sessions')) {
      if (queryUpper.includes('session_token') && queryUpper.includes('expires_at') && params.length === 2) {
        const [sessionToken, currentTime] = params;
        const session = this.sessions.find(s => 
          s.session_token === sessionToken && 
          new Date(s.expires_at) > new Date(currentTime)
        );
        return session ? [session] : [];
      }
    }
    
    // Update user last login
    if (queryUpper.includes('UPDATE') && queryUpper.includes('users') && queryUpper.includes('last_login') && params.length === 2) {
      const [lastLogin, userId] = params;
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.last_login = lastLogin;
        console.log('Updated last login for user:', userId);
      }
      return [];
    }
    
    // Update user password
    if (queryUpper.includes('UPDATE') && queryUpper.includes('users') && queryUpper.includes('password_hash') && params.length === 3) {
      const [passwordHash, salt, userId] = params;
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.password_hash = passwordHash;
        user.salt = salt;
        console.log('Updated password for user:', userId);
      }
      return [];
    }
    
    // Delete session
    if (queryUpper.includes('DELETE') && queryUpper.includes('user_sessions') && params.length === 1) {
      const sessionToken = params[0];
      const initialLength = this.sessions.length;
      this.sessions = this.sessions.filter(s => s.session_token !== sessionToken);
      console.log('Deleted sessions:', initialLength - this.sessions.length);
      return [];
    }
    
    console.log('Unhandled query:', query);
    return [];
  }

  async close(): Promise<void> {
    // No-op for web fallback
  }
}

export const webFallbackDatabase = new WebFallbackDatabase();