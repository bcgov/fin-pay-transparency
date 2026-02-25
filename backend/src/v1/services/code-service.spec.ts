import { vi, describe, it, expect } from 'vitest';
import prisma from '../prisma/__mocks__/prisma-client.js';
import { codeService } from './code-service.js';
import type {
  calculation_code,
  employee_count_range,
  naics_code,
} from '@prisma/client';

vi.mock('../prisma/prisma-client');

describe('getAllEmployeeCountRanges', () => {
  it('returns an array of code values', async () => {
    const mockDBResp = [
      {
        employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
        employee_count_range: '1-99',
      },
      {
        employee_count_range_id: 'c7e1c454-7db9-46c6-b250-1567a543d22f',
        employee_count_range: '100-499',
      },
      {
        employee_count_range_id: '5f26cc90-7960-4e14-9700-87ecd75f0a0f',
        employee_count_range: '500+',
      },
    ] as employee_count_range[];

    prisma.employee_count_range.findMany.mockResolvedValue(mockDBResp);

    // Expect the first call to the function to cause the implementation
    // provide a response by fetching data from a database (also confirm the
    //response contains the expected data)
    const resp1 = await codeService.getAllEmployeeCountRanges();
    const values1 = resp1.map((d: any) => d.employee_count_range);
    expect(prisma.employee_count_range.findMany).toHaveBeenCalledTimes(1);
    expect(resp1).toHaveLength(3);
    expect(values1).toContain(mockDBResp[0].employee_count_range);
    expect(values1).toContain(mockDBResp[1].employee_count_range);
    expect(values1).toContain(mockDBResp[2].employee_count_range);

    // Repeat the call to confirm that only one first call caused a DB
    // query, and the second call returned cached data  (also confirm the
    //response contains the expected data)
    const resp2 = await codeService.getAllEmployeeCountRanges();
    const values2 = resp2.map((d: any) => d.employee_count_range);
    expect(prisma.employee_count_range.findMany).toHaveBeenCalledTimes(1);
    expect(resp2).toHaveLength(3);
    expect(values2).toContain(mockDBResp[0].employee_count_range);
    expect(values2).toContain(mockDBResp[1].employee_count_range);
    expect(values2).toContain(mockDBResp[2].employee_count_range);
  });
});

describe('getAllNaicsCodes', () => {
  it('returns an array of code values', async () => {
    const mockDBResp = [
      {
        naics_code: '1',
        naics_label: 'test1',
      },
      {
        naics_code: '2',
        naics_label: 'test2',
      },
      {
        naics_code: '3',
        naics_label: 'test3',
      },
    ] as naics_code[];

    prisma.naics_code.findMany.mockResolvedValue(mockDBResp);

    // Expect the first call to the function to cause the implementation
    // provide a response by fetching data from a database (also confirm the
    //response contains the expected data)
    const resp1 = await codeService.getAllNaicsCodes();
    const values1 = resp1.map((d: any) => d.naics_code);
    expect(prisma.naics_code.findMany).toHaveBeenCalledTimes(1);
    expect(resp1).toHaveLength(3);
    expect(values1).toContain(mockDBResp[0].naics_code);
    expect(values1).toContain(mockDBResp[1].naics_code);
    expect(values1).toContain(mockDBResp[2].naics_code);

    // Repeat the call to confirm that only one first call caused a DB
    // query, and the second call returned cached data  (also confirm the
    //response contains the expected data)
    const resp2 = await codeService.getAllNaicsCodes();
    const values2 = resp2.map((d: any) => d.naics_code);
    expect(prisma.naics_code.findMany).toHaveBeenCalledTimes(1);
    expect(resp2).toHaveLength(3);
    expect(values2).toContain(mockDBResp[0].naics_code);
    expect(values2).toContain(mockDBResp[1].naics_code);
    expect(values2).toContain(mockDBResp[2].naics_code);
  });
});

describe('getAllCalculationCodesAndIds', () => {
  it('returns an array of code values', async () => {
    const mockDBResp = [
      {
        calculation_code_id: '50da3659-fe7c-4d2d-9fcf-58b653a2bd00',
        calculation_code: 'MEAN_HOURLY_PAY_DIFF_M',
      },
      {
        calculation_code_id: '59ad14f8-6d9a-41c4-a9a9-288150e0e69b',
        calculation_code: 'MEDIAN_HOURLY_PAY_DIFF_W',
      },
      {
        calculation_code_id: '1f689572-8d55-456f-ac91-3fe86e059398',
        calculation_code: 'MEAN_OT_PAY_DIFF_X',
      },
    ] as calculation_code[];
    const expectedResult = {
      MEAN_HOURLY_PAY_DIFF_M: '50da3659-fe7c-4d2d-9fcf-58b653a2bd00',
      MEDIAN_HOURLY_PAY_DIFF_W: '59ad14f8-6d9a-41c4-a9a9-288150e0e69b',
      MEAN_OT_PAY_DIFF_X: '1f689572-8d55-456f-ac91-3fe86e059398',
    };

    prisma.calculation_code.findMany.mockResolvedValue(mockDBResp);

    // Expect the first call to the function to cause the implementation
    // provide a response by fetching data from a database (also confirm the
    //response contains the expected data)
    const resp1 = await codeService.getAllCalculationCodesAndIds();
    expect(prisma.calculation_code.findMany).toHaveBeenCalledTimes(1);
    expect(resp1).toStrictEqual(expectedResult);

    // Repeat the call to confirm that only one first call caused a DB
    // query, and the second call returned cached data  (also confirm the
    //response contains the expected data)
    const resp2 = await codeService.getAllCalculationCodesAndIds();
    expect(prisma.calculation_code.findMany).toHaveBeenCalledTimes(1);
    expect(resp2).toStrictEqual(expectedResult);
  });
});
