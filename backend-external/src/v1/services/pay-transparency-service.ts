import { AxiosRequestConfig } from 'axios';
import { utils } from '../../utils';
import { config } from '../../config';
import { Request } from 'express';

export const payTransparencyService = {
  async getPayTransparencyData(
    startDate: string,
    endDate: string,
    offset: number,
    limit: number,
  ) {
    const axiosConfig = {
      params: {
        startDate,
        endDate,
        offset,
        limit,
      },
    };
    const { status, data } = await utils
      .backendAxios()
      .get('/external-consumer-api/v1/', axiosConfig);
    return { status, data };
  },
  async deleteReports(req: Request) {
    const axiosConfig: AxiosRequestConfig = {
      params: req.params,
      headers: {
        'x-api-key': config.get('backend:deleteReportsApiKey'),
      },
    };
    const { status, data } = await utils.backendAxios().delete<{
      error: boolean;
      message: string;
    }>('/external-consumer-api/v1/delete-reports', axiosConfig);
    return { status, data };
  },
};
