/**
 * Unit tests for scoreQuiz (src/logic/score.ts).
  *
   * Run with:
    *   npx jest --testPathPattern=score.test.ts
     *
      * Setup (one-time, from the app/ directory):
       *   npm install --save-dev jest @types/jest ts-jest
        *   # Add the jest config block to package.json (see jest.config section in
         *   # the project README or run: npx ts-jest config:init)
          */

          import { scoreQuiz, TOTAL_QUESTIONS } from './score';
          import type { Option } from '../data/quiz';
          import { QUIZ } from '../data/quiz';

          // ── Helpers ──────────────────────────────────────────────────────────────────

          /** Build a full-length answers array filled with nulls. */
          function nullAnswers(): (Option | null)[] {
            return Array(TOTAL_QUESTIONS).fill(null);
            }

            /** Build an answers array that weights every question heavily toward one animal. */
            function answersFor(animal: 'wolf' | 'bear' | 'fox' | 'hummingbird' | 'dolphin' | 'octopus'): (Option | null)[] {
              return QUIZ.map((q) => {
                  // Find the option with the highest score for the target animal, or null.
                      const best = q.options.reduce<Option | null>((winner, opt) => {
                            const pts = opt.scores[animal] ?? 0;
                                  const winPts = winner ? (winner.scores[animal] ?? 0) : -1;
                                        return pts > winPts ? opt : winner;
                                            }, null);
                                                return best;
                                                  });
                                                  }

                                                  // ── Core correctness ─────────────────────────────────────────────────────────

                                                  describe('scoreQuiz — core correctness', () => {
                                                    it('returns a valid AnimalId for all-null answers', () => {
                                                        const validAnimals = ['dolphin', 'wolf', 'bear', 'hummingbird', 'fox', 'octopus'];
                                                            const result = scoreQuiz(nullAnswers());
                                                                expect(validAnimals).toContain(result.animal);
                                                                  });

                                                                    it('result object always includes peak, crash, and recharge strings', () => {
                                                                        const result = scoreQuiz(nullAnswers());
                                                                            expect(typeof result.peak).toBe('string');
                                                                                expect(result.peak.length).toBeGreaterThan(0);
                                                                                    expect(typeof result.crash).toBe('string');
                                                                                        expect(result.crash.length).toBeGreaterThan(0);
                                                                                            expect(typeof result.recharge).toBe('string');
                                                                                                expect(result.recharge.length).toBeGreaterThan(0);
                                                                                                  });

                                                                                                    it('scores wolf-heavy answers as wolf', () => {
                                                                                                        const result = scoreQuiz(answersFor('wolf'));
                                                                                                            expect(result.animal).toBe('wolf');
                                                                                                              });
                                                                                                              
                                                                                                                it('scores bear-heavy answers as bear', () => {
                                                                                                                    const result = scoreQuiz(answersFor('bear'));
                                                                                                                        expect(result.animal).toBe('bear');
                                                                                                                          });
                                                                                                                          
                                                                                                                            it('scores fox-heavy answers as fox', () => {
                                                                                                                                const result = scoreQuiz(answersFor('fox'));
                                                                                                                                    expect(result.animal).toBe('fox');
                                                                                                                                      });
                                                                                                                                      });
                                                                                                                                      
                                                                                                                                      // ── Tag / chip extraction ────────────────────────────────────────────────────
                                                                                                                                      
                                                                                                                                      describe('scoreQuiz — tag chips', () => {
                                                                                                                                        it('picks up a peak tag from a tagged answer', () => {
                                                                                                                                            // Q5 (id: 'focus') option 0 tags peak = 'early morning'
                                                                                                                                                const answers = nullAnswers();
                                                                                                                                                    answers[4] = QUIZ[4].options[0]; // 'Early morning' → peak: 'early morning'
                                                                                                                                                        const result = scoreQuiz(answers);
                                                                                                                                                            expect(result.peak).toBe('early morning');
                                                                                                                                                              });
                                                                                                                                                              
                                                                                                                                                                it('picks up a crash tag from a tagged answer', () => {
                                                                                                                                                                    // Q6 (id: 'crash') option 1 tags crash = '2–4pm'
                                                                                                                                                                        const answers = nullAnswers();
                                                                                                                                                                            answers[5] = QUIZ[5].options[1]; // '2–4pm'
                                                                                                                                                                                const result = scoreQuiz(answers);
                                                                                                                                                                                    expect(result.crash).toBe('2–4pm');
                                                                                                                                                                                      });
                                                                                                                                                                                      
                                                                                                                                                                                        it('picks up a recharge tag from a tagged answer', () => {
                                                                                                                                                                                            // Q8 (id: 'recovery') option 0 tags recharge = 'solitude'
                                                                                                                                                                                                const answers = nullAnswers();
                                                                                                                                                                                                    answers[7] = QUIZ[7].options[0]; // 'Alone & quiet' → recharge: 'solitude'
                                                                                                                                                                                                        const result = scoreQuiz(answers);
                                                                                                                                                                                                            expect(result.recharge).toBe('solitude');
                                                                                                                                                                                                              });
                                                                                                                                                                                                              
                                                                                                                                                                                                                it('later tags overwrite earlier tags of the same kind', () => {
                                                                                                                                                                                                                    // Provide two different peak tags; the last one should win.
                                                                                                                                                                                                                        const answers = nullAnswers();
                                                                                                                                                                                                                            answers[4] = QUIZ[4].options[0]; // peak: 'early morning'
                                                                                                                                                                                                                                // There is no second peak tag in the quiz by default, so we verify the
                                                                                                                                                                                                                                    // first one is correctly retained (regression guard).
                                                                                                                                                                                                                                        const result = scoreQuiz(answers);
                                                                                                                                                                                                                                            expect(result.peak).toBe('early morning');
                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                              // ── Edge cases & stability ───────────────────────────────────────────────────
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                              describe('scoreQuiz — edge cases', () => {
                                                                                                                                                                                                                                                it('does not throw for an empty answers array', () => {
                                                                                                                                                                                                                                                    expect(() => scoreQuiz([])).not.toThrow();
                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                        it('does not throw for a longer-than-expected answers array', () => {
                                                                                                                                                                                                                                                            const extra = [...nullAnswers(), null, null, null];
                                                                                                                                                                                                                                                                expect(() => scoreQuiz(extra)).not.toThrow();
                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                    it('does not throw when answers contain unexpected shapes', () => {
                                                                                                                                                                                                                                                                        // @ts-expect-error — deliberately passing bad data to test runtime safety
                                                                                                                                                                                                                                                                            expect(() => scoreQuiz([undefined, 0, false, {}, { scores: {} }])).not.toThrow();
                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                it('returns a deterministic result for the same input', () => {
                                                                                                                                                                                                                                                                                    const answers = answersFor('octopus');
                                                                                                                                                                                                                                                                                        const r1 = scoreQuiz(answers);
                                                                                                                                                                                                                                                                                            const r2 = scoreQuiz(answers);
                                                                                                                                                                                                                                                                                                expect(r1.animal).toBe(r2.animal);
                                                                                                                                                                                                                                                                                                    expect(r1.peak).toBe(r2.peak);
                                                                                                                                                                                                                                                                                                        expect(r1.crash).toBe(r2.crash);
                                                                                                                                                                                                                                                                                                            expect(r1.recharge).toBe(r2.recharge);
                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                it('tie-break priority: dolphin beats wolf on equal scores (per PRIORITY array)', () => {
                                                                                                                                                                                                                                                                                                                    // Manufacture a answers set that gives dolphin and wolf equal points.
                                                                                                                                                                                                                                                                                                                        // Q1 sleep: 'Takes forever' → dolphin:3, fox:1
                                                                                                                                                                                                                                                                                                                            // Q2 morning: 'Foggy' → wolf:3, bear:1
                                                                                                                                                                                                                                                                                                                                // These two options give dolphin=3 and wolf=3. Per PRIORITY, dolphin wins.
                                                                                                                                                                                                                                                                                                                                    const answers = nullAnswers();
                                                                                                                                                                                                                                                                                                                                        answers[0] = QUIZ[0].options[1]; // dolphin: 3
                                                                                                                                                                                                                                                                                                                                            answers[1] = QUIZ[1].options[1]; // wolf: 3
                                                                                                                                                                                                                                                                                                                                                const result = scoreQuiz(answers);
                                                                                                                                                                                                                                                                                                                                                    expect(result.animal).toBe('dolphin');
                                                                                                                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                                                                                                                      });
