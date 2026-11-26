import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET ||= 'eventhub-analyze-test-jwt-secret';

const { default: app } = await import('../src/app.js');
const { default: Feedback } = await import('../src/models/Feedback.js');

let mongoServer;
let httpServer;
let baseUrl;

describe('POST /api/analyze & Health Provider Status', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    });
    await mongoose.connect(mongoServer.getUri());
    httpServer = app.listen(0);
    await new Promise((resolve) => httpServer.once('listening', resolve));
    const { port } = httpServer.address();
    baseUrl = `http://localhost:${port}/api`;
  }, { timeout: 90000 });

  beforeEach(async () => {
    await Feedback.deleteMany({});
  });

  after(async () => {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('1. Includes AI provider flags in GET /api/health', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(typeof body.providers?.geminiConfigured, 'boolean');
    assert.equal(typeof body.providers?.openaiConfigured, 'boolean');
    assert.equal(typeof body.providers?.localFallbackEnabled, 'boolean');
  });

  it('2. Analyzes feedback and saves student name, category, rating, and feedback to MongoDB', async () => {
    const res = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        category: 'Speakers',
        rating: 5,
        event: 'Tech Fest 2026',
        feedback: 'The keynote speaker was amazing, clear, and super engaging!',
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.analysis.sentiment, 'Positive');
    assert.ok(body.analysis.summary.length > 0);
    assert.ok(Array.isArray(body.analysis.suggestions) && body.analysis.suggestions.length > 0);
    assert.equal(body.data.studentName, 'Aarav Sharma');
    assert.equal(body.data.category, 'Speakers');
    assert.equal(body.data.rating, 5);
    assert.equal(body.data.eventName, 'Tech Fest 2026');

    const stored = await Feedback.findById(body.data.id).lean();
    assert.ok(stored);
    assert.equal(stored.studentName, 'Aarav Sharma');
    assert.equal(stored.category, 'Speakers');
    assert.equal(stored.rating, 5);
    assert.equal(stored.sentiment, 'Positive');
  });

  it('3. Rejects empty feedback or invalid rating with 400', async () => {
    const emptyRes = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: '   ' }),
    });
    assert.equal(emptyRes.status, 400);

    const badRatingRes = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student',
        category: 'Venue',
        rating: 9,
        feedback: 'Valid text with invalid rating',
      }),
    });
    assert.equal(badRatingRes.status, 400);
  });
});
