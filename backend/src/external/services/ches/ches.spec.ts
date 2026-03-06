import { vi, describe, it, expect } from 'vitest';
import emailService from './ches.js';

vi.mock('./ches-service');

describe('emailService', () => {
  it('should not export the emailService instance', () => {
    expect(emailService).toBeFalsy();
  });
});
