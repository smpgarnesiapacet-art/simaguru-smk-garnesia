import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SEED_STATE } from './src/data/seedData';
import type { SimaguruState } from './src/types';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'simaguru-db.json');

function ensureDb(): SimaguruState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(SEED_STATE, null, 2), 'utf-8');
    return SEED_STATE;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as SimaguruState;
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(SEED_STATE, null, 2), 'utf-8');
    return SEED_STATE;
  }
}

function saveDb(state: SimaguruState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Ensure persistent DB file exists on startup
  ensureDb();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/state', (_req, res) => {
    const state = ensureDb();
    res.json(state);
  });

  app.put('/api/state', (req, res) => {
    const nextState = req.body as SimaguruState;
    if (!nextState || !nextState.profile || !Array.isArray(nextState.classes)) {
      res.status(400).json({ error: 'Format payload tidak valid.' });
      return;
    }
    saveDb(nextState);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  });

  app.post('/api/state/reset', (_req, res) => {
    saveDb(SEED_STATE);
    res.json(SEED_STATE);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMAGURU SMK Garnesia server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
