const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const app = express();
app.use(cors());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

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
Generate 4-5 sections, 2-3 evidence items each. Reference actual content.`;

    let messages;
    if (isPDF && fileBase64) {
      messages = [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
        { type: 'text', text: analysisPrompt }
      ]}];
    } else {
      let documentText = fileBase64 ? await extractText(fileName, fileBase64, mimeType) : null;
      documentText = documentText || fileContent || null;
      const docSection = documentText
        ? `\n\nDOCUMENT NAME: ${fileName}\n\nCONTENT:\n${documentText}`
        : `\n\nDocument: "${fileName}" — content unavailable.`;
      messages = [{ role: 'user', content: analysisPrompt + docSection }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'pdfs-2024-09-25' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3500, messages })
    });

    if (!response.ok) return res.status(500).json({ error: 'Anthropic API error', details: await response.text() });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// ── Scene generation ──────────────────────────────────────────────────────────
app.post('/api/scenes', async (req, res) => {
  try {
    const { report, presenterMode } = req.body;
    const prompt = `You are AABStudio Scene Engine. Convert this report into broadcast-ready presenter scripts.

REPORT: ${report.title}
TYPE: ${report.docType} | DOMAIN: ${report.domain}
SUMMARY: ${report.executiveSummary}
SECTIONS: ${report.sections.map((s,i) => `${i+1}. ${s.title}: ${s.body} | Evidence: ${(s.evidenceItems||[]).map(e=>e.text).join(' | ')}`).join('\n')}

PRESENTER MODE: ${presenterMode || 'human'}
- human: natural teleprompter, one presenter
- ai: authoritative narration, third-person
- dual: Presenter A introduces/questions, Presenter B explains/analyses

RULES: 8 seconds max per scene, 140wpm = 15-20 words exactly per scene. Scenes must flow continuously.
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
          "visualPrompt": "cinematic description of what appears on screen — setting, mood, visual elements",
          "evidenceRef": "EV-101 or null"
        }
      ]
    }
  ]
}
One block per section, 3-5 scenes per block. Natural broadcast-ready language.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });

    if (!response.ok) return res.status(500).json({ error: 'Anthropic API error', details: await response.text() });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (err) {
    console.error('Scene error:', err);
    res.status(500).json({ error: 'Scene generation failed', details: err.message });
  }
});

// ── ElevenLabs voice generation ───────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId, stability, similarityBoost } = req.body;
    const vid = voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Sarah — clear, professional

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: stability || 0.5,
          similarity_boost: similarityBoost || 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'ElevenLabs error', details: err });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    res.json({ audio: base64Audio, mimeType: 'audio/mpeg' });
  } catch (err) {
    console.error('Voice error:', err);
    res.status(500).json({ error: 'Voice generation failed', details: err.message });
  }
});

// ── ElevenLabs voices list ────────────────────────────────────────────────────
app.get('/api/voices', async (req, res) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
    });
    if (!response.ok) return res.status(500).json({ error: 'Could not fetch voices' });
    const data = await response.json();
    const voices = (data.voices || []).map(v => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.labels ? Object.values(v.labels).join(', ') : ''
    }));
    res.json({ voices });
  } catch (err) {
    res.status(500).json({ error: 'Voices fetch failed', details: err.message });
  }
});

// ── Runway video generation ───────────────────────────────────────────────────
app.post('/api/video/generate', async (req, res) => {
  try {
    const { prompt, duration, ratio } = req.body;

    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptText: prompt,
        duration: duration || 8,
        ratio: ratio || '1280:768',
        watermark: false
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Runway error', details: err });
    }

    const data = await response.json();
    res.json({ taskId: data.id, status: data.status });
  } catch (err) {
    console.error('Runway error:', err);
    res.status(500).json({ error: 'Video generation failed', details: err.message });
  }
});

// ── Runway task status ────────────────────────────────────────────────────────
app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06'
      }
    });

    if (!response.ok) return res.status(500).json({ error: 'Status check failed' });
    const data = await response.json();
    res.json({
      taskId: data.id,
      status: data.status,
      progress: data.progress || 0,
      videoUrl: data.output ? data.output[0] : null,
      error: data.failure || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', details: err.message });
  }
});

// ── Generate export metadata ──────────────────────────────────────────────────
app.post('/api/export/metadata', async (req, res) => {
  try {
    const { report, platform } = req.body;
    const platformGuide = {
      youtube: 'YouTube: title max 100 chars, description 5000 chars, 3-5 hashtags, include chapters',
      instagram: 'Instagram Reels: punchy caption max 2200 chars, 20-30 hashtags, call to action',
      tiktok: 'TikTok: hook in first line, 150 char caption, 3-5 trending hashtags',
      linkedin: 'LinkedIn: professional tone, 1300 char limit, 3-5 hashtags, include key insight',
      twitter: 'Twitter/X: max 280 chars, 1-2 hashtags, punchy and direct',
      facebook: 'Facebook: conversational, 63206 char limit, 1-3 hashtags'
    };

    const prompt = `Generate optimised social media metadata for this document analysis video.

REPORT TITLE: ${report.title}
DOCUMENT TYPE: ${report.docType}
SUMMARY: ${report.executiveSummary}
PLATFORM: ${platform}
GUIDE: ${platformGuide[platform] || 'General social media post'}

Return ONLY valid JSON:
{
  "title": "optimised video title for ${platform}",
  "description": "optimised description/caption",
  "hashtags": ["tag1", "tag2"],
  "chapters": [{"time": "0:00", "title": "Chapter title"}],
  "thumbnail_prompt": "description for AI thumbnail generation"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });

    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (err) {
    res.status(500).json({ error: 'Metadata generation failed', details: err.message });
  }
});

// ── Stripe ────────────────────────────────────────────────────────────────────
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { priceId, mode, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: mode || 'subscription',
      payment_method_types: ['card'],
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
    status: 'ok', platform: 'AABStudio API v5',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing',
    stripe: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    elevenlabs: process.env.ELEVENLABS_API_KEY ? 'set' : 'missing',
    runway: process.env.RUNWAY_API_KEY ? 'set' : 'missing'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API v5 running on port ${PORT}`));
