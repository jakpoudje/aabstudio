const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const app = express();
app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const RUNWAY_KEY = process.env.RUNWAY_API_KEY;
const CREATOMATE_KEY = process.env.CREATOMATE_API_KEY;

// ── Document extraction ───────────────────────────────────────────────────────
async function extractText(fileName, fileBase64, mimeType) {
  if (!fileBase64) return null;
  const buffer = Buffer.from(fileBase64, 'base64');
  const name = (fileName || '').toLowerCase();
  try {
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 8000);
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      wb.SheetNames.forEach(s => { text += `[Sheet: ${s}]\n` + XLSX.utils.sheet_to_csv(wb.Sheets[s]) + '\n'; });
      return text.slice(0, 8000);
    }
    if (name.endsWith('.pptx')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      wb.SheetNames.forEach((s, i) => { text += `[Slide ${i+1}]\n` + XLSX.utils.sheet_to_txt(wb.Sheets[s]) + '\n'; });
      return text.slice(0, 8000);
    }
    if (name.match(/\.(csv|txt|md|json|html|htm)$/) || (mimeType && mimeType.startsWith('text/'))) {
      return buffer.toString('utf8').slice(0, 8000);
    }
    return null;
  } catch (err) {
    console.error('Extraction error:', err.message);
    return null;
  }
}

// ── Analysis ──────────────────────────────────────────────────────────────────
app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, fileName, fileContent, fileBase64, mimeType } = req.body;
    const name = (fileName || '').toLowerCase();
    const isPDF = name.endsWith('.pdf') || mimeType === 'application/pdf';

    const analysisPrompt = `You are AABStudio AI — a professional document intelligence engine.
Analysis request: "${request}"
Analysis depth: ${depth || 'deep'}
Return ONLY valid JSON, no markdown, no code fences:
{
  "title": "specific descriptive report title",
  "docType": "document type",
  "domain": "Legal | Financial | Research | Investigative | Policy | Technical | General",
  "executiveSummary": "2-3 sentences of substantive findings from the document",
  "sections": [
    {
      "title": "section title",
      "body": "3-4 sentences of substantive analysis with specific document references",
      "reasoning": {
        "observation": "specific observation from the document",
        "implication": "practical meaning",
        "recommendation": "actionable recommendation"
      },
      "evidenceItems": [
        {
          "label": "Risk Clause | Financial Anomaly | Key Entity | Contradiction | Obligation | Data Point | Legal Provision",
          "source": "Section 4.2 / Page 17 / Clause 3",
          "text": "direct quote or paraphrase from document",
          "interpretation": "analytical meaning",
          "implication": "practical consequence",
          "confidence": "High|Medium|Low"
        }
      ]
    }
  ]
}
Generate 4-5 sections, 2-3 evidence items each.`;

    let messages;
    if (isPDF && fileBase64) {
      messages = [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
        { type: 'text', text: analysisPrompt }
      ]}];
    } else {
      let documentText = fileBase64 ? await extractText(fileName, fileBase64, mimeType) : null;
      documentText = documentText || fileContent || null;
      const docSection = documentText ? `\n\nDOCUMENT NAME: ${fileName}\n\nCONTENT:\n${documentText}` : `\n\nDocument: "${fileName}" — content unavailable.`;
      messages = [{ role: 'user', content: analysisPrompt + docSection }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'pdfs-2024-09-25' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3500, messages })
    });
    if (!response.ok) return res.status(500).json({ error: 'Anthropic API error', details: await response.text() });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// ── Scene generation ──────────────────────────────────────────────────────────
