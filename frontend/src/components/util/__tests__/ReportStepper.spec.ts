import ReportStepper from '../ReportStepper.vue';
import { describe, it, beforeEach, expect } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/vue';
import { createTestingPinia } from '@pinia/testing';
import {
  ReportStage,
  useReportStepperStore,
} from '../../../store/modules/reportStepper';
import { useRouter } from 'vue-router';

vi.mock('vue-router');

const pinia = createTestingPinia();
const wrappedRender = () => {
  return render(ReportStepper, {
    global: {
      plugins: [pinia],
    },
  });
};

const store = useReportStepperStore();

describe('ReportStepper', () => {
  beforeEach(() => {
    store.$patch({
      stage: 'UPLOAD',
      reportId: undefined,
    });
  });
  describe('defaults', () => {
    it('should default to the upload step', () => {
      const { getByTestId } = wrappedRender();

      expect(getByTestId('report-step-UPLOAD')).toBeInTheDocument();
      expect(getByTestId('report-step-UPLOAD')).toHaveClass('active');
    });
  });

  describe('labels', () => {
    it('should correct label for each step', () => {
      const { getByTestId } = wrappedRender();

      expect(getByTestId('report-step-UPLOAD')).toHaveTextContent('1');
      expect(getByTestId('report-step-REVIEW')).toHaveTextContent('2');
      expect(getByTestId('report-step-FINAL')).toHaveTextContent('3');
    });
  });

  it('should react to stage value in store', async () => {
    const { getByTestId } = wrappedRender();
    expect(getByTestId('report-step-UPLOAD')).toBeInTheDocument();
    expect(getByTestId('report-step-UPLOAD')).toHaveClass('active');
    store.$patch({ stage: 'REVIEW' });
    await waitFor(() => {
      expect(store.stage).toBe('REVIEW');
    });
    expect(getByTestId('report-step-UPLOAD')).not.toHaveClass('active');
    expect(getByTestId('report-step-REVIEW')).toHaveClass('active');
  });

  describe('clicks', () => {
    useRouter.mockReturnValue({
      push: vi.fn(),
    });

    beforeEach(() => {
      useRouter().push.mockReset();
    });

    describe('from upload stage', () => {
      it('should not navigate to review step', async () => {
        const { getByTestId } = wrappedRender();
        expect(getByTestId('report-step-UPLOAD')).toBeInTheDocument();
        expect(getByTestId('report-step-UPLOAD')).toHaveClass('active');
        const reviewButton = getByTestId('report-step-REVIEW');
        expect(reviewButton).toHaveClass('disabled');
        await fireEvent.click(reviewButton);
        expect(store.stage).toBe<ReportStage>('UPLOAD');
      });
      it('should not navigate to final step', async () => {
        const { getByTestId } = wrappedRender();
        expect(getByTestId('report-step-UPLOAD')).toBeInTheDocument();
        expect(getByTestId('report-step-UPLOAD')).toHaveClass('active');
        const finalButton = getByTestId('report-step-FINAL');
        expect(finalButton).toHaveClass('disabled');
        await fireEvent.click(finalButton);
        expect(store.stage).toBe<ReportStage>('UPLOAD');
      });
    });
    describe('from review stage', () => {
      it('should allow navigate to upload step', async () => {
        store.$patch({ stage: 'REVIEW' });
        await waitFor(() => {
          expect(store.stage).toBe<ReportStage>('REVIEW');
        });
        const { getByTestId } = wrappedRender();
        expect(getByTestId('report-step-REVIEW')).toBeInTheDocument();
        expect(getByTestId('report-step-REVIEW')).toHaveClass('active');
        const uploadButton = getByTestId('report-step-UPLOAD');
        expect(uploadButton).not.toHaveClass('disabled');
        await fireEvent.click(uploadButton);
        expect(store.stage).toBe<ReportStage>('UPLOAD');
      });
      it('should not navigate to final step', async () => {
        store.$patch({ stage: 'REVIEW' });
        const { getByTestId } = wrappedRender();
        expect(getByTestId('report-step-REVIEW')).toBeInTheDocument();
        expect(getByTestId('report-step-REVIEW')).toHaveClass('active');
        const finalButton = getByTestId('report-step-FINAL');
        expect(finalButton).toHaveClass('disabled');
        await fireEvent.click(finalButton);
        expect(store.stage).toBe<ReportStage>('REVIEW');
      });
    });

    describe('from final stage', () => {
      it('should not navigate to review step', async () => {
        store.$patch({ stage: 'FINAL' });
        const { getByTestId } = wrappedRender();
        expect(getByTestId('report-step-FINAL')).toBeInTheDocument();
        expect(getByTestId('report-step-FINAL')).toHaveClass('active');
        const reviewButton = getByTestId('report-step-REVIEW');
        expect(reviewButton).toHaveClass('disabled');
        await fireEvent.click(reviewButton);
        expect(store.stage).toBe<ReportStage>('FINAL');
      });
      it('should not navigate to upload step', async () => {
        store.$patch({ stage: 'FINAL' });
        const { getByTestId } = wrappedRender();
        expect(getByTestId('report-step-FINAL')).toBeInTheDocument();
        expect(getByTestId('report-step-FINAL')).toHaveClass('active');
        const uploadButton = getByTestId('report-step-UPLOAD');
        expect(uploadButton).toHaveClass('disabled');
        await fireEvent.click(uploadButton);
        expect(store.stage).toBe<ReportStage>('FINAL');
      });
    });
  });
});
