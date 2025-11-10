// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Only run cleanup if it's available
if (typeof cleanup === 'function') {
  afterEach(() => {
    cleanup();
  });
}