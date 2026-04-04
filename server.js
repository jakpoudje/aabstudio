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

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 1: DOCUMENT INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

async function extractText(fileName, fileBase64, mimeType) {
  if (!fileBase64) return null;
  const buffer = Buffer.from(fileBase64, 'base64');
  const name = (fileName || '').toLowerCase();
  try {
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 12000);
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      wb.SheetNames.forEach(s => { text += `[Sheet: ${s}]\n` + XLSX.utils.sheet_to_csv(wb.Sheets[s]) + '\n'; });
      return text.slice(0, 12000);
    }
    if (name.endsWith('.pptx')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      wb.SheetNames.forEach((s, i) => { text += `[Slide ${i+1}]\n` + XLSX.utils.sheet_to_txt(wb.Sheets[s]) + '\n'; });
      return text.slice(0, 12000);
    }
    if (name.match(/\.(csv|txt|md|json|html|htm)$/) || (mimeType && mimeType.startsWith('text/'))) {
      return buffer.toString('utf8').slice(0, 12000);
    }
    return null;
  } catch (err) { console.error('Extraction error:', err.message); return null; }
}

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 2: ANALYSIS INTELLIGENCE ENGINE (Balanced — per spec Section 5)
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, fileName, fileContent, fileBase64, mimeType } = req.body;
    const name = (fileName || '').toLowerCase();
    const isPDF = name.endsWith('.pdf') || mimeType === 'application/pdf';

    const analysisPrompt = `You are AABStudio AI — a professional document intelligence engine.
You are NOT a summarization tool. You are an intelligence extraction and broadcasting platform.
Analysis request: "${request}"
Analysis depth: ${depth || 'deep'}
CRITICAL: Produce BALANCED analysis. Each section must cover merits AND risks, not just negatives.
Return ONLY valid JSON, no markdown, no code fences:
{
  "title": "specific descriptive report title",
  "docType": "document type",
  "domain": "Legal | Financial | Research | Investigative | Policy | Technical | General",
  "executiveSummary": "3-4 sentences covering both positive and concerning aspects",
  "documentMap": {"totalSections":0,"totalParagraphs":0,"keyEntities":["entity names"]},
  "sections": [
    {
      "title": "section title",
      "sectionId": "SEC_01",
      "body": "4-5 sentences of substantive analysis",
      "reasoning": {
        "observation": "factual observation from the document",
        "evidence": "direct reference supporting the observation",
        "interpretation": "what this means in context",
        "merits": "positive aspects or strengths",
        "risks": "concerns or weaknesses",
        "tradeOffs": "balance between competing considerations",
        "operationalImpact": "practical effect on operations",
        "financialImpact": "monetary or resource implications",
        "recommendation": "actionable recommendation"
      },
      "evidenceItems": [
        {
          "evidenceId": "EV-101",
          "label": "Risk Clause | Financial Data | Legal Provision | Policy Statement | Technical Finding | Statistical Data",
          "source": "Page X / Section Y / Clause Z",
          "sourceId": "DOC01_SEC01_PARA02",
          "text": "exact quote or close paraphrase",
          "interpretation": "what this evidence means",
          "implication": "practical consequence",
          "confidence": "High|Medium|Low"
        }
      ]
    }
  ]
}
Generate 4-6 sections, 2-3 evidence items each, sequential IDs (EV-101, EV-102...).`;

    let messages;
    if (isPDF && fileBase64) {
      messages = [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } },
        { type: 'text', text: analysisPrompt }
      ]}];
    } else {
      let documentText = fileBase64 ? await extractText(fileName, fileBase64, mimeType) : null;
      documentText = documentText || fileContent || null;
      const docSection = documentText ? `\n\nDOCUMENT: ${fileName}\n\nCONTENT:\n${documentText}` : `\n\nDocument: "${fileName}" — content unavailable.`;
      messages = [{ role: 'user', content: analysisPrompt + docSection }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'pdfs-2024-09-25' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4500, messages })
    });
    if (!response.ok) return res.status(500).json({ error: 'Anthropic API error', details: await response.text() });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    const report = JSON.parse(text.replace(/```json|```/g, '').trim());
    report._tokenUsage = { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 };
    res.json(report);
  } catch (err) { res.status(500).json({ error: 'Analysis failed', details: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 3: SCENE INTELLIGENCE ENGINE (per spec Section 6)
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/scenes', async (req, res) => {
  try {
    const { report, presenterMode, speed } = req.body;
    const mode = presenterMode || 'human';
    const sc = { slow: { wpm:110, wpsc:14 }, normal: { wpm:140, wpsc:18 }, fast: { wpm:170, wpsc:22 } }[speed] || { wpm:140, wpsc:18 };

    const trimmedSections = (report.sections || []).map((s, i) => ({
      num: i+1, sectionId: s.sectionId || `SEC_0${i+1}`, title: s.title,
      body: s.body ? s.body.slice(0, 400) : '', reasoning: s.reasoning || {},
      evidence: (s.evidenceItems || []).slice(0, 3).map(e => ({ evidenceId: e.evidenceId, label: e.label, source: e.source, text: (e.text||'').slice(0,150), implication: (e.implication||'').slice(0,100) }))
    }));

    const prompt = `You are AABStudio Scene Intelligence Engine. Transform report into broadcast scripts.
DOCUMENT: ${report.title} | ${report.docType} | ${report.domain}
SUMMARY: ${report.executiveSummary}
SECTIONS:
${trimmedSections.map(s => `[${s.sectionId}] ${s.title}: ${s.body}\nMerits: ${s.reasoning.merits||''} | Risks: ${s.reasoning.risks||''}\nEvidence: ${s.evidence.map(e=>`[${e.evidenceId}] ${e.text}`).join(' | ')}`).join('\n\n')}

MODE: ${mode} | SPEED: ${sc.wpm} WPM | TARGET: ${sc.wpsc} words/scene | MAX: 8 seconds/scene
MODE RULES: human=first-person conversational | ai=third-person authoritative | dual=A asks, B explains

VISUAL PROMPT RULES — describe for each scene:
- Presenter body language matching content (pointing for evidence, open hands for explanation, concerned for risks, confident for recommendations)
- Professional studio setting, camera angle, lighting mood
- For evidence scenes: describe document excerpt that should overlay

Return ONLY valid JSON:
{"title":"","presenterMode":"${mode}","speed":"${speed||'normal'}","wordsPerScene":${sc.wpsc},
"discussions":[{"sectionTitle":"","sectionId":"","discussionText":"60-180 words spoken narrative",
"scenes":[{"sceneNumber":1,"type":"Introduction|Evidence|Explanation|Comparison|Recommendation|Conclusion",
"duration":8,"presenterA":"${sc.wpsc} words","presenterB":"for dual only, else null",
"visualPrompt":"cinematic: gesture, setting, camera, overlay","evidenceRef":"EV-101 or null","overlayText":"under 6 words or null"}]}]}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 6000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) return res.status(500).json({ error: 'Scene engine error', details: await response.text() });
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    let scenes;
    try { scenes = JSON.parse(clean); } catch(e) { const m = clean.match(/\{[\s\S]*\}/); if(m) scenes = JSON.parse(m[0]); else throw new Error('Parse failed'); }

    let sceneNum = 1, totalScenes = 0;
    (scenes.discussions || []).forEach(disc => {
      disc.wordCount = disc.discussionText ? disc.discussionText.split(/\s+/).length : 0;
      (disc.scenes || []).forEach(scene => { scene.sceneNumber = sceneNum++; scene.wordCount = scene.presenterA ? scene.presenterA.split(/\s+/).length : 0; scene.duration = 8; totalScenes++; });
    });
    scenes.totalScenes = totalScenes;
    scenes.totalDurationSeconds = totalScenes * 8;
    scenes.estimatedDuration = `${Math.floor(scenes.totalDurationSeconds/60)}m ${scenes.totalDurationSeconds%60}s`;
    scenes.costEstimate = { totalCredits: totalScenes * 10, creditsPerScene: 10 };
    console.log(`Scenes: ${totalScenes} scenes, ${scenes.estimatedDuration}, ${scenes.costEstimate.totalCredits} credits`);
    res.json(scenes);
  } catch (err) { console.error('Scene error:', err); res.status(500).json({ error: 'Scene generation failed', details: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 4: COST ESTIMATOR (per spec Section 8-9)
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/cost/estimate', (req, res) => {
  const n = req.body.numScenes || 20;
  const totalCredits = n * 10;
  const dur = `${Math.floor((n*8)/60)}m ${(n*8)%60}s`;
  res.json({ estimatedScenes: n, estimatedDuration: dur, estimatedCredits: totalCredits,
    message: `Estimated video: ${dur} | ${n} scenes | ${totalCredits} credits` });
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 5: VOICE ENGINE (ElevenLabs)
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId, stability, similarityBoost } = req.body;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'EXAVITQu4vr4xnSDxMaL'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_KEY },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: stability||0.5, similarity_boost: similarityBoost||0.75, style: 0.3, use_speaker_boost: true } })
    });
    if (!response.ok) return res.status(500).json({ error: 'ElevenLabs error', details: await response.text() });
    res.json({ audio: Buffer.from(await response.arrayBuffer()).toString('base64'), mimeType: 'audio/mpeg' });
  } catch (err) { res.status(500).json({ error: 'Voice failed', details: err.message }); }
});

app.get('/api/voices', async (req, res) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': ELEVENLABS_KEY } });
    if (!response.ok) return res.status(500).json({ error: 'Voices fetch failed' });
    const data = await response.json();
    res.json({ voices: (data.voices||[]).map(v => ({ id: v.voice_id, name: v.name, category: v.category })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 6: MUSIC ENGINE
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/music/generate', async (req, res) => {
  try {
    const { prompt, duration } = req.body;
    const dur = Math.min(Math.max(duration||22, 1), 22);
    let response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_KEY },
      body: JSON.stringify({ text: prompt, duration_seconds: dur })
    });
    if (!response.ok) {
      response = await fetch('https://api.elevenlabs.io/v1/text-to-sound-effects', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_KEY },
        body: JSON.stringify({ text: prompt, duration_seconds: dur })
      });
    }
    if (!response.ok) return res.status(500).json({ error: 'Music failed — check ElevenLabs permissions', details: await response.text() });
    res.json({ audio: Buffer.from(await response.arrayBuffer()).toString('base64'), mimeType: 'audio/mpeg' });
  } catch (err) { res.status(500).json({ error: 'Music failed', details: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 7: VIDEO RENDER ENGINE (Runway) — with rate limit cache
// ══════════════════════════════════════════════════════════════════════════════

let runwayRateLimitedUntil = null;

app.post('/api/video/generate', async (req, res) => {
  try {
    if (runwayRateLimitedUntil && new Date() < runwayRateLimitedUntil) {
      return res.status(429).json({ error: 'Runway daily limit (cached)', retryable: false });
    }
    const { prompt, duration, ratio, referenceImageBase64 } = req.body;
    const body = { model: 'gen3a_turbo', promptText: prompt, duration: 10, ratio: { '1280:768':'1280:768','768:1280':'768:1280','1024:1024':'1024:1024' }[ratio] || '1280:768', watermark: false };
    if (referenceImageBase64) body.promptImage = `data:image/jpeg;base64,${referenceImageBase64}`;

    console.log(`Runway: prompt=${prompt.slice(0,80)}...`);
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RUNWAY_KEY}`, 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) { runwayRateLimitedUntil = new Date(Date.now() + 3600000); console.log('Runway rate limited'); return res.status(429).json({ error: 'Runway daily limit', retryable: false }); }
      return res.status(500).json({ error: 'Runway error', details: errText });
    }
    const data = await response.json();
    console.log('Runway task:', data.id);
    res.json({ taskId: data.id, status: data.status });
  } catch (err) { res.status(500).json({ error: 'Video failed', details: err.message }); }
});

