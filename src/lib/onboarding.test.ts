import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isOnboardingDone, markOnboardingDone, markOnboardingUndone } from './onboarding';

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

describe('isOnboardingDone', () => {
	it('returns false when localStorage is empty', () => {
		expect(isOnboardingDone()).toBe(false);
	});

	it('returns false when key has unexpected value', () => {
		localStorage.setItem('onboarding_done', 'yes');
		expect(isOnboardingDone()).toBe(false);
	});

	it('returns true after markOnboardingDone', () => {
		markOnboardingDone();
		expect(isOnboardingDone()).toBe(true);
	});
});

describe('markOnboardingDone', () => {
	it('sets the localStorage key to "true"', () => {
		markOnboardingDone();
		expect(localStorage.getItem('onboarding_done')).toBe('true');
	});

	it('is idempotent — calling twice still returns true', () => {
		markOnboardingDone();
		markOnboardingDone();
		expect(isOnboardingDone()).toBe(true);
	});
});

describe('markOnboardingUndone', () => {
	it('removes the key so isOnboardingDone returns false', () => {
		markOnboardingDone();
		markOnboardingUndone();
		expect(isOnboardingDone()).toBe(false);
	});

	it('is safe to call when key does not exist', () => {
		expect(() => markOnboardingUndone()).not.toThrow();
		expect(isOnboardingDone()).toBe(false);
	});
});
