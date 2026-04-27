import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import db from './db.js';
import { scanProvider } from './scanner.js';
import { buildDashboardData } from './aggregator.js';
import { scanAndDetect } from './core/optimize.js';
import type { DateRange } from './core/types.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/db-test', (_req, res) => {
    const count = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
    res.json({ sessionsInDB: count, dbStatus: 'connected' });
});

app.get('/api/providers', (_req, res) => {
    const home = os.homedir();
    const providerDefs = [
        { id: 'claude', name: 'Claude (VS Code)', paths: [
            path.join(home, '.claude', 'projects'),
            path.join(home, 'AppData', 'Roaming', 'Claude', 'projects'),
        ]},
        { id: 'codex', name: 'Codex (VS Code)', paths: [
            path.join(home, '.codex', 'sessions'),
            path.join(home, 'AppData', 'Roaming', 'Codex', 'sessions'),
        ]},
        { id: 'cursor', name: 'Cursor', paths: [
            path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
            path.join(home, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
            path.join(home, '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
        ]},
        { id: 'copilot', name: 'GitHub Copilot', paths: [
            path.join(home, '.github', 'copilot'),
            path.join(home, 'AppData', 'Local', 'GitHub', 'copilot'),
        ]},
        { id: 'opencode', name: 'OpenCode', paths: [
            path.join(home, '.opencode', 'sessions'),
        ]},
    ];

    const result = providerDefs.map(def => {
        let sessions = 0;
        let foundPath = null;
        for (const p of def.paths) {
            if (fs.existsSync(p)) {
                foundPath = p;
                try {
                    if (p.endsWith('.vscdb')) {
                        sessions = -1;
                    } else {
                        const allFiles = fs.readdirSync(p, { recursive: true, encoding: 'utf8' });
                        sessions = allFiles.filter(f => f.endsWith('.jsonl')).length;
                    }
                } catch {}
                break;
            }
        }
        return {
            id: def.id,
            name: def.name,
            sessions,
            path: foundPath,
            status: foundPath ? 'found' : 'not_found'
        };
    });

    res.json({ providers: result });
});

app.get('/api/scan/:provider', async (req, res) => {
    const provider = req.params.provider;
    try {
        const projects = await scanProvider(provider);
        res.json({ provider, projects });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.get('/api/report', async (req, res) => {
    const provider = (req.query.provider as string) || 'all';
    const project = req.query.project as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    try {
        const dateRange = from || to ? {
            start: from ? new Date(from) : new Date(0),
            end: to ? new Date(to) : new Date(),
        } : undefined;

        let projects = await scanProvider(provider);
        if (project) {
            projects = projects.filter(p => p.project === project);
        }
        const dashboard = buildDashboardData(projects);
        res.json(dashboard);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.get('/api/optimize', async (req, res) => {
    const provider = (req.query.provider as string) || 'all';
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    try {
        const dateRange: DateRange | undefined = from || to ? {
            start: from ? new Date(from) : new Date(0),
            end: to ? new Date(to) : new Date(),
        } : undefined;

        const projects = await scanProvider(provider);
        const result = await scanAndDetect(projects, dateRange);
        res.json({
            findings: result.findings,
            costRate: result.costRate,
            healthScore: result.healthScore,
            healthGrade: result.healthGrade,
            sessionsAnalyzed: projects.reduce((s, p) => s + p.sessions.length, 0),
            projectsAnalyzed: projects.length,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.listen(PORT, () => {
    console.log(`CodeBurn Web backend running on port ${PORT}`);
    console.log(`Database ready at codeburn.db`);
});