app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`, {
      headers: { 'Authorization': `Bearer ${RUNWAY_KEY}`, 'X-Runway-Version': '2024-11-06' }
    });
    if (!response.ok) return res.status(500).json({ error: 'Status failed' });
    const data = await response.json();
    res.json({ taskId: data.id, status: data.status, progress: data.progress||0, videoUrl: data.output ? (Array.isArray(data.output) ? data.output[0] : data.output) : null, error: data.failure||null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 8: AUDIO STORE + CREATOMATE RENDER
// ══════════════════════════════════════════════════════════════════════════════

const audioStore = new Map();
setInterval(() => { const now = new Date(); for (const [id, item] of audioStore) { if (item.expires < now) audioStore.delete(id); } }, 1800000);

app.get('/api/audio/:id', (req, res) => {
  const item = audioStore.get(req.params.id);
  if (!item || item.expires < new Date()) { audioStore.delete(req.params.id); return res.status(404).send('Not found'); }
  res.set('Content-Type', item.mime); res.set('Cache-Control', 'public, max-age=3600'); res.send(item.data);
});

function storeAudio(b64, mime) {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  audioStore.set(id, { data: Buffer.from(b64, 'base64'), mime: mime||'audio/mpeg', expires: new Date(Date.now() + 7200000) });
  return id;
}

app.post('/api/render', async (req, res) => {
  try {
    const { scenes, studioConfig, musicConfig, outputFormat } = req.body;
    const valid = scenes.filter(s => s.audioBase64);
    if (!valid.length) return res.status(400).json({ error: 'No scenes with audio' });

    const fmt = { '16:9':{w:1920,h:1080}, '9:16':{w:1080,h:1920}, '1:1':{w:1080,h:1080} }[outputFormat] || {w:1920,h:1080};
    const bg = studioConfig?.bgColor || '#1a3a5c';
    const base = process.env.BASE_URL || 'https://aabstudio-production.up.railway.app';
    const tc = { Introduction:'#b8942a', Evidence:'#c0392b', Explanation:'#1a7a4a', Comparison:'#8a6200', Recommendation:'#2d5f8e', Conclusion:'#1a3a5c' };
    const els = [];
    let t = 0;

    for (const s of valid) {
      const d = s.duration || 8;
      // Background
      if (s.videoUrl) { els.push({ type:'video', track:1, time:t, duration:d, source:s.videoUrl, fit:'cover', width:'100%', height:'100%' }); }
      else { els.push({ type:'shape', track:1, time:t, duration:d, x:'50%', y:'50%', width:'100%', height:'100%', fill_color:bg, path:'M 0 0 L 100 0 L 100 100 L 0 100 Z' }); }
      // Audio
      if (s.audioBase64) { const aid = storeAudio(s.audioBase64, 'audio/mpeg'); els.push({ type:'audio', track:2, time:t, duration:d, source:`${base}/api/audio/${aid}`, volume:'100%' }); }
      // Type badge
      if (s.type) { els.push({ type:'text', track:3, time:t, duration:2.5, text:s.type.toUpperCase(), x:'5%', y:'8%', width:'25%', height:'5%', x_anchor:'0%', y_anchor:'50%', font_family:'Montserrat', font_weight:700, font_size:null, font_size_minimum:'1 vmin', font_size_maximum:'3 vmin', fill_color:'#ffffff', background_color:tc[s.type]||bg, background_x_padding:'50%', background_y_padding:'30%', background_border_radius:'50%' }); }
      // Overlay
      if (s.overlayText && s.overlayText !== 'null') { els.push({ type:'text', track:4, time:t+0.5, duration:d-1, text:String(s.overlayText), x:'50%', y:'90%', width:'90%', height:'8%', x_alignment:'50%', y_alignment:'50%', font_family:'Montserrat', font_weight:600, font_size:null, font_size_minimum:'1 vmin', font_size_maximum:'4 vmin', fill_color:'#ffffff', background_color:'rgba(26,58,92,0.85)', background_x_padding:'30%', background_y_padding:'20%', background_border_radius:'8%' }); }
      t += d;
    }

    // Music
    if (musicConfig?.audioBase64) {
      const mid = storeAudio(musicConfig.audioBase64, 'audio/mpeg');
      els.push({ type:'audio', track:5, time:0, duration:t, source:`${base}/api/audio/${mid}`, volume:`${musicConfig.volume||30}%`, audio_fade_in:1, audio_fade_out:2 });
    }

    const source = { output_format:'mp4', width:fmt.w, height:fmt.h, frame_rate:24, duration:t, elements:els.filter(e=>e&&e.type) };
    console.log(`Creatomate: ${valid.length} scenes, ${Math.round(t)}s, ${source.elements.length} elements`);

    const response = await fetch('https://api.creatomate.com/v1/renders', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${CREATOMATE_KEY}` },
      body: JSON.stringify({ source })
    });
    if (!response.ok) { const e = await response.text(); console.error('Creatomate:', response.status, e); return res.status(500).json({ error:'Creatomate error', details:e }); }
    const data = await response.json();
    const rid = Array.isArray(data) ? data[0].id : data.id;
    console.log('Creatomate render:', rid);
    res.json({ renderId:rid, status:'rendering' });
  } catch (err) { console.error('Render error:', err); res.status(500).json({ error:'Render failed', details:err.message }); }
});

