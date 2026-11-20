import { screen, waitFor } from '@testing-library/vue';
import { renderWithPlugins } from '../../../test-utils/vuetify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmployerMetrics } from '../../../types/employers';
import NumEmployerLogons from '../NumEmployerLogons.vue';

const mockEmployerMetrics: EmployerMetrics = {
  num_employers_logged_on_to_date: 6,
  num_employers_logged_on_this_year: 4,
};
const mockGetEmployerMetrics = vi.fn(async () => mockEmployerMetrics);

vi.mock('../../../services/apiService', () => ({
  default: {
    getEmployerMetrics: () => {
      return mockGetEmployerMetrics();
    },
  },
}));

const wrappedRender = () => {
  return renderWithPlugins(NumEmployerLogons);
};

describe('NumEmployerLogons', () => {
  it('displays the number of employers who have logged on to date', async () => {
    await wrappedRender();
    expect(mockGetEmployerMetrics).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(
          `${mockEmployerMetrics.num_employers_logged_on_to_date}`,
          {
            exact: true,
          },
        ),
      ).toBeInTheDocument();
    });
  });

  it('displays the number of employers who have logged on this year', async () => {
    await wrappedRender();
    expect(mockGetEmployerMetrics).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(
          `${mockEmployerMetrics.num_employers_logged_on_this_year}`,
          {
            exact: true,
          },
        ),
      ).toBeInTheDocument();
    });
  });
});