app.post('/api/scenes', async (req, res) => {
  try {
    const { report, presenterMode } = req.body;
    const prompt = `You are AABStudio Scene Engine. Convert this report into broadcast-ready scripts.
REPORT: ${report.title} | TYPE: ${report.docType} | DOMAIN: ${report.domain}
SUMMARY: ${report.executiveSummary}
SECTIONS: ${report.sections.map((s,i) => `${i+1}. ${s.title}: ${s.body} | Evidence: ${(s.evidenceItems||[]).map(e=>e.text).join(' | ')}`).join('\n')}
PRESENTER MODE: ${presenterMode || 'human'}
- human: natural teleprompter, one presenter
- ai: authoritative narration, third-person
- dual: Presenter A introduces, Presenter B explains
RULES: 8 seconds max, 140wpm = 15-20 words exactly per scene. Scenes flow continuously.
Scene types: Introduction | Evidence | Explanation | Comparison | Recommendation | Conclusion
Return ONLY valid JSON:
{
  "title": "production title",
  "presenterMode": "${presenterMode||'human'}",
  "totalScenes": 0,
  "discussions": [
    {
      "sectionTitle": "section title",
      "discussionText": "2-3 sentence spoken expansion",
      "scenes": [
        {
          "sceneNumber": 1,
          "type": "Introduction",
          "duration": 8,
          "presenterA": "exactly 15-20 word script",
          "presenterB": "15-20 words for dual only, null otherwise",
          "visualPrompt": "cinematic scene description for video generation — setting, mood, movement, lighting",
          "evidenceRef": "EV-101 or null",
          "overlayText": "optional short text overlay for screen — key stat, quote, or name. null if none"
        }
      ]
    }
  ]
}
One block per section, 3-5 scenes per block. Natural broadcast language.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return res.status(500).json({ error: 'Scene error', details: await response.text() });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (err) {
    res.status(500).json({ error: 'Scene generation failed', details: err.message });
  }
});

// ── ElevenLabs voice ──────────────────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId, stability, similarityBoost } = req.body;
    const vid = voiceId || 'EXAVITQu4vr4xnSDxMaL';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_KEY },
      body: JSON.stringify({
        text, model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: stability || 0.5, similarity_boost: similarityBoost || 0.75, style: 0.3, use_speaker_boost: true }
      })
    });
    if (!response.ok) return res.status(500).json({ error: 'ElevenLabs error', details: await response.text() });
    const audioBuffer = await response.arrayBuffer();
    res.json({ audio: Buffer.from(audioBuffer).toString('base64'), mimeType: 'audio/mpeg' });
  } catch (err) {
    res.status(500).json({ error: 'Voice failed', details: err.message });
  }
});

app.get('/api/voices', async (req, res) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': ELEVENLABS_KEY } });
    if (!response.ok) return res.status(500).json({ error: 'Voices fetch failed' });
    const data = await response.json();
    res.json({ voices: (data.voices || []).map(v => ({ id: v.voice_id, name: v.name, category: v.category, description: v.labels ? Object.values(v.labels).join(', ') : '' })) });
  } catch (err) {
    res.status(500).json({ error: 'Voices failed', details: err.message });
  }
});

// ── ElevenLabs music/sound generation ────────────────────────────────────────
app.post('/api/music/generate', async (req, res) => {
  try {
    const { prompt, duration } = req.body;
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_KEY },
      body: JSON.stringify({ text: prompt, duration_seconds: Math.min(duration || 30, 22), prompt_influence: 0.3 })
    });
    if (!response.ok) return res.status(500).json({ error: 'Music generation failed', details: await response.text() });
    const audioBuffer = await response.arrayBuffer();
    res.json({ audio: Buffer.from(audioBuffer).toString('base64'), mimeType: 'audio/mpeg' });
  } catch (err) {
    res.status(500).json({ error: 'Music failed', details: err.message });
  }
});

// ── Runway video generation ───────────────────────────────────────────────────
app.post('/api/video/generate', async (req, res) => {
  try {
    const { prompt, duration, ratio, referenceImageBase64 } = req.body;
    let body;
    if (referenceImageBase64) {
      body = {
        model: 'gen3a_turbo',
        promptImage: `data:image/jpeg;base64,${referenceImageBase64}`,
        promptText: prompt,
        duration: duration || 8,
        ratio: ratio || '1280:768',
        watermark: false
      };
    } else {
      body = {
        model: 'gen3a_turbo',
        promptText: prompt,
        duration: duration || 8,
        ratio: ratio || '1280:768',
        watermark: false
      };
    }
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RUNWAY_KEY}`, 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify(body)
    });
    if (!response.ok) return res.status(500).json({ error: 'Runway error', details: await response.text() });
    const data = await response.json();
    res.json({ taskId: data.id, status: data.status });
  } catch (err) {
    res.status(500).json({ error: 'Video generation failed', details: err.message });
  }
});