app.get('/api/render/status/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`, { headers:{ 'Authorization':`Bearer ${CREATOMATE_KEY}` } });
    if (!r.ok) return res.status(500).json({ error:'Status failed' });
    const d = await r.json();
    res.json({ renderId:d.id, status:d.status, url:d.url||null, progress:d.progress||0, error:d.error_message||null });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get('/api/render/check/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`, { headers:{ 'Authorization':`Bearer ${CREATOMATE_KEY}` } });
    if (!r.ok) return res.status(r.status).json({ error:'Not found' });
    const d = await r.json();
    res.json({ renderId:d.id, status:d.status, url:d.url||null, progress:d.progress||0, duration:d.duration, fileSize:d.file_size, error:d.error_message||null });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 9: EXPORT METADATA
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/export/metadata', async (req, res) => {
  try {
    const { report, platform } = req.body;
    const guides = { youtube:'title max 100, description+chapters, 3-5 tags', instagram:'caption 2200, 20-30 tags', tiktok:'hook first, 150 chars, 3-5 tags', linkedin:'professional 1300 chars, 3-5 tags', twitter:'280 chars, 1-2 tags', facebook:'conversational, 1-3 tags' };
    const prompt = `Generate social metadata. REPORT: ${report.title} | ${report.docType}\nSUMMARY: ${report.executiveSummary}\nPLATFORM: ${platform} | ${guides[platform]||''}\nReturn ONLY JSON: {"title":"","description":"","hashtags":[""],"chapters":[{"time":"0:00","title":""}]}`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key':ANTHROPIC_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{ role:'user', content:prompt }] })
    });
    const data = await response.json();
    res.json(JSON.parse(data.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim()));
  } catch (err) { res.status(500).json({ error:'Metadata failed', details:err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ENGINE 10: STRIPE BILLING
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { priceId, mode, customerEmail } = req.body;
    const p = { mode:mode||'subscription', payment_method_types:['card'], line_items:[{price:priceId,quantity:1}], success_url:'https://aabstudio.ai?checkout=success', cancel_url:'https://aabstudio.ai?checkout=cancelled', customer_email:customerEmail, allow_promotion_codes:true };
    if (mode==='subscription') p.subscription_data = { trial_period_days:7 };
    const session = await stripe.checkout.sessions.create(p);
    res.json({ url:session.url, sessionId:session.id });
  } catch (err) { res.status(500).json({ error:'Checkout failed', details:err.message }); }
});

