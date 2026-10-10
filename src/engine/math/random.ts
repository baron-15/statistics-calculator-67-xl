/**
 * rand / randint generator (M §4.5, recovered from TI screenshots): a multiplicative LCG with
 * L'Ecuyer's first component,
 *
 *   x ← 40014·x mod 2147483563,   rand = x / 2147483563
 *
 * `s→rand` sets x = s (seed 5: first rand 0.000093165, GB p.30; seed 1: 0.000018633 then 0.745579721,
 * TG p.94). The default seed (12345, the TI-8x convention, used by state.ts) and the handling of seed 0
 * (which would lock the generator at 0; it is replaced by 12345) are SPEC: assumption (M §11.8).
 */
export const RAND_A = 40014;
export const RAND_M = 2147483563;
export const DEFAULT_SEED = 12345;

/** One draw: the value in (0, 1) and the new seed (the state to keep in CalcState.randSeed). */
export function randNext(seed: number): { value: number; seed: number } {
  let s = Math.floor(Math.abs(seed)) % RAND_M;
  if (s === 0) s = DEFAULT_SEED;
  const next = (RAND_A * s) % RAND_M; // < 2^47: exact in doubles
  return { value: next / RAND_M, seed: next };
}

/** A stateful source for EvalContext.random: `random()` draws, `seed()` is the state to store back. */
export function makeRandom(seed: number): { random: () => number; seed: () => number } {
  let s = seed;
  return {
    random: () => {
      const r = randNext(s);
      s = r.seed;
      return r.value;
    },
    seed: () => s,
  };
}
