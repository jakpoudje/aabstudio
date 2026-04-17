'use strict';
/*
  AABStudio.ai — Server v2.2
  Clean, production-ready. All endpoints verified against frontend.
*/

const express   = require('express');
const cors      = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS — must be first, before all routes ───────────────────────────────────
const corsOpts = {
  origin: '*',
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOpts));
app.options('*', cors(corsOpts));

// ── Stripe webhook needs raw body — before json parser ────────────────────────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.json({ received: true });
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event  = stripe.webhooks.constructEvent(req.body, sig, secret);
    console.log('Stripe event:', event.type, event.data?.object?.customer_email || '');
    // TODO: update user plan in Supabase based on event.type
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.status(400).send('Webhook error: ' + e.message);
  }
});

app.use(express.json({ limit: '25mb' }));

// ── RATE LIMITING — simple in-memory, protects Anthropic credits ──────────────
const rateCounts = {};
const RATE_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT  = 10;        // max 10 AI calls per IP per minute

function checkRate(req, res) {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  const now = Date.now();
  if (!rateCounts[ip]) rateCounts[ip] = { count: 0, reset: now + RATE_WINDOW };
  if (now > rateCounts[ip].reset) rateCounts[ip] = { count: 0, reset: now + RATE_WINDOW };
  rateCounts[ip].count++;
  if (rateCounts[ip].count > RATE_LIMIT) {
    res.status(429).json({ error: 'Too many requests — please wait a moment and try again.' });
    return false;
  }
  return true;
}
// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateCounts).forEach(ip => { if (rateCounts[ip].reset < now) delete rateCounts[ip]; });
}, 5 * 60 * 1000);

// ── API CLIENTS ───────────────────────────────────────────────────────────────
const anthropic      = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const HEYGEN_KEY     = process.env.HEYGEN_API_KEY;
const OPENAI_KEY     = process.env.OPENAI_API_KEY;
const STRIPE_KEY     = process.env.STRIPE_SECRET_KEY;
const MODEL          = 'claude-sonnet-4-6';

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status:     'ok',
  version:    '2.2',
  platform:   'AABStudio.ai',
  model:      MODEL,
  anthropic:  !!process.env.ANTHROPIC_API_KEY,
  elevenlabs: !!ELEVENLABS_KEY,
  heygen:     !!HEYGEN_KEY,
  openai:     !!OPENAI_KEY,
  stripe:     !!STRIPE_KEY
}));

