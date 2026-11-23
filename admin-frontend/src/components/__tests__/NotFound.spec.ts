import { describe, expect, it } from 'vitest';
import NotFound from '../NotFound.vue';
import { renderWithPlugins } from '../../test-utils/vuetify.ts';

const wrappedRender = () => {
  return renderWithPlugins(NotFound);
};

describe('NotFound', () => {
  it('should display the correct message', () => {
    const { getByTestId } = wrappedRender();
    expect(getByTestId('not-found-message')).toHaveTextContent(
      'This page cannot be found.',
    );
  });
  it('should display home button', () => {
    const { getByTestId } = wrappedRender();
    const button = getByTestId('dashboard-button');
    expect(button).toHaveTextContent('Return to dashboard');
  });
});
