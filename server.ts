import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'task-x' });
  });

  const VALID_APP_ICONS = new Set(['obsidian', 'cobalt', 'emerald', 'sunset', 'grid', 'mono']);
  app.get('/api/manifest.webmanifest', (req, res) => {
    const rawIcon = typeof req.query.icon === 'string' ? req.query.icon.trim() : 'obsidian';
    const iconId = VALID_APP_ICONS.has(rawIcon) ? rawIcon : 'obsidian';
    const rawTheme = typeof req.query.theme === 'string' ? req.query.theme.trim() : '#2563eb';
    const themeColor = /^#[0-9a-fA-F]{6}$/.test(rawTheme) ? rawTheme : '#2563eb';
    const rawBg = typeof req.query.bg === 'string' ? req.query.bg.trim() : '#000000';
    const bgColor = /^#[0-9a-fA-F]{6}$/.test(rawBg) ? rawBg : '#000000';

    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.json({
      id: '/',
      name: 'Task X',
      short_name: 'Task X',
      description:
        'Daily task planner with recurring reminders, customizable folders, tags, and Google Calendar sync.',
      theme_color: themeColor,
      background_color: bgColor,
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: `/icons/${iconId}-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `/icons/${iconId}-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `/icons/${iconId}-maskable-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    });
  });

  app.post('/api/ai/parse-task', async (req, res) => {
    try {
      const { input, todayDate, folders = [], tags = [] } = req.body ?? {};
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'Task text input is required.' });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service is not configured. Please check GEMINI_API_KEY in Secrets.',
        });
      }

      const folderNames = Array.isArray(folders) ? folders.slice(0, 20).join(', ') : '';
      const tagNames = Array.isArray(tags) ? tags.slice(0, 30).join(', ') : '';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Parse this natural language task into structured task fields.
Today's date is ${todayDate || new Date().toISOString().slice(0, 10)}.
Available folders: ${folderNames || 'Work, Personal, Health, Learning'}.
Available tags: ${tagNames || 'Deep Work, Quick Win, Urgent, Habit'}.
User input: "${input.slice(0, 400)}"`,
        config: {
          systemInstruction:
            'You are a precision task parser for Task X. Extract a concise actionable title (without date/time/tag clutter), optional notes, dueDate in YYYY-MM-DD (default today if recurring or implied today, empty string if none), reminderTime in 24h HH:mm (empty string if none), recurrence (none|daily|weekdays|weekends|weekly|custom), customDays (array of integers 0=Sun..6=Sat), priority (low|medium|high), suggestedFolder (best match from available folders or empty), and suggestedTags (1-3 concise tags).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              notes: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              reminderTime: { type: Type.STRING },
              recurrence: {
                type: Type.STRING,
                enum: ['none', 'daily', 'weekdays', 'weekends', 'weekly', 'custom'],
              },
              customDays: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
              },
              priority: {
                type: Type.STRING,
                enum: ['low', 'medium', 'high'],
              },
              suggestedFolder: { type: Type.STRING },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'title',
              'notes',
              'dueDate',
              'reminderTime',
              'recurrence',
              'customDays',
              'priority',
              'suggestedFolder',
              'suggestedTags',
            ],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (err: any) {
      console.error('AI parse-task error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to parse task with AI.',
      });
    }
  });

  app.post('/api/ai/subtasks', async (req, res) => {
    try {
      const { title, notes = '' } = req.body ?? {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Task title is required.' });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service is not configured. Please check GEMINI_API_KEY in Secrets.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Break this task down into 3 to 5 clear, concrete, short subtasks.
Task title: "${title.slice(0, 240)}"
Notes: "${String(notes).slice(0, 600)}"`,
        config: {
          systemInstruction:
            'Generate 3 to 5 concise, actionable subtasks (each under 80 characters) to help the user complete the task smoothly.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['subtasks'],
          },
        },
      });

      const raw = (response.text ?? '{"subtasks":[]}').trim();
      const parsed = JSON.parse(raw);
      return res.json({
        subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks.slice(0, 6) : [],
      });
    } catch (err: any) {
      console.error('AI subtasks error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate subtasks with AI.',
      });
    }
  });

  app.post('/api/ai/optimize-day', async (req, res) => {
    try {
      const { tasks = [], currentDate = '' } = req.body ?? {};
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'At least one active task is needed to optimize.' });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service is not configured. Please check GEMINI_API_KEY in Secrets.',
        });
      }

      const compactTasks = tasks.slice(0, 25).map((t: any) => ({
        id: String(t.id),
        title: String(t.title).slice(0, 120),
        priority: t.priority,
        dueDate: t.dueDate,
        reminderTime: t.reminderTime,
        recurrence: t.recurrence,
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Today is ${currentDate || new Date().toISOString().slice(0, 10)}.
Analyze these pending tasks and suggest an optimal execution order and concise focus strategy:
${JSON.stringify(compactTasks)}`,
        config: {
          systemInstruction:
            'Return a brief 1-2 sentence focus summary, an ordered list of the provided task IDs from highest leverage/urgency to lowest, and 3 short actionable focus tips.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              focusSummary: { type: Type.STRING },
              orderedTaskIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['focusSummary', 'orderedTaskIds', 'tips'],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (err: any) {
      console.error('AI optimize-day error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to optimize schedule with AI.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Task X server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
