import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, pool } from './db.js';
import { authRequired } from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistDir = path.resolve(__dirname, '../../frontend/dist/frontend/browser');

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
const jwtSecret = process.env.JWT_SECRET_KEY || 'dev-jwt-secret';
const tokenCookie = 'token';

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 5 seconds.' },
});

const viewLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 5 seconds.' },
});

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  res.cookie(tokenCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(tokenCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(503).json({ status: 'db_unavailable', error: error.message });
  }
});

app.get('/api/config', (_req, res) => {
  const adsenseEnabled = String(process.env.ADSENSE_ENABLED || 'false').toLowerCase() === 'true';
  return res.json({
    adsenseEnabled,
    adsenseClientId: process.env.ADSENSE_CLIENT_ID || '',
    adsenseSlotIdViewAd: process.env.ADSENSE_SLOT_ID_VIEW_AD || '',
  });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, visit_count, balance',
      [email, passwordHash]
    );

    const user = inserted.rows[0];
    setAuthCookie(res, { sub: user.id, email: user.email });

    return res.status(201).json({
      message: 'Account created',
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, email, password_hash, twofa_enabled, visit_count, balance FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password || '', user.password_hash || '');
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setAuthCookie(res, { sub: user.id, email: user.email });

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        visit_count: user.visit_count,
        balance: user.balance,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, visit_count, balance, twofa_enabled, created_at, last_view_time FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard', authRequired, async (req, res) => {
  try {
    const [userResult, topUsersResult] = await Promise.all([
      pool.query(
        'SELECT id, email, visit_count, balance, twofa_enabled, created_at FROM users WHERE id = $1',
        [req.user.id]
      ),
      pool.query(
        'SELECT id, email, visit_count, balance FROM users ORDER BY visit_count DESC LIMIT 10'
      ),
    ]);

    return res.json({
      user: userResult.rows[0],
      topUsers: topUsersResult.rows,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/view-ad', authRequired, viewLimiter, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id, last_view_time, visit_count FROM users WHERE id = $1', [
      req.user.id,
    ]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const now = new Date();

    if (user.last_view_time) {
      const lastView = new Date(user.last_view_time);
      const diffSeconds = Math.floor((now.getTime() - lastView.getTime()) / 1000);
      if (diffSeconds < 10) {
        return res.status(429).json({ error: 'Wait 10 seconds before next view.' });
      }
    }

    const updated = await pool.query(
      'UPDATE users SET visit_count = visit_count + 1, last_view_time = NOW() WHERE id = $1 RETURNING id, email, visit_count, balance, last_view_time',
      [req.user.id]
    );

    return res.json({
      message: 'Ad viewed successfully',
      user: updated.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(frontendDistDir, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
