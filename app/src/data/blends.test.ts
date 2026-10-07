import { ARCHETYPES, AnimalId } from './archetypes';
import { blendFor, displayName, STREAKS } from './blends';

const ANIMALS = Object.keys(ARCHETYPES) as AnimalId[];

describe('blends', () => {
  it('names all 30 blends uniquely', () => {
    const names = new Set<string>();
    ANIMALS.forEach((a) =>
      ANIMALS.filter((b) => b !== a).forEach((b) => names.add(blendFor({ animal: a, runnerUp: b })!.name))
    );
    expect(names.size).toBe(30);
  });

  it('flavours the main animal with the streak', () => {
    const b = blendFor({ animal: 'dolphin', runnerUp: 'bear' });
    expect(b?.name).toBe('Steady Dolphin');
    expect(b?.line).toContain('Bear streak');
    expect(b?.tip.text.length).toBeGreaterThan(0);
  });

  it('has no blend without a different runner-up', () => {
    expect(blendFor({ animal: 'fox' })).toBeNull();
    expect(blendFor({ animal: 'fox', runnerUp: 'fox' })).toBeNull();
    expect(displayName({ animal: 'fox' })).toBe('Fox');
  });

  it('writes every streak line without em dashes', () => {
    Object.values(STREAKS).forEach((s) => expect(s.line).not.toContain('—'));
  });
});
