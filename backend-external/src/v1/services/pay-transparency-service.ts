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
      .get('/external-consumer-api/v1/reports', axiosConfig);
    return { status, data };
  },

  async deleteReports(req: Request) {
    const axiosConfig: AxiosRequestConfig = {
      params: req.query,
      headers: {
        'x-api-key': config.get('backend:apiKey'),
      },
    };
    const { status, data } = await utils.backendAxios().delete<{
      error: boolean;
      message: string;
    }>('/external-consumer-api/v1/reports', axiosConfig);
    return { status, data };
  },

  async getReportErrors(
    startDate: string,
    endDate: string,
    page: string,
    limit: string,
  ) {
    const axiosConfig = {
      params: {
        startDate,
        endDate,
        page,
        limit,
      },
    };
    const { status, data } = await utils
      .backendAxios()
      .get('/external-consumer-api/v1/reports/errors', axiosConfig);
    return { status, data };
  },
};
