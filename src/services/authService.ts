import { databaseService } from '../db/database';
import type { User, LoginCredentials, RegisterData } from '../db/authSchema';

class AuthService {
  private currentUser: User | null = null;
  private currentSession: string | null = null;

  // Simple hash function for passwords (in production, use bcrypt or similar)
  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async register(userData: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Check if username or email already exists
      const existingUsers = await databaseService.executeQuery(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [userData.username, userData.email]
      );

      if (existingUsers.length > 0) {
        const existing = existingUsers[0];
        if (existing.username === userData.username) {
          return { success: false, message: 'Username already exists' };
        }
        if (existing.email === userData.email) {
          return { success: false, message: 'Email already exists' };
        }
      }

      // Validate input
      if (userData.username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters long' };
      }

      if (userData.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
      }

      if (!userData.email.includes('@')) {
        return { success: false, message: 'Please enter a valid email address' };
      }

      // Hash password
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(userData.password, salt);

      // Create user
      const result = await databaseService.executeQuery(
        'INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)',
        [userData.username, userData.email, passwordHash, salt]
      );

      const userId = result[0];

      const user: User = {
        id: userId,
        username: userData.username,
        email: userData.email,
        is_active: true
      };

      return { success: true, message: 'Account created successfully', user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Failed to create account. Please try again.' };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Get user by username
      const users = await databaseService.executeQuery(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [credentials.username]
      );

      if (users.length === 0) {
        return { success: false, message: 'Invalid username or password' };
      }

      const user = users[0];

      // Verify password
      const hashedPassword = await this.hashPassword(credentials.password, user.salt);
      if (hashedPassword !== user.password_hash) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      await databaseService.executeQuery(
        'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
        [user.id, sessionToken, expiresAt]
      );

      // Update last login
      await databaseService.executeQuery(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), user.id]
      );

      // Set current user and session
      this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        is_active: user.is_active
      };
      this.currentSession = sessionToken;

      // Store in localStorage for persistence
      localStorage.setItem('takatracker_session', sessionToken);
      localStorage.setItem('takatracker_user', JSON.stringify(this.currentUser));

      return { success: true, message: 'Login successful', user: this.currentUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        // Remove session from database
        await databaseService.executeQuery(
          'DELETE FROM user_sessions WHERE session_token = ?',
          [this.currentSession]
        );
      }

      // Clear current user and session
      this.currentUser = null;
      this.currentSession = null;

      // Clear localStorage
      localStorage.removeItem('takatracker_session');
      localStorage.removeItem('takatracker_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async checkSession(): Promise<boolean> {
    try {
      const sessionToken = localStorage.getItem('takatracker_session');
      const userStr = localStorage.getItem('takatracker_user');

      if (!sessionToken || !userStr) {
        return false;
      }

      // Check if session is valid and not expired
      const sessions = await databaseService.executeQuery(
        'SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > ?',
        [sessionToken, new Date().toISOString()]
      );

      if (sessions.length === 0) {
        // Session expired or invalid
        this.logout();
        return false;
      }

      // Restore user session
      this.currentUser = JSON.parse(userStr);
      this.currentSession = sessionToken;

      return true;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!this.currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      // Get current user data
      const users = await databaseService.executeQuery(
        'SELECT password_hash, salt FROM users WHERE id = ?',
        [this.currentUser.id]
      );

      if (users.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const user = users[0];

      // Verify current password
      const currentHash = await this.hashPassword(currentPassword, user.salt);
      if (currentHash !== user.password_hash) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password
      if (newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long' };
      }

      // Hash new password
      const newSalt = this.generateSalt();
      const newHash = await this.hashPassword(newPassword, newSalt);

      // Update password
      await databaseService.executeQuery(
        'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?',
        [newHash, newSalt, this.currentUser.id]
      );

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }
}

export const authService = new AuthService();