import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { EmployerMetrics } from '../types/employers';

export const employerService = {
  /**
   * Get employer metrics
   * @returns EmployerMetrics
   */
  async getEmployerMetrics(): Promise<EmployerMetrics> {
    const numEmployers =
      await prismaReadOnlyReplica.pay_transparency_company.count();
    return {
      num_employers_logged_on_to_date: numEmployers,
    };
  },
};
