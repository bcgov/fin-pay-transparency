import {defineStore} from 'pinia';

export const appStore = defineStore('app', {
  namespaced: true,
  state: () => ({
    pageTitle: null,

  }),
  getters: {},
  actions: {
    setPageTitle(pageTitle) {
      this.pageTitle = pageTitle;
    },


  },
});


