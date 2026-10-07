import { hasAiConsent, setAiConsent } from './consent';

describe('AI consent', () => {
  it('defaults to not granted, and can be granted and withdrawn', async () => {
    expect(await hasAiConsent()).toBe(false);
    await setAiConsent(true);
    expect(await hasAiConsent()).toBe(true);
    await setAiConsent(false);
    expect(await hasAiConsent()).toBe(false);
  });
});
