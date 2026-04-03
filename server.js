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
    const mode = presenterMode || 'human';

    // Trim report to prevent token overflow on large documents
    // Send only titles, summaries, and top 2 evidence items per section
    const trimmedSections = (report.sections || []).map((s, i) => ({
      num: i + 1,
      title: s.title,
      body: s.body ? s.body.slice(0, 400) : '',
      reasoning: s.reasoning || {},
      evidence: (s.evidenceItems || []).slice(0, 2).map(e => ({
        label: e.label,
        source: e.source,
        text: e.text ? e.text.slice(0, 150) : '',
        implication: e.implication ? e.implication.slice(0, 100) : ''
      }))
    }));

    // PHASE 1 — Expand each section into natural spoken discussion
    const discussionPrompt = `You are AABStudio Discussion Engine. Your job is to transform analytical report sections into natural spoken broadcast discussion — the kind a professional presenter would actually say out loud, not a compressed summary.

DOCUMENT: ${report.title}
TYPE: ${report.docType} | DOMAIN: ${report.domain}
EXECUTIVE SUMMARY: ${report.executiveSummary}

REPORT SECTIONS:
${trimmedSections.map(s => `
SECTION ${s.num}: ${s.title}
Analysis: ${s.body}
Observation: ${s.reasoning.observation || ''}
Implication: ${s.reasoning.implication || ''}
Recommendation: ${s.reasoning.recommendation || ''}
Key evidence: ${s.evidence.map(e => `[${e.label}] ${e.text} — ${e.implication}`).join(' | ')}
`).join('\n')}

PRESENTER MODE: ${mode}
- human: natural first-person teleprompter, conversational, direct address ("here's what this means for you...")
- ai: authoritative third-person narration ("the document reveals...", "analysis indicates...")
- dual: Presenter A sets context and asks questions, Presenter B provides analysis and explains

CRITICAL RULES FOR DISCUSSION WRITING:
1. Write as if speaking naturally — not bullet points or compressed sentences
2. Each section should become a flowing spoken discussion of 60-180 words
3. Use natural speech patterns: pauses implied by punctuation, transitions between ideas
4. Reference specific evidence, clause numbers, figures, names from the document
5. The discussion should feel like a documentary or news segment — engaging and informative
6. For dual mode: alternate between A and B naturally within the discussion

SCENE SPLITTING RULES — APPLY AFTER WRITING DISCUSSION:
- Split discussion into scenes of EXACTLY 15-20 words each
- Count words precisely — 140 words per minute × 8 seconds = 18.67 words
- Target exactly 18 words per scene — never more than 20, never fewer than 14
- Each scene must be a complete thought that flows into the next
- Scenes must read as continuous speech when played back-to-back

SCENE TYPES — assign the most accurate type to each scene:
- Introduction: opening a topic or section
- Evidence: citing specific document content, clause, figure, or quote
- Explanation: unpacking what evidence means in plain language
- Comparison: contrasting two things or showing change over time
- Recommendation: advising action or highlighting what to do
- Conclusion: closing a section or the whole production

Return ONLY valid JSON, no markdown, no code fences:
{
  "title": "compelling production title based on the document",
  "presenterMode": "${mode}",
  "totalScenes": 0,
  "estimatedDuration": "calculated from total scenes × 8 seconds",
  "discussions": [
    {
      "sectionTitle": "exact section title from report",
      "discussionText": "the full natural spoken discussion for this section — 60 to 180 words of broadcast-quality prose",
      "wordCount": 0,
      "scenes": [
        {
          "sceneNumber": 1,
          "type": "Introduction",
          "duration": 8,
          "wordCount": 18,
          "presenterA": "exactly 15-20 words of natural speech — this scene's portion of the discussion",
          "presenterB": "15-20 words for dual mode only, null for human or ai mode",
          "visualPrompt": "specific cinematic description — what appears on screen, camera angle, lighting, mood, any text or graphics shown",
          "evidenceRef": "specific evidence ID like EV-101 if this scene references evidence, otherwise null",
          "overlayText": "short on-screen text if relevant — a key stat, name, clause number, or quote. Keep under 6 words. null if none"
        }
      ]
    }
  ]
}

Generate one discussion block per report section. The number of scenes per section is determined entirely by the length of the discussion — longer sections with more evidence produce more scenes. Do not artificially limit or pad scene count. The total scene count reflects the actual substance of the document.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        messages: [{ role: 'user', content: discussionPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Scene engine error', details: err });
    }

    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    let scenes;
    try {
      scenes = JSON.parse(clean);
    } catch (parseErr) {
      // Try to extract JSON if there's surrounding text
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) scenes = JSON.parse(match[0]);
      else throw new Error('Failed to parse scene JSON: ' + parseErr.message);
    }

    // Post-process: number scenes sequentially, calculate totals
    let sceneNum = 1;
    let totalScenes = 0;
    (scenes.discussions || []).forEach(disc => {
      disc.wordCount = disc.discussionText ? disc.discussionText.split(/\s+/).length : 0;
      (disc.scenes || []).forEach(scene => {
        scene.sceneNumber = sceneNum++;
        scene.wordCount = scene.presenterA ? scene.presenterA.split(/\s+/).length : 0;
        scene.duration = 8;
        totalScenes++;
      });
    });

    scenes.totalScenes = totalScenes;
    const totalSecs = totalScenes * 8;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    scenes.estimatedDuration = `${mins > 0 ? mins + 'm ' : ''}${secs}s`;

    console.log(`Scene engine: ${totalScenes} scenes across ${(scenes.discussions||[]).length} discussion blocks`);
    res.json(scenes);

  } catch (err) {
    console.error('Scene generation error:', err);
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

    // Runway Gen3 Turbo supports 5s or 10s — use 10s for best quality
    const clipDuration = 10;

    // Map our ratio format to Runway format
    const ratioMap = { '1280:768': '1280:768', '768:1280': '768:1280', '1024:1024': '1024:1024' };
    const runwayRatio = ratioMap[ratio] || '1280:768';

    let endpoint, body;

    if (referenceImageBase64) {
      endpoint = 'https://api.dev.runwayml.com/v1/image_to_video';
      body = {
        model: 'gen3a_turbo',
        promptImage: `data:image/jpeg;base64,${referenceImageBase64}`,
        promptText: prompt,
        duration: clipDuration,
        ratio: runwayRatio,
        watermark: false
      };
    } else {
      endpoint = 'https://api.dev.runwayml.com/v1/image_to_video';
      body = {
        model: 'gen3a_turbo',
        promptText: prompt,
        duration: clipDuration,
        ratio: runwayRatio,
        watermark: false
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNWAY_KEY}`,
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Runway error:', response.status, errText);
      return res.status(500).json({ error: 'Runway error', details: errText, status: response.status });
    }

    const data = await response.json();
    res.json({ taskId: data.id, status: data.status });
  } catch (err) {
    console.error('Runway generate error:', err);
    res.status(500).json({ error: 'Video generation failed', details: err.message });
  }
});

