import { render } from '@testing-library/vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicAnnouncements from '../PublicAnnouncements.vue';
import { createTestingPinia } from '@pinia/testing';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import dashboardMetricsStore from '../../../store/modules/dashboardMetricsStore';

const getAnnouncementsMetricsMock = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getAnnouncementsMetrics: () => {
      return getAnnouncementsMetricsMock();
    },
  },
}));

const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const wrappedRender = () => {
  return render(PublicAnnouncements, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

describe('PublicAnnouncements', () => {
  let store;
  beforeEach(() => {
    vi.clearAllMocks();
    store = dashboardMetricsStore();
  });
  it('should render the component', async () => {
    store.announcementsMetrics = {
      published: { count: 0 },
      draft: { count: 0 },
    };
    const { getByText } = await wrappedRender();
    expect(store.getAnnouncementMetrics).toHaveBeenCalled();
    expect(
      getByText(
        'There are 0 published announcements and 0 draft announcements',
      ),
    ).not.toBeNull();
  });
});
