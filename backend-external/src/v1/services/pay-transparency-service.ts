import { utils } from '../../utils';

export const payTransparencyService = {
  async getPayTransparencyData(startDate: string, endDate: string, offset: number, limit: number) {
    const axiosConfig = {
      params: {
        startDate,
        endDate,
        offset,
        limit
      }
    };
    const { status, data } = await utils.backendAxios().get('/external-consumer-api/v1/', axiosConfig);
    return { status, data };
  }
};
