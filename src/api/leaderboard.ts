import type {
  LeaderboardEntry,
  ScoreSubmission,
  ScoreSubmissionResponse,
  Result,
} from '../types/index.js';

const API_BASE = (import.meta as unknown as { env: Record<string, string | undefined> }).env['VITE_API_BASE'] ?? '/api';

export async function fetchLeaderboard(): Promise<Result<LeaderboardEntry[]>> {
  try {
    const res = await fetch(`${API_BASE}/scores`);
    if (!res.ok) return { ok: false, error: new Error(`HTTP ${res.status}`) };
    const data = (await res.json()) as { entries: LeaderboardEntry[] };
    return { ok: true, value: data.entries };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

export async function submitScore(
  submission: ScoreSubmission,
): Promise<Result<ScoreSubmissionResponse>> {
  try {
    const res = await fetch(`${API_BASE}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      return { ok: false, error: new Error(err.error ?? `HTTP ${res.status}`) };
    }
    const data = (await res.json()) as ScoreSubmissionResponse;
    return { ok: true, value: data };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}
