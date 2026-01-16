// ============================================
// util/sessionManager.js
// Real-time Session Tracking & Heartbeat Manager
// ============================================

import { Config } from "./config";
import { clearTokens } from "../store/profile.store";

class SessionManager {
  constructor() {
    this.heartbeatInterval = null;
    this.sessionToken = null;
    this.heartbeatFrequency = 2 * 60 * 1000; // 2 minutes
    this.isActive = false;
    this.missedHeartbeats = 0;
    this.maxMissedHeartbeats = 3;
  }

  /**
   * Initialize session after successful login
   * @param {string} sessionToken - Session token from server
   */
  initSession(sessionToken) {
    if (!sessionToken) {
      console.error('❌ Cannot initialize session: No session token provided');
      return;
    }

    this.sessionToken = sessionToken;
    this.isActive = true;
    this.missedHeartbeats = 0;
    
    // Store in localStorage
    localStorage.setItem('session_token', sessionToken);
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Setup event listeners
    this.setupEventListeners();
    
  }

  /**
   * Setup event listeners for session management
   */
  setupEventListeners() {
    // Listen for tab/window close
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for user activity to reset heartbeat
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), { passive: true });
    });

  }

  /**
   * Handle user activity - ensure heartbeat is running
   */
  handleUserActivity() {
    if (!this.heartbeatInterval && this.isActive) {
      this.startHeartbeat();
    }
  }

  /**
   * Start sending periodic heartbeat to server
   */
  startHeartbeat() {
    // Clear existing interval if any
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    
    // Send heartbeat immediately
    this.sendHeartbeat();
    
    // Then send periodically
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatFrequency);
  }

  /**
   * Send heartbeat request to server
   */
  async sendHeartbeat() {
    try {
      const accessToken = localStorage.getItem('access_token');
      const sessionToken = this.sessionToken || localStorage.getItem('session_token');

      if (!accessToken || !sessionToken) {
        console.warn('⚠️ No tokens found, stopping heartbeat');
        this.stopHeartbeat();
        return;
      }

      const response = await fetch(`${Config.base_url}auth/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-session-token': sessionToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.missedHeartbeats = 0; // Reset counter on success
      } else {
        this.missedHeartbeats++;
        console.error('❌ Heartbeat failed:', response.status, `(${this.missedHeartbeats}/${this.maxMissedHeartbeats})`);
        
        // If too many missed heartbeats or unauthorized, logout
        if (response.status === 401 || this.missedHeartbeats >= this.maxMissedHeartbeats) {
          console.error('🚪 Too many failed heartbeats or unauthorized, logging out...');
          await this.logout();
          window.location.href = '/login';
        }
      }
    } catch (error) {
      this.missedHeartbeats++;
      console.error('❌ Heartbeat error:', error, `(${this.missedHeartbeats}/${this.maxMissedHeartbeats})`);
      
      // If too many consecutive failures, assume connection lost
      if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
        console.error('🚪 Too many failed heartbeats, logging out...');
        await this.logout();
        window.location.href = '/login';
      }
    }
  }

  /**
   * Stop sending heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle tab/window close event
   */
  handleBeforeUnload(e) {
    
    // Use sendBeacon for reliable logout during page unload
    const accessToken = localStorage.getItem('access_token');
    const sessionToken = this.sessionToken || localStorage.getItem('session_token');

    if (accessToken && sessionToken) {
      const logoutData = JSON.stringify({
        session_token: sessionToken
      });
      
      const url = `${Config.base_url}auth/logout`;
      const blob = new Blob([logoutData], { type: 'application/json' });
      
      // sendBeacon works reliably during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, blob);
      }
    }
    
    this.cleanup();
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Keep heartbeat running even when tab is hidden
      // This ensures user stays "online" while browsing other tabs
    } else {
      
      // When tab becomes visible, ensure heartbeat is running
      if (!this.heartbeatInterval && this.isActive) {
        this.startHeartbeat();
      }
    }
  }

  /**
   * Logout user and cleanup session
   */
  async logout() {
    
    try {
      const accessToken = localStorage.getItem('access_token');
      const sessionToken = this.sessionToken || localStorage.getItem('session_token');

      if (accessToken && sessionToken) {
        // Try to send logout request
        // Use keepalive to ensure request completes even if page is closing
        await fetch(`${Config.base_url}auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-session-token': sessionToken,
            'Content-Type': 'application/json'
          },
          keepalive: true
        }).catch(err => {
          // Ignore errors during logout
          console.warn('Logout request failed:', err);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always cleanup, even if logout request fails
      this.cleanup();
    }
  }

  /**
   * Cleanup session data and stop all activities
   */
  cleanup() {
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Reset state
    this.isActive = false;
    this.sessionToken = null;
    this.missedHeartbeats = 0;
    
    // Clear tokens from store
    clearTokens();
    
    // Remove from localStorage
    localStorage.removeItem('session_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('profile');
    localStorage.removeItem('permission');
    localStorage.removeItem('user_id');
    
    // Remove event listeners
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
  }

  /**
   * Destroy session manager completely
   */
  destroy() {
    this.cleanup();
  }

  /**
   * Get current session status
   * @returns {Object} Session status information
   */
  getStatus() {
    return {
      isActive: this.isActive,
      hasHeartbeat: !!this.heartbeatInterval,
      sessionToken: this.sessionToken,
      missedHeartbeats: this.missedHeartbeats,
      lastHeartbeat: new Date().toISOString()
    };
  }

  /**
   * Check if session is valid
   * @returns {boolean} True if session is valid
   */
  isSessionValid() {
    const accessToken = localStorage.getItem('access_token');
    const sessionToken = this.sessionToken || localStorage.getItem('session_token');
    return !!(accessToken && sessionToken && this.isActive);
  }

  /**
   * Manually trigger a heartbeat (for testing)
   */
  forceHeartbeat() {
    this.sendHeartbeat();
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Export for use throughout the app
export default sessionManager;