app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`, {
      headers: { 'Authorization': `Bearer ${RUNWAY_KEY}`, 'X-Runway-Version': '2024-11-06' }
    });
    if (!response.ok) return res.status(500).json({ error: 'Status check failed' });
    const data = await response.json();
    res.json({ taskId: data.id, status: data.status, progress: data.progress || 0, videoUrl: data.output ? data.output[0] : null, error: data.failure || null });
  } catch (err) {
    res.status(500).json({ error: 'Status failed', details: err.message });
  }
});

// ── Creatomate render ─────────────────────────────────────────────────────────
app.post('/api/render', async (req, res) => {
  try {
    const { scenes, studioConfig, musicConfig, outputFormat, presenterMode } = req.body;

    // Build Creatomate composition
    const elements = [];
    let timeOffset = 0;

    for (const scene of scenes) {
      const sceneDuration = scene.audioDuration || scene.duration || 8;

      // Video track
      if (scene.videoUrl) {
        elements.push({
          type: 'video',
          source: scene.videoUrl,
          time: timeOffset,
          duration: sceneDuration,
          fit: 'cover',
          width: '100%',
          height: '100%'
        });
      } else {
        // Fallback: colour background with studio colour
        elements.push({
          type: 'rectangle',
          time: timeOffset,
          duration: sceneDuration,
          width: '100%',
          height: '100%',
          color: studioConfig?.bgColor || '#1a3a5c'
        });
      }

      // Voice audio track
      if (scene.audioBase64) {
        elements.push({
          type: 'audio',
          source: `data:audio/mpeg;base64,${scene.audioBase64}`,
          time: timeOffset,
          duration: sceneDuration,
          volume: '100%'
        });
      }

      // Text overlay — lower third
      if (scene.overlayText) {
        elements.push({
          type: 'text',
          text: scene.overlayText,
          time: timeOffset + 0.5,
          duration: sceneDuration - 1,
          x: '5%',
          y: '82%',
          width: '90%',
          height: 'auto',
          font_family: 'Montserrat',
          font_size: '28px',
          font_weight: '600',
          color: '#ffffff',
          background_color: 'rgba(26,58,92,0.85)',
          x_padding: '16px',
          y_padding: '8px',
          border_radius: '6px',
          x_alignment: 'left',
          animations: [{ time: 'start', duration: 0.4, type: 'slide', direction: 'up', fade: true }]
        });
      }

      // Scene type tag
      if (scene.type) {
        const typeColors = {
          Introduction: '#b8942a', Evidence: '#c0392b', Explanation: '#1a7a4a',
          Comparison: '#8a6200', Recommendation: '#2d5f8e', Conclusion: '#1a3a5c'
        };
        elements.push({
          type: 'text',
          text: scene.type.toUpperCase(),
          time: timeOffset,
          duration: 2,
          x: '5%', y: '5%', width: 'auto', height: 'auto',
          font_family: 'Montserrat', font_size: '11px', font_weight: '700',
          color: '#ffffff',
          background_color: typeColors[scene.type] || '#1a3a5c',
          x_padding: '10px', y_padding: '5px', border_radius: '20px',
          letter_spacing: '1.5px',
          animations: [{ time: 'start', duration: 0.3, type: 'fade' }, { time: 'end', duration: 0.3, type: 'fade' }]
        });
      }

      timeOffset += sceneDuration;
    }

    // Background music
    if (musicConfig && musicConfig.audioBase64) {
      const totalDuration = timeOffset;
      elements.push({
        type: 'audio',
        source: `data:audio/mpeg;base64,${musicConfig.audioBase64}`,
        time: 0,
        duration: totalDuration,
        volume: `${musicConfig.volume || 30}%`,
        audio_fade_in: 1,
        audio_fade_out: 2,
        keyframes: musicConfig.sidechain ? buildSidechainKeyframes(scenes, musicConfig) : null
      });
    }

    // Output format settings
    const formatSettings = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 }
    };
    const fmt = formatSettings[outputFormat] || formatSettings['16:9'];

    const renderBody = {
      output_format: 'mp4',
      width: fmt.width,
      height: fmt.height,
      frame_rate: 24,
      elements
    };

    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CREATOMATE_KEY}` },
      body: JSON.stringify(renderBody)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Creatomate error', details: err });
    }

    const data = await response.json();
    const renderId = Array.isArray(data) ? data[0].id : data.id;
    res.json({ renderId, status: 'rendering' });
  } catch (err) {
    res.status(500).json({ error: 'Render failed', details: err.message });
  }
});

