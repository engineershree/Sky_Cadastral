import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from './db.js';
import projectsRouter from './routes/projects.js';
import layoutsRouter from './routes/layouts.js';
import plotsRouter from './routes/plots.js';
import bookingsRouter from './routes/bookings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });
dotenv.config({ path: join(rootDir, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/projects', projectsRouter);
app.use('/api/layouts', layoutsRouter);
app.use('/api/plots', plotsRouter);
app.use('/api/bookings', bookingsRouter);

app.listen(PORT, () => {
  console.log(`Sky Cadastral API listening on http://localhost:${PORT}`);
});
