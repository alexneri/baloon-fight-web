import type { KVScoreEntry, ScoreSubmission } from '../../src/types/index.js';
import { validateName, validateScore, validatePhase } from '../validation.js';

export interface Env {
  SCORES_KV: KVNamespace;
}

const SCORES_KEY = 'scores:global';
const CORS_ORIGIN = 'https://balloon-fight.pages.dev';

async function getIpHash(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export async function handlePostScore(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const submission = body as Partial<ScoreSubmission>;
  const name  = validateName(submission.name);
  const score = validateScore(submission.score);
  const phase = validatePhase(submission.phase);

  if (!name)  return jsonError('Invalid name', 400);
  if (!score) return jsonError('Invalid score', 400);
  if (!phase) return jsonError('Invalid phase', 400);

  // Rate limit
  const ipHash = await getIpHash(request);
  const rlKey = `ratelimit:${ipHash}`;
  const count = parseInt((await env.SCORES_KV.get(rlKey)) ?? '0', 10);
  if (count >= 5) return jsonError('Rate limit exceeded', 429);
  await env.SCORES_KV.put(rlKey, String(count + 1), { expirationTtl: 600 });

  try {
    const raw = await env.SCORES_KV.get(SCORES_KEY);
    const entries: KVScoreEntry[] = raw ? (JSON.parse(raw) as KVScoreEntry[]) : [];

    const newEntry: KVScoreEntry = { name, score, phase, timestamp: Date.now(), ip_hash: ipHash };
    entries.push(newEntry);
    entries.sort((a, b) => b.score - a.score);
    const top50 = entries.slice(0, 50);
    await env.SCORES_KV.put(SCORES_KEY, JSON.stringify(top50));

    const rank = top50.findIndex((e) => e.ip_hash === ipHash && e.score === score) + 1;

    return new Response(JSON.stringify({ success: true, rank: rank > 0 ? rank : -1 }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': CORS_ORIGIN,
      },
    });
  } catch {
    return jsonError('Internal error', 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
