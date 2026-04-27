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
import { aggregateModelStats, computeComparison, computeCategoryComparison, computeWorkingStyle } from './core/compare-stats.js';
import type { DateRange } from './core/types.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------- Settings store (in-memory for now, DB later) ----------
const settings = new Map<string, any>();

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

app.get('/api/compare', async (req, res) => {
    const provider = (req.query.provider as string) || 'all';
    const modelA = req.query.model_a as string;
    const modelB = req.query.model_b as string;

    if (!modelA || !modelB) {
        res.status(400).json({ error: 'model_a and model_b query params required' });
        return;
    }

    try {
        const projects = await scanProvider(provider);
        const stats = aggregateModelStats(projects);
        const a = stats.find(s => s.model === modelA);
        const b = stats.find(s => s.model === modelB);

        if (!a || !b) {
            const models = stats.map(s => s.model);
            res.status(404).json({ error: 'Model not found', availableModels: models });
            return;
        }

        const comparison = computeComparison(a, b);
        const categoryCompare = computeCategoryComparison(projects, modelA, modelB);
        const workingStyle = computeWorkingStyle(projects, modelA, modelB);

        res.json({
            modelA: { model: a.model, calls: a.calls, totalCost: a.totalCost },
            modelB: { model: b.model, calls: b.calls, totalCost: b.totalCost },
            comparison,
            categoryComparison: categoryCompare,
            workingStyle,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

// ---------- Settings endpoints ----------

app.get('/api/settings', (_req, res) => {
    res.json({
        plan: settings.get('plan') || 'none',
        monthlyUsd: settings.get('monthlyUsd') || 0,
        currency: settings.get('currency') || 'USD',
        modelAliases: settings.get('modelAliases') || {},
    });
});

app.post('/api/settings/plan', (req, res) => {
    const { plan, monthlyUsd } = req.body;
    settings.set('plan', plan);
    if (monthlyUsd !== undefined) settings.set('monthlyUsd', monthlyUsd);
    res.json({ ok: true });
});

app.post('/api/settings/currency', (req, res) => {
    const { currency } = req.body;
    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
        res.status(400).json({ error: 'Invalid currency code' });
        return;
    }
    settings.set('currency', currency.toUpperCase());
    res.json({ ok: true, currency: currency.toUpperCase() });
});

app.post('/api/settings/model-alias', (req, res) => {
    const { from, to } = req.body;
    if (!from || !to) {
        res.status(400).json({ error: 'from and to required' });
        return;
    }
    const aliases = settings.get('modelAliases') || {};
    aliases[from] = to;
    settings.set('modelAliases', aliases);
    res.json({ ok: true, aliases });
});

app.delete('/api/settings/model-alias', (req, res) => {
    const { from } = req.body;
    const aliases = settings.get('modelAliases') || {};
    delete aliases[from];
    settings.set('modelAliases', aliases);
    res.json({ ok: true, aliases });
});

// ---------- Export endpoint ----------

app.get('/api/export', async (req, res) => {
    const format = (req.query.format as string) || 'json';
    const provider = (req.query.provider as string) || 'all';

    try {
        const projects = await scanProvider(provider);
        const dashboard = buildDashboardData(projects);

        if (format === 'csv') {
            const rows = [
                ['date', 'cost', 'calls'],
                ...dashboard.daily.map(d => [d.date, d.cost.toString(), d.calls.toString()])
            ];
            const csv = rows.map(r => r.join(',')).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=codeburn-costs.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Disposition', 'attachment; filename=codeburn-report.json');
            res.json(dashboard);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.listen(PORT, () => {
    console.log(`CodeBurn Web backend running on port ${PORT}`);
    console.log(`Database ready at codeburn.db`);
});