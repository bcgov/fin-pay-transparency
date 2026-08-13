import { vi } from 'vitest';

// additional 'expect' methods for testing-library
import '@testing-library/jest-dom/vitest';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(function ResizeObserver() {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});

// Stubs
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('visualViewport', new EventTarget());
vi.stubGlobal('scrollTo', vi.fn());
