# TakaTracker 💰

A fully offline-first personal finance app for Android, built with React + Capacitor + SQLite. Track your income, expenses, and manage multiple bank accounts - all stored securely on your device.

## 🌟 Features

- **🔐 User Authentication**: Secure local account creation and login system
- **Fully Offline**: All data stored locally using SQLite - no internet required
- **Multi-Account Support**: Manage multiple accounts (savings, cash, wallet, etc.)
- **Transaction Management**: Add, edit, and delete income/expense transactions
- **Dashboard Overview**: Real-time summary of your financial status
- **Category-based Tracking**: Organize transactions by categories
- **Data Export**: Export your data as JSON for backup
- **Password Management**: Change password and secure account access
- **Privacy-First**: No data collection, no tracking, no external servers

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Mobile**: Capacitor for Android
- **Database**: SQLite via @capacitor-community/sqlite
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## 📱 Screenshots

*Dashboard showing account balances and quick actions*
*Transaction list with filtering options*
*Account management interface*

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Android Studio (for Android development)
- Java Development Kit (JDK) 17+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd takatracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the web app**
   ```bash
   npm run build
   ```

4. **Sync with Capacitor**
   ```bash
   npx cap sync android
   ```

5. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

6. **Run on device/emulator**
   - Connect your Android device or start an emulator
   - Click "Run" in Android Studio

### Development

For web development and testing:

```bash
npm run dev
```

Note: SQLite functionality is limited in web browsers. For full functionality, test on Android.

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  is_active BOOLEAN DEFAULT 1
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### Accounts Table
```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
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
```

## 🏛️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthWrapper.tsx # Authentication wrapper
│   ├── Layout.tsx      # Main layout wrapper
│   └── Navigation.tsx  # Bottom navigation
├── pages/              # Main application pages
│   ├── Login.tsx       # User login page
│   ├── Register.tsx    # User registration page
│   ├── Dashboard.tsx   # Financial overview
│   ├── Transactions.tsx # Transaction list & management
│   ├── TransactionForm.tsx # Add/edit transactions
│   ├── Accounts.tsx    # Account management
│   └── Settings.tsx    # App settings & account management
├── services/           # Business logic services
│   └── authService.ts  # Authentication service
├── db/                 # Database layer
│   ├── schema.ts       # Main database schema & types
│   ├── authSchema.ts   # Authentication schema & types
│   ├── database.ts     # Database service & operations
│   └── webFallback.ts  # Web development fallback
├── App.tsx             # Root component
└── index.css           # Global styles & Tailwind
```

## 🔧 Configuration

### Capacitor Configuration

The app is configured in `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.takatracker.app',
  appName: 'TakaTracker',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      // ... other SQLite configurations
    }
  }
};
```

### Tailwind Configuration

Custom theme colors and components are defined in `tailwind.config.js` and `src/index.css`.

## 📱 Usage

### First Time Setup
1. **Create Account**: Launch the app and tap "Create one" to register
2. **Fill Details**: Enter username, email, and password (min 6 characters)
3. **Login**: Use your credentials to access the app

### User Authentication
- **Login**: Enter username and password to access your data
- **Session Management**: Stay logged in for 30 days automatically
- **Change Password**: Go to Settings > Change Password
- **Logout**: Settings > Sign Out

### Adding Accounts
1. Go to "Accounts" tab
2. Tap "Add New Account"
3. Enter account name and select type
4. Save to create the account

### Recording Transactions
1. Go to "Transactions" tab or use quick actions on Dashboard
2. Tap "Add" button
3. Select transaction type (Income/Expense)
4. Choose account, enter amount, date, and category
5. Add optional notes
6. Save the transaction

### Viewing Financial Summary
- Dashboard shows total balance, income, and expenses
- Account-wise balances are displayed
- Use quick action buttons for fast transaction entry

### Data Management
- Go to Settings to export your data as JSON
- Use the export feature for backup before major changes
- Clear all data option available (use with caution)

## 🔒 Privacy & Security

- **Local Authentication**: User accounts stored locally with hashed passwords
- **Session Management**: Secure session tokens with expiration
- **Fully Offline**: No data leaves your device
- **Password Hashing**: SHA-256 with salt for secure password storage
- **No Tracking**: No analytics or user behavior tracking
- **Local Storage**: All data stored in device's SQLite database
- **No Permissions**: Minimal Android permissions required

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server (web)
npm run dev

# Build for production
npm run build

# Add Android platform
npx cap add android

# Sync changes to native project
npx cap sync android

# Open in Android Studio
npx cap open android

# Copy web assets to native project
npx cap copy android
```

## 🐛 Troubleshooting

### SQLite Issues
- Ensure you're testing on Android device/emulator for full SQLite functionality
- Web browsers have limited SQLite support

### Build Issues
- Make sure all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`
- Ensure Android Studio and JDK are properly configured

### Android Studio Issues
- Sync Gradle files if prompted
- Ensure Android SDK is up to date
- Check that device/emulator is properly connected

## 🔮 Future Enhancements

- [ ] Data sync across devices (optional cloud backup)
- [ ] Recurring transactions
- [ ] Budget tracking and alerts
- [ ] Charts and analytics
- [ ] CSV import/export
- [ ] Biometric authentication
- [ ] Dark/light theme toggle
- [ ] Multiple currency support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please create an issue in the repository.

---

**TakaTracker** - Your privacy-first expense tracker 🚀