app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_KEY}`,
        'X-Runway-Version': '2024-11-06'
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Status check failed', details: errText });
    }
    const data = await response.json();
    res.json({
      taskId: data.id,
      status: data.status,
      progress: data.progress || 0,
      videoUrl: data.output ? data.output[0] : null,
      error: data.failure || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Status failed', details: err.message });
  }
});

// ── Creatomate render ─────────────────────────────────────────────────────────
app.post('/api/render', async (req, res) => {
  try {
    const { scenes, studioConfig, musicConfig, outputFormat } = req.body;

    const formatSettings = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1':  { width: 1080, height: 1080 }
    };
    const fmt = formatSettings[outputFormat] || formatSettings['16:9'];
    const bgColor = studioConfig?.bgColor || '#1a3a5c';

    // Process all scenes — no artificial limits
    const compositionElements = [];
    let timeOffset = 0;

    for (const scene of scenes) {
      const dur = scene.audioDuration || scene.duration || 8;

      // Background
      if (scene.videoUrl) {
        compositionElements.push({
          type: 'video',
          track: 1,
          time: timeOffset,
          duration: dur,
          source: scene.videoUrl,
          fit: 'cover',
          width: '100%',
          height: '100%'
        });
      } else {
        compositionElements.push({
          type: 'rectangle',
          track: 1,
          time: timeOffset,
          duration: dur,
          x: '50%',
          y: '50%',
          width: '100%',
          height: '100%',
          fill_color: bgColor
        });
      }

      // Voice audio
      if (scene.audioBase64) {
        compositionElements.push({
          type: 'audio',
          track: 2,
          time: timeOffset,
          duration: dur,
          source: `data:audio/mpeg;base64,${scene.audioBase64}`,
          volume: '100%'
        });
      }

      // Scene type tag — top left, shown for first 2s
      if (scene.type) {
        const typeColors = {
          Introduction: '#b8942a', Evidence: '#c0392b', Explanation: '#1a7a4a',
          Comparison: '#8a6200', Recommendation: '#2d5f8e', Conclusion: '#1a3a5c'
        };
        compositionElements.push({
          type: 'text',
          track: 3,
          time: timeOffset,
          duration: 2,
          text: scene.type.toUpperCase(),
          x: '3%', y: '6%',
          x_anchor: '0%', y_anchor: '50%',
          width: 'auto', height: 'auto',
          font_family: 'Montserrat',
          font_weight: '700',
          font_size: '15px',
          color: '#ffffff',
          background_color: typeColors[scene.type] || '#1a3a5c',
          x_padding: '10px', y_padding: '4px',
          border_radius: '20px'
        });
      }

      // Lower third overlay text
      if (scene.overlayText && scene.overlayText !== 'null' && scene.overlayText !== null) {
        compositionElements.push({
          type: 'text',
          track: 4,
          time: timeOffset + 0.5,
          duration: dur - 1,
          text: scene.overlayText,
          x: '5%', y: '88%',
          x_anchor: '0%', y_anchor: '50%',
          width: '90%', height: 'auto',
          font_family: 'Montserrat',
          font_weight: '600',
          font_size: '20px',
          color: '#ffffff',
          background_color: 'rgba(26,58,92,0.9)',
          x_padding: '14px', y_padding: '7px',
          border_radius: '6px'
        });
      }

      timeOffset += dur;
    }

    // Background music with sidechain ducking
    if (musicConfig && musicConfig.audioBase64) {
      const musicEl = {
        type: 'audio',
        track: 5,
        time: 0,
        duration: timeOffset,
        source: `data:audio/mpeg;base64,${musicConfig.audioBase64}`,
        volume: `${musicConfig.volume || 30}%`,
        audio_fade_in: 1,
        audio_fade_out: 2
      };

      // Sidechain — duck music during each scene's speech
      if (musicConfig.sidechain) {
        let t = 0;
        const kf = [];
        for (const scene of scenes) {
          const d = scene.audioDuration || scene.duration || 8;
          if (scene.audioBase64) {
            kf.push({ time: t, value: `${musicConfig.duckLevel || 15}%` });
            kf.push({ time: t + d - 0.5, value: `${musicConfig.volume || 30}%` });
          }
          t += d;
        }
        if (kf.length) musicEl.volume_keyframes = kf;
      }

      compositionElements.push(musicEl);
    }

    const source = {
      output_format: 'mp4',
      width: fmt.width,
      height: fmt.height,
      frame_rate: 24,
      duration: timeOffset,
      elements: compositionElements
    };

    console.log(`Creatomate: ${scenes.length} scenes, ${Math.round(timeOffset)}s, ${compositionElements.length} elements`);

    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CREATOMATE_KEY}`
      },
      body: JSON.stringify({ source })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Creatomate error:', response.status, errText);
      return res.status(500).json({ error: 'Creatomate error', details: errText });
    }

    const data = await response.json();
    const renderId = Array.isArray(data) ? data[0].id : data.id;
    console.log('Creatomate render started:', renderId);
    res.json({ renderId, status: 'rendering' });

  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: 'Render failed', details: err.message });
  }
});

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
