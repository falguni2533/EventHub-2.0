import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import Feedback, {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SENTIMENTS,
} from '../models/Feedback.js';

const MAX_FEEDBACK_LENGTH = 5000;

const parseAndValidateAnalysis = (rawText) => {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Empty response from AI model.');
  }

  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  const parsed = JSON.parse(cleaned);

  if (!FEEDBACK_SENTIMENTS.includes(parsed.sentiment)) {
    throw new Error('AI returned an invalid sentiment.');
  }
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new Error('AI returned an invalid summary.');
  }
  if (
    !Array.isArray(parsed.suggestions) ||
    !parsed.suggestions.every((item) => typeof item === 'string' && item.trim())
  ) {
    throw new Error('AI returned invalid suggestions.');
  }

  return {
    sentiment: parsed.sentiment,
    summary: parsed.summary.trim(),
    suggestions: parsed.suggestions.map((item) => item.trim()),
  };
};

const analyzeWithGemini = async (feedback) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    env.geminiApiKey
  )}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: 'You are an expert student feedback analyzer. Keep the summary concise, give practical suggestions, and do not invent facts.',
          },
        ],
      },
      contents: [{ role: 'user', parts: [{ text: feedback }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          required: ['sentiment', 'summary', 'suggestions'],
          properties: {
            sentiment: { type: 'STRING', enum: FEEDBACK_SENTIMENTS },
            summary: { type: 'STRING' },
            suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = new Error(`Gemini API error (${res.status})`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseAndValidateAnalysis(rawText);
};

const analyzeWithOpenAI = async (feedback) => {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      instructions:
        'You are an expert student feedback analyzer. Keep the summary concise, give practical suggestions, and do not invent facts.',
      input: feedback,
      text: {
        format: {
          type: 'json_schema',
          name: 'feedback_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['sentiment', 'summary', 'suggestions'],
            properties: {
              sentiment: { type: 'string', enum: FEEDBACK_SENTIMENTS },
              summary: { type: 'string' },
              suggestions: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = new Error(`OpenAI API error (${res.status})`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const rawText =
    data?.output_text ||
    data?.output?.[0]?.content?.find((part) => typeof part?.text === 'string')?.text;

  return parseAndValidateAnalysis(rawText);
};

const analyzeLocally = (feedback) => {
  const text = feedback.toLowerCase();
  const positiveWords = [
    'good', 'great', 'excellent', 'clear', 'clearly', 'helpful', 'best',
    'love', 'loved', 'liked', 'amazing', 'awesome', 'engaging', 'useful',
    'nice', 'informative', 'supportive', 'easy', 'well', 'enjoyed', 'understand',
  ];
  const negativeWords = [
    'bad', 'poor', 'worst', 'confusing', 'confused', 'rushed', 'fast',
    'hard', 'difficult', 'boring', 'unclear', 'slow', 'issue', 'problem',
    'lack', 'missing', 'hate', 'terrible', 'disappointed', 'overload', 'late',
  ];
  const phrasePositive = ['अच्छा', 'बहुत अच्छा', 'शानदार', 'बढ़िया'];
  const phraseNegative = ['खराब', 'बेकार', 'समस्या', 'गंदा'];

  let score = 0;
  for (const word of positiveWords) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) score += 1;
  }
  for (const word of negativeWords) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) score -= 1;
  }
  for (const phrase of phrasePositive) {
    if (text.includes(phrase)) score += 1;
  }
  for (const phrase of phraseNegative) {
    if (text.includes(phrase)) score -= 2;
  }
  if (/\bnot\s+(good|clear|helpful|easy|useful)\b/i.test(text)) {
    score -= 2;
  }

  let sentiment = 'Neutral';
  if (score >= 1) sentiment = 'Positive';
  else if (score <= -1) sentiment = 'Negative';

  const trimmed = feedback.trim().replace(/\s+/g, ' ');
  const summary = trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;

  const suggestions = [];
  if (/\b(rushed|fast|pace|speed|time|deadline|queue|wait)\b/i.test(text)) {
    suggestions.push('Adjust session pacing and allow extra time for complex topics or check-ins.');
  }
  if (/\b(confus|unclear|explain|example|understand)\b/i.test(text)) {
    suggestions.push('Include more step-by-step examples and interactive Q&A checkpoints.');
  }
  if (/\b(assignment|lab|homework|project|exam|quiz)\b/i.test(text)) {
    suggestions.push('Balance session workload with clearer instructions and rubrics.');
  }

  if (suggestions.length === 0) {
    if (sentiment === 'Positive') {
      suggestions.push('Continue the current approach and share key highlights as best practices.');
      suggestions.push('Collect periodic check-ins to maintain student engagement.');
    } else if (sentiment === 'Negative') {
      suggestions.push('Follow up with students to identify top pain points and address them early.');
      suggestions.push('Provide additional support or operational backup for future events.');
    } else {
      suggestions.push('Gather more specific feedback on event pacing, materials, and logistics.');
      suggestions.push('Highlight actionable next steps before the next campus session.');
    }
  }

  return { sentiment, summary, suggestions };
};

const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  const match = FEEDBACK_CATEGORIES.find((cat) => cat.toLowerCase() === raw);
  return match || 'Other';
};

export const getAiEngineStatus = () => ({
  geminiConfigured: Boolean(env.geminiApiKey),
  openaiConfigured: Boolean(env.openaiApiKey),
  localFallbackEnabled: env.allowLocalFallback,
});

export const analyzeAndSaveFeedback = async ({ payload, userId = null }) => {
  const rawFeedback = payload?.feedback;

  if (
    typeof rawFeedback !== 'string' ||
    !rawFeedback.trim() ||
    rawFeedback.trim().length > MAX_FEEDBACK_LENGTH
  ) {
    throw new AppError(
      `Please provide feedback between 1 and ${MAX_FEEDBACK_LENGTH} characters.`,
      400
    );
  }

  const cleanFeedback = rawFeedback.trim();
  const studentName =
    String(payload?.studentName || payload?.name || '').trim() || 'Anonymous';
  const category = normalizeCategory(payload?.category);
  const eventName =
    String(payload?.eventName || payload?.event || '').trim() || 'General Event';

  let rating = null;
  if (payload?.rating !== undefined && payload?.rating !== null && payload?.rating !== '') {
    const parsedRating = Number(payload.rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new AppError('Rating must be an integer between 1 and 5.', 400);
    }
    rating = parsedRating;
  }

  let analysis = null;
  let provider = 'local-fallback';
  let warning = null;
  let lastError = null;

  if (env.geminiApiKey) {
    try {
      analysis = await analyzeWithGemini(cleanFeedback);
      provider = 'gemini';
    } catch (error) {
      lastError = error;
      console.error('[Analyze] Gemini Analysis Error:', error.message || error);
    }
  }

  if (!analysis && env.openaiApiKey) {
    try {
      analysis = await analyzeWithOpenAI(cleanFeedback);
      provider = 'openai';
    } catch (error) {
      lastError = error;
      console.error('[Analyze] OpenAI Analysis Error:', error.message || error);
    }
  }

  if (!analysis) {
    if (!env.allowLocalFallback) {
      const statusCode = lastError?.status === 401 ? 502 : lastError?.status === 429 ? 429 : 500;
      throw new AppError(
        'AI analysis failed and local fallback is disabled. Configure GEMINI_API_KEY or OPENAI_API_KEY in backend/.env.',
        statusCode
      );
    }

    analysis = analyzeLocally(cleanFeedback);
    provider = 'local-fallback';
    warning = 'Cloud AI key/quota unavailable; analyzed locally.';
  }

  const saved = await Feedback.create({
    studentName,
    category,
    rating,
    eventName,
    feedback: cleanFeedback,
    sentiment: analysis.sentiment,
    aiSummary: analysis.summary,
    aiSuggestions: analysis.suggestions,
    provider,
    submittedBy: userId,
  });

  return {
    provider,
    warning,
    analysis,
    feedbackRecord: saved.toJSON(),
  };
};
