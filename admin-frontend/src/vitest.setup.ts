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

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Stub the global visualViewport
vi.stubGlobal('visualViewport', new EventTarget());
