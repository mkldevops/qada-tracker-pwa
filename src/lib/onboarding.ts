const ONBOARDING_KEY = 'onboarding_done';

export const isOnboardingDone = () => localStorage.getItem(ONBOARDING_KEY) === 'true';
export const markOnboardingDone = () => localStorage.setItem(ONBOARDING_KEY, 'true');
export const markOnboardingUndone = () => localStorage.removeItem(ONBOARDING_KEY);
