import { defineStore } from 'pinia';
import { ref } from 'vue';
import ApiService from '../../services/apiService';
import { IConfigValue } from '../../types';

export const useConfigStore = defineStore('config', () => {
  const config = ref<IConfigValue>();

  const loadConfig = async () => {
    if (config.value) return config.value;

    const data = await ApiService.getConfig();

    config.value = data;

    return data;
  };

  return { config, loadConfig };
});
