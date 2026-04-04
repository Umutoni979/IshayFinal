const express      = require('express');
const path         = require('path');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const session      = require('express-session');
const PgSession    = require('connect-pg-simple')(session);
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes         = require('./modules/auth/auth.routes');
const userRoutes         = require('./modules/users/user.routes');
const productionRoutes   = require('./modules/productions/production.routes');
const roleRoutes         = require('./modules/roles/role.routes');
const rehearsalRoutes    = require('./modules/rehearsals/rehearsal.routes');
const attendanceRoutes   = require('./modules/attendance/attendance.routes');
const reportRoutes       = require('./modules/reports/report.routes');
const conflictRoutes     = require('./modules/conflicts/conflict.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const adminRoutes        = require('./modules/admin/admin.routes');

const app = express();

// ─── Static Files ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Security & Parsing ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Session ─────────────────────────────────────────────────
app.use(session({
  store: new PgSession({
    conString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ─── Rate Limiting ────────────────────────────────────────────
// Strict limiter for sensitive auth actions only (login, register, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) =>
    req.method === 'GET' ||
    req.path === '/refresh-token', // never limit token refresh
});
app.use('/api/v1/auth', authLimiter);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/productions',   productionRoutes);
app.use('/api/v1/roles',         roleRoutes);
app.use('/api/v1/rehearsals',    rehearsalRoutes);
app.use('/api/v1/attendance',    attendanceRoutes);
app.use('/api/v1/reports',       reportRoutes);
app.use('/api/v1/conflicts',     conflictRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin',         adminRoutes);

app.get('/api/v1/health', (req, res) => res.json({ success: true, message: 'ISHYA API is running' }));

// ─── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
