// additional 'expect' methods for testing-library
import '@testing-library/jest-dom/vitest';

//mock ResizeObserver
class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
}

globalThis.ResizeObserver = ResizeObserver;
