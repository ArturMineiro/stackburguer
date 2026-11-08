import { execSync } from 'node:child_process';
import type { APIRoute } from 'astro';

/**
 * Identifica a versão publicada. O deploy confere este arquivo para garantir
 * que a pasta remota é a do cardápio e que a versão nova entrou no ar.
 */
function commit(): string {
  const fromEnv = process.env.GIT_COMMIT || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'desconhecido';
  }
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ app: 'stackburguer', commit: commit(), builtAt: new Date().toISOString() }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
