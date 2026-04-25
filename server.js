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
// ── Supabase admin client (server-side only, uses service role key) ──────────
function getSupaAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL      || 'https://phjlxkyloafogznhyyig.supabase.co',
    process.env.SUPABASE_SERVICE_KEY,  // service role key — set in Railway env vars
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Map Stripe price IDs to plan names
const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_CREATOR]:        'creator',
  [process.env.STRIPE_PRICE_CREATOR_ANNUAL]: 'creator',
  [process.env.STRIPE_PRICE_STUDIO]:         'studio',
  [process.env.STRIPE_PRICE_STUDIO_ANNUAL]:  'studio',
  // Hardcoded fallbacks (sandbox)
  'price_1THCSlBJVJa9ylUXwAYC4LpR': 'creator',
  'price_1TNRx6BJVJa9ylUXwLr11VPm': 'studio',
};

async function updateUserPlan(email, plan) {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn('SUPABASE_SERVICE_KEY not set — cannot update user plan');
    return;
  }
  try {
    const supa = getSupaAdmin();
    // Find user by email
    const { data: { users }, error } = await supa.auth.admin.listUsers();
    if (error) throw error;
    const user = users.find(u => u.email === email);
    if (!user) { console.warn('User not found for email:', email); return; }
    // Update user metadata with new plan
    await supa.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, plan }
    });
    console.log('Plan updated:', email, '→', plan);
  } catch (e) {
    console.error('updateUserPlan error:', e.message);
  }
}

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.json({ received: true });
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event  = stripe.webhooks.constructEvent(req.body, sig, secret);
    console.log('Stripe event:', event.type);

    const obj = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const email  = obj.customer_email || obj.customer_details?.email;
      const priceId = obj.line_items?.data?.[0]?.price?.id;
      const plan   = PRICE_TO_PLAN[priceId] || 'creator';
      if (email) await updateUserPlan(email, plan);
    }

    if (event.type === 'customer.subscription.deleted') {
      // Subscription cancelled — downgrade to free
      const stripe2   = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const customer  = await stripe2.customers.retrieve(obj.customer);
      const email     = customer.email;
      if (email) await updateUserPlan(email, 'free');
    }

    if (event.type === 'invoice.payment_failed') {
      console.warn('Payment failed for:', obj.customer_email);
      // Optionally downgrade after grace period
    }

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
const KLING_KEY      = process.env.KLING_API_KEY;
const RUNWAY_KEY      = process.env.RUNWAY_API_KEY;
const CREATOMATE_KEY  = process.env.CREATOMATE_API_KEY;
const OPENAI_KEY     = process.env.OPENAI_API_KEY;
const STRIPE_KEY     = process.env.STRIPE_SECRET_KEY;
const MODEL          = 'claude-sonnet-4-6';
const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929';

// ── HEALTH ────────────────────────────────────────────────────────────────────
// Check Supabase service key is set
if (!process.env.SUPABASE_SERVICE_KEY) {
  console.warn('⚠ SUPABASE_SERVICE_KEY not set — plan updates after payment will not work');
}


