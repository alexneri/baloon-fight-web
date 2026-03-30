import type { KVScoreEntry, LeaderboardEntry } from '../../src/types/index.js';

export interface Env {
  SCORES_KV: KVNamespace;
}

const SCORES_KEY = 'scores:global';
const CORS_ORIGIN = 'https://balloon-fight.pages.dev';

export async function handleGetScores(request: Request, env: Env): Promise<Response> {
  void request;
  try {
    const raw = await env.SCORES_KV.get(SCORES_KEY);
    const entries: KVScoreEntry[] = raw ? (JSON.parse(raw) as KVScoreEntry[]) : [];

    const public_entries: LeaderboardEntry[] = entries.map((e, i) => ({
      rank: i + 1,
      name: e.name,
      score: e.score,
      phase: e.phase,
      timestamp: e.timestamp,
    }));

    return new Response(
      JSON.stringify({ entries: public_entries, cached: false, cachedAt: Date.now() }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': CORS_ORIGIN,
        },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
