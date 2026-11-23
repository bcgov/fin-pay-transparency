import { renderWithPlugins } from '../../../test-utils/vuetify';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicAnnouncements from '../PublicAnnouncements.vue';
import { createTestPlugins } from '../../../test-utils/vuetify';
import dashboardMetricsStore from '../../../store/modules/dashboardMetricsStore';

const getAnnouncementsMetricsMock = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getAnnouncementsMetrics: () => {
      return getAnnouncementsMetricsMock();
    },
  },
}));

const plugins = createTestPlugins();

const wrappedRender = () => {
  return renderWithPlugins(PublicAnnouncements, {
    global: {
      plugins: plugins.plugins,
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
