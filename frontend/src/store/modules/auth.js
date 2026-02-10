import ApiService from '../../common/apiService';
import AuthService from '../../common/authService';
import { defineStore } from 'pinia';

function isFollowUpVisit(jwtToken) {
  return !!jwtToken;
}

export const authStore = defineStore('auth', {
  namespaced: true,
  state: () => ({
    acronyms: [],
    isAuthenticated: false,
    userInfo: null,
    error: false,
    isLoading: true,
    loginError: false,
    jwtToken: localStorage.getItem('jwtToken'),
    lastActivity: null,
    issuedTime: null,
    expiryTime: null,
    keepAliveTimeoutId: null,
  }),
  getters: {
    acronymsGet: (state) => state.acronyms,
    isAuthenticatedGet: (state) => state.isAuthenticated,
    jwtTokenGet: (state) => state.jwtToken,
    userInfoGet: (state) => state.userInfo,
    loginErrorGet: (state) => state.loginError,
    errorGet: (state) => state.error,
    isLoadingGet: (state) => state.isLoading,
  },
  actions: {
    //sets Json web token and determines whether user is authenticated
    async setJwtToken(token = null) {
      if (token) {
        this.isAuthenticated = true;
        this.jwtToken = token;
        localStorage.setItem('jwtToken', token);
      } else {
        this.isAuthenticated = false;
        this.jwtToken = null;
        localStorage.removeItem('jwtToken');
      }
    },
    setCorrelationID(correlationID) {
      if (correlationID) {
        localStorage.setItem('correlationID', correlationID);
      } else {
        localStorage.removeItem('correlationID');
      }
    },
    async setUserInfo(userInfo) {
      if (userInfo) {
        this.userInfo = userInfo;
      } else {
        this.userInfo = null;
      }
    },
    async setLoginError() {
      this.loginError = true;
    },
    async setError(error) {
      this.error = error;
    },
    async setLoading(isLoading) {
      this.isLoading = isLoading;
    },
    async loginErrorRedirect() {
      this.loginError = true;
    },
    async logout() {
      await this.setJwtToken();
      await this.setUserInfo();
    },
    async getUserInfo() {
      const userInfoRes = await ApiService.getUserInfo();
      this.userInfo = userInfoRes.data;
    },
    //retrieves the json web token from local storage. If not in local storage, retrieves it from API
    async getJwtToken() {
      await this.setError(false);
      if (isFollowUpVisit(this.jwtToken)) {
        const response = await AuthService.refreshAuthToken(
          this.jwtToken,
          localStorage.getItem('correlationID'),
        );
        if (response.jwtFrontend) {
          await this.setJwtToken(response.jwtFrontend);
          this.setCorrelationID(response.correlationID);
          ApiService.setAuthHeader(response.jwtFrontend);
          ApiService.setCorrelationID(response.correlationID);
          this.expiryTime = new Date(response.exp * 1000);
          this.issuedTime = new Date(response.iat * 1000);
        } else {
          throw new Error('No jwtFrontend');
        }
      } else {
        //initial login and redirect
        const response = await AuthService.getAuthToken();

        if (response.jwtFrontend) {
          await this.setJwtToken(response.jwtFrontend);
          this.setCorrelationID(response.correlationID);
          ApiService.setAuthHeader(response.jwtFrontend);
          ApiService.setCorrelationID(response.correlationID);
        } else {
          throw new Error('No jwtFrontend');
        }
      }
    },
    _updateActivity() {
      this.lastActivity = new Date();
    },
    async _refreshOnActivity() {
      //if the last activity was after the issued time, refresh the token
      if (this.lastActivity > this.issuedTime) {
        await this.getJwtToken();
      }

      // Choose next interval to check for activity, but don't set it longer than the time remaining until 1 minute before token expiry
      const timeToExpiry = this.expiryTime - new Date();
      const oneMinuteBeforeExpiry = timeToExpiry - 1 * 60 * 1000;
      if (oneMinuteBeforeExpiry > 0) {
        // Duration is the lesser of 10 minutes or the time remaining until 1 minute before token expiry
        const duration = Math.min(10 * 60 * 1000, oneMinuteBeforeExpiry);
        this.keepAliveTimeoutId = setTimeout(this._refreshOnActivity, duration);
      } else {
        //if less than one minute, then let the token expire.
        this.stopKeepAlive();
      }
    },
    keepAlive() {
      // Track user activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach((event) => {
        document.addEventListener(event, this._updateActivity, {
          passive: true,
        });
      });

      // Refresh token periodically
      this._refreshOnActivity();
    },
    stopKeepAlive() {
      clearTimeout(this.keepAliveTimeoutId);
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach((event) => {
        document.removeEventListener(event, this._updateActivity);
      });
    },
  },
});
