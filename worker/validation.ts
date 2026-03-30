export function validateName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const upper = name.toUpperCase();
  if (!/^[A-Z0-9]{1,3}$/.test(upper)) return null;
  return upper;
}

export function validateScore(score: unknown): number | null {
  if (typeof score !== 'number' || !Number.isInteger(score)) return null;
  if (score < 1 || score > 9_999_999) return null;
  return score;
}

export function validatePhase(phase: unknown): number | null {
  if (typeof phase !== 'number' || !Number.isInteger(phase)) return null;
  if (phase < 1 || phase > 999) return null;
  return phase;
}
