import { describe, it, expect } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { ref } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ConfirmationDialog from '../ConfirmationDialog.vue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface OpenOptions {
  title?: string;
  message?: string;
  options?: Record<string, unknown>;
  contentClass?: string;
}

/**
 * Renders ConfirmationDialog inside a thin wrapper that calls open() on mount
 * and exposes the resulting promise via window.__testDialogPromise so tests
 * can await the resolution value.
 */
async function renderAndOpen({
  title = 'Confirm Action',
  message = 'Are you sure?',
  options = {},
  contentClass = '',
}: OpenOptions = {}) {
  const user = userEvent.setup();
  const vuetify = createVuetify({ components, directives });

  // The wrapper calls open() imperatively and stores the promise so each test
  // can await the resolved value independently.
  const Wrapper = {
    components: { ConfirmationDialog },
    setup() {
      const dialogRef = ref<InstanceType<typeof ConfirmationDialog> | null>(
        null,
      );
      const resultRef = ref<boolean | null>(null);

      async function triggerOpen() {
        const result = await dialogRef.value!.open(title, message, options);
        resultRef.value = result;
      }

      return { dialogRef, resultRef, triggerOpen };
    },
    template: `
      <div>
        <button data-testid="open-dialog" @click="triggerOpen">Open</button>
        <span v-if="resultRef !== null" data-testid="result">{{ String(resultRef) }}</span>
        <ConfirmationDialog ref="dialogRef" content-class="${contentClass}" />
      </div>
    `,
  };

  render(Wrapper, { global: { plugins: [vuetify] } });

  await user.click(screen.getByTestId('open-dialog'));
  await flushPromises();

  return { user };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConfirmationDialog', () => {
  // -------------------------------------------------------------------------
  // open() — content
  // -------------------------------------------------------------------------

  describe('open()', () => {
    it('displays the title passed to open()', async () => {
      await renderAndOpen({ title: 'Delete Item' });
      expect(screen.getByText('Delete Item')).toBeVisible();
    });

    it('displays the message passed to open()', async () => {
      await renderAndOpen({ message: 'This cannot be undone.' });
      expect(screen.getByText('This cannot be undone.')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // agree() — resolves true
  // -------------------------------------------------------------------------

  describe('agree()', () => {
    it('resolves the promise with true when the Yes button is clicked', async () => {
      const { user } = await renderAndOpen();
      await user.click(screen.getByRole('button', { name: 'Yes' }));
      await flushPromises();
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });

    it('closes the dialog when the Yes button is clicked', async () => {
      const { user } = await renderAndOpen();
      await user.click(screen.getByRole('button', { name: 'Yes' }));
      await flushPromises();
      expect(screen.queryByText('Are you sure?')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // cancel() — resolves false
  // -------------------------------------------------------------------------

  describe('cancel()', () => {
    it('resolves the promise with false when the Cancel button is clicked', async () => {
      const { user } = await renderAndOpen();
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await flushPromises();
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });

    it('closes the dialog when the Cancel button is clicked', async () => {
      const { user } = await renderAndOpen();
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await flushPromises();
      expect(screen.queryByText('Are you sure?')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Button text — defaults and overrides
  // -------------------------------------------------------------------------

  describe('button text', () => {
    it('shows "Yes" as the default resolve button text', async () => {
      await renderAndOpen();
      expect(screen.getByRole('button', { name: 'Yes' })).toBeVisible();
    });

    it('shows "Cancel" as the default reject button text', async () => {
      await renderAndOpen();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });

    it('shows custom resolveText when provided', async () => {
      await renderAndOpen({ options: { resolveText: 'Delete' } });
      expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible();
    });

    it('shows custom rejectText when provided', async () => {
      await renderAndOpen({ options: { rejectText: 'Go Back' } });
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // resolveDisabled option
  // -------------------------------------------------------------------------

  describe('resolveDisabled option', () => {
    it('disables the resolve button when resolveDisabled is true', async () => {
      await renderAndOpen({ options: { resolveDisabled: true } });
      expect(
        screen.getByRole('button', { name: 'Yes' }).closest('button'),
      ).toBeDisabled();
    });

    it('enables the resolve button when resolveDisabled is false', async () => {
      await renderAndOpen({ options: { resolveDisabled: false } });
      expect(
        screen.getByRole('button', { name: 'Yes' }).closest('button'),
      ).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // closeIcon option
  // -------------------------------------------------------------------------

  describe('closeIcon option', () => {
    it('does not render the close icon button by default', async () => {
      await renderAndOpen();
      expect(document.getElementById('closeBtn')).not.toBeInTheDocument();
    });

    it('renders the close icon button when closeIcon is true', async () => {
      await renderAndOpen({ options: { closeIcon: true } });
      expect(document.getElementById('closeBtn')).toBeVisible();
    });

    it('resolves the promise with false when the close icon button is clicked', async () => {
      const { user } = await renderAndOpen({ options: { closeIcon: true } });
      await user.click(document.getElementById('closeBtn')!);
      await flushPromises();
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });

  // -------------------------------------------------------------------------
  // divider option
  // -------------------------------------------------------------------------

  describe('divider option', () => {
    it('does not render the divider by default', async () => {
      await renderAndOpen();
      expect(document.querySelector('.v-divider')).not.toBeInTheDocument();
    });

    it('renders the divider when divider is true', async () => {
      await renderAndOpen({ options: { divider: true } });
      expect(document.querySelector('.v-divider')).toBeVisible();
    });
  });
});
