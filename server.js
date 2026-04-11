const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const Stripe = require('stripe');

const app = express();

// ── CORS — allow all origins including GitHub Pages and custom domains ─────────
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info', 'x-supabase-api-version'],
  credentials: false
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── STRIPE WEBHOOK — must be raw body, registered BEFORE express.json() ──────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    if (!stripe) throw new Error('Stripe not configured');
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
      res.json({ received: true });
      return;
    }
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Payment completed:', session.id, session.customer_email);
      // TODO: credit user account in Supabase
    }
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.use(express.json({ limit: '50mb' }));

// ── ENV ───────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const CREATOMATE_KEY = process.env.CREATOMATE_API_KEY;
const HEYGEN_KEY = process.env.HEYGEN_API_KEY;
const KLING_KEY = process.env.KLING_API_KEY;
const DALLE_KEY = process.env.OPENAI_API_KEY;
const STABILITY_KEY = process.env.STABILITY_API_KEY;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;

// ── SERVER-SIDE RATE LIMIT CACHE ──────────────────────────────────────────────
let runwayRateLimitedUntil = 0;

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      anthropic: !!ANTHROPIC_KEY,
      elevenlabs: !!ELEVENLABS_KEY,
      stripe: !!STRIPE_KEY,
      creatomate: !!CREATOMATE_KEY,
      heygen: !!HEYGEN_KEY,
      kling: !!KLING_KEY,
      openai: !!DALLE_KEY,
    }
  });
});

// ── ENGINE 1: DOCUMENT INTELLIGENCE ──────────────────────────────────────────
function extractBase64Text(base64, mimeType, fileName) {
  if (!base64) return '';
  try {
    if (mimeType === 'text/plain' || fileName?.endsWith('.txt') || fileName?.endsWith('.csv') || fileName?.endsWith('.json')) {
      const buf = Buffer.from(base64, 'base64');
      return buf.toString('utf-8').slice(0, 50000);
    }
    if (mimeType === 'text/html' || fileName?.endsWith('.html')) {
      const buf = Buffer.from(base64, 'base64');
      return buf.toString('utf-8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50000);
    }
    return '';
  } catch (e) {
    return '';
  }
}

function buildAnalysisMessages(body) {
  const { request, depth, fileName, fileContent, fileBase64, mimeType } = body;
  const isPDF = mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName?.toLowerCase().endsWith('.docx');
  const isImage = mimeType?.startsWith('image/');
  const isPptx = mimeType?.includes('presentationml') || fileName?.toLowerCase().endsWith('.pptx');
  const isExcel = mimeType?.includes('spreadsheetml') || fileName?.toLowerCase().endsWith('.xlsx');

  // Size guard — Anthropic 200K token limit (~150K chars safe)
  const base64TooLarge = fileBase64 && fileBase64.length > 120000;

  const systemPrompt = `You are AABStudio's Document Intelligence Engine — a professional-grade analysis AI.

You produce DEEP, BALANCED analysis reports that are fair, evidence-based, and multi-perspective.

BALANCED REASONING REQUIRED:
Every section must include a "reasoning" object with these fields:
- observation: what you see in the document
- merits: positive aspects, benefits, strengths
- risks: concerns, risks, weaknesses
- tradeoffs: the tension between merits and risks
- operationalImpact: practical day-to-day consequences
- financialImpact: financial consequences and cost implications
- recommendation: specific actionable advice

EVIDENCE EXTRACTION:
Each section should include evidenceItems with:
- label: short descriptive name
- source: page/clause/section reference
- text: the direct quote from the document
- interpretation: what this means
- implication: consequence of this finding
- confidence: "High", "Medium", or "Low"

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown, no preamble:
{
  "title": "...",
  "docType": "...",
  "domain": "...",
  "executiveSummary": "...",
  "sections": [
    {
      "title": "...",
      "body": "...",
      "reasoning": {
        "observation": "...",
        "merits": "...",
        "risks": "...",
        "tradeoffs": "...",
        "operationalImpact": "...",
        "financialImpact": "...",
        "recommendation": "..."
      },
      "evidenceItems": [
        {
          "label": "...",
          "source": "...",
          "text": "...",
          "interpretation": "...",
          "implication": "...",
          "confidence": "High"
        }
      ]
    }
  ]
}

Analysis depth requested: ${depth || 'deep'}
User request: ${request}`;

  const userContent = [];

  if (fileBase64 && !base64TooLarge) {
    if (isPDF) {
      userContent.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 }
      });
    } else if (isImage) {
      const imgMime = mimeType || 'image/jpeg';
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: imgMime, data: fileBase64 }
      });
    } else if (isDocx || isPptx || isExcel) {
      // For Office files, try to send as document or extract text
      try {
        const extracted = extractBase64Text(fileBase64, mimeType, fileName);
        if (extracted) {
          userContent.push({ type: 'text', text: `Document content extracted from ${fileName}:\n\n${extracted}` });
        } else {
          // Try sending raw as PDF-like document
          userContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 }
          });
        }
      } catch (e) {
        userContent.push({ type: 'text', text: `File: ${fileName} (content extraction failed, analyse based on filename and request)` });
      }
    } else {
      const text = extractBase64Text(fileBase64, mimeType, fileName);
      if (text) userContent.push({ type: 'text', text: `File: ${fileName}\n\n${text}` });
    }
  } else if (base64TooLarge) {
    // Extract text from oversized file
    const extracted = extractBase64Text(fileBase64, mimeType, fileName);
    userContent.push({
      type: 'text',
      text: extracted
        ? `File: ${fileName} (large document — first 50,000 chars extracted):\n\n${extracted}`
        : `File: ${fileName} (too large to process directly — analyse based on filename and request context)`
    });
  }

  if (fileContent) {
    userContent.push({ type: 'text', text: `Additional content:\n${fileContent.slice(0, 20000)}` });
  }

  userContent.push({ type: 'text', text: `Analyse this document. Request: "${request}". Return ONLY valid JSON per the system format.` });

  return [{ role: 'user', content: userContent }];
}

