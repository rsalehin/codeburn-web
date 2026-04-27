import { parseAllSessions } from './core/parser.js';
import type { ProjectSummary } from './core/types.js';

export async function scanProvider(provider: string): Promise<ProjectSummary[]> {
    const results = await parseAllSessions(undefined, provider);
    return results;
}