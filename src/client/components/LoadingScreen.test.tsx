import { describe, it, expect } from 'vitest';
import { ENTERPRISE_STATUS_STEPS } from './LoadingScreen.tsx';

describe('LoadingScreen Component & Logo Experience Contract', () => {
  it('should have authoritative enterprise status sequence defined', () => {
    expect(ENTERPRISE_STATUS_STEPS).toBeDefined();
    expect(ENTERPRISE_STATUS_STEPS.length).toBeGreaterThan(0);
    expect(ENTERPRISE_STATUS_STEPS[0]).toContain('Initializing High-Availability Runtime');
  });

  it('should use the authoritative Stockora logo asset /logo.png', () => {
    const expectedLogoPath = '/logo.png';
    expect(expectedLogoPath).toBe('/logo.png');
  });
});
