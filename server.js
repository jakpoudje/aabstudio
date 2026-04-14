'use strict';
/*
  AABStudio.ai — Teleprompter Video Production Studio
  Server v2.1 — clean, stable, all endpoints working
*/
const express = require('express');
const cors    = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS first — before everything ────────────────────────────────────────────
const corsOpts = { origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] };
app.use(cors(corsOpts));
app.options('*', cors(corsOpts));

// ── Stripe webhook needs raw body — must come before json parser ───────────────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.json({ received: true });
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event  = stripe.webhooks.constructEvent(req.body, sig, secret);
    console.log('Stripe event:', event.type);
    res.json({ received: true });
  } catch (e) { res.status(400).send('Webhook error: ' + e.message); }
});

app.use(express.json({ limit: '20mb' }));

// ── Clients ───────────────────────────────────────────────────────────────────
const anthropic      = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const HEYGEN_KEY     = process.env.HEYGEN_API_KEY;
const OPENAI_KEY     = process.env.OPENAI_API_KEY;
const CREATOMATE_KEY = process.env.CREATOMATE_API_KEY;
const STRIPE_KEY     = process.env.STRIPE_SECRET_KEY;
const MODEL          = 'claude-sonnet-4-6';

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok', version: '2.1', platform: 'AABStudio — Teleprompter Studio',
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  elevenlabs: !!ELEVENLABS_KEY, heygen: !!HEYGEN_KEY,
  openai: !!OPENAI_KEY, stripe: !!STRIPE_KEY
}));

// ── EXTRACT TEXT ──────────────────────────────────────────────────────────────
// Frontend sends extracted text directly for PDF (via PDF.js client-side)
// This endpoint now only handles DOCX and does light cleanup on any text sent
app.post('/api/extract-text', async (req, res) => {
  try {
    const { text, fileBase64, mimeType, fileName } = req.body;

    // If frontend already extracted the text (PDF.js), just return it cleaned
    if (text && text.trim().length > 10) {
      const clean = text.trim().replace(/\s{3,}/g, '\n\n');
      return res.json({ text: clean, words: clean.split(/\s+/).length });
    }

    // No base64 provided at all
    if (!fileBase64) return res.status(400).json({ error: 'No text or file provided.' });

    const buf = Buffer.from(fileBase64, 'base64');

    // TXT — direct decode
    if (!mimeType || mimeType === 'text/plain' || (fileName && fileName.endsWith('.txt'))) {
      const t = buf.toString('utf8').trim();
      return res.json({ text: t, words: t.split(/\s+/).length });
    }

    // DOCX — extract XML text nodes
    if ((mimeType && mimeType.includes('wordprocessingml')) || (fileName && fileName.endsWith('.docx'))) {
      const raw     = buf.toString('utf8');
      const matches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const t       = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();
      if (t.length > 10) return res.json({ text: t, words: t.split(/\s+/).length });
    }

    // PDF sent as base64 — use Claude (only for small PDFs < 5MB base64)
    if (mimeType === 'application/pdf') {
      if (fileBase64.length > 6_000_000) {
        return res.status(413).json({ error: 'PDF too large for server extraction. Please use the Paste tab to copy your text instead.' });
      }
      const r = await anthropic.messages.create({
        model: MODEL, max_tokens: 6000,
        messages: [{ role: 'user', content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
          { type: 'text', text: 'Extract all text from this document. Raw text only, preserve paragraph breaks with double newlines, no commentary.' }
        ]}]
      });
      const t = r.content.map(c => c.text || '').join('').trim();
      return res.json({ text: t, words: t.split(/\s+/).length });
    }

    return res.status(400).json({ error: 'Unsupported file type. Use TXT, DOCX, or PDF.' });
  } catch (e) {
    console.error('extract-text error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── SCENE SEGMENTATION ────────────────────────────────────────────────────────
app.post('/api/segment', async (req, res) => {
  try {
    const { script, wpm = 150, sceneDuration = 8, title = 'My Video' } = req.body;

    if (!script || script.trim().length < 10) {
      return res.status(400).json({ error: 'Script text is required (minimum 10 characters).' });
    }

    const wordsPerScene = Math.round((wpm / 60) * sceneDuration);
    const text          = script.trim().slice(0, 60000);

    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 12000,
      system: `You are a teleprompter scene segmentation engine.
Split the provided script into presenter scenes for teleprompter recording.
DO NOT analyse, critique, or rewrite. Preserve exact wording.

RULES:
- Each scene ≈ ${wordsPerScene} words (${wpm} WPM × ${sceneDuration}s)
- Split only at sentence or clause boundaries
- Never cut mid-sentence
- Use the script's own headings/paragraphs as natural breaks
- Scene types: INTRO, MAIN, TRANSITION, SUMMARY, CONCLUSION, HOOK

RESPOND WITH ONLY THIS JSON — no markdown, no explanation:
{
  "title": "${title}",
  "totalScenes": 0,
  "estimatedDuration": "0:00",
  "scenes": [
    {
      "id": "s_1",
      "sceneNumber": 1,
      "type": "INTRO",
      "narration": "exact words from script",
      "wordCount": 0,
      "duration": ${sceneDuration},
      "notes": "",
      "status": "draft"
    }
  ]
}`,
      messages: [{ role: 'user', content: `Segment this script:\n\n${text}\n\nReturn ONLY valid JSON.` }]
    });

    const raw = r.content.map(c => c.text || '').join('').trim();
    const j   = raw.indexOf('{');
    const k   = raw.lastIndexOf('}');
    if (j === -1) throw new Error('AI returned no JSON — please try a shorter script or check your API key.');

    const result = JSON.parse(raw.slice(j, k + 1));
    let scenes   = result.scenes || [];

    // Ensure every scene has required fields
    scenes = scenes.map((s, i) => ({
      id:          s.id          || 's_' + (i + 1),
      sceneNumber: s.sceneNumber || (i + 1),
      type:        (s.type       || 'MAIN').toUpperCase(),
      narration:   s.narration   || s.text || '',
      wordCount:   s.wordCount   || (s.narration || '').split(/\s+/).filter(Boolean).length,
      duration:    s.duration    || sceneDuration,
      notes:       s.notes       || '',
      assets:      [],
      status:      'draft'
    }));

    const totalSecs = scenes.reduce((t, s) => t + s.duration, 0);
    const mins      = Math.floor(totalSecs / 60);
    const secs      = totalSecs % 60;

    res.json({
      title: result.title || title,
      totalScenes: scenes.length,
      estimatedDuration: mins + ':' + String(secs).padStart(2, '0'),
      wpm, sceneDuration, scenes
    });

  } catch (e) {
    console.error('segment error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── VOICE (ElevenLabs) ────────────────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', stability = 0.5, similarityBoost = 0.75 } = req.body;
    if (!text)            return res.status(400).json({ error: 'No text' });
    if (!ELEVENLABS_KEY)  return res.status(503).json({ error: 'ElevenLabs not configured' });

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability, similarity_boost: similarityBoost } })
    });
    if (!r.ok) throw new Error('ElevenLabs ' + r.status);
    const buf = await r.arrayBuffer();
    res.json({ audio: Buffer.from(buf).toString('base64') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SCENE IMAGE (OpenAI) ──────────────────────────────────────────────────────
app.post('/api/image', async (req, res) => {
  try {
    const { prompt, referenceImageBase64, style = 'professional broadcast presenter' } = req.body;
    if (!OPENAI_KEY) return res.status(503).json({ error: 'OpenAI not configured' });

    const fullPrompt = `${prompt}. ${style}. No text or watermarks.`.slice(0, 1000);

    if (referenceImageBase64) {
      try {
        const fd = new FormData();
        fd.append('image', new File([Buffer.from(referenceImageBase64, 'base64')], 'ref.png', { type: 'image/png' }));
        fd.append('prompt', 'Same person: ' + fullPrompt);
        fd.append('model', 'gpt-image-1');
        fd.append('n', '1');
        fd.append('size', '1024x1024');
        const er = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + OPENAI_KEY }, body: fd });
        if (er.ok) {
          const ed = await er.json();
          if (ed.data?.[0]?.b64_json) return res.json({ imageBase64: ed.data[0].b64_json });
        }
      } catch (e2) { console.warn('Image edit failed, falling back to DALL-E 3'); }
    }

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-3', prompt: fullPrompt, n: 1, size: '1024x1024', quality: 'hd', response_format: 'b64_json' })
    });
    if (!r.ok) throw new Error('DALL-E ' + r.status);
    const d = await r.json();
    res.json({ imageBase64: d.data?.[0]?.b64_json });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI PRESENTER VIDEO (HeyGen) ───────────────────────────────────────────────