function buildSidechainKeyframes(scenes, musicConfig) {
  const keyframes = [];
  let t = 0;
  for (const scene of scenes) {
    const dur = scene.audioDuration || scene.duration || 8;
    if (scene.audioBase64) {
      keyframes.push({ time: t, volume: `${musicConfig.duckLevel || 15}%` });
      keyframes.push({ time: t + 0.3, volume: `${musicConfig.duckLevel || 15}%` });
      keyframes.push({ time: t + dur - 0.3, volume: `${musicConfig.volume || 30}%` });
    }
    t += dur;
  }
  return keyframes;
}

app.get('/api/render/status/:renderId', async (req, res) => {
  try {
    const response = await fetch(`https://api.creatomate.com/v1/renders/${req.params.renderId}`, {
      headers: { 'Authorization': `Bearer ${CREATOMATE_KEY}` }
    });
    if (!response.ok) return res.status(500).json({ error: 'Render status failed' });
    const data = await response.json();
    res.json({ renderId: data.id, status: data.status, url: data.url, progress: data.progress || 0, error: data.error || null });
  } catch (err) {
    res.status(500).json({ error: 'Status failed', details: err.message });
  }
});

// ── Export metadata ───────────────────────────────────────────────────────────
app.post('/api/export/metadata', async (req, res) => {
  try {
    const { report, platform } = req.body;
    const guides = {
      youtube: 'YouTube: title max 100 chars, description with chapters, 3-5 hashtags',
      instagram: 'Instagram: punchy caption max 2200 chars, 20-30 hashtags, call to action',
      tiktok: 'TikTok: hook in first line, 150 chars, 3-5 trending hashtags',
      linkedin: 'LinkedIn: professional, 1300 chars, insight-led, 3-5 hashtags',
      twitter: 'Twitter/X: max 280 chars, 1-2 hashtags, punchy and direct',
      facebook: 'Facebook: conversational, 63206 chars, 1-3 hashtags'
    };
    const prompt = `Generate optimised social metadata for this document analysis video.
REPORT: ${report.title} | TYPE: ${report.docType}
SUMMARY: ${report.executiveSummary}
PLATFORM: ${platform} | GUIDE: ${guides[platform]||'General social'}
Return ONLY valid JSON:
{"title":"optimised title","description":"optimised description","hashtags":["tag1"],"chapters":[{"time":"0:00","title":"Chapter"}],"thumbnail_prompt":"AI thumbnail description"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (err) {
    res.status(500).json({ error: 'Metadata failed', details: err.message });
  }
});

// ── Stripe ────────────────────────────────────────────────────────────────────
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { priceId, mode, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: mode || 'subscription', payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://aabstudio.ai?checkout=success',
      cancel_url: 'https://aabstudio.ai?checkout=cancelled',
      customer_email: customerEmail,
      subscription_data: mode === 'subscription' ? { trial_period_days: 7 } : undefined,
      allow_promotion_codes: true
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
});

app.post('/api/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  console.log('Webhook:', event.type);
  res.json({ received: true });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok', platform: 'AABStudio API v6',
    anthropic: ANTHROPIC_KEY ? 'set' : 'missing',
    stripe: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    elevenlabs: ELEVENLABS_KEY ? 'set' : 'missing',
    runway: RUNWAY_KEY ? 'set' : 'missing',
    creatomate: CREATOMATE_KEY ? 'set' : 'missing'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API v6 on port ${PORT}`));
