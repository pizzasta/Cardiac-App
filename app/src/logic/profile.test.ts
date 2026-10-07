import { QUIZ } from '../data/quiz';
import { clearProfile, loadProfile, parseProfile, saveProfile, serializeProfile } from './profile';

const result = { animal: 'wolf' as const, peak: 'night', crash: 'mid-morning', recharge: 'novelty' };
const answers = QUIZ.map((q) => q.options[1]);

describe('profile persistence', () => {
  it('round-trips the result and rehydrates answers from the quiz', () => {
    const back = parseProfile(serializeProfile(result, answers));
    expect(back?.result).toEqual(result);
    expect(back?.answers).toHaveLength(QUIZ.length);
    expect(back?.answers[0]).toBe(QUIZ[0].options[1]);
  });

  it('rejects malformed or unknown data', () => {
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile('not json')).toBeNull();
    expect(parseProfile(JSON.stringify({ result: { animal: 'unicorn', peak: '', crash: '', recharge: '' } }))).toBeNull();
  });

  it('saves, loads and clears through storage', async () => {
    await saveProfile(result, answers);
    expect((await loadProfile())?.result.animal).toBe('wolf');
    await clearProfile();
    expect(await loadProfile()).toBeNull();
  });
});
