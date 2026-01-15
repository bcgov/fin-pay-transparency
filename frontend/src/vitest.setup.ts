/**
 * Helps add expect extensions to vitest
 */
import '@testing-library/jest-dom/vitest';

//mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
