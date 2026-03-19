import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createTestingPinia } from '@pinia/testing';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import Login from '../Login.vue';
import { authStore } from '../../store/modules/auth';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@braintree/sanitize-url', () => ({
  sanitizeUrl: vi.fn((url: string) => url),
}));

Object.defineProperty(window, 'config', {
  value: {},
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderComponent() {
  const user = userEvent.setup();
  const vuetify = createVuetify({ components, directives });

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      auth: {
        isAuthenticated: false,
      },
    },
  });

  const result = render(Login, {
    global: {
      plugins: [pinia, vuetify],
    },
  });

  const store = authStore();

  return { ...result, user, store };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login', () => {
  // -------------------------------------------------------------------------
  // Static content
  // -------------------------------------------------------------------------

  describe('static content', () => {
    it('renders the welcome heading', async () => {
      await renderComponent();
      expect(
        screen.getByText('Welcome to the Pay Transparency Reporting Tool'),
      ).toBeVisible();
    });

    it('renders the login button', async () => {
      await renderComponent();
      expect(screen.getByTestId('login-button')).toBeVisible();
    });

    it('renders the Upload step button', async () => {
      await renderComponent();
      expect(screen.getByRole('button', { name: 'Upload' })).toBeVisible();
    });

    it('renders the Review step button', async () => {
      await renderComponent();
      expect(screen.getByRole('button', { name: 'Review' })).toBeVisible();
    });

    it('renders the Generate step button', async () => {
      await renderComponent();
      expect(screen.getByRole('button', { name: 'Generate' })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Initial stage: UPLOAD
  // -------------------------------------------------------------------------

  describe('initial stage (UPLOAD)', () => {
    it('shows the Upload stage description', async () => {
      await renderComponent();
      expect(screen.getByText("Upload your company's data")).toBeVisible();
    });

    it('shows the Download sample CSV button', async () => {
      await renderComponent();
      expect(screen.getByText('Download sample CSV')).toBeVisible();
    });

    it('does not show the Review stage description', async () => {
      await renderComponent();
      expect(screen.getByText('Review and validate')).not.toBeVisible();
    });

    it('does not show the Generate stage description', async () => {
      await renderComponent();
      expect(screen.getByText('Generate your report')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Stage switching
  // -------------------------------------------------------------------------

  describe('changeStage', () => {
    it('shows the Review description when the Review button is clicked', async () => {
      const { user } = await renderComponent();
      await user.click(screen.getByRole('button', { name: 'Review' }));
      expect(screen.getByText('Review and validate')).toBeVisible();
    });

    it('hides the Upload description after switching to Review', async () => {
      const { user } = await renderComponent();
      await user.click(screen.getByRole('button', { name: 'Review' }));
      expect(screen.getByText("Upload your company's data")).not.toBeVisible();
    });

    it('shows the Generate description when the Generate button is clicked', async () => {
      const { user } = await renderComponent();
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      expect(screen.getByText('Generate your report')).toBeVisible();
    });

    it('shows the View sample report button in the Generate stage', async () => {
      const { user } = await renderComponent();
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      expect(screen.getByText('View sample report')).toBeVisible();
    });

    it('switches back to the Upload description when Upload is clicked after another stage', async () => {
      const { user } = await renderComponent();
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await user.click(screen.getByRole('button', { name: 'Upload' }));
      expect(screen.getByText("Upload your company's data")).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Login button
  // -------------------------------------------------------------------------

  describe('clearStorageAndRedirectToLogin', () => {
    it('calls authStore().setJwtToken when the login button is clicked', async () => {
      const { user, store } = await renderComponent();
      await user.click(screen.getByTestId('login-button'));
      expect(store.setJwtToken).toHaveBeenCalled();
    });

    it('redirects to the BCeID login URL when the login button is clicked', async () => {
      const { user } = await renderComponent();
      Object.defineProperty(window, 'location', {
        value: { href: 'temp' },
        writable: true,
      });
      await user.click(screen.getByTestId('login-button'));
      expect(globalThis.location.href).toContain('Bceid');
    });
  });
});
