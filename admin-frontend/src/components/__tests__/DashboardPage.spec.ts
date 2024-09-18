import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import DashboardPage from '../DashboardPage.vue';
import NumEmployerLogins from '../dashboard/NumEmployerLogins.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('../../services/apiService', () => ({
  default: {
    getReports: vi.fn().mockResolvedValue({ reports: [], total: 0 }),
  },
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('DashboardPage', () => {
  let wrapper;
  let pinia;

  const initWrapper = async () => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(DashboardPage, {
      global: {
        plugins: [vuetify, pinia],
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  //Tests that required UI components appear on the page

  it('The Recently Submitted Reports widget is shown', async () => {
    if (wrapper.vm.isDashboardAvailable) {
      expect(wrapper.findComponent(NumEmployerLogins)).toBeTruthy();
    }
  });
});
