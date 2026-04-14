/*
===============================================================================
AABStudio.ai — Advanced Teleprompter Video Production Studio
Server — Clean Rebuild
===============================================================================
*/
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.json({ received: true });
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    if (event.type === 'checkout.session.completed') {
      console.log('Payment completed:', event.data.object.customer_email);
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).send('Webhook Error: ' + err.message);
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(cors());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const HEYGEN_KEY = process.env.HEYGEN_API_KEY;
const DALLE_KEY = process.env.OPENAI_API_KEY;
const CREATOMATE_KEY = process.env.CREATOMATE_API_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'AABStudio.ai — Teleprompter Video Studio',
    version: '2.0',
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    elevenlabs: !!ELEVENLABS_KEY,
    heygen: !!HEYGEN_KEY,
    openai: !!DALLE_KEY,
    creatomate: !!CREATOMATE_KEY,
    stripe: !!STRIPE_KEY
  });
});

function extractTextFromBase64(base64, mimeType, fileName) {
  try {
    const buf = Buffer.from(base64, 'base64');
    if (mimeType === 'text/plain' || (fileName && fileName.endsWith('.txt'))) {
      return buf.toString('utf8');
    }
    if (mimeType && mimeType.includes('wordprocessingml')) {
      const text = buf.toString('utf8');
      const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
    }
    return '';
  } catch (e) { return ''; }
}

// ── SCENE SEGMENTATION — the core AI feature ──────────────────────────────────
app.post('/api/segment', async (req, res) => {
  try {
    const { script, scriptText, fileBase64, mimeType, fileName, wpm = 150, sceneDuration = 8, title } = req.body;
    let text = script || scriptText || '';

    if (!text && fileBase64) {
      if (mimeType === 'application/pdf') {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
              { type: 'text', text: 'Extract all text from this document. Return only the raw text, no commentary.' }
            ]
          }]
        });
        text = response.content.map(c => c.text || '').join('').trim();
      } else {
        text = extractTextFromBase64(fileBase64, mimeType, fileName);
      }
    }

    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'No script text found.' });
    }

    const wordsPerScene = Math.round((wpm / 60) * sceneDuration);

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 12000,
      system: `You are a scene segmentation engine for a professional teleprompter video studio.
Your ONLY job: split script text into timed presenter scenes.
Do NOT analyse, critique, or modify content. Preserve exact wording.

RULES:
- Each scene = ${wordsPerScene} words (target ${sceneDuration}s at ${wpm} WPM)
- Split at natural sentence or clause boundaries only
- Never cut mid-sentence
- Detect section headings as scene group titles
- Assign a concise scene title (3-5 words)
- Suggest a brief visual prompt per scene

OUTPUT — valid JSON only, flat scenes array:
{"title":"project title","totalScenes":0,"scenes":[{"id":"s_1","sceneNumber":1,"type":"INTRO","narration":"exact words from script","wordCount":0,"duration":${sceneDuration},"notes":"","status":"draft"}]}`,
      messages: [{
        role: 'user',
        content: `Segment this script into ${wordsPerScene}-word scenes:\n\n${text.slice(0, 60000)}\n\nReturn ONLY valid JSON.`
      }]
    });

    const raw = response.content.map(c => c.text || '').join('').trim();
    const j = raw.indexOf('{'), k = raw.lastIndexOf('}');
    if (j === -1) throw new Error('AI returned no valid JSON. Try a shorter script.');
    const result = JSON.parse(raw.slice(j, k + 1));

    // Flatten sections into scenes array (frontend expects flat scenes[])
    let scenes = [];
    let sceneCounter = 1;
    if (result.scenes && result.scenes.length) {
      // Already flat
      scenes = result.scenes.map((s, i) => ({
        id: 's_' + (i + 1),
        sceneNumber: i + 1,
        type: s.type || 'MAIN',
        narration: s.narration || s.text || '',
        wordCount: s.wordCount || (s.narration || '').split(/\s+/).length,
        duration: s.duration || sceneDuration,
        notes: s.notes || '',
        assets: [],
        status: 'draft'
      }));
    } else if (result.sections && result.sections.length) {
      // Nested sections — flatten
      result.sections.forEach(section => {
        (section.scenes || []).forEach(s => {
          scenes.push({
            id: 's_' + sceneCounter,
            sceneNumber: sceneCounter,
            type: s.type || 'MAIN',
            narration: s.narration || s.text || '',
            wordCount: s.wordCount || (s.narration || '').split(/\s+/).length,
            duration: s.duration || sceneDuration,
            notes: s.notes || '',
            sectionTitle: section.sectionTitle || '',
            assets: [],
            status: 'draft'
          });
          sceneCounter++;
        });
      });
    }

    const totalScenes = scenes.length;
    const totalSecs = totalScenes * sceneDuration;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const estimatedDuration = mins + ':' + String(secs).padStart(2, '0');

    res.json({
      title: result.title || title || 'My Video',
      totalScenes,
      estimatedDuration,
      wpm,
      sceneDuration,
      scenes
    });
  } catch (e) {
    console.error('Segment error:', e.message, e.stack);
    res.status(500).json({ 
      error: e.message,
      hint: !process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY is not set in Railway environment variables' : 'Check Railway deployment logs for details'
    });
  }
});