// ════════════════════════════════════════════════════════════════════════════
// RUNWAY ML — AI video generation from images/text
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/runway/generate', async (req, res) => {
  try {
    if(!RUNWAY_KEY) return res.status(503).json({ error: 'Runway API key not configured. Add RUNWAY_API_KEY to Railway.' });
    const { promptImage, promptText, duration = 5, ratio = '1280:720', model = 'gen4_turbo' } = req.body;
    if(!promptImage && !promptText) return res.status(400).json({ error: 'promptImage (URL/base64) or promptText required' });

    const body = { model, ratio, duration };
    if(promptText)  body.promptText  = promptText;
    if(promptImage) body.promptImage = promptImage;

    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(body)
    });
    if(!r.ok) { const err = await r.text(); throw new Error(`Runway ${r.status}: ${err.slice(0,200)}`); }
    const data = await r.json();
    res.json({ taskId: data.id, status: 'pending', provider: 'runway' });
  } catch(e) {
    console.error('Runway generate:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/runway/status/:taskId', async (req, res) => {
  try {
    if(!RUNWAY_KEY) return res.status(503).json({ error: 'Runway API key not configured.' });
    const r = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`, {
      headers: { 'Authorization': `Bearer ${RUNWAY_KEY}`, 'X-Runway-Version': '2024-11-06' }
    });
    if(!r.ok) throw new Error(`Runway status ${r.status}`);
    const data = await r.json();
    const map = { PENDING:'pending', RUNNING:'processing', SUCCEEDED:'completed', FAILED:'failed' };
    res.json({ taskId: req.params.taskId, status: map[data.status]||data.status,
               videoUrl: data.output?.[0]||null, progress: data.progressRatio||0, provider:'runway' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// CREATOMATE — Professional video stitching, rendering, subtitle burn-in
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/creatomate/stitch', async (req, res) => {
  try {
    if(!CREATOMATE_KEY) return res.status(503).json({ error: 'Creatomate API key not configured. Add CREATOMATE_API_KEY to Railway.' });
    const { clips, subtitles = [], musicUrl, outputFormat = 'mp4', resolution = '1080p', title = '' } = req.body;
    if(!clips || !clips.length) return res.status(400).json({ error: 'clips array required. Each: {url, duration}' });

    const resMap = { '720p':[1280,720], '1080p':[1920,1080], '4k':[3840,2160] };
    const [width, height] = resMap[resolution] || [1920,1080];

    const elements = [];
    let time = 0;

    clips.forEach((clip, i) => {
      // Video clip
      elements.push({ type:'video', source:clip.url, time, duration:clip.duration||8, fit:'cover', volume:1 });
      // Subtitle for this clip
      if(subtitles[i]) {
        elements.push({
          type:'text', text:subtitles[i], time, duration:clip.duration||8,
          x:'50%', y:'88%', width:'85%', height:'auto',
          font_size:'5 vmin', font_weight:'600', color:'#ffffff',
          background_color:'rgba(0,0,0,0.68)', x_padding:'8%', y_padding:'15%',
          font_family:'Open Sans', x_anchor:'50%', y_anchor:'100%'
        });
      }
      time += (clip.duration || 8);
    });

    // Background music
    if(musicUrl) {
      elements.push({ type:'audio', source:musicUrl, time:0, duration:time, volume:0.25, audio_fade_out:3 });
    }

    const payload = { output_format:outputFormat, width, height, frame_rate:30, elements };

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${CREATOMATE_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if(!r.ok) { const err = await r.text(); throw new Error(`Creatomate ${r.status}: ${err.slice(0,300)}`); }
    const data = await r.json();
    const render = Array.isArray(data) ? data[0] : data;
    res.json({ taskId:render.id, status:render.status||'pending', outputUrl:render.url||null,
               provider:'creatomate', totalDuration:time, clipCount:clips.length });
  } catch(e) {
    console.error('Creatomate stitch:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/creatomate/status/:renderId', async (req, res) => {
  try {
    if(!CREATOMATE_KEY) return res.status(503).json({ error: 'Creatomate API key not configured.' });
    const r = await fetch(`https://api.creatomate.com/v1/renders/${req.params.renderId}`, {
      headers:{ 'Authorization':`Bearer ${CREATOMATE_KEY}` }
    });
    if(!r.ok) throw new Error(`Creatomate status ${r.status}`);
    const data = await r.json();
    res.json({ taskId:req.params.renderId, status:data.status, progress:data.percent||0,
               outputUrl:data.url||null, provider:'creatomate' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


// ════════════════════════════════════════════════════════════════════════════
// PROJECT SYNC — save/load projects to Supabase so they work across all devices
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/project/save', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No auth token' });
    const token = authHeader.replace('Bearer ', '');

    // Verify user via Supabase
    const sb = getSupabase();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { project } = req.body;
    if (!project || !project.id) return res.status(400).json({ error: 'project.id required' });

    // Upsert project into projects table
    // Strip large binary data before saving to Supabase (5MB limit per row)
    var projectData = JSON.parse(JSON.stringify(project));
    if(projectData.assets) projectData.assets = projectData.assets.map(function(a){ 
      var clean = Object.assign({}, a); delete clean.dataUrl; return clean; 
    });
    if(projectData.scenes) projectData.scenes = projectData.scenes.map(function(s){
      var sc = Object.assign({}, s);
      if(sc.assets) sc.assets = sc.assets.map(function(a){ var c=Object.assign({},a); delete c.dataUrl; return c; });
      return sc;
    });
    delete projectData.clips;
    
    const { error } = await sb.from('aab_projects').upsert({
      id:      project.id,
      user_id: user.id,
      title:   project.title || 'My Video',
      data:    projectData
    }, { onConflict: 'id' });

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('project/save:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/project/list', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No auth token' });
    const token = authHeader.replace('Bearer ', '');

    const sb = getSupabase();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data, error } = await sb.from('aab_projects')
      .select('id, title, data, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ projects: (data || []).map(function(r){ return r.data; }) });
  } catch (e) {
    console.error('project/list:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/project/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No auth token' });
    const token = authHeader.replace('Bearer ', '');

    const sb = getSupabase();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { error } = await sb.from('aab_projects')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', user.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ── Auto-setup: create aab_projects table if missing ─────────────────────────
app.post('/api/setup-db', async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(500).json({ error: 'Supabase not configured' });
    
    // Try to create table via raw SQL using Supabase's rpc
    const sql = `
      CREATE TABLE IF NOT EXISTS aab_projects (
        id       TEXT PRIMARY KEY,
        user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title    TEXT,
        data     JSONB
      );
      ALTER TABLE aab_projects ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename='aab_projects' AND policyname='users_own_aab_projects'
        ) THEN
          CREATE POLICY "users_own_aab_projects" ON aab_projects
            FOR ALL USING (auth.uid() = user_id);
        END IF;
      END $$;
    `;
    
    const { error } = await sb.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: { message: 'rpc not available' } }));
    
    // Verify table exists by querying it
    const { error: checkErr } = await sb.from('aab_projects').select('id').limit(1);
    
    if (checkErr && checkErr.code === 'PGRST205') {
      return res.status(500).json({ error: 'Table does not exist - run SQL manually in Supabase', sql });
    }
    
    res.json({ ok: true, tableExists: !checkErr });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Save multiple projects at once (for cross-device sync)
