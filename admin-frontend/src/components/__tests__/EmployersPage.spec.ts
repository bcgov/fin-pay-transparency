import { createTestingPinia } from '@pinia/testing';
import { fireEvent, render, within } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import EmployersPage from '../EmployersPage.vue';

// eslint-disable-next-line @typescript-eslint/no-require-imports
global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const wrappedRender = async () => {
  return render(EmployersPage, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

describe('EmployersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('required form elements are present', async () => {
    const { getByRole, getByLabelText } = await wrappedRender();
    expect(getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(getByLabelText('Calendar Year(s)')).toBeInTheDocument();
    expect(getByLabelText('Search by employer name')).toBeInTheDocument();
    expect(getByLabelText('First Log In Date Range')).toBeInTheDocument();
  });
  describe('search', () => {
    it('searches and displays the results', async () => {
      const { getByRole } = await wrappedRender();
      const searchBtn = getByRole('button', { name: 'Search' });
      await fireEvent.click(searchBtn);
    });
  });
  describe('reset', () => {
    it('resets the search controls', async () => {
      const { getByRole, getByLabelText } = await wrappedRender();
      const mockSearchText = 'mock employer name';
      const employerName = getByLabelText('Search by employer name');
      const calendarYears = getByLabelText('Calendar Year(s)');
      const resetBtn = getByRole('button', { name: 'Reset' });
      await fireEvent.update(employerName, mockSearchText);
      await fireEvent.update(calendarYears, `${new Date().getFullYear()}`);
      await fireEvent.click(resetBtn);
      expect(employerName).toHaveValue('');
      expect(calendarYears).toHaveValue('');
    });
  });
});
