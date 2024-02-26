import { render } from '@testing-library/vue';
import NotFound from '../NotFound.vue';
import { describe, it, expect } from 'vitest';

const wrappedRender = () => {
  return render(NotFound);
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