// ── VOICE ─────────────────────────────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', stability = 0.5, similarityBoost = 0.75 } = req.body;
    if (!text) return res.status(400).json({ error: 'No text' });
    if (!ELEVENLABS_KEY) return res.status(503).json({ error: 'ElevenLabs not configured' });
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability, similarity_boost: similarityBoost } })
    });
    if (!r.ok) throw new Error('ElevenLabs HTTP ' + r.status);
    const buf = await r.arrayBuffer();
    res.json({ audio: Buffer.from(buf).toString('base64') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SCENE IMAGE ───────────────────────────────────────────────────────────────
app.post('/api/image', async (req, res) => {
  try {
    const { prompt, referenceImageBase64, isFirstScene, style = 'photorealistic professional' } = req.body;
    if (!DALLE_KEY) return res.status(503).json({ error: 'OpenAI not configured' });
    const fullPrompt = `${prompt}. ${style}. Broadcast quality, 4K, no text.`.slice(0, 1000);

    if (referenceImageBase64) {
      try {
        const buf = Buffer.from(referenceImageBase64, 'base64');
        const fd = new FormData();
        fd.append('image', new File([buf], 'ref.png', { type: 'image/png' }));
        fd.append('prompt', (isFirstScene ? 'Same person from reference: ' : 'IDENTICAL to reference: ') + fullPrompt);
        fd.append('model', 'gpt-image-1');
        fd.append('n', '1');
        fd.append('size', '1024x1024');
        const er = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { 'Authorization': 'Bearer ' + DALLE_KEY }, body: fd });
        if (er.ok) {
          const ed = await er.json();
          if (ed.data?.[0]?.b64_json) return res.json({ imageBase64: ed.data[0].b64_json, provider: 'gpt-image-1' });
        }
      } catch (e2) { console.warn('Image edit failed:', e2.message); }
    }

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + DALLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-3', prompt: fullPrompt, n: 1, size: '1024x1024', quality: 'hd', response_format: 'b64_json' })
    });
    if (!r.ok) throw new Error('DALL-E HTTP ' + r.status);
    const data = await r.json();
    res.json({ imageBase64: data.data?.[0]?.b64_json, provider: 'dalle-3' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── AI PRESENTER ──────────────────────────────────────────────────────────────
app.post('/api/presenter', async (req, res) => {
  try {
    const { referenceImageBase64, audioBase64, ratio = '16:9' } = req.body;
    if (!HEYGEN_KEY) return res.status(503).json({ error: 'HeyGen not configured' });
    const ur = await fetch('https://upload.heygen.com/v1/talking_photo', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: referenceImageBase64 })
    });
    if (!ur.ok) throw new Error('HeyGen upload HTTP ' + ur.status);
    const ud = await ur.json();
    const tpId = ud.data?.talking_photo_id;
    if (!tpId) throw new Error('No talking_photo_id');
    const vr = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: 'talking_photo', talking_photo_id: tpId, talking_style: 'expressive', expression: 'happy', movement_amplitude: 'auto' },
          voice: audioBase64 ? { type: 'audio', audio_base64: audioBase64 } : { type: 'text', input_text: 'Hello.', voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54' },
          background: { type: 'color', value: '#1a3a5c' }
        }],
        aspect_ratio: ratio
      })
    });
    if (!vr.ok) throw new Error('HeyGen video HTTP ' + vr.status);
    const vd = await vr.json();
    const vid = vd.data?.video_id;
    if (!vid) throw new Error('No video_id');
    res.json({ taskId: 'heygen-' + vid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/presenter/status/:taskId', async (req, res) => {
  try {
    const id = req.params.taskId.replace('heygen-', '');
    const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, { headers: { 'X-Api-Key': HEYGEN_KEY } });
    const data = await r.json();
    const s = data.data?.status;
    res.json({ status: s === 'completed' ? 'SUCCEEDED' : s === 'failed' ? 'FAILED' : 'PROCESSING', videoUrl: data.data?.video_url, progress: s === 'completed' ? 1 : 0.5 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ASSEMBLY ──────────────────────────────────────────────────────────────────
app.post('/api/assemble', async (req, res) => {
  try {
    const { scenes, format = '16:9' } = req.body;
    if (!CREATOMATE_KEY) return res.status(503).json({ error: 'Creatomate not configured' });
    const sizeMap = { '16:9': [1920,1080], '9:16': [1080,1920], '1:1': [1080,1080], '4:5': [1080,1350] };
    const [w, h] = sizeMap[format] || [1920, 1080];
    const elements = (scenes || []).filter(s => s.videoUrl || s.imageUrl).map(s => ({
      type: s.videoUrl ? 'video' : 'image', source: s.videoUrl || s.imageUrl, duration: s.duration || 8
    }));
    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + CREATOMATE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: { output_format: 'mp4', width: w, height: h, elements } })
    });
    if (!r.ok) throw new Error('Creatomate HTTP ' + r.status);
    const data = await r.json();
    res.json({ renderId: data[0]?.id, status: data[0]?.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/assemble/status/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`, { headers: { 'Authorization': 'Bearer ' + CREATOMATE_KEY } });
    const data = await r.json();
    res.json({ status: data.status, url: data.url, progress: data.progress || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MUSIC ─────────────────────────────────────────────────────────────────────
app.post('/api/music', async (req, res) => {
  try {
    const { prompt = 'calm professional background, no vocals', duration = 30 } = req.body;
    if (!ELEVENLABS_KEY) return res.status(503).json({ error: 'ElevenLabs not configured' });
    const r = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: prompt, duration_seconds: duration, prompt_influence: 0.3 })
    });
    if (!r.ok) throw new Error('Music HTTP ' + r.status);
    const buf = await r.arrayBuffer();
    res.json({ audio: Buffer.from(buf).toString('base64') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STRIPE ────────────────────────────────────────────────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    if (!STRIPE_KEY) return res.status(503).json({ error: 'Stripe not configured' });
    const stripe = require('stripe')(STRIPE_KEY);
    const { priceId, mode = 'subscription', customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode, customer_email: customerEmail,
      success_url: 'https://aabstudio.ai?checkout=success',
      cancel_url: 'https://aabstudio.ai?checkout=cancelled'
    });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI HELPERS ────────────────────────────────────────────────────────────────
app.post('/api/script/improve', async (req, res) => {
  try {
    const { text } = req.body;
    const r = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 2000,
      system: 'Improve this script for spoken video delivery. Keep all content intact. Improve flow and natural speech patterns only.',
      messages: [{ role: 'user', content: text }]
    });
    res.json({ improved: r.content[0]?.text?.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`AABStudio v2 — Teleprompter Studio — port ${PORT}`));