// ── EXTRACT TEXT FROM FILE ────────────────────────────────────────────────────
// Frontend handles PDF (PDF.js) and TXT (FileReader) client-side.
// This endpoint only handles DOCX and cleans up any text sent.
app.post('/api/extract-text', async (req, res) => {
  try {
    const { text, fileBase64, mimeType, fileName } = req.body;

    // If text already extracted client-side, just clean and return
    if (text && text.trim().length > 10) {
      const clean = text.trim().replace(/\s{3,}/g, '\n\n');
      return res.json({ text: clean, words: clean.split(/\s+/).filter(Boolean).length });
    }

    if (!fileBase64) return res.status(400).json({ error: 'No file or text provided.' });

    const buf = Buffer.from(fileBase64, 'base64');

    // TXT
    if (!mimeType || mimeType === 'text/plain' || fileName?.endsWith('.txt')) {
      const t = buf.toString('utf8').trim();
      return res.json({ text: t, words: t.split(/\s+/).filter(Boolean).length });
    }

    // DOCX — extract XML text nodes
    if (mimeType?.includes('wordprocessingml') || fileName?.endsWith('.docx')) {
      const raw     = buf.toString('utf8');
      const matches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const t       = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();
      if (t.length > 10) return res.json({ text: t, words: t.split(/\s+/).filter(Boolean).length });
      return res.status(400).json({ error: 'Could not extract text from DOCX. Try copying and pasting instead.' });
    }

    // Small PDF fallback (PDF.js should handle these client-side)
    if (mimeType === 'application/pdf') {
      if (fileBase64.length > 5_000_000) {
        return res.status(413).json({ error: 'PDF too large for server. Use the Paste tab to copy your text.' });
      }
      if (!checkRate(req, res)) return;
      const r = await anthropic.messages.create({
        model: MODEL, max_tokens: 6000,
        messages: [{ role: 'user', content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
          { type: 'text', text: 'Extract all text. Raw text only, preserve paragraph breaks with double newlines, no commentary.' }
        ]}]
      });
      const t = r.content.map(c => c.text || '').join('').trim();
      return res.json({ text: t, words: t.split(/\s+/).filter(Boolean).length });
    }

    return res.status(400).json({ error: 'Unsupported file type. Use PDF, TXT, or DOCX.' });
  } catch (e) {
    console.error('extract-text error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── SCENE SEGMENTATION ────────────────────────────────────────────────────────
app.post('/api/segment', async (req, res) => {
  if (!checkRate(req, res)) return;
  try {
    const { script, wpm = 150, sceneDuration = 8, title = 'My Video' } = req.body;

    if (!script || script.trim().length < 10) {
      return res.status(400).json({ error: 'Script text is required (minimum 10 characters).' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'Anthropic API key not configured. Add credits at console.anthropic.com then check Railway environment variables.' });
    }

    const wordsPerScene = Math.round((wpm / 60) * sceneDuration);
    const text          = script.trim().slice(0, 60000);

    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 12000,
      system: `You are a teleprompter scene segmentation engine.
Split the provided script into presenter scenes for teleprompter recording.
DO NOT analyse, critique, or rewrite. Preserve exact wording from the script.

RULES:
- Each scene ≈ ${wordsPerScene} words (${wpm} WPM × ${sceneDuration}s)
- Split ONLY at sentence or paragraph boundaries — never mid-sentence
- Use the script's own headings and paragraphs as natural break points
- Scene types: INTRO, MAIN, TRANSITION, SUMMARY, CONCLUSION, HOOK
- Max scene duration: 10 seconds. No scene should exceed 10s worth of words.

RESPOND WITH ONLY THIS JSON — no markdown fences, no explanation, no preamble:
{
  "title": "${title.replace(/"/g, "'")}",
  "totalScenes": 0,
  "estimatedDuration": "0:00",
  "scenes": [
    {
      "id": "s_1",
      "sceneNumber": 1,
      "type": "INTRO",
      "narration": "exact words from script here",
      "wordCount": 0,
      "duration": ${sceneDuration},
      "notes": "",
      "status": "draft"
    }
  ]
}`,
      messages: [{ role: 'user', content: `Segment this script:\n\n${text}\n\nReturn ONLY valid JSON, nothing else.` }]
    });

    const raw = r.content.map(c => c.text || '').join('').trim();
    const j   = raw.indexOf('{');
    const k   = raw.lastIndexOf('}');

    if (j === -1) {
      throw new Error('AI returned no valid JSON. Check your Anthropic credits at console.anthropic.com');
    }

    const result = JSON.parse(raw.slice(j, k + 1));
    let scenes   = result.scenes || [];

    // Normalise every scene — enforce max 10s duration
    scenes = scenes.map((s, i) => ({
      id:          s.id          || ('s_' + (i + 1)),
      sceneNumber: s.sceneNumber || (i + 1),
      type:        (s.type       || 'MAIN').toUpperCase(),
      narration:   (s.narration  || s.text || '').trim(),
      wordCount:   s.wordCount   || (s.narration || '').split(/\s+/).filter(Boolean).length,
      duration:    Math.min(s.duration || sceneDuration, 10), // hard cap at 10s
      notes:       s.notes || '',
      assets:      [],
      status:      'draft'
    })).filter(s => s.narration.length > 0); // remove empty scenes

    const totalSecs = scenes.reduce((t, s) => t + s.duration, 0);
    const mins      = Math.floor(totalSecs / 60);
    const secs      = totalSecs % 60;

    res.json({
      title:             result.title || title,
      totalScenes:       scenes.length,
      estimatedDuration: mins + ':' + String(secs).padStart(2, '0'),
      wpm,
      sceneDuration,
      scenes
    });

  } catch (e) {
    console.error('segment error:', e.message);
    const isCredits = e.message?.includes('credit') || e.message?.includes('billing') || e.status === 400;
    res.status(500).json({
      error: isCredits
        ? 'Anthropic API credits exhausted. Go to console.anthropic.com → Billing to top up.'
        : e.message
    });
  }
});

// ── VOICE (ElevenLabs TTS) ────────────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', stability = 0.5, similarityBoost = 0.75 } = req.body;
    if (!text)           return res.status(400).json({ error: 'No text provided.' });
    if (!ELEVENLABS_KEY) return res.status(503).json({ error: 'ElevenLabs API key not configured.' });

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability, similarity_boost: similarityBoost, style: 0.3, use_speaker_boost: true }
      })
    });
    if (!r.ok) throw new Error('ElevenLabs error: ' + r.status + ' ' + await r.text());
    const buf = await r.arrayBuffer();
    res.json({ audio: Buffer.from(buf).toString('base64') });
  } catch (e) {
    console.error('voice error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── SCENE IMAGE (DALL-E 3) ────────────────────────────────────────────────────
app.post('/api/image', async (req, res) => {
  if (!checkRate(req, res)) return;
  try {
    const { prompt, style = 'professional broadcast, photorealistic, 4K, no text, no watermarks' } = req.body;
    if (!OPENAI_KEY) return res.status(503).json({ error: 'OpenAI API key not configured.' });

    const safePrompt = (prompt + '. ' + style).slice(0, 1000);

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: safePrompt,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        response_format: 'b64_json',
        style: 'natural'
      })
    });
    if (!r.ok) throw new Error('DALL-E error: ' + r.status + ' ' + await r.text());
    const d = await r.json();
    res.json({ imageBase64: d.data?.[0]?.b64_json });
  } catch (e) {
    console.error('image error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── AI PRESENTER (HeyGen) ─────────────────────────────────────────────────────
// Sends clean audio for accurate phoneme/viseme/lipsync.
// No text overlays, no watermark, seamless transitions via talking_style: expressive.
app.post('/api/presenter', async (req, res) => {
  try {
    const { referenceImageBase64, audioBase64, ratio = '16:9' } = req.body;
    if (!HEYGEN_KEY) return res.status(503).json({ error: 'HeyGen API key not configured.' });
    if (!referenceImageBase64) return res.status(400).json({ error: 'Photo required.' });
    if (!audioBase64)          return res.status(400).json({ error: 'Audio required for lipsync.' });

    // Upload photo
    const ur = await fetch('https://upload.heygen.com/v1/talking_photo', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: referenceImageBase64 })
    });
    if (!ur.ok) throw new Error('HeyGen photo upload failed: ' + ur.status);
    const ud  = await ur.json();
    const tpId = ud.data?.talking_photo_id;
    if (!tpId) throw new Error('HeyGen did not return a talking_photo_id');

    // Generate video — clean audio drives lipsync (phoneme/viseme handled by HeyGen)
    const vr = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'talking_photo',
            talking_photo_id: tpId,
            talking_style: 'expressive',    // natural mouth movement
            expression: 'happy',
            movement_amplitude: 'auto'
          },
          voice: {
            type: 'audio',
            audio_base64: audioBase64       // clean audio = accurate lipsync
          },
          background: { type: 'color', value: '#1a3a5c' }
        }],
        aspect_ratio: ratio,
        test: false                         // no watermark
      })
    });
    if (!vr.ok) throw new Error('HeyGen video generation failed: ' + vr.status);
    const vd  = await vr.json();
    const vid = vd.data?.video_id;
    if (!vid) throw new Error('HeyGen did not return a video_id');

    res.json({ taskId: 'heygen-' + vid });
  } catch (e) {
    console.error('presenter error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── AI PRESENTER STATUS ───────────────────────────────────────────────────────
app.get('/api/presenter/status/:taskId', async (req, res) => {
  try {
    const id = req.params.taskId.replace('heygen-', '');
    const r  = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, {
      headers: { 'X-Api-Key': HEYGEN_KEY }
    });
    const d = await r.json();
    const s = d.data?.status;
    res.json({
      status:   s === 'completed' ? 'SUCCEEDED' : s === 'failed' ? 'FAILED' : 'PROCESSING',
      videoUrl: d.data?.video_url,
      progress: s === 'completed' ? 1 : 0.5
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STRIPE CHECKOUT ───────────────────────────────────────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    if (!STRIPE_KEY) return res.status(503).json({ error: 'Stripe not configured.' });
    const stripe  = require('stripe')(STRIPE_KEY);
    const { priceId, mode = 'subscription', customerEmail } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId required.' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      customer_email: customerEmail,
      success_url:    'https://aabstudio.ai?checkout=success',
      cancel_url:     'https://aabstudio.ai/pricing'
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('stripe checkout error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── IMPROVE SCRIPT (AI helper) ────────────────────────────────────────────────
app.post('/api/script/improve', async (req, res) => {
  if (!checkRate(req, res)) return;
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided.' });

    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 3000,
      system: 'Improve this script for spoken video delivery. Keep all content and meaning intact. Improve sentence flow, natural speech rhythm, and clarity only. Return only the improved script text.',
      messages: [{ role: 'user', content: text }]
    });
    res.json({ improved: r.content[0]?.text?.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AABStudio v2.2 running on port ${PORT}`);
  console.log(`Anthropic: ${!!process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`Stripe:    ${!!STRIPE_KEY ? 'configured' : 'MISSING'}`);
});
