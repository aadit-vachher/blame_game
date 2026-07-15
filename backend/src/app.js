require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');


const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const teamRoutes = require('./modules/teams/routes');
const categoryRoutes = require('./modules/categories/routes');
const blameRoutes = require('./modules/blames/routes');
const discussionRoutes = require('./modules/discussions/routes');
const dependencyRoutes = require('./modules/dependencies/routes');

const notificationRoutes = require('./modules/notifications/routes');
const analyticsRoutes = require('./modules/analytics/routes');
const auditRoutes = require('./modules/audit/routes');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, code: 'RATE_LIMIT', message: 'Too many requests' },
});
app.use(generalLimiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}


app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Blame Game API is running', timestamp: new Date().toISOString() });
});


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/blames', blameRoutes);
app.use('/api/blames', discussionRoutes);
app.use('/api/dependencies', dependencyRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
});


app.use(errorHandler);

const { startReminderScheduler } = require('./utils/reminderScheduler');

app.listen(PORT, () => {
  console.log(`\n🎯 Blame Game API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  
  // Start the background reminders scheduler for unresolved blames
  startReminderScheduler();
});

module.exports = app;