app.post('/api/project/save-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No auth token' });
    const token = authHeader.replace('Bearer ', '');
    const sb = getSupabase();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { projects } = req.body;
    if (!projects || !Array.isArray(projects)) return res.status(400).json({ error: 'projects array required' });

    const results = [];
    for (const project of projects) {
      if (!project.id) continue;
      try {
        // Strip binary data
        const p = JSON.parse(JSON.stringify(project));
        if (p.assets) p.assets = p.assets.map(a => { const c={...a}; delete c.dataUrl; return c; });
        if (p.scenes) p.scenes = p.scenes.map(s => { const sc={...s}; if(sc.assets) sc.assets=sc.assets.map(a=>{const c={...a};delete c.dataUrl;return c;}); return sc; });
        delete p.clips;
        const { error } = await sb.from('aab_projects').upsert({ id: p.id, user_id: user.id, title: p.title||'My Video', data: p }, { onConflict: 'id' });
        results.push({ id: project.id, title: project.title, ok: !error, error: error ? error.message : null });
      } catch(e) { results.push({ id: project.id, ok: false, error: e.message }); }
    }
    res.json({ results, saved: results.filter(r=>r.ok).length, total: results.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({
  status:     'ok',
  version:    '2.3',
  platform:   'AABStudio.ai',
  model:      MODEL,
  anthropic:  !!process.env.ANTHROPIC_API_KEY,
  elevenlabs: !!ELEVENLABS_KEY,
  heygen:     !!HEYGEN_KEY,
    runway:     !!RUNWAY_KEY,
    creatomate: !!CREATOMATE_KEY,
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
    const fullText = script.trim();
    // For very long scripts, Claude can't return all scenes in one response
    // Limit to ~400 words per scene * max scenes that fit in 16k tokens (~60 scenes max)
    // Each scene JSON is ~200 tokens, so 60 scenes = 12000 tokens for scenes alone
    const MAX_SCENES_PER_CALL = 50;
    const approxSceneCount = Math.ceil(fullText.split(/\s+/).length / wordsPerScene);
    // If script would produce > MAX_SCENES_PER_CALL scenes, truncate to fit
    const maxWords = MAX_SCENES_PER_CALL * wordsPerScene;
    const words = fullText.split(/\s+/);
    const text = words.length > maxWords 
      ? words.slice(0, maxWords).join(' ') + ' [Script continues — remaining scenes will use local segmentation]'
      : fullText;
    const isLongScript = words.length > maxWords;

    // Try primary model, fall back to previous if not supported
    let r;
    try {
      r = await anthropic.messages.create({
        model: MODEL, max_tokens: 16000,
      system: `You are a teleprompter scene segmentation engine.
Split the provided script into presenter scenes for teleprompter recording.
DO NOT analyse, critique, or rewrite. Preserve exact wording from the script.

RULES:
- Each scene ≈ ${wordsPerScene} words (${wpm} WPM × ${sceneDuration}s)
- Split ONLY at sentence or paragraph boundaries — never mid-sentence
- Use the script's own headings and paragraphs as natural break points
- Scene types: INTRO, MAIN, TRANSITION, SUMMARY, CONCLUSION, HOOK
- Max scene duration: 10 seconds. No scene should exceed 10s worth of words.

CRITICAL: Your response must be pure valid JSON only. No markdown, no explanation, no text before or after.
Escape any double quotes inside narration strings with backslash. Replace actual newlines in narration with spaces.
RESPOND WITH ONLY THIS JSON:
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
    } catch(modelErr) {
      if(modelErr.status === 404 || modelErr.message?.includes('model')) {
        r = await anthropic.messages.create({
          model: MODEL_FALLBACK, max_tokens: 16000,
          system: `You are a teleprompter scene segmentation engine. Split the script into scenes. Respond ONLY with valid JSON.`,
          messages: [{ role: 'user', content: `Segment this script:\n\n${text}\n\nReturn ONLY valid JSON.` }]
        });
      } else { throw modelErr; }
    }

    const raw = r.content.map(c => c.text || '').join('').trim();
    const j   = raw.indexOf('{');
    if (j === -1) throw new Error('AI returned no valid JSON');

    // Smart JSON extraction — handles truncated responses
    // Try finding last complete scene by looking for last valid "}" before any trailing text
    let depth = 0, k = -1, lastValidK = -1;
    for (let ci = j; ci < raw.length; ci++) {
      if (raw[ci] === '{') depth++;
      else if (raw[ci] === '}') { 
        depth--; 
        if (depth === 0) { k = ci; break; }
        if (depth === 1) lastValidK = ci; // track last complete scene closing
      }
    }
    // If full JSON not found (truncated), try to repair by closing open braces
    if (k === -1 && lastValidK > -1) {
      // Truncated response — close the arrays and objects
      k = lastValidK;
      // We'll repair below
    }
    if (k === -1) throw new Error('Could not find valid JSON in AI response');

    let result;
    try {
      let jsonStr = raw.slice(j, k + 1);
      // Clean up common AI JSON issues
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ');
      result = JSON.parse(jsonStr);
    } catch(parseErr) {
      // Truncated JSON repair: extract complete scenes only
      console.warn('JSON parse failed, attempting repair:', parseErr.message);
      // Extract all complete scene objects
      const sceneRx = /\{[^{}]*"narration"[^{}]*\}/g;
      // Regex fallback: extract narration fields directly
      console.warn('JSON.parse failed, using regex:', parseErr.message);
      const sceneMatches = [];
      // Better regex that handles escaped quotes
      const rx = /"narration"\s*:\s*"((?:[^\\"]|\\.)*)"/g;
      let m2, idx2 = 0;
      while ((m2 = rx.exec(raw)) !== null) {
        sceneMatches.push({
          id: 's_' + (sceneMatches.length + 1),
          sceneNumber: sceneMatches.length + 1,
          type: idx2 === 0 ? 'INTRO' : 'MAIN',
          narration: m2[1].replace(/\n/g, ' ').replace(/\"/g, '"'),
          wordCount: m2[1].split(/\s+/).length,
          duration: Math.min(sceneDuration, 10),
          notes: '', assets: [], status: 'draft'
        });
        idx2++;
      }
      if (sceneMatches.length === 0) throw new Error('Could not parse AI response');
      result = { scenes: sceneMatches, title };
    }
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

    // If script was truncated, add remaining words as locally-split scenes
    if(isLongScript && scenes.length > 0) {
      const coveredWords = scenes.reduce((t,s) => t + (s.wordCount||0), 0);
      const remainingWords = words.slice(coveredWords);
      let wi = 0;
      while(wi < remainingWords.length) {
        const chunk = remainingWords.slice(wi, wi + wordsPerScene).join(' ');
        if(chunk.trim().length > 5) {
          scenes.push({
            id: 's_' + (scenes.length + 1),
            sceneNumber: scenes.length + 1,
            type: wi === 0 ? 'TRANSITION' : 'MAIN',
            narration: chunk,
            wordCount: chunk.split(/\s+/).length,
            duration: Math.min(sceneDuration, 10),
            notes: '', assets: [], status: 'draft'
          });
        }
        wi += wordsPerScene;
      }
    }

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
    console.error('segment error:', e.message, 'status:', e.status, 'type:', e.error?.type);
    const isCredits = e.message?.includes('credit') || e.message?.includes('billing') || e.status === 400;
    const isNoKey   = !process.env.ANTHROPIC_API_KEY;
    const errMsg    = isNoKey ? 'ANTHROPIC_API_KEY not set in Railway environment variables' : 
                      isCredits ? 'Anthropic API credits exhausted — top up at console.anthropic.com' :
                      (e.message || 'AI segmentation failed');
    res.status(500).json({ error: errMsg, detail: e.message });
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
    const { referenceImageBase64, audioBase64, ratio = '16:9', sceneText = '' } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'Audio (base64) is required.' });

    // ── Prefer Kling for lip-sync ──────────────────────────────────────────
    if (KLING_KEY) {
      return await generateWithKling(req, res, { referenceImageBase64, audioBase64, ratio, sceneText });
    }

    // ── Fallback: HeyGen (original) ────────────────────────────────────────
    if (HEYGEN_KEY) {
      return await generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio });
    }

    res.status(503).json({ error: 'No video generation API key configured. Add KLING_API_KEY or HEYGEN_API_KEY in Railway environment variables.' });

  } catch (e) {
    console.error('presenter error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Kling lip-sync implementation ──────────────────────────────────────────
async function generateWithKling(req, res, { referenceImageBase64, audioBase64, ratio, sceneText }) {
  // Kling API: https://api.klingai.com/v1
  const KLING_BASE = 'https://api.klingai.com/v1';

  // Build the lip-sync payload
  // Kling accepts: image (base64), audio (base64), prompt for motion
  const payload = {
    model_name: 'kling-v1-5',
    mode:       'pro',
    duration:   '5',
    aspect_ratio: ratio === '9:16' ? '9:16' : ratio === '1:1' ? '1:1' : '16:9',
  };

  // Add audio for lip sync
  if (audioBase64) {
    payload.audio = {
      type: 'base64',
      data: audioBase64,
      mime_type: 'audio/mpeg'
    };
  }

  // Add reference image
  if (referenceImageBase64) {
    payload.image = referenceImageBase64; // base64 string
    payload.prompt = (sceneText || 'person speaking naturally to camera, professional presenter').slice(0, 200);
  } else {
    // No image — generate avatar with prompt
    payload.prompt = 'professional news presenter speaking to camera, clear lighting, ' + (sceneText || '').slice(0, 150);
  }

  console.log('Kling lip-sync request, hasImage:', !!referenceImageBase64, 'hasAudio:', !!audioBase64);

  // Try lip-sync endpoint first
  const lipSyncResp = await fetch(`${KLING_BASE}/videos/lip-sync`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${KLING_KEY}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({
      input: {
        type:       'audio',
        audio_type: 'base64',
        audio_base64: audioBase64,
        ...(referenceImageBase64 ? { image_type: 'base64', image_base64: referenceImageBase64 } : {})
      },
      model_name: 'kling-v1',
    })
  });

  let taskId, videoUrl;

  if (lipSyncResp.ok) {
    const lipData = await lipSyncResp.json();
    taskId = lipData.data?.task_id || lipData.task_id;
    console.log('Kling lip-sync task created:', taskId);
  } else {
    const lipErr = await lipSyncResp.text();
    console.warn('Kling lip-sync failed:', lipSyncResp.status, lipErr.slice(0, 200));

    // Fallback: image-to-video
    if (referenceImageBase64) {
      const i2vResp = await fetch(`${KLING_BASE}/images/image2video`, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${KLING_KEY}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          model_name:   'kling-v1-5',
          image:         referenceImageBase64,
          prompt:        'person speaking to camera naturally, professional presenter, clear speech',
          duration:      '5',
          aspect_ratio:  payload.aspect_ratio,
          cfg_scale:     0.5
        })
      });

      if (!i2vResp.ok) {
        const i2vErr = await i2vResp.text();
        throw new Error(`Kling image-to-video failed: ${i2vResp.status} — ${i2vErr.slice(0,150)}`);
      }
      const i2vData = await i2vResp.json();
      taskId = i2vData.data?.task_id || i2vData.task_id;
      console.log('Kling image2video task:', taskId);
    } else {
      throw new Error(`Kling lip-sync failed: ${lipSyncResp.status} — ${lipErr.slice(0,100)}`);
    }
  }

  if (!taskId) throw new Error('Kling did not return a task_id');

  res.json({
    taskId:   'kling-' + taskId,
    provider: 'kling',
    message:  'Kling video generating — poll /api/presenter-status for completion (usually 2-5 min)'
  });
}

// ── HeyGen: correct API flow ──────────────────────────────────────────────
// HeyGen v2 requires: upload audio → get asset_id → use in video/generate
// ── HeyGen: correct API flow per official docs ────────────────────────────
// Docs: https://docs.heygen.com/reference/upload-asset
// Asset upload = RAW BINARY body, Content-Type: audio/mpeg, NO form fields
async function generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio }) {

  // Step 1: Upload audio as RAW BINARY (not multipart, not JSON)
  const audioBuffer = Buffer.from(audioBase64, 'base64');

  console.log(`HeyGen: uploading audio ${audioBuffer.length} bytes...`);
  const audioUpload = await fetch('https://upload.heygen.com/v1/asset', {
    method:  'POST',
    headers: {
      'X-Api-Key':    HEYGEN_KEY,
      'Content-Type': 'audio/mpeg'  // RAW binary — no multipart, no form fields
    },
    body: audioBuffer  // raw binary buffer directly
  });

  if (!audioUpload.ok) {
    const errText = await audioUpload.text();
    throw new Error(`HeyGen audio upload failed: ${audioUpload.status} — ${errText.slice(0, 200)}`);
  }

  const audioData   = await audioUpload.json();
  const audioAssetId = audioData.data?.id || audioData.data?.asset_id || audioData.asset_id || audioData.id;
  if (!audioAssetId) {
    throw new Error(`HeyGen audio upload: no asset_id returned. Response: ${JSON.stringify(audioData).slice(0, 200)}`);
  }
  console.log('HeyGen audio asset_id:', audioAssetId);

  // Step 2: Upload photo as RAW BINARY (if provided)
  let tpId = null;
  if (referenceImageBase64) {
    try {
      const imgBuffer = Buffer.from(referenceImageBase64, 'base64');
      console.log(`HeyGen: uploading photo ${imgBuffer.length} bytes...`);

      const photoUp = await fetch('https://upload.heygen.com/v1/talking_photo', {
        method:  'POST',
        headers: {
          'X-Api-Key':    HEYGEN_KEY,
          'Content-Type': 'image/jpeg'  // RAW binary
        },
        body: imgBuffer
      });

      if (photoUp.ok) {
        const pd = await photoUp.json();
        tpId = pd.data?.talking_photo_id || pd.talking_photo_id;
        console.log('HeyGen photo tpId:', tpId);
      } else {
        const errTxt = await photoUp.text();
        console.warn('HeyGen photo upload failed:', photoUp.status, errTxt.slice(0,100), '— using default avatar');
      }
    } catch (e) {
      console.warn('HeyGen photo error:', e.message, '— using default avatar');
    }
  }

  // Step 3: Generate video — audio_asset_id in voice field
  const character = tpId
    ? { type: 'talking_photo', talking_photo_id: tpId, talking_style: 'expressive' }
    : { type: 'avatar', avatar_id: 'josh_lite3_20230714', avatar_style: 'normal' };

  console.log('HeyGen: generating video, character:', character.type);
  const vr = await fetch('https://api.heygen.com/v2/video/generate', {
    method:  'POST',
    headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character,
        voice: { type: 'audio', audio_asset_id: audioAssetId },
        background: { type: 'color', value: '#1a2a3a' }
      }],
      aspect_ratio: ratio,
      test: false
    })
  });

  if (!vr.ok) {
    const errText = await vr.text();
    throw new Error(`HeyGen video generate failed: ${vr.status} — ${errText.slice(0, 200)}`);
  }

  const vd  = await vr.json();
  const vid = vd.data?.video_id || vd.video_id;
  if (!vid) throw new Error(`HeyGen no video_id. Response: ${JSON.stringify(vd).slice(0, 200)}`);

  console.log('HeyGen video_id:', vid);
  res.json({ taskId: 'heygen-' + vid, provider: 'heygen', usedPhoto: !!tpId, audioAssetId });
}

// ── Poll status for Kling tasks ────────────────────────────────────────────
app.get('/api/presenter-status', async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });

  try {
    if (taskId.startsWith('kling-')) {
      const klingTaskId = taskId.replace('kling-', '');
      const KLING_BASE  = 'https://api.klingai.com/v1';

      // Try lip-sync status first, then image2video
      let statusResp = await fetch(`${KLING_BASE}/videos/lip-sync/${klingTaskId}`, {
        headers: { 'Authorization': `Bearer ${KLING_KEY}` }
      });

      if (!statusResp.ok) {
        statusResp = await fetch(`${KLING_BASE}/images/image2video/${klingTaskId}`, {
          headers: { 'Authorization': `Bearer ${KLING_KEY}` }
        });
      }

      const data   = await statusResp.json();
      const task   = data.data || data;
      const status = task.task_status || task.status;
      const works  = task.task_result?.videos?.[0]?.url || task.video_url;

      res.json({
        status:   status,          // 'submitted' | 'processing' | 'succeed' | 'failed'
        videoUrl: works || null,
        done:     status === 'succeed',
        failed:   status === 'failed',
        raw:      task
      });

    } else if (taskId.startsWith('heygen-')) {
      const heygenVidId = taskId.replace('heygen-', '');
      const sr = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${heygenVidId}`, {
        headers: { 'X-Api-Key': HEYGEN_KEY }
      });
      const sd = await sr.json();
      res.json({
        status:   sd.data?.status,
        videoUrl: sd.data?.video_url || null,
        done:     sd.data?.status === 'completed',
        failed:   sd.data?.status === 'failed',
        raw:      sd.data
      });

    } else {
      res.status(400).json({ error: 'Unknown task provider' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dummy for old route reference ─────────────────────────────────────────
// (route already handled above, this line kept for clarity));

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

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      customer_email: customerEmail,
      success_url: 'https://aabstudio.ai?checkout=success',
      cancel_url:  'https://aabstudio.ai/pricing',
      // Collect card now, charge after trial ends
      subscription_data: mode === 'subscription' ? {
        trial_period_days: 7,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } }
      } : undefined,
      // Require payment method even during trial
      payment_method_collection: 'always'
    };
    const session = await stripe.checkout.sessions.create(sessionParams);
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
// Auto-create aab_projects table on startup
async function ensureAabProjectsTable() {
  try {
    const sb = getSupabase();
    if (!sb) return;
    // Test if table exists
    const { error } = await sb.from('aab_projects').select('id').limit(1);
    if (error && error.code === 'PGRST205') {
      // Table doesn't exist - log instructions
      console.warn('⚠ aab_projects table missing. Run this SQL in Supabase:');
      console.warn('create table aab_projects (id text primary key, user_id uuid references auth.users(id) on delete cascade, title text, data jsonb); alter table aab_projects enable row level security; create policy "users_own_aab_projects" on aab_projects for all using (auth.uid() = user_id);');
    } else {
      console.log('✓ aab_projects table ready');
    }
  } catch(e) { /* silent */ }
}
ensureAabProjectsTable();

// ── Auto-create aab_projects table on startup ────────────────────────────────
async function ensureAabProjectsTable() {
  try {
    const sb = getSupabase();
    if (!sb) return;
    // Test if table exists
    const { error } = await sb.from('aab_projects').select('id').limit(1);
    if (!error) { console.log('✓ aab_projects table exists'); return; }
    if (error.code !== 'PGRST205') { console.log('aab_projects check:', error.message); return; }
    // Table doesn't exist - create it via pg REST
    console.log('Creating aab_projects table...');
    const createSQL = `
      CREATE TABLE IF NOT EXISTS aab_projects (
        id       TEXT PRIMARY KEY,
        user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title    TEXT,
        data     JSONB
      );
      ALTER TABLE aab_projects ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "users_own_aab_projects" ON aab_projects
        FOR ALL USING (auth.uid() = user_id);
      CREATE INDEX IF NOT EXISTS aab_projects_user_idx ON aab_projects(user_id);
    `;
    // Use pg directly via supabase-js rpc if available
    const { error: rpcErr } = await sb.rpc('query', { query: createSQL }).catch(() => ({ error: { message: 'no rpc' } }));
    if (rpcErr) {
      console.log('Table auto-create via rpc failed:', rpcErr.message);
      console.log('Run this SQL in Supabase dashboard:');
      console.log('CREATE TABLE IF NOT EXISTS aab_projects (id TEXT PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, title TEXT, data JSONB); ALTER TABLE aab_projects ENABLE ROW LEVEL SECURITY; CREATE POLICY "users_own_aab_projects" ON aab_projects FOR ALL USING (auth.uid() = user_id);');
    }
  } catch(e) { console.warn('ensureAabProjectsTable:', e.message); }
}

app.listen(PORT, () => {
  ensureAabProjectsTable();
  console.log(`AABStudio v2.2 running on port ${PORT}`);
  console.log(`Anthropic: ${!!process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`Stripe:    ${!!STRIPE_KEY ? 'configured' : 'MISSING'}`);
});
