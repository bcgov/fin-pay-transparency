import { employerService } from '../services/employer-service';
import { EmployerKeyEnum, EmployerMetrics } from '../types/employers';

const mockCountPayTransparencyCompanies = jest.fn();
const mockFindManyPayTransparencyCompanies = jest.fn();

jest.mock('../prisma/prisma-client-readonly-replica', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client-readonly-replica'),
  default: {
    pay_transparency_company: {
      count: () => mockCountPayTransparencyCompanies(),
      findMany: (...args) => mockFindManyPayTransparencyCompanies(...args),
    },
  },
}));

describe('employer-service', () => {
  describe('getEmployerMetrics', () => {
    it('delegates request to the database', async () => {
      const numCompaniesLoggedOnToDate = 16;
      mockCountPayTransparencyCompanies.mockResolvedValue(
        numCompaniesLoggedOnToDate,
      );
      const employerMetrics: EmployerMetrics =
        await employerService.getEmployerMetrics();
      expect(employerMetrics.num_employers_logged_on_to_date).toBe(
        numCompaniesLoggedOnToDate,
      );
    });
  });
  describe('getEmployer', () => {
    it('prisma queries to be formed correctly', async () => {
      await employerService.getEmployer(
        50, //limit:
        0, //offset:
        [
          //sort:
          { field: 'create_date', order: 'asc' },
          { field: 'company_name', order: 'desc' },
        ],
        [
          //filter:
          { key: EmployerKeyEnum.Name, operation: 'like', value: 'bc' },
          {
            key: EmployerKeyEnum.Year,
            operation: 'in',
            value: [2023, 2024],
          },
        ],
      );
      expect(mockFindManyPayTransparencyCompanies).toHaveBeenCalledWith({
        orderBy: [{ create_date: 'asc' }, { company_name: 'desc' }],
        select: { company_id: true, company_name: true, create_date: true },
        skip: 0,
        take: 50,
        where: {
          OR: [
            {
              create_date: {
                gte: new Date('2023-01-01T00:00:00.000Z'),
                lt: new Date('2024-01-01T00:00:00.000Z'),
              },
            },
            {
              create_date: {
                gte: new Date('2024-01-01T00:00:00.000Z'),
                lt: new Date('2025-01-01T00:00:00.000Z'),
              },
            },
          ],
          company_name: { contains: 'bc', mode: 'insensitive' },
        },
      });
      expect(mockCountPayTransparencyCompanies).toHaveBeenCalled();
    });
    it('default to work', async () => {
      await employerService.getEmployer();
      expect(mockFindManyPayTransparencyCompanies).toHaveBeenCalledWith({
        orderBy: [{ company_name: 'asc' }],
        select: { company_id: true, company_name: true, create_date: true },
        skip: 0,
        take: 1000,
        where: {},
      });
      expect(mockCountPayTransparencyCompanies).toHaveBeenCalled();
    });
  });
});
