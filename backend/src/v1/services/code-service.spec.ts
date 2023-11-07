import prisma from '../prisma/prisma-client';
import { codeService } from './code-service';

jest.mock('../prisma/prisma-client', () => {
  return {
    employee_count_range: {
      findMany: jest.fn()
    }
  }
})

afterEach(() => {
  jest.clearAllMocks();
});


describe("getAllEmployeeCountRanges", () => {
  it("returns an array of code values", async () => {
    (prisma.employee_count_range.findMany as jest.Mock).mockResolvedValue([
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
    ])

    const resp1 = await codeService.getAllEmployeeCountRanges();
    const values1 = resp1.map((d: any) => d.employee_count_range);
    expect(resp1.length).toBe(3);
    expect(values1).toContain("1-99");
    expect(values1).toContain("100-499");
    expect(values1).toContain("500+");
    expect(prisma.employee_count_range.findMany).toBeCalledTimes(1);

    //repeat the call to confirm that only one first call caused a DB
    //query, and the second call returned cached data
    const resp2 = await codeService.getAllEmployeeCountRanges();
    const values2 = resp1.map((d: any) => d.employee_count_range);
    expect(resp2.length).toBe(3);
    expect(values2).toContain("1-99");
    expect(values2).toContain("100-499");
    expect(values2).toContain("500+");
    expect(prisma.employee_count_range.findMany).toBeCalledTimes(1);
  })
})