// ── ENGINE 2: ANALYSIS ────────────────────────────────────────────────────────
app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, fileName, fileBase64, fileContent, mimeType } = req.body;

    const systemPrompt = `You are AABStudio's Document Intelligence Engine — a professional, consultant-grade analysis AI.

CORE PRINCIPLE: Every analysis must be BALANCED. You must identify both positive and negative elements.
Do NOT only search for problems. Evaluate every section across four dimensions:

1. STRENGTHS — what the document does well (clear vision, logical structure, strong roadmap, innovation)
2. WEAKNESSES — areas lacking clarity or depth (missing detail, unclear costs, vague implementation)
3. RISKS — potential future challenges (unrealistic timelines, technical dependencies, legal exposure)
4. OPPORTUNITIES — ways the strategy could become stronger (partnerships, licensing, market expansion)

EVIDENCE RULE: Every observation must link to a direct quote or section reference from the document.

SCENE INTEGRATION: Each section you produce will become 2-5 presenter scenes in the Scene Studio.
Write body text as clear, flowing narrative suitable for a presenter to read aloud.

Analysis depth: ${depth || 'deep'}
User request: ${request}

OUTPUT: respond with ONLY valid JSON, no markdown, no preamble:
{
  "title": "...",
  "docType": "...",
  "domain": "...",
  "executiveSummary": "...",
  "sections": [
    {
      "title": "...",
      "body": "...",
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "risks": ["...", "..."],
      "opportunities": ["...", "..."],
      "recommendation": "...",
      "confidence": "High | Medium | Low",
      "evidenceItems": [
        {
          "label": "...",
          "source": "...",
          "text": "direct quote from document",
          "interpretation": "...",
          "implication": "...",
          "confidence": "High | Medium | Low"
        }
      ]
    }
  ]
}`;

    // Build user message content
    const userContent = [];
    const isPDF = mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
    const isImage = mimeType?.startsWith('image/');
    const tooLarge = fileBase64 && fileBase64.length > 120000;

    if (fileBase64 && !tooLarge) {
      if (isPDF) {
        userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } });
      } else if (isImage) {
        userContent.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: fileBase64 } });
      } else {
        // Office docs / text — extract as text
        const extracted = extractBase64Text(fileBase64, mimeType, fileName);
        if (extracted) {
          userContent.push({ type: 'text', text: `Document: ${fileName}\n\n${extracted}` });
        } else {
          // Try sending as document anyway (some office formats work)
          try {
            userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } });
          } catch (e) {
            userContent.push({ type: 'text', text: `File: ${fileName} (binary format — analyse based on filename and request)` });
          }
        }
      }
    } else if (tooLarge) {
      const extracted = extractBase64Text(fileBase64, mimeType, fileName);
      userContent.push({ type: 'text', text: extracted ? `Document: ${fileName} (first 50,000 chars):\n\n${extracted}` : `File: ${fileName} (too large — analyse based on filename and request)` });
    }

    if (fileContent) userContent.push({ type: 'text', text: `Content:\n${fileContent.slice(0, 20000)}` });
    userContent.push({ type: 'text', text: `Analyse this document. Request: "${request}". Return ONLY valid JSON.` });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('Claude returned no JSON — check ANTHROPIC_API_KEY is valid');
    const report = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    res.json(report);
  } catch (e) {
    console.error('Analysis error:', e.message);
    res.status(500).json({ error: e.message, details: e.stack?.split('\n')[0] });
  }
});

