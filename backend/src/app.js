import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS configuration allowing frontend requests
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers for JSON and URL-encoded payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'EventHub Backend Server',
    docs: '/api',
    health: '/api/health',
  });
});

// Version-free /api mount ready for Phase 1+ endpoints
app.use('/api', apiRoutes);

// 404 & centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
