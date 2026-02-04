// src/utils/activityTracker.js

import { message } from 'antd';
import { request } from './helper';

class ActivityTracker {
  constructor() {
    this.timeoutMinutes = 50;
    this.warningMinutes = 5;
    this.checkInterval = 60000;
    this.lastActivityTime = Date.now();
    this.intervalId = null;
    this.warningShown = false;
    this.warningMessageKey = 'inactivity-warning';
  }

  start() {
    this.updateActivity();
    this.setupEventListeners();
    this.startChecking();
    this.fetchConfig();
  }

  async fetchConfig() {
    try {
      const response = await request('config/auto-logout', "get");


      if (response?.timeout_minutes) {
        this.timeoutMinutes = response.timeout_minutes;
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  }

  setupEventListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let throttleTimer = null;

    const throttledUpdate = () => {
      if (!throttleTimer) {
        this.updateActivity();
        throttleTimer = setTimeout(() => { throttleTimer = null; }, 5000);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });
  }

  updateActivity() {
    this.lastActivityTime = Date.now();
    this.warningShown = false;
    message.destroy(this.warningMessageKey);
  }

  startChecking() {
    this.intervalId = setInterval(() => this.checkInactivity(), this.checkInterval);
  }

  checkInactivity() {
    const inactiveMinutes = (Date.now() - this.lastActivityTime) / 60000;



    if (inactiveMinutes >= this.timeoutMinutes) {
      this.handleAutoLogout();
    }
  }



  handleAutoLogout() {
    this.stop();
    message.destroy(this.warningMessageKey);
    message.error(`អ្នកត្រូវបាន logout ដោយសារគ្មានសកម្មភាពរយៈពេល ${this.timeoutMinutes} នាទី`, 5);
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => window.location.href = '/login', 1500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    message.destroy(this.warningMessageKey);
  }
}

export default new ActivityTracker();