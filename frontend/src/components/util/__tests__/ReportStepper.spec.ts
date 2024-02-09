import ReportStepper from '../ReportStepper.vue';
import { describe, it, beforeEach, expect } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/vue';
import { createTestingPinia } from '@pinia/testing';
import { useReportStepperStore } from '../../../store/modules/reportStepper';

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
      reportId: undefined
    });
  });
  describe('defaults', () => {
    it('should default to the upload step', () => {
      const { getByTestId } = wrappedRender();

      expect(getByTestId('report-step-UPLOAD')).toBeInTheDocument();
      expect(getByTestId('report-step-UPLOAD')).toHaveClass('active');
    });
  });

  describe('actions', () => {
    it('should set new stage on click', async () => {
      const { getByTestId } = wrappedRender();

      expect(getByTestId('report-step-UPLOAD')).toBeInTheDocument();
      expect(getByTestId('report-step-UPLOAD')).toHaveClass('active');
      await fireEvent.click(getByTestId('report-step-REVIEW'));
      await waitFor(() => {
        expect(getByTestId('report-step-REVIEW')).toHaveClass('active');
        expect(getByTestId('report-step-UPLOAD')).not.toHaveClass('active');
      })
    });
  })

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
});
