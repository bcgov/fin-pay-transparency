import { createTestingPinia } from '@pinia/testing';
import { render, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { EmployerMetrics } from '../../../types/employers';
import NumEmployerLogons from '../NumEmployerLogons.vue';

const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const mockEmployerMetrics: EmployerMetrics = {
  num_employers_logged_on_to_date: 6,
  num_employers_logged_on_this_year: 4,
};
const mockGetEmployerMetrics = vi.fn().mockResolvedValue(mockEmployerMetrics);

vi.mock('../../../services/apiService', () => ({
  default: {
    getEmployerMetrics: (...args) => {
      return mockGetEmployerMetrics(...args);
    },
  },
}));

const wrappedRender = () => {
  return render(NumEmployerLogons, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

describe('NumEmployerLogons', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

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
