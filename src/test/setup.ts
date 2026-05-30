import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
});

const activeAnimationFrames = new Set<number>();

const requestAnimationFrameMock = (callback: FrameRequestCallback) => {
  const id = window.setTimeout(() => {
    activeAnimationFrames.delete(id);
    callback(Date.now());
  }, 16);

  activeAnimationFrames.add(id);
  return id;
};

const cancelAnimationFrameMock = (id: number) => {
  activeAnimationFrames.delete(id);
  clearTimeout(id);
};

Object.defineProperty(window, 'requestAnimationFrame', {
  value: requestAnimationFrameMock,
  writable: true
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: cancelAnimationFrameMock,
  writable: true
});

Object.defineProperty(globalThis, 'requestAnimationFrame', {
  value: requestAnimationFrameMock,
  writable: true
});

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  value: cancelAnimationFrameMock,
  writable: true
});

Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true
});

class MockIntersectionObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true
});

class MockResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }),
  writable: true
});

afterEach(() => {
  for (const id of activeAnimationFrames) {
    clearTimeout(id);
  }

  activeAnimationFrames.clear();
});
