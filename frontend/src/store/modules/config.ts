import { ref } from 'vue';
import { defineStore } from 'pinia';
import ApiService from '../../common/apiService';
import { IConfigValue } from '../../common/types';

export const useConfigStore = defineStore('config', () => {
  const config = ref<IConfigValue>();

  const loadConfig = async () => {
    if (config.value) return;

    const data = await ApiService.getConfig();

    config.value = data;

    return data;
  }

  return { config, loadConfig };
});
