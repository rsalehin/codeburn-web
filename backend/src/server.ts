import express from 'express';
import cors from 'cors';
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

app.listen(PORT, () => {
    console.log(`CodeBurn Web backend running on port ${PORT}`);
    console.log(`Database ready at codeburn.db`);
});