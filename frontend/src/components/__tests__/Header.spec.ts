import { render } from '@testing-library/vue';
import Header from '../Header.vue';
import { describe, it, expect } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

const pinia = createTestingPinia();
const wrappedRender = () => {
  return render(Header, {
    global: {
      plugins: [pinia],
    },
  });
};

describe('Header', () => {
  describe('Authenticated', () => {
    
  });
});
