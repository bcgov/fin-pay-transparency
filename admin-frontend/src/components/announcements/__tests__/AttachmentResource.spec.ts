import { fireEvent, render } from '@testing-library/vue';
import AttachmentResource from '../AttachmentResource.vue';
import { describe, it, expect, vi } from 'vitest';
import { FILE_DOWNLOAD_ERROR } from '../../../constants';

const mockDownloadFile = vi.fn();

vi.mock('../../../services/apiService', () => ({
  default: {
    downloadFile: (...args) => mockDownloadFile(...args),
  },
}));

const pushNotificationErrorMock = vi.fn();
vi.mock('../../../services/notificationService', () => ({
  NotificationService: {
    pushNotificationError: (...args) => pushNotificationErrorMock(...args),
  },
}));

describe('AttachmentResource', () => {
  it('should download file', async () => {
    const attachment = {
      id: 1,
      name: 'Test file',
    };
    const { getByLabelText } = await render(AttachmentResource, {
      props: { ...attachment },
    });
    const link = await getByLabelText('Test file');
    expect(link).toBeInTheDocument();
    await fireEvent.click(link);
    await expect(mockDownloadFile).toHaveBeenCalledWith(1);
  });

  it('should display error message when download fails', async () => {
    mockDownloadFile.mockRejectedValue(new Error('Download failed'));
    const attachment = {
      id: 1,
      name: 'Test file',
    };
    const { getByLabelText } = await render(AttachmentResource, {
      props: { ...attachment },
    });
    const link = await getByLabelText('Test file');
    expect(link).toBeInTheDocument();
    await fireEvent.click(link);
    await expect(pushNotificationErrorMock).toHaveBeenCalledWith(FILE_DOWNLOAD_ERROR, '', 30000);
  });
});
