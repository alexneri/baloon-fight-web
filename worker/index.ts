import { handleGetScores } from './handlers/getScores.js';
import { handlePostScore } from './handlers/postScore.js';
import type { Env } from './handlers/getScores.js';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://balloon-fight.pages.dev',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === '/api/scores') {
      if (request.method === 'GET')  return handleGetScores(request, env);
      if (request.method === 'POST') return handlePostScore(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