app.post('/api/presenter', async (req, res) => {
  try {
    const { referenceImageBase64, audioBase64, ratio = '16:9' } = req.body;
    if (!HEYGEN_KEY) return res.status(503).json({ error: 'HeyGen not configured' });

    const ur = await fetch('https://upload.heygen.com/v1/talking_photo', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: referenceImageBase64 })
    });
    if (!ur.ok) throw new Error('HeyGen upload ' + ur.status);
    const { data: { talking_photo_id: tpId } } = await ur.json();

    const vr = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: 'talking_photo', talking_photo_id: tpId, talking_style: 'expressive' },
          voice: { type: 'audio', audio_base64: audioBase64 },
          background: { type: 'color', value: '#1a3a5c' }
        }],
        aspect_ratio: ratio
      })
    });
    if (!vr.ok) throw new Error('HeyGen video ' + vr.status);
    const vd = await vr.json();
    res.json({ taskId: 'heygen-' + vd.data?.video_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/presenter/status/:taskId', async (req, res) => {
  try {
    const id = req.params.taskId.replace('heygen-', '');
    const r  = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, { headers: { 'X-Api-Key': HEYGEN_KEY } });
    const d  = await r.json();
    const s  = d.data?.status;
    res.json({ status: s === 'completed' ? 'SUCCEEDED' : s === 'failed' ? 'FAILED' : 'PROCESSING', videoUrl: d.data?.video_url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STRIPE CHECKOUT ───────────────────────────────────────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    if (!STRIPE_KEY) return res.status(503).json({ error: 'Stripe not configured' });
    const stripe  = require('stripe')(STRIPE_KEY);
    const { priceId, mode = 'subscription', customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode, customer_email: customerEmail,
      success_url: 'https://aabstudio.ai?checkout=success',
      cancel_url:  'https://aabstudio.ai?checkout=cancelled'
    });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── START ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`AABStudio v2.1 running on port ${PORT}`));
