import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { globSync } from 'fast-glob';
import db from './db';

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

// Provider detection endpoint
app.get('/api/providers', (_req, res) => {
    const home = os.homedir();
    const providerDefs = [
        { id: 'claude', name: 'Claude (VS Code)', paths: [
            path.join(home, '.claude', 'projects'),
            path.join(home, 'AppData', 'Roaming', 'Claude', 'projects'), // Windows fallback
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
                        // SQLite database, count later
                        sessions = -1; // indicate complex counting
                    } else {
                        const files = globSync('**/*.jsonl', { cwd: p, absolute: false });
                        sessions = files.length;
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

app.listen(PORT, () => {
    console.log(`CodeBurn Web backend running on port ${PORT}`);
    console.log(`Database ready at codeburn.db`);
});