// ── ENGINE 3: DOCUMENT COMPARISON ────────────────────────────────────────────
app.post('/api/compare', async (req, res) => {
  try {
    const { docABase64, docAMime, docAName, docBBase64, docBMime, docBName, compareType } = req.body;

    const textA = extractBase64Text(docABase64, docAMime, docAName);
    const textB = extractBase64Text(docBBase64, docBMime, docBName);

    const buildDocContent = (base64, mime, name, text, label) => {
      const content = [];
      const isPDF = mime === 'application/pdf' || name?.endsWith('.pdf');
      const tooLarge = base64 && base64.length > 120000;

      if (base64 && isPDF && !tooLarge) {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
      } else if (text) {
        content.push({ type: 'text', text: `${label} (${name}):\n\n${text.slice(0, 30000)}` });
      } else {
        content.push({ type: 'text', text: `${label}: ${name} (content not extractable)` });
      }
      return content;
    };

    const userContent = [
      ...buildDocContent(docABase64, docAMime, docAName, textA, 'DOCUMENT A — Original'),
      ...buildDocContent(docBBase64, docBMime, docBName, textB, 'DOCUMENT B — Revised'),
      {
        type: 'text',
        text: `Compare these two documents. Focus: ${compareType || 'full'}. 
Return ONLY valid JSON:
{
  "summary": "...",
  "changes": [
    { "type": "added|removed|changed", "label": "...", "text": "...", "before": "...", "after": "..." }
  ],
  "riskChanges": "..."
}`
      }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 6000,
      messages: [{ role: 'user', content: userContent }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1) throw new Error('No JSON in response');
    const result = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    res.json(result);
  } catch (e) {
    console.error('Compare error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 4: SCENE INTELLIGENCE ─────────────────────────────────────────────
app.post('/api/scenes', async (req, res) => {
  try {
    const { report, presenterMode, speed } = req.body;

    const wpmMap = { slow: 110, normal: 140, fast: 170 };
    const wpm = wpmMap[speed] || 140;
    const wordsPerScene = Math.round(wpm * 8 / 60);

    const systemPrompt = `You are AABStudio's Scene Intelligence Engine.

Convert balanced analysis reports into broadcast-ready presenter scripts.

SCENE RULES:
- Each scene = 6 to 10 seconds of narration
- Words per scene at ${wpm} wpm = ~${wordsPerScene} words
- Scene types: INTRODUCTION, STRENGTH, WEAKNESS, RISK, OPPORTUNITY, RECOMMENDATION, CONCLUSION
- Each major report section generates 2 to 5 scenes
- Map report fields to scenes as follows:
  • executiveSummary → opening scene
  • strengths → positive strategic scenes
  • weaknesses → areas needing improvement scenes
  • risks → risk explanation scenes
  • opportunities → strategic opportunity scenes
  • recommendation → closing recommendation scene

PRESENTER MODE: ${presenterMode}
${presenterMode === 'dual' ? `DEBATE MODE: Presenter A presents the strength/opportunity, Presenter B presents the weakness/risk. Each ~${Math.floor(wordsPerScene / 2)} words.` : ''}
${presenterMode === 'documentary' ? `DOCUMENTARY: Hook → Strength reveal → Weakness/Risk → Opportunity → Recommendation` : ''}

EVIDENCE OVERLAYS:
- evidenceRef: the evidence ID (e.g. "EV-101") to show as overlay, or null
- overlayText: short quote for on-screen display (max 12 words), or null

VISUAL PROMPTS:
- visualPrompt: 30-50 word description of background/environment for AI video

OUTPUT — ONLY valid JSON:
{
  "title": "...",
  "presenterMode": "${presenterMode}",
  "totalDuration": 0,
  "costEstimate": { "totalScenes": 0, "totalCredits": 0 },
  "discussions": [
    {
      "sectionTitle": "...",
      "discussionText": "...",
      "scenes": [
        {
          "sceneNumber": 1,
          "type": "INTRODUCTION",
          "duration": 8,
          "wordCount": ${wordsPerScene},
          "presenterA": "...",
          "presenterB": ${presenterMode === 'dual' ? '"..."' : 'null'},
          "evidenceRef": null,
          "overlayText": null,
          "visualPrompt": "..."
        }
      ]
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 12000,
      messages: [{
        role: 'user',
        content: `Convert this analysis report into scenes.\n\nReport:\n${JSON.stringify(report, null, 2).slice(0, 40000)}\n\nReturn ONLY valid JSON.`
      }],
      system: systemPrompt
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1) throw new Error('No JSON');
    const scenes = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    // Calculate cost
    let totalScenes = 0;
    (scenes.discussions || []).forEach(d => { totalScenes += (d.scenes || []).length; });
    scenes.costEstimate = { totalScenes, totalCredits: totalScenes * 10 };
    scenes.totalDuration = totalScenes * 8;

    res.json(scenes);
  } catch (e) {
    console.error('Scenes error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 5: DOCUMENTARY MODE ────────────────────────────────────────────────
app.post('/api/documentary', async (req, res) => {
  try {
    const { report, presenterMode, speed } = req.body;
    const wpmMap = { slow: 110, normal: 140, fast: 170 };
    const wpm = wpmMap[speed] || 140;
    const wordsPerScene = Math.round(wpm * 8 / 60);

    const systemPrompt = `You are AABStudio's Documentary Mode Engine.

Convert analysis reports into documentary-style scripts following this STRICT structure:
1. HOOK — Grab attention with the most compelling finding (1-2 scenes)
2. EVIDENCE REVEAL — Present the key evidence (2-3 scenes)
3. CONTEXT EXPLANATION — Explain why this matters (2-3 scenes)
4. IMPLICATION — What this means for the audience (1-2 scenes)
5. CONCLUSION — The takeaway and call to action (1 scene)

This is for YouTube creators, journalists, and educational channels.
Each scene = 8 seconds, ~${wordsPerScene} words.
Write with dramatic tension and clear storytelling rhythm.

OUTPUT — ONLY valid JSON using the same schema as the scenes endpoint:
{
  "title": "...",
  "presenterMode": "documentary",
  "totalDuration": 0,
  "costEstimate": { "totalScenes": 0, "totalCredits": 0 },
  "discussions": [
    {
      "sectionTitle": "HOOK|EVIDENCE REVEAL|CONTEXT|IMPLICATION|CONCLUSION",
      "discussionText": "...",
      "scenes": [...]
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 10000,
      messages: [{
        role: 'user',
        content: `Create a documentary script from this report:\n\n${JSON.stringify(report, null, 2).slice(0, 40000)}\n\nReturn ONLY valid JSON.`
      }],
      system: systemPrompt
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1) throw new Error('No JSON');
    const scenes = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    let totalScenes = 0;
    (scenes.discussions || []).forEach(d => { totalScenes += (d.scenes || []).length; });
    scenes.costEstimate = { totalScenes, totalCredits: totalScenes * 10 };

    res.json(scenes);
  } catch (e) {
    console.error('Documentary error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 6: COST ESTIMATOR ──────────────────────────────────────────────────
app.post('/api/cost/estimate', async (req, res) => {
  try {
    const { reportSections, presenterMode } = req.body;
    const sectionsCount = reportSections || 5;
    const scenesPerSection = 3;
    const totalScenes = sectionsCount * scenesPerSection;
    const totalCredits = totalScenes * 10;
    const totalSecs = totalScenes * 8;
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;

    res.json({
      estimatedScenes: totalScenes,
      estimatedRuntime: `${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`,
      estimatedCredits: totalCredits,
      pricePerCredit: 0.048,
      breakdown: {
        voice: totalScenes * 2,
        video: totalScenes * 5,
        stitch: 3,
        margin: Math.round(totalCredits * 0.3)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 7: VOICE (ElevenLabs) ─────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId, stability, similarityBoost } = req.body;
    if (!ELEVENLABS_KEY) throw new Error('ElevenLabs API key not configured');
    if (!text || text.trim().length === 0) throw new Error('No text provided');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'EXAVITQu4vr4xnSDxMaL'}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: stability ?? 0.5,
          similarity_boost: similarityBoost ?? 0.75
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs HTTP ${response.status}: ${err.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    res.json({ audio: base64 });
  } catch (e) {
    console.error('Voice error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 8: MUSIC (ElevenLabs Sound Generation) ────────────────────────────
app.post('/api/music/generate', async (req, res) => {
  try {
    const { prompt, duration } = req.body;
    if (!ELEVENLABS_KEY) throw new Error('ElevenLabs key not set');

    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: prompt || 'professional news background music', duration_seconds: Math.min(duration || 22, 22) })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs music HTTP ${response.status}: ${err.slice(0, 200)}`);
    }

    const buf = await response.arrayBuffer();
    res.json({ audio: Buffer.from(buf).toString('base64') });
  } catch (e) {
    console.error('Music error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 9: VIDEO GENERATION (HeyGen + Kling AI) ───────────────────────────
// HeyGen: lip-synced talking presenter from photo + script
// Kling: background/environment video
// This replaces Runway Gen3a Turbo

app.post('/api/video/generate', async (req, res) => {
  try {
    const { prompt, duration, ratio, referenceImageBase64, audioBase64, voiceId } = req.body;

    // If HeyGen key available and we have a reference image + audio, use HeyGen for presenter video
    if (HEYGEN_KEY && referenceImageBase64 && audioBase64) {
      return await generateHeyGenVideo(req, res, { referenceImageBase64, audioBase64, ratio, duration });
    }

    // If Kling key available, use Kling for background video
    if (KLING_KEY) {
      return await generateKlingVideo(req, res, { prompt, duration, ratio });
    }

    // Fallback: return a placeholder task ID
    console.warn('No video API key configured — returning placeholder');
    res.json({ taskId: 'placeholder-' + Date.now(), status: 'no_api_key' });
  } catch (e) {
    console.error('Video generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

async function generateHeyGenVideo(req, res, { referenceImageBase64, audioBase64, ratio, duration }) {
  if (!HEYGEN_KEY) throw new Error('HEYGEN_API_KEY not set in Railway environment variables');

  // HeyGen Avatar IV — perfect lip sync pipeline:
  // 1. Upload talking photo → get talking_photo_id
  // 2. Create video with audio → perfect lip sync output

  // Step 1: Upload the presenter photo as a talking photo
  const avatarUploadRes = await fetch('https://upload.heygen.com/v1/talking_photo', {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: referenceImageBase64   // base64 PNG/JPG of the presenter face
    })
  });

  if (!avatarUploadRes.ok) {
    const err = await avatarUploadRes.text();
    throw new Error('HeyGen photo upload failed: HTTP ' + avatarUploadRes.status + ' — ' + err.slice(0, 200));
  }

  const avatarData = await avatarUploadRes.json();
  const talkingPhotoId = avatarData.data?.talking_photo_id;
  if (!talkingPhotoId) throw new Error('HeyGen: no talking_photo_id returned from upload');

  // Step 2: Create video generation job with audio for lip sync
  const aspectMap = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1' };
  const aspect = aspectMap[ratio] || '16:9';

  // Voice config — use uploaded audio for perfect lip sync
  const voiceConfig = audioBase64
    ? {
        type: 'audio',
        audio_base64: audioBase64,
        // Ensure audio is the right format for HeyGen
      }
    : {
        type: 'text',
        input_text: 'Professional presenter speaking clearly.',
        voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54',  // HeyGen built-in voice
        speed: 1.0,
        pitch: 0
      };

  const videoRes = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: 'talking_photo',
          talking_photo_id: talkingPhotoId,
          talking_photo_style: 'square',   // square = full face, bust = shoulders up
          talking_style: 'expressive',     // expressive = natural lip movement, not robotic
          expression: 'happy',             // natural expression baseline
          movement_amplitude: 'auto'       // natural head movement
        },
        voice: voiceConfig,
        background: {
          type: 'color',
          value: '#1a3a5c'                 // navy — will be replaced by Creatomate background
        }
      }],
      aspect_ratio: aspect,
      test: false,                         // set true for free 5-credit test renders
      version: 'v2'
    })
  });

  if (!videoRes.ok) {
    const err = await videoRes.text();
    throw new Error('HeyGen video create failed: HTTP ' + videoRes.status + ' — ' + err.slice(0, 300));
  }

  const videoData = await videoRes.json();
  const videoId = videoData.data?.video_id;
  if (!videoId) throw new Error('HeyGen: no video_id returned — ' + JSON.stringify(videoData).slice(0, 200));

  res.json({ taskId: 'heygen-' + videoId, provider: 'heygen' });
}


async function generateKlingVideo(req, res, { prompt, duration, ratio }) {
  const ratioMap = { '9:16': '9:16', '1:1': '1:1' };
  const aspect = ratioMap[ratio] || '16:9';
  const dur = Math.min(duration || 8, 10);

  const klingRes = await fetch('https://api.klingai.com/v1/videos/text2video', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + KLING_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kling-v1',
      prompt: prompt || 'professional broadcast studio',
      negative_prompt: 'blurry, low quality, text, watermark',
      cfg_scale: 0.5,
      mode: 'std',
      duration: dur,
      aspect_ratio: aspect
    })
  });
  if (!klingRes.ok) throw new Error('Kling HTTP ' + klingRes.status);
  const klingData = await klingRes.json();
  const taskId = klingData.data?.task_id;
  if (!taskId) throw new Error('Kling: no task_id returned');

  res.json({ taskId: 'kling-' + taskId, provider: 'kling' });
}

// ── ENGINE 9b: VIDEO STATUS ───────────────────────────────────────────────────
app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    if (taskId.startsWith('placeholder-')) {
      return res.json({ status: 'FAILED', error: 'No video API configured' });
    }

    if (taskId.startsWith('heygen-')) {
      const videoId = taskId.replace('heygen-', '');
      const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: { 'X-Api-Key': HEYGEN_KEY }
      });
      if (!r.ok) throw new Error('HeyGen status HTTP ' + r.status);
      const d = await r.json();
      const status = d.data?.status;
      const videoUrl = d.data?.video_url;
      return res.json({
        status: status === 'completed' ? 'SUCCEEDED' : status === 'failed' ? 'FAILED' : 'PROCESSING',
        progress: status === 'completed' ? 1 : status === 'processing' ? 0.5 : 0,
        videoUrl: videoUrl || null
      });
    }

    if (taskId.startsWith('kling-')) {
      const klingTaskId = taskId.replace('kling-', '');
      const r = await fetch(`https://api.klingai.com/v1/videos/text2video/${klingTaskId}`, {
        headers: { 'Authorization': 'Bearer ' + KLING_KEY }
      });
      if (!r.ok) throw new Error('Kling status HTTP ' + r.status);
      const d = await r.json();
      const taskStatus = d.data?.task_status;
      const videoUrl = d.data?.task_result?.videos?.[0]?.url;
      const statusMap = { succeed: 'SUCCEEDED', failed: 'FAILED', processing: 'PROCESSING', submitted: 'PROCESSING' };
      return res.json({
        status: statusMap[taskStatus] || 'PROCESSING',
        progress: taskStatus === 'succeed' ? 1 : taskStatus === 'processing' ? 0.5 : 0.1,
        videoUrl: videoUrl || null
      });
    }

    res.json({ status: 'FAILED', error: 'Unknown task format' });
  } catch (e) {
    console.error('Video status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 10: CREATOMATE VIDEO STITCHING ─────────────────────────────────────
app.post('/api/render', async (req, res) => {
  try {
    const { scenes, studioConfig, musicConfig, outputFormat } = req.body;
    if (!CREATOMATE_KEY) throw new Error('Creatomate API key not configured');
    if (!scenes || scenes.length === 0) throw new Error('No scenes provided');

    const ratioMap = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] };
    const [width, height] = ratioMap[outputFormat] || [1920, 1080];

    const elements = [];
    let currentTime = 0;

    for (const scene of scenes) {
      const sceneDuration = scene.duration || 8;

      // Background shape
      elements.push({
        type: 'shape',
        path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
        fill_color: studioConfig?.bgColor || '#1a3a5c',
        time: currentTime,
        duration: sceneDuration
      });

      // Video clip if available
      if (scene.videoUrl) {
        elements.push({
          type: 'video',
          source: scene.videoUrl,
          time: currentTime,
          duration: sceneDuration,
          fit: 'cover'
        });
      }

      // Audio narration
      if (scene.audioBase64) {
        elements.push({
          type: 'audio',
          source: `data:audio/mpeg;base64,${scene.audioBase64}`,
          time: currentTime,
          duration: sceneDuration,
          volume: musicConfig ? '80%' : '100%'
        });
      }

      // Evidence overlay text
      if (scene.overlayText) {
        elements.push({
          type: 'text',
          text: scene.overlayText,
          time: currentTime + 0.5,
          duration: 2.5,
          x: '50%',
          y: '85%',
          width: '80%',
          font_family: 'DM Mono',
          font_size: null,
          font_size_minimum: '1 vmin',
          font_size_maximum: '3.5 vmin',
          font_weight: 400,
          fill_color: '#ffffff',
          background_color: 'rgba(184,148,42,0.9)',
          background_x_padding: '50%',
          background_y_padding: '25%',
          background_border_radius: '50%',
          x_alignment: '50%',
          y_alignment: '50%'
        });
      }

      currentTime += sceneDuration;
    }

    // Background music track
    if (musicConfig && musicConfig.audioBase64) {
      elements.push({
        type: 'audio',
        source: `data:audio/mpeg;base64,${musicConfig.audioBase64}`,
        time: 0,
        duration: currentTime,
        volume: `${musicConfig.volume || 30}%`
      });
    }

    const payload = {
      output_format: 'mp4',
      width,
      height,
      elements,
      frame_rate: 24,
      snapshot_time: 1
    };

    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CREATOMATE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Creatomate HTTP ${response.status}: ${errText.slice(0, 300)}`);
    }

    const renders = await response.json();
    const renderId = Array.isArray(renders) ? renders[0]?.id : renders?.id;
    if (!renderId) throw new Error('No render ID returned from Creatomate');

    res.json({ renderId, status: 'processing' });
  } catch (e) {
    console.error('Render error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── RENDER STATUS ─────────────────────────────────────────────────────────────
app.get('/api/render/status/:id', async (req, res) => {
  try {
    if (!CREATOMATE_KEY) throw new Error('Creatomate key not set');
    const r = await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${CREATOMATE_KEY}` }
    });
    if (!r.ok) throw new Error('Creatomate status HTTP ' + r.status);
    const d = await r.json();
    res.json({ status: d.status, progress: d.progress || 0, url: d.url || null, error: d.error_message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/render/check/:id', async (req, res) => {
  try {
    if (!CREATOMATE_KEY) throw new Error('Creatomate key not set');
    const r = await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${CREATOMATE_KEY}` }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    res.json({ status: d.status, progress: d.progress || 0, url: d.url || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE 11: EXPORT METADATA ────────────────────────────────────────────────
app.post('/api/export/metadata', async (req, res) => {
  try {
    const { report, platform } = req.body;
    const platformGuides = {
      youtube: 'YouTube: title max 100 chars, description 200-500 chars, 5-10 hashtags, 5 chapters with timestamps',
      instagram: 'Instagram Reels: caption max 150 chars, 10-15 hashtags, hook in first line',
      tiktok: 'TikTok: caption max 100 chars, 3-5 trending hashtags, hook in first 3 words',
      linkedin: 'LinkedIn: professional tone, 150-300 char caption, 3-5 professional hashtags',
      twitter: 'Twitter/X: max 280 chars total with hashtags, punchy and direct',
      facebook: 'Facebook: conversational, 100-250 chars, 2-3 hashtags'
    };

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Generate ${platform} metadata for this analysis video.
Guide: ${platformGuides[platform] || 'Standard social media post'}
Report title: ${report.title}
Domain: ${report.domain}
Summary: ${report.executiveSummary?.slice(0, 500)}

Return ONLY valid JSON:
{ "title": "...", "description": "...", "hashtags": ["...", "..."], "chapters": [{"time": "0:00", "title": "..."}] }`
      }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    res.json(j > -1 ? JSON.parse(text.slice(j, k + 1)) : { title: report.title, description: report.executiveSummary?.slice(0, 200), hashtags: [] });
  } catch (e) {
    console.error('Metadata error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── EXPORT: PDF / DOCX ────────────────────────────────────────────────────────
app.post('/api/export/pdf', async (req, res) => {
  try {
    const { report } = req.body;
    // Generate a simple HTML-to-text PDF representation
    // For production use puppeteer or pdfkit
    const content = buildReportText(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(report.title || 'Report').replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    // Return plain text as placeholder — replace with pdfkit/puppeteer in production
    res.status(501).json({ error: 'PDF export requires pdfkit. Install: npm install pdfkit. See /api/export/pdf-text for text version.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/export/docx', async (req, res) => {
  try {
    const { report } = req.body;
    res.status(501).json({ error: 'DOCX export requires docx package. Install: npm install docx. Endpoint ready for implementation.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/export/pdf-text', async (req, res) => {
  try {
    const { report } = req.body;
    const text = buildReportText(report);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${(report.title || 'Report').replace(/[^a-z0-9]/gi, '_')}.txt"`);
    res.send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function buildReportText(report) {
  let txt = `${report.title}\n${'='.repeat(report.title.length)}\n\n`;
  txt += `Document type: ${report.docType}\nDomain: ${report.domain}\n\n`;
  txt += `EXECUTIVE SUMMARY\n${'-'.repeat(20)}\n${report.executiveSummary}\n\n`;
  (report.sections || []).forEach((s, i) => {
    txt += `${i + 1}. ${s.title}\n${'-'.repeat(s.title.length + 3)}\n${s.body}\n\n`;
    if (s.reasoning) {
      if (s.reasoning.observation) txt += `Observation: ${s.reasoning.observation}\n`;
      if (s.reasoning.merits) txt += `Merits: ${s.reasoning.merits}\n`;
      if (s.reasoning.risks) txt += `Risks: ${s.reasoning.risks}\n`;
      if (s.reasoning.recommendation) txt += `Recommendation: ${s.reasoning.recommendation}\n`;
      txt += '\n';
    }
    (s.evidenceItems || []).forEach((ev, j) => {
      txt += `Evidence ${j + 1}: ${ev.label}\n`;
      txt += `  Source: ${ev.source}\n  "${ev.text}"\n  → ${ev.interpretation}\n\n`;
    });
  });
  return txt;
}

// ── ENGINE 12: STRIPE BILLING ─────────────────────────────────────────────────
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe not configured');
    const { priceId, mode, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: mode || 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://aabstudio.ai?checkout=success',
      cancel_url: 'https://aabstudio.ai?checkout=cancelled',
      customer_email: customerEmail || undefined,
      allow_promotion_codes: true
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('Stripe error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: MULTI-DOCUMENT SYNTHESIS ─────────────────────────────────────────
app.post('/api/synthesise', async (req, res) => {
  try {
    const { documents, request, depth } = req.body;
    // documents = [{ name, base64, mimeType }]
    if (!documents || documents.length < 2) throw new Error('At least 2 documents required');

    const userContent = [];
    for (const doc of documents.slice(0, 6)) {
      const isPDF = doc.mimeType === 'application/pdf' || doc.name?.endsWith('.pdf');
      const tooLarge = doc.base64 && doc.base64.length > 80000;
      if (doc.base64 && isPDF && !tooLarge) {
        userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.base64 } });
      } else {
        const text = extractBase64Text(doc.base64, doc.mimeType, doc.name);
        userContent.push({ type: 'text', text: `DOCUMENT: ${doc.name}\n\n${(text || '').slice(0, 15000)}` });
      }
    }
    userContent.push({ type: 'text', text: `Synthesise ALL ${documents.length} documents above into one unified analysis. Find patterns, contradictions, and cross-document insights. Request: "${request}". Return ONLY valid JSON matching the standard AABStudio report format with an additional "crossDocumentInsights" array and "contradictions" array.` });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 10000,
      system: `You are AABStudio's Multi-Document Synthesis Engine. Analyse multiple documents simultaneously. Find patterns across all documents. Detect contradictions between documents. Surface insights that only appear when documents are read together. Use the SWOT framework per section. Return ONLY valid JSON.`,
      messages: [{ role: 'user', content: userContent }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON returned');
    res.json(JSON.parse(text.slice(j, k + 1)));
  } catch (e) {
    console.error('Synthesise error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: CONTRADICTION DETECTOR ───────────────────────────────────────────
app.post('/api/contradictions', async (req, res) => {
  try {
    const { report } = req.body;
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 4000,
      system: 'You are AABStudio\'s Contradiction Detector. Find internal contradictions within documents. Return ONLY valid JSON: { "contradictions": [{ "clauseA": "...", "clauseB": "...", "locationA": "...", "locationB": "...", "severity": "High|Medium|Low", "explanation": "..." }], "consistencyScore": 0-100, "summary": "..." }',
      messages: [{ role: 'user', content: `Find all internal contradictions in this document analysis:\n\n${JSON.stringify(report).slice(0, 30000)}\n\nReturn ONLY valid JSON.` }]
    });
    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    res.json(j > -1 ? JSON.parse(text.slice(j, k + 1)) : { contradictions: [], consistencyScore: 100, summary: 'No contradictions detected' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: PODCAST GENERATION ────────────────────────────────────────────────
app.post('/api/podcast', async (req, res) => {
  try {
    const { report, hostAName, hostBName, duration } = req.body;
    const targetMinutes = duration || 5;
    const wordsTotal = targetMinutes * 140;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 10000,
      system: `You are AABStudio's Podcast Generation Engine. Convert document analysis into a natural, engaging podcast conversation between two hosts. The conversation must feel human — use interruptions, agreements, follow-up questions, light humour where appropriate. Never sound robotic. Return ONLY valid JSON.`,
      messages: [{
        role: 'user', content: `Create a ${targetMinutes}-minute podcast episode (~${wordsTotal} words total) from this analysis. Hosts: ${hostAName || 'Alex'} and ${hostBName || 'Priya'}.

Report: ${JSON.stringify(report).slice(0, 25000)}

Return ONLY valid JSON:
{
  "title": "...",
  "showNotes": "...",
  "duration": "${targetMinutes}:00",
  "segments": [
    {
      "segmentTitle": "...",
      "exchanges": [
        { "host": "Alex", "line": "...", "mood": "curious|excited|serious|thoughtful" },
        { "host": "Priya", "line": "...", "mood": "..." }
      ]
    }
  ],
  "chapterMarkers": [{ "time": "0:00", "title": "..." }],
  "hashtags": ["..."]
}`
      }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON');
    res.json(JSON.parse(text.slice(j, k + 1)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: EARNINGS CALL MODE ────────────────────────────────────────────────
app.post('/api/earnings', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, ticker } = req.body;
    const isPDF = mimeType === 'application/pdf';
    const userContent = [];
    if (fileBase64 && isPDF && fileBase64.length < 120000) {
      userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } });
    } else {
      const text = extractBase64Text(fileBase64, mimeType, fileName);
      if (text) userContent.push({ type: 'text', text });
    }
    userContent.push({ type: 'text', text: `Perform earnings call analysis for ${ticker || 'this company'}. Extract all financial metrics, beats/misses vs estimates, guidance changes, management tone, and key risk factors. Return ONLY valid JSON.` });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 6000,
      system: `You are a senior equity analyst. Extract: revenue, EPS, gross margin, guidance, beat/miss vs consensus, management sentiment (positive/cautious/negative), key risks, key opportunities, analyst Q&A highlights. Return ONLY valid JSON: { "ticker": "...", "period": "...", "headline": "...", "keyMetrics": { "revenue": { "reported": "...", "estimate": "...", "beat": true }, "eps": {...}, "grossMargin": "...", "guidance": "..." }, "sentimentScore": -100 to 100, "managementTone": "...", "topRisks": [], "topOpportunities": [], "analystQuestions": [], "sixtySecondSummary": "...", "socialCaption": "...", "sections": [] }`,
      messages: [{ role: 'user', content: userContent }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON');
    res.json(JSON.parse(text.slice(j, k + 1)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: LEGAL REDLINE MODE ────────────────────────────────────────────────
app.post('/api/redline', async (req, res) => {
  try {
    const { docABase64, docAMime, docAName, docBBase64, docBMime, docBName } = req.body;

    const buildContent = (b64, mime, name) => {
      if (!b64) return [];
      const isPDF = mime === 'application/pdf';
      if (isPDF && b64.length < 120000) return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }];
      const text = extractBase64Text(b64, mime, name);
      return text ? [{ type: 'text', text: `${name}:\n\n${text.slice(0, 25000)}` }] : [];
    };

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 8000,
      system: `You are AABStudio's Legal Redline Engine. Compare two contract versions with the precision of a senior solicitor. Classify every change as: RISK_INCREASED (red), RISK_REDUCED (green), NEUTRAL (grey), NEW_OBLIGATION (amber), REMOVED_PROTECTION (red). Return ONLY valid JSON.`,
      messages: [{
        role: 'user', content: [
          ...buildContent(docABase64, docAMime, docAName),
          ...buildContent(docBBase64, docBMime, docBName),
          { type: 'text', text: `Perform legal redline comparison. Return ONLY valid JSON: { "summary": "...", "riskDelta": "increased|decreased|neutral", "overallRiskScore": { "before": 0-100, "after": 0-100 }, "changes": [{ "clause": "...", "location": "...", "type": "RISK_INCREASED|RISK_REDUCED|NEUTRAL|NEW_OBLIGATION|REMOVED_PROTECTION", "before": "...", "after": "...", "impact": "...", "severity": "High|Medium|Low" }], "newObligations": [], "removedProtections": [], "recommendation": "..." }` }
        ]
      }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON');
    res.json(JSON.parse(text.slice(j, k + 1)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: ACADEMIC LECTURE MODE ─────────────────────────────────────────────
app.post('/api/lecture', async (req, res) => {
  try {
    const { report, audienceLevel, includeQA } = req.body;
    const level = audienceLevel || 'undergraduate'; // undergraduate | postgraduate | professional | public

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 10000,
      system: `You are AABStudio's Academic Lecture Engine. Convert research analysis into a structured lecture. Adapt complexity to audience level. Use the Socratic method — pose questions before explaining. Include clear transitions between concepts. Generate slide notes, citations, and a student Q&A section. Return ONLY valid JSON.`,
      messages: [{
        role: 'user', content: `Convert this analysis into a ${level}-level academic lecture. Include Q&A: ${includeQA !== false}.

Report: ${JSON.stringify(report).slice(0, 25000)}

Return ONLY valid JSON:
{
  "lectureTitle": "...",
  "audienceLevel": "${level}",
  "learningObjectives": ["..."],
  "estimatedDuration": "...",
  "sections": [
    {
      "title": "...",
      "slideNotes": "...",
      "presenterScript": "...",
      "keyPoints": ["..."],
      "discussion": "..."
    }
  ],
  "qaSection": [{ "question": "...", "answer": "..." }],
  "citations": ["..."],
  "furtherReading": ["..."]
}`
      }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON');
    res.json(JSON.parse(text.slice(j, k + 1)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: CINEMATIC VIDEO PROMPT GENERATOR ──────────────────────────────────
// Generates production-grade prompts for Kling/HeyGen — not robotic, not animated
app.post('/api/cinematic-prompt', async (req, res) => {
  try {
    const { sceneText, sceneType, characterStyle, cinematographyPreset, studioBg, avatarDesc } = req.body;

    const CINEMATOGRAPHY_PRESETS = {
      news: {
        lighting: 'three-point lighting setup, soft key light at 45 degrees left, fill light at 30%, blue-tinted rim light behind subject, subtle lens flare',
        camera: 'locked-off medium shot, slight slow push-in over 8 seconds, shallow depth of field f/2.8',
        grade: 'neutral colour grade, clean whites, slight blue-cool tint, broadcast safe levels',
        atmosphere: 'professional broadcast studio, multiple LED screens in background, clean modern aesthetic'
      },
      documentary: {
        lighting: 'single dramatic key light from upper left, strong shadows for depth, warm tungsten fill, practical lamp visible in background',
        camera: 'handheld medium shot with subtle organic movement, occasional slow rack focus to background',
        grade: 'cinematic colour grade, slightly desaturated, warm shadows, high contrast',
        atmosphere: 'intimate documentary setting, depth and texture in background, authentic and grounded'
      },
      corporate: {
        lighting: 'soft diffused lighting, large octabox key light, even fill, no harsh shadows, clean and professional',
        camera: 'static medium-wide shot, perfectly stable, slight breathing movement',
        grade: 'clean neutral grade, bright whites, corporate blue accents',
        atmosphere: 'clean white studio, subtle gradient background, modern and trustworthy'
      },
      cinematic: {
        lighting: 'dramatic Rembrandt lighting, 2.39:1 anamorphic crop, deep shadows, single motivated key light, practical elements',
        camera: 'slow cinematic push-in, anamorphic lens flares, shallow bokeh, filmic motion blur',
        grade: 'teal and orange grade, deep blacks, filmic grain overlay, cinematic contrast curve',
        atmosphere: 'cinematic environment with rich detail, dramatic and authoritative'
      },
      investigative: {
        lighting: 'harsh side lighting, strong shadow casting, single hard key light, low-key exposure, mystery atmosphere',
        camera: 'slightly low angle medium shot, slow creeping push-in, subtle camera shake',
        grade: 'desaturated grade, strong contrast, cold tones, noir-influenced',
        atmosphere: 'dark office or investigation room, evidence board barely visible, tense atmosphere'
      },
      academic: {
        lighting: 'warm tungsten library lighting, soft and scholarly, overhead practical light mixing with window light',
        camera: 'static medium shot, stable and authoritative, slight depth of field on background books',
        grade: 'warm neutral grade, scholarly feel, natural colour',
        atmosphere: 'library or study with wooden shelves, warm and intellectual'
      }
    };

    const CHARACTER_STYLES = {
      realistic: 'photorealistic human presenter, natural skin texture, subtle facial micro-expressions, natural blinking, slight head movement, professional attire',
      cartoon: 'high-quality 3D animated cartoon character, Pixar-style rendering, expressive face, smooth animation, vibrant colours, professional broadcast quality',
      anime: 'premium anime-style character, fluid animation, expressive large eyes, detailed hair, cinematic anime lighting, professional broadcast quality',
      clay: 'premium claymation stop-motion style character, rich textures, warm handcrafted aesthetic, smooth fluid movement, broadcast quality',
      illustrated: 'high-quality 2D illustrated character, editorial illustration style, confident strokes, professional and modern',
      avatar3d: 'photorealistic 3D avatar, ultra-high detail skin shader, subsurface scattering, natural hair simulation, hyper-realistic facial animation'
    };

    const preset = CINEMATOGRAPHY_PRESETS[cinematographyPreset || 'news'];
    const charStyle = CHARACTER_STYLES[characterStyle || 'realistic'];
    const bgDesc = studioBg || 'modern professional broadcast studio';

    const prompt = `${charStyle}, ${avatarDesc || 'confident professional presenter'}, speaking naturally and expressively to camera with perfect lip sync, natural breathing and subtle body language, NOT robotic NOT stiff NOT animated-looking.

SETTING: ${bgDesc}, ${preset.atmosphere}.
LIGHTING: ${preset.lighting}.
CAMERA: ${preset.camera}.
COLOUR GRADE: ${preset.grade}.
SCENE TYPE: ${sceneType || 'explanation'} — ${sceneText ? sceneText.slice(0, 100) : ''}.
QUALITY: 4K resolution, cinematic quality, broadcast ready, photo-realistic, no watermarks, no text overlays, clean background, professional production value.
NEGATIVE: no cartoon appearance, no obvious CGI, no robotic movement, no text, no watermarks, no blurring, no low quality.`;

    res.json({ prompt, preset: cinematographyPreset, characterStyle, wordCount: prompt.split(' ').length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: KNOWLEDGE GRAPH ───────────────────────────────────────────────────
app.post('/api/knowledge-graph', async (req, res) => {
  try {
    const { report } = req.body;
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 4000,
      system: 'You are AABStudio\'s Knowledge Graph Engine. Extract entities and relationships from document analysis. Return ONLY valid JSON: { "nodes": [{ "id": "...", "label": "...", "type": "person|organisation|clause|concept|risk|obligation|date|amount", "weight": 1-10 }], "edges": [{ "source": "...", "target": "...", "relationship": "...", "strength": 1-10 }], "clusters": [{ "name": "...", "nodeIds": [] }] }',
      messages: [{ role: 'user', content: `Extract knowledge graph from:\n\n${JSON.stringify(report).slice(0, 20000)}\n\nReturn ONLY valid JSON.` }]
    });
    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    res.json(j > -1 ? JSON.parse(text.slice(j, k + 1)) : { nodes: [], edges: [], clusters: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: THUMBNAIL GENERATOR ───────────────────────────────────────────────
app.post('/api/thumbnail-prompt', async (req, res) => {
  try {
    const { report, platform, brandColour } = req.body;
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 1000,
      system: 'You are a professional YouTube thumbnail designer. Generate prompts for compelling, high-CTR thumbnails. Return ONLY valid JSON.',
      messages: [{
        role: 'user', content: `Generate thumbnail for: "${report?.title}". Platform: ${platform || 'youtube'}. Brand colour: ${brandColour || '#1a3a5c'}.
Return ONLY valid JSON: { "headline": "SHORT PUNCHY TEXT MAX 5 WORDS", "subtext": "...", "imagePrompt": "professional thumbnail background, bold and eye-catching...", "colourScheme": "...", "emotions": ["..."] }`
      }]
    });
    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    res.json(j > -1 ? JSON.parse(text.slice(j, k + 1)) : { headline: report?.title?.slice(0, 30), imagePrompt: 'professional studio background' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: NEWSLETTER EXPORT ─────────────────────────────────────────────────
app.post('/api/newsletter', async (req, res) => {
  try {
    const { report, brandName, tone } = req.body;
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 4000,
      system: `You are a professional newsletter writer. Convert document analysis into a compelling email newsletter. Tone: ${tone || 'professional'}. Return ONLY valid JSON.`,
      messages: [{
        role: 'user', content: `Convert this analysis into a newsletter for ${brandName || 'AABStudio'}. Report: ${JSON.stringify(report).slice(0, 15000)}.
Return ONLY valid JSON: { "subject": "...", "previewText": "...", "sections": [{ "heading": "...", "body": "...", "callToAction": "..." }], "footer": "..." }`
      }]
    });
    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON');
    res.json(JSON.parse(text.slice(j, k + 1)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Stripe webhook registered above (before express.json middleware)

// ── TEST ENDPOINTS ────────────────────────────────────────────────────────────
app.get('/api/test/anthropic', async (req, res) => {
  try {
    const r = await anthropic.messages.create({ model: 'claude-opus-4-5', max_tokens: 50, messages: [{ role: 'user', content: 'Say "AABStudio online"' }] });
    res.json({ ok: true, response: r.content[0].text });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/test/elevenlabs', async (req, res) => {
  try {
    if (!ELEVENLABS_KEY) throw new Error('No key');
    const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': ELEVENLABS_KEY } });
    const d = await r.json();
    res.json({ ok: true, voiceCount: d.voices?.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/test/heygen', async (req, res) => {
  try {
    if (!HEYGEN_KEY) throw new Error('No HEYGEN_API_KEY set');
    const r = await fetch('https://api.heygen.com/v2/avatars', { headers: { 'X-Api-Key': HEYGEN_KEY } });
    const d = await r.json();
    res.json({ ok: true, avatarCount: d.data?.avatars?.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/test/kling', async (req, res) => {
  try {
    if (!KLING_KEY) throw new Error('No KLING_API_KEY set');
    res.json({ ok: true, message: 'Kling key present — ready for video generation' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/test/creatomate', async (req, res) => {
  try {
    if (!CREATOMATE_KEY) throw new Error('No key');
    const payload = {
      output_format: 'mp4', width: 320, height: 180,
      elements: [{ type: 'shape', path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', fill_color: '#1a3a5c', time: 0, duration: 2 }, { type: 'text', text: 'AABStudio Test', time: 0, duration: 2, font_size: null, font_size_minimum: '1 vmin', font_size_maximum: '6 vmin', font_weight: 700, fill_color: '#ffffff', x: '50%', y: '50%', x_alignment: '50%', y_alignment: '50%' }]
    };
    const r = await fetch('https://api.creatomate.com/v1/renders', { method: 'POST', headers: { 'Authorization': `Bearer ${CREATOMATE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await r.json();
    res.json({ ok: r.ok, renderId: Array.isArray(d) ? d[0]?.id : d?.id, status: Array.isArray(d) ? d[0]?.status : d?.status });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── START ─────────────────────────────────────────────────────────────────────
// ── ENGINE: PER-SCENE IMAGE GENERATION ───────────────────────────────────────

// Build the constant suffix from studio setup — locked across all scenes
function buildStudioSuffix({ characterStyle, cinematographyPreset, studioBg, avatarDesc }) {
  const CINE = {
    news: 'three-point broadcast lighting, slow push-in, neutral colour grade, clean broadcast studio background',
    documentary: 'single dramatic key light, warm shadows, cinematic grade, intimate documentary setting',
    cinematic: 'Rembrandt lighting, 2.39:1 anamorphic crop, teal-orange grade, filmic grain, deep shadows',
    corporate: 'soft diffused octabox lighting, static framing, clean white studio, bright neutral grade',
    investigative: 'hard side lighting, low-key exposure, cold noir tones, dark office atmosphere',
    academic: 'warm tungsten library lighting, stable medium shot, wooden bookshelves background'
  };
  const CHAR = {
    realistic: 'photorealistic, natural skin texture, natural blinking, subtle micro-expressions',
    cartoon: 'Pixar-quality 3D animated style, expressive and vibrant',
    anime: 'premium anime illustration style, fluid and expressive',
    clay: 'claymation stop-motion aesthetic, rich handcrafted textures',
    illustrated: 'high-quality editorial illustration style, confident brushwork',
    avatar3d: 'ultra-realistic 3D render, subsurface scattering, hyper-detailed'
  };
  const preset = CINE[cinematographyPreset] || CINE.news;
  const charStyle = CHAR[characterStyle] || CHAR.realistic;
  const bg = studioBg || 'professional broadcast studio';
  return `${charStyle}. Setting: ${bg}. ${preset}. 4K quality, professional production value, no text, no watermarks, clean composition.`;
}

app.post('/api/image/generate', async (req, res) => {
  try {
    const {
      scenePrompt, sceneType, sceneNumber,
      characterStyle, cinematographyPreset, studioBg, avatarDesc,
      referenceImageBase64,  // avatar photo OR previous scene output for consistency
      isFirstScene           // true = establish look from reference; false = maintain it
    } = req.body;

    if (!scenePrompt) throw new Error('No scene prompt provided');
    if (!DALLE_KEY) throw new Error('No OPENAI_API_KEY set in Railway environment variables');

    const suffix = buildStudioSuffix({ characterStyle, cinematographyPreset, studioBg, avatarDesc });

    // Consistency prefix — anchors character appearance across all scenes
    let prefix = '';
    if (referenceImageBase64) {
      prefix = isFirstScene
        ? 'Based on the provided reference photo: same person, same face, same clothing, same hairstyle. '
        : 'IDENTICAL appearance to reference image: same face, same outfit, same hairstyle, same studio background. Only the scene action differs. ';
    }

    const fullPrompt = (prefix + scenePrompt.slice(0, 700) + '. ' + suffix).slice(0, 1000);

    // With reference image: use GPT-Image-1 edits endpoint for visual consistency
    if (referenceImageBase64) {
      try {
        const imageBuffer = Buffer.from(referenceImageBase64, 'base64');
        const { Blob } = await import('buffer');
        const formData = new FormData();
        formData.append('image', new File([imageBuffer], 'reference.png', { type: 'image/png' }));
        formData.append('prompt', fullPrompt);
        formData.append('model', 'gpt-image-1');
        formData.append('n', '1');
        formData.append('size', '1024x1024');

        const editRes = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + DALLE_KEY },
          body: formData
        });

        if (editRes.ok) {
          const editData = await editRes.json();
          const b64 = editData.data?.[0]?.b64_json;
          if (b64) return res.json({ imageBase64: b64, provider: 'gpt-image-1', prompt: fullPrompt });
        }
        // Fall through to DALL-E 3 with strong consistency prompt
        console.warn('GPT-Image-1 edit not available, using DALL-E 3 with consistency prompt');
      } catch (editErr) {
        console.warn('Image edit error:', editErr.message);
      }
    }

    // DALL-E 3 — used for Scene 1 or as fallback
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + DALLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('DALL-E HTTP ' + response.status + ': ' + err.slice(0, 200));
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image returned from DALL-E');

    res.json({ imageBase64: b64, provider: 'dalle', prompt: fullPrompt, revisedPrompt: data.data?.[0]?.revised_prompt });
  } catch (e) {
    console.error('Image generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
// ── ENGINE: BATCH IMAGE STATUS (returns which scenes have images) ─────────────
// Simple in-memory store for generated images (keyed by sessionId+sceneNumber)
// In production this should be Supabase storage
const IMAGE_STORE = {};

app.post('/api/image/store', async (req, res) => {
  try {
    const { sessionId, sceneNumber, imageBase64, provider } = req.body;
    if (!sessionId || sceneNumber === undefined) throw new Error('sessionId and sceneNumber required');
    const key = `${sessionId}_${sceneNumber}`;
    IMAGE_STORE[key] = { imageBase64, provider, createdAt: Date.now() };
    // Clean old entries (keep last 500)
    const keys = Object.keys(IMAGE_STORE);
    if (keys.length > 500) {
      keys.sort((a, b) => IMAGE_STORE[a].createdAt - IMAGE_STORE[b].createdAt)
          .slice(0, keys.length - 500)
          .forEach(k => delete IMAGE_STORE[k]);
    }
    res.json({ ok: true, key });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENGINE: REPORT-TO-SCENES (Path 2 — own content) ──────────────────────────
// Splits user's own document/script directly into presenter scenes
// Skips AI analysis — goes straight to scene structure
app.post('/api/report-to-scenes', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, textContent, pacing, destination } = req.body;

    const wpmMap = { slow: 110, normal: 140, fast: 170 };
    const wpm = wpmMap[pacing] || 140;
    const wordsPerScene = Math.round(wpm * 8 / 60);

    // Extract text content
    let rawText = textContent || '';
    if (!rawText && fileBase64) {
      const isPDF = mimeType === 'application/pdf';
      if (isPDF && fileBase64.length < 120000) {
        // Send PDF to Claude for text extraction + scene splitting in one step
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 10000,
          system: `You are AABStudio's Content Splitter. The user has uploaded their own document to split into presenter scenes.

DO NOT analyse or critique the content. Simply split it into scenes for a presenter to read.

RULES:
- Each scene = exactly ${wordsPerScene} words (±2 words) at ${wpm} wpm
- Respect section headings as natural scene breaks
- Split at sentence boundaries, never mid-sentence
- Generate a short visual prompt per scene (what should appear behind the presenter)
- Scene types: INTRODUCTION, MAIN, EVIDENCE, SUMMARY, CONCLUSION

OUTPUT — ONLY valid JSON:
{
  "title": "...",
  "presenterMode": "human",
  "totalDuration": 0,
  "costEstimate": { "totalScenes": 0, "totalCredits": 0 },
  "discussions": [
    {
      "sectionTitle": "...",
      "discussionText": "",
      "scenes": [
        {
          "sceneNumber": 1,
          "type": "INTRODUCTION",
          "duration": 8,
          "wordCount": ${wordsPerScene},
          "presenterA": "exact words from the document for this scene",
          "presenterB": null,
          "evidenceRef": null,
          "overlayText": null,
          "visualPrompt": "professional background matching the content theme"
        }
      ]
    }
  ]
}`,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
              { type: 'text', text: `Split this document into ${wordsPerScene}-word presenter scenes. Return ONLY valid JSON.` }
            ]
          }]
        });

        const text = response.content.map(c => c.text || '').join('').trim();
        const j = text.indexOf('{'), k = text.lastIndexOf('}');
        if (j === -1) throw new Error('No JSON returned');
        const result = JSON.parse(text.slice(j, k + 1));
        // Add cost estimate
        let total = 0;
        (result.discussions || []).forEach(d => { total += (d.scenes || []).length; });
        result.costEstimate = { totalScenes: total, totalCredits: total * 10 };
        result.totalDuration = total * 8;
        return res.json(result);
      }

      // For non-PDF files, extract text
      rawText = extractBase64Text(fileBase64, mimeType, fileName) || '';
    }

    if (!rawText || rawText.trim().length < 20) {
      throw new Error('No readable content found. Please paste your text or upload a PDF/TXT file.');
    }

    // Split text into scenes using Claude
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 10000,
      system: `You are AABStudio's Content Splitter. Split the provided text into presenter scenes.

DO NOT analyse or critique. Simply split into scenes for a presenter to read aloud.

RULES:
- Each scene = exactly ${wordsPerScene} words (±2 words)
- Respect paragraph/section breaks as scene breaks where possible
- Never split mid-sentence
- Group related sentences into scenes
- Generate a short visual prompt per scene
- Use the document's own section headings as discussion titles

OUTPUT — ONLY valid JSON with same schema as scenes endpoint.`,
      messages: [{
        role: 'user',
        content: `Split this content into ${wordsPerScene}-word scenes:\n\n${rawText.slice(0, 40000)}\n\nReturn ONLY valid JSON.`
      }]
    });

    const text = response.content.map(c => c.text || '').join('').trim();
    const j = text.indexOf('{'), k = text.lastIndexOf('}');
    if (j === -1) throw new Error('No JSON returned');
    const result = JSON.parse(text.slice(j, k + 1));

    let total = 0;
    (result.discussions || []).forEach(d => { total += (d.scenes || []).length; });
    result.costEstimate = { totalScenes: total, totalCredits: total * 10 };
    result.totalDuration = total * 8;
    result.presenterMode = 'human';

    res.json(result);
  } catch (e) {
    console.error('Report-to-scenes error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`AABStudio server running on port ${PORT}`));
