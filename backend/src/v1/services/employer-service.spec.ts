import { employerService } from '../services/employer-service';
import { EmployerMetrics } from '../types/employers';

const mockCountPayTransparencyCompanies = jest.fn();

jest.mock('../prisma/prisma-client-readonly-replica', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client-readonly-replica'),
  default: {
    pay_transparency_company: {
      count: () => mockCountPayTransparencyCompanies(),
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
});
