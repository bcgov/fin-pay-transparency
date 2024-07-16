import ApiService, { LOCAL_STORAGE_KEY_JWT } from '../../services/apiService';
import AuthService from '../../services/authService';
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
    jwtToken: localStorage.getItem(LOCAL_STORAGE_KEY_JWT),
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
        localStorage.setItem(LOCAL_STORAGE_KEY_JWT, token);
      } else {
        this.isAuthenticated = false;
        this.jwtToken = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY_JWT);
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
    doesUserHaveRole(roleToCheckFor) {
      return (
        this?.userInfo?.roles?.length &&
        this?.userInfo?.roles.indexOf(roleToCheckFor) >= 0
      );
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
        } else {
          throw new Error('No jwtFrontend');
        }
      } else {
        //inital login and redirect
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
  },
});