app.post('/api/stripe/webhook', (req, res) => {
  try { const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); console.log('Webhook:', event.type); res.json({ received:true }); }
  catch (err) { res.status(400).send(`Webhook Error: ${err.message}`); }
});

// ══════════════════════════════════════════════════════════════════════════════
// TEST ENDPOINTS — Direct API verification URLs
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/test/creatomate', async (req, res) => {
  try {
    const source = { output_format:'mp4', width:1280, height:720, duration:5, elements:[
      { type:'shape', track:1, time:0, duration:5, x:'50%', y:'50%', width:'100%', height:'100%', fill_color:'#1a3a5c', path:'M 0 0 L 100 0 L 100 100 L 0 100 Z' },
      { type:'text', track:2, time:0, duration:5, text:'AABStudio v8 Test', x:'50%', y:'50%', width:'80%', height:'20%', x_alignment:'50%', y_alignment:'50%', font_family:'Montserrat', font_weight:700, font_size:null, font_size_minimum:'3 vmin', font_size_maximum:'10 vmin', fill_color:'#ffffff' }
    ]};
    const r = await fetch('https://api.creatomate.com/v1/renders', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${CREATOMATE_KEY}` }, body:JSON.stringify({ source }) });
    const t = await r.text();
    res.json({ status:r.status, ok:r.ok, body:JSON.parse(t) });
  } catch (err) { res.json({ error:err.message }); }
});

app.get('/api/test/elevenlabs', async (req, res) => {
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers:{ 'xi-api-key':ELEVENLABS_KEY } });
    const d = await r.json();
    res.json({ status:r.status, ok:r.ok, voiceCount:(d.voices||[]).length });
  } catch (err) { res.json({ error:err.message }); }
});

app.get('/api/test/runway', async (req, res) => {
  try {
    if (runwayRateLimitedUntil && new Date() < runwayRateLimitedUntil) return res.json({ status:'rate_limited', until:runwayRateLimitedUntil.toISOString() });
    const r = await fetch('https://api.dev.runwayml.com/v1/tasks/nonexistent', { headers:{ 'Authorization':`Bearer ${RUNWAY_KEY}`, 'X-Runway-Version':'2024-11-06' } });
    res.json({ status:r.status, authenticated: r.status !== 401 });
  } catch (err) { res.json({ error:err.message }); }
});

app.get('/api/test/anthropic', async (req, res) => {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key':ANTHROPIC_KEY, 'anthropic-version':'2023-06-01' }, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:20, messages:[{role:'user',content:'Say OK'}] }) });
    const d = await r.json();
    res.json({ status:r.status, ok:r.ok, reply:d.content?.[0]?.text });
  } catch (err) { res.json({ error:err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ══════════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status:'ok', platform:'AABStudio API v8',
    engines:['DocumentIntelligence','AnalysisIntelligence','SceneIntelligence','CostEstimator','CreditManager','VoiceEngine','MusicEngine','VideoRender','CreatomateRender','ExportMetadata'],
    apis:{ anthropic:ANTHROPIC_KEY?'set':'missing', stripe:process.env.STRIPE_SECRET_KEY?'set':'missing', elevenlabs:ELEVENLABS_KEY?'set':'missing', runway:RUNWAY_KEY?'set':'missing', creatomate:CREATOMATE_KEY?'set':'missing', runwayRateLimited:!!runwayRateLimitedUntil },
    audioStoreSize: audioStore.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AABStudio API v8 on port ${PORT}`));
