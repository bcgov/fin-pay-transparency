import prisma from '../prisma/prisma-client';
import { codeService } from './code-service';

jest.mock('../prisma/prisma-client', () => {
  return {
    employee_count_range: {
      findMany: jest.fn()
    },
    naics_code: {
      findMany: jest.fn()
    }
  }
})

afterEach(() => {
  jest.clearAllMocks();
});


describe("getAllEmployeeCountRanges", () => {
  it("returns an array of code values", async () => {
    const mockDBResp = [
      {
        employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
        employee_count_range: '1-99'
      },
      {
        employee_count_range_id: 'c7e1c454-7db9-46c6-b250-1567a543d22f',
        employee_count_range: '100-499'
      },
      {
        employee_count_range_id: '5f26cc90-7960-4e14-9700-87ecd75f0a0f',
        employee_count_range: '500+'
      },
    ];

    (prisma.employee_count_range.findMany as jest.Mock).mockResolvedValue(mockDBResp)

    // Expect the first call to the function to cause the implementation 
    // provide a response by fetching data from a database (also confirm the
    //response contains the expected data)
    const resp1 = await codeService.getAllEmployeeCountRanges();
    const values1 = resp1.map((d: any) => d.employee_count_range);
    expect(prisma.employee_count_range.findMany).toBeCalledTimes(1);
    expect(resp1.length).toBe(3);
    expect(values1).toContain(mockDBResp[0].employee_count_range);
    expect(values1).toContain(mockDBResp[1].employee_count_range);
    expect(values1).toContain(mockDBResp[2].employee_count_range);
    
    // Repeat the call to confirm that only one first call caused a DB
    // query, and the second call returned cached data  (also confirm the
    //response contains the expected data)
    const resp2 = await codeService.getAllEmployeeCountRanges();
    const values2 = resp2.map((d: any) => d.employee_count_range);
    expect(prisma.employee_count_range.findMany).toBeCalledTimes(1);
    expect(resp2.length).toBe(3);
    expect(values2).toContain(mockDBResp[0].employee_count_range);
    expect(values2).toContain(mockDBResp[1].employee_count_range);
    expect(values2).toContain(mockDBResp[2].employee_count_range);
    
  })
});

describe("getAllNaicsCodes", () => {
  it("returns an array of code values", async () => {
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
    ];

    (prisma.naics_code.findMany as jest.Mock).mockResolvedValue(mockDBResp)

    // Expect the first call to the function to cause the implementation 
    // provide a response by fetching data from a database (also confirm the
    //response contains the expected data)
    const resp1 = await codeService.getAllNaicsCodes();
    const values1 = resp1.map((d: any) => d.naics_code);
    expect(prisma.naics_code.findMany).toBeCalledTimes(1);
    expect(resp1.length).toBe(3);
    expect(values1).toContain(mockDBResp[0].naics_code);
    expect(values1).toContain(mockDBResp[1].naics_code);
    expect(values1).toContain(mockDBResp[2].naics_code);
    
    // Repeat the call to confirm that only one first call caused a DB
    // query, and the second call returned cached data  (also confirm the
    //response contains the expected data)
    const resp2 = await codeService.getAllNaicsCodes();
    const values2 = resp2.map((d: any) => d.naics_code);
    expect(prisma.naics_code.findMany).toBeCalledTimes(1);
    expect(resp2.length).toBe(3);
    expect(values2).toContain(mockDBResp[0].naics_code);
    expect(values2).toContain(mockDBResp[1].naics_code);
    expect(values2).toContain(mockDBResp[2].naics_code);
    
  })
});