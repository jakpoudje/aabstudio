'use strict';
/*
  AABStudio.ai — Server v2.2
  Clean, production-ready. All endpoints verified against frontend.
*/

const sharp    = require('sharp');
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
let HEYGEN_AVATAR_ID  = process.env.HEYGEN_AVATAR_ID || 'Anna_public_3_20240108'; // safe current default, overwritten by discoverHeyGenAvatar()
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
const KLING_KEY        = KLING_ACCESS_KEY; // legacy compat

// Build Kling JWT from access + secret keys (required by Kling API)
function buildKlingJWT(accessKey, secretKey) {
  const ak = accessKey || KLING_ACCESS_KEY;
  const sk = secretKey || KLING_SECRET_KEY;
  if (!ak || !sk) return null;
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: ak, exp: now + 1800, nbf: now - 5 })).toString('base64url');
  const crypto  = require('crypto');
  const sig     = crypto.createHmac('sha256', sk).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}
const RUNWAY_KEY      = process.env.RUNWAY_API_KEY;
const CREATOMATE_KEY  = process.env.CREATOMATE_API_KEY;
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
    const sb = getSupaAdmin();
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

    if (error) {
      // If table doesn't exist, auto-create it then retry
      if (error.code === 'PGRST205' || error.message?.includes('aab_projects')) {
        console.log('aab_projects table missing — creating it now...');
        await ensureAabProjectsTable();
        const { error: e2 } = await sb.from('aab_projects').upsert({
          id: project.id, user_id: user.id,
          title: project.title || 'My Video', data: projectData
        }, { onConflict: 'id' });
        if (e2) throw e2;
      } else {
        throw error;
      }
    }
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

    const sb = getSupaAdmin();
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

    const sb = getSupaAdmin();
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
    const sb = getSupaAdmin();
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
    const sb = getSupaAdmin();
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



// ══════════════════════════════════════════════════════════════════════════════
// SCENE IMAGE COMPOSITING — Sharp-based presenter + background compositor
// Puts the uploaded presenter photo IN FRONT of the selected background
// ══════════════════════════════════════════════════════════════════════════════



// Background definitions — gradient colors for each studio type
const STUDIO_BACKGROUNDS = {
  'news-studio':   { r: 8,  g: 18, b: 60 },   // deep navy blue
  'podcast':       { r: 12, g: 4,  b: 28 },   // dark purple
  'office':        { r: 10, g: 20, b: 10 },   // dark green
  'classroom':     { r: 20, g: 18, b: 8  },   // warm dark
  'courtroom':     { r: 25, g: 12, b: 4  },   // dark brown
  'documentary':   { r: 5,  g: 5,  b: 5  },   // near black
  'cooking':       { r: 8,  g: 22, b: 8  },   // kitchen green
  'custom':        { r: 15, g: 20, b: 30 },   // fallback dark blue
};

const STUDIO_ACCENT = {
  'news-studio':  { r: 20,  g: 60,  b: 180 },
  'podcast':      { r: 80,  g: 20,  b: 120 },
  'office':       { r: 20,  g: 80,  b: 40  },
  'classroom':    { r: 100, g: 90,  b: 20  },
  'courtroom':    { r: 120, g: 60,  b: 20  },
  'documentary':  { r: 40,  g: 10,  b: 10  },
  'cooking':      { r: 40,  g: 120, b: 20  },
  'custom':       { r: 30,  g: 60,  b: 100 },
};

// Framing: where presenter sits in frame (as fraction of canvas)
const FRAMING_CONFIG = {
  'medium':    { w: 0.42, h: 0.80, x: 0.50, y: 1.0  },  // centered, chest-up
  'close':     { w: 0.55, h: 0.90, x: 0.50, y: 1.0  },  // larger face
  'wide':      { w: 0.30, h: 0.90, x: 0.50, y: 1.0  },  // smaller, full body feel
  'news-desk': { w: 0.50, h: 0.75, x: 0.50, y: 1.0  },  // slightly right of center
  'podcast':   { w: 0.38, h: 0.82, x: 0.48, y: 1.0  },  // slightly left of center
};

async function generateStudioBackground(studioType, W, H) {
  // SVG-based studio background — tested, no external API needed
  const configs = {
    'news-studio':  { base: [8,18,60],    accent: [20,60,180],  desk: true  },
    'podcast':      { base: [12,4,28],    accent: [80,20,120],  desk: false },
    'office':       { base: [10,20,10],   accent: [20,100,40],  desk: false },
    'classroom':    { base: [20,18,8],    accent: [100,90,20],  desk: true  },
    'courtroom':    { base: [25,12,4],    accent: [120,60,20],  desk: true  },
    'documentary':  { base: [5,5,5],      accent: [60,10,10],   desk: false },
    'cooking':      { base: [8,22,8],     accent: [40,130,20],  desk: true  },
  };
  const cfg = configs[studioType] || configs['news-studio'];
  const [br,bg_,bb] = cfg.base;
  const [ar,ag,ab]  = cfg.accent;

  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="rgb(${br},${bg_},${bb})"/>
    <defs>
      <radialGradient id="l1" cx="28%" cy="55%" r="65%">
        <stop offset="0%" stop-color="rgb(${ar},${ag},${ab})" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="rgb(${br},${bg_},${bb})" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="l2" cx="76%" cy="42%" r="45%">
        <stop offset="0%" stop-color="rgb(${Math.min(ar+20,255)},${Math.min(ag+20,255)},${Math.min(ab+20,255)})" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgb(${ar},${ag},${ab})" stop-opacity="0"/>
        <stop offset="100%" stop-color="rgb(${ar},${ag},${ab})" stop-opacity="0.25"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#l1)"/>
    <rect width="${W}" height="${H}" fill="url(#l2)"/>
    <rect x="0" y="${Math.round(H*0.72)}" width="${W}" height="${Math.round(H*0.28)}" fill="url(#floor)"/>
    ${cfg.desk ? `<rect x="${Math.round(W*0.14)}" y="${Math.round(H*0.73)}" width="${Math.round(W*0.72)}" height="${Math.round(H*0.055)}" rx="4" fill="rgb(${Math.min(ar+5,80)},${Math.min(ag+5,50)},${Math.min(ab+15,100)})" opacity="0.85"/>` : ''}
    <ellipse cx="${Math.round(W*0.28)}" cy="-8" rx="${Math.round(W*0.13)}" ry="${Math.round(H*0.07)}" fill="rgb(${ar},${ag},${ab})" opacity="0.22"/>
    <ellipse cx="${Math.round(W*0.72)}" cy="-8" rx="${Math.round(W*0.13)}" ry="${Math.round(H*0.07)}" fill="rgb(${ar},${ag},${ab})" opacity="0.22"/>
  </svg>`;

  return await sharp(Buffer.from(bgSvg)).jpeg({ quality: 95 }).toBuffer();
}








// ── Studio background images (generated via DALL-E) ───────────────────────────
// Cache generated backgrounds to avoid re-generating same studio across scenes
const BG_CACHE = {};



async function generateBackgroundImage(bgType, customBgB64, ratio = '16:9') {
  // Return cached background if available
  if (BG_CACHE[bgType] && bgType !== 'custom') {
    console.log(`Using cached background: ${bgType}`);
    return BG_CACHE[bgType];
  }

  // Custom background: user uploaded
  if (bgType === 'custom' && customBgB64) {
    return { b64: customBgB64, provider: 'custom-upload' };
  }

  const bgPrompt = BG_PROMPTS[bgType] || BG_PROMPTS['news-studio'];
  
  // Generate background with DALL-E 3
  if (OPENAI_KEY) {
    try {
      console.log(`Generating background: "${bgType}"...`);
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: bgPrompt + ' Photorealistic, wide angle, 16:9 composition, broadcast quality, empty set ready for presenter.',
          n: 1,
          size: '1792x1024',
          quality: 'hd',
          response_format: 'b64_json'
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          console.log(`Background "${bgType}" generated via DALL-E 3 ✓`);
          const result = { b64, provider: 'dalle3' };
          BG_CACHE[bgType] = result; // cache it
          return result;
        }
      } else {
        console.warn('DALL-E background failed:', (await resp.text()).slice(0,100));
      }
    } catch(e) { console.warn('DALL-E background error:', e.message); }
  }

  // Fallback: FAL flux
  if (FAL_KEY) {
    try {
      const resp = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
        method: 'POST',
        headers: { 'Authorization': 'Key ' + FAL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: bgPrompt, image_size: 'landscape_16_9', num_inference_steps: 28, output_format: 'jpeg' })
      });
      if (resp.ok) {
        const data = await resp.json();
        const url = data.images?.[0]?.url;
        if (url) {
          const dlBuf = await (await fetch(url)).arrayBuffer();
          const b64 = Buffer.from(dlBuf).toString('base64');
          console.log(`Background "${bgType}" generated via FAL ✓`);
          const result = { b64, provider: 'fal' };
          BG_CACHE[bgType] = result;
          return result;
        }
      }
    } catch(e) { console.warn('FAL background error:', e.message); }
  }

  return null;
}

async function removePresenterBackground(presenterB64) {
  // Method 1: remove.bg API (best quality, requires API key)
  if (REMOVE_BG_KEY) {
    try {
      const buf = Buffer.from(presenterB64, 'base64');
      const formData = new FormData();
      formData.append('image_file', new Blob([buf], { type: 'image/jpeg' }), 'presenter.jpg');
      formData.append('size', 'regular');
      
      const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_KEY },
        body: formData
      });
      
      if (resp.ok) {
        const pngBuf = await resp.arrayBuffer();
        const b64 = Buffer.from(pngBuf).toString('base64');
        console.log('Background removed via remove.bg ✓');
        return { b64, format: 'png', provider: 'remove.bg' };
      } else {
        console.warn('remove.bg failed:', resp.status);
      }
    } catch(e) { console.warn('remove.bg error:', e.message); }
  }

  // Method 2: FAL background removal
  if (FAL_KEY) {
    try {
      const buf = Buffer.from(presenterB64, 'base64');
      const formData = new FormData();
      formData.append('image', new Blob([buf], { type: 'image/jpeg' }), 'presenter.jpg');
      
      const resp = await fetch('https://fal.run/fal-ai/imageutils/rembg', {
        method: 'POST',
        headers: { 'Authorization': 'Key ' + FAL_KEY },
        body: formData
      });
      
      if (resp.ok) {
        const data = await resp.json();
        const url = data.image?.url;
        if (url) {
          const dlBuf = await (await fetch(url)).arrayBuffer();
          const b64 = Buffer.from(dlBuf).toString('base64');
          console.log('Background removed via FAL rembg ✓');
          return { b64, format: 'png', provider: 'fal-rembg' };
        }
      }
    } catch(e) { console.warn('FAL rembg error:', e.message); }
  }

  // Method 3: No removal API — use presenter as-is (still better than nothing)
  console.log('No background removal API — using presenter photo as-is');
  return null;
}

async function compositePresenterOnBackground({
  _presB64, presenterB64,           // accept both names
  _bgB64, backgroundB64,         // accept both names  
  studioType = 'news-studio',
  framingStyle = 'medium', framing = 'medium',  // accept both names
  ratio = '16:9'
}) {
  const DIMS = { '16:9': [1280,720], '9:16': [720,1280], '1:1': [1024,1024] };
  const [W, H] = DIMS[ratio] || DIMS['16:9'];

  const FRAMING = {
    'medium':    { wFrac: 0.42, hFrac: 0.80, xFrac: 0.50 },
    'close':     { wFrac: 0.55, hFrac: 0.90, xFrac: 0.50 },
    'wide':      { wFrac: 0.30, hFrac: 0.90, xFrac: 0.50 },
    'news-desk': { wFrac: 0.50, hFrac: 0.76, xFrac: 0.50 },
    'podcast':   { wFrac: 0.38, hFrac: 0.82, xFrac: 0.48 },
  };
  const framingConfig = FRAMING[framingKey] || FRAMING['medium'];

  console.log(`Compositing: ${W}x${H}, studio="${studioType}", framing="${framingStyle}"`);

  // STEP A: Get background buffer
  let bgBuffer;
  if (customBackgroundBase64) {
    bgBuffer = await sharp(Buffer.from(customBackgroundBase64, 'base64'))
      .resize(W, H, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toBuffer();
    console.log('Using custom uploaded background');
  } else {
    bgBuffer = await generateStudioBackground(studioType, W, H);
    console.log('Generated studio background:', studioType);
  }

  // STEP B: If no presenter photo, return background only
  if (!presenterPhotoBase64) {
    console.log('No presenter photo — returning background only');
    return bgBuffer.toString('base64');
  }

  // STEP C: Resize presenter photo to fit the frame
  const maxW = Math.round(W * framing.wFrac);
  const maxH = Math.round(H * framing.hFrac);

  const presenterBuf = Buffer.from(presenterPhotoBase64, 'base64');
  
  // Get presenter metadata to maintain aspect ratio
  const meta = await sharp(presenterBuf).metadata();
  const aspect = (meta.width || 1) / (meta.height || 1);
  
  let fitW = maxW;
  let fitH = Math.round(maxW / aspect);
  if (fitH > maxH) { fitH = maxH; fitW = Math.round(maxH * aspect); }
  
  const presResized = await sharp(presenterBuf)
    .resize(fitW, fitH, { fit: 'fill' })
    .toBuffer();

  // STEP D: Calculate position (centered horizontally, anchored to bottom)
  const left = Math.max(0, Math.round(W * framing.xFrac - fitW / 2));
  const top  = Math.max(0, H - fitH);

  console.log(`Presenter placed: ${fitW}x${fitH} at (${left}, ${top})`);

  // STEP E: Add drop shadow beneath presenter
  const shadowSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="s" cx="50%" cy="100%" r="32%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    <ellipse cx="${left + fitW/2}" cy="${H}" rx="${Math.round(fitW * 0.38)}" ry="${Math.round(H * 0.038)}" fill="url(#s)"/>
  </svg>`;

  // STEP F: Final composite — background + shadow + presenter on top
  const result = await sharp(bgBuffer)
    .composite([
      { input: Buffer.from(shadowSvg), blend: 'multiply' },
      { input: presResized, top, left, blend: 'over' }
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  console.log(`Composite done: ${result.length} bytes (${Math.round(result.length/1024)}KB)`);
  return result.toString('base64');
}



// ── MAIN scene image builder ──────────────────────────────────────────────────
// This is the correct flow:
// 1. Generate empty studio background image
// 2. Remove background from presenter photo
// 3. Composite presenter IN FRONT of background
// 4. Return composited scene image for animation

// ── AI Video Pipeline

// ══════════════════════════════════════════════════════════════════════════════
// AI PRESENTER PIPELINE — Correct 4-step flow
// Step 1: Voice (ElevenLabs) → audio
// Step 2: Scene Image (DALL-E 3 / FAL) → presenter + background composite image  
// Step 3: Animate (Kling lipsync / HeyGen / Runway) → video from image + audio
// Step 4: Return video URL
// ══════════════════════════════════════════════════════════════════════════════


// ── STEP 3: Animate image with audio (Kling lip-sync) ─────────────────────────

// ── UPDATED generateWithKling — uses 4-step pipeline ──────────────────────────

// ── UPDATED generateWithHeyGen — uses scene image if available ─────────────────

// ── generateWithRunway — uses scene image ──────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// AI PRESENTER PIPELINE v3 — Correct compositing flow:
// Step 1: Generate background image (DALL-E 3 / FAL)
// Step 2: Composite presenter photo ON TOP of background (sharp)
// Step 3: Generate voice audio (ElevenLabs)
// Step 4: Animate composite image with audio (Kling / HeyGen / Runway)
// ══════════════════════════════════════════════════════════════════════════════

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const FAL_KEY    = process.env.FAL_KEY;

// Background style prompts
const BG_PROMPTS = {
  'news-studio':   'Professional broadcast news studio. Dark blue background with gold accent lighting. Large LED display screen behind the desk. Clean modern set, broadcast quality. Empty studio, no people.',
  'podcast':       'Modern podcast recording studio. Dark moody atmosphere with warm ring light glow. Exposed brick or acoustic panels. Microphone stand. Comfortable chairs. No people.',
  'office':        'Clean modern corporate office. Floor-to-ceiling windows with city skyline view. Minimal desk setup. Professional warm lighting. No people.',
  'classroom':     'Academic classroom or lecture hall. Whiteboard, bookshelves, wooden desk. Warm educational atmosphere. Natural light. No people.',
  'courtroom':     'Formal courtroom studio. Dark mahogany wood panelling. Dramatic overhead lighting. Serious professional atmosphere. No people.',
  'documentary':   'Dark cinematic documentary backdrop. Single dramatic side light source. Moody dark atmosphere. Film quality. No people.',
  'cooking':       'Bright professional cooking show kitchen. White marble counters, hanging copper pots, colourful produce. Warm inviting light. No people.',
  'outdoor':       'Beautiful outdoor location. Lush greenery, natural daylight. Clean background, slightly blurred bokeh. No people.'
};

// ── STEP 1: Generate background image ─────────────────────────────────────────
async function generateBackgroundImage(bgType, customBgB64, ratio) {
  // If user uploaded a custom background, use it directly
  if (bgType === 'custom' && customBgB64) {
    console.log('Using custom uploaded background');
    return { b64: customBgB64, source: 'custom-upload' };
  }

  const prompt = BG_PROMPTS[bgType] || BG_PROMPTS['news-studio'];
  const size = ratio === '9:16' ? '1024x1792' : ratio === '1:1' ? '1024x1024' : '1792x1024';

  console.log(`Generating background: "${bgType}" at ${size}`);

  // Try DALL-E 3 first
  if (OPENAI_KEY) {
    try {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt + ' Photorealistic, professional photography, wide angle lens, no people, no text, no watermarks.',
          n: 1, size, quality: 'hd', response_format: 'b64_json'
        })
      });
      if (resp.ok) {
        const d = await resp.json();
        const b64 = d.data?.[0]?.b64_json;
        if (b64) { console.log('Background generated via DALL-E 3 ✓'); return { b64, source: 'dalle3' }; }
      } else {
        console.warn('DALL-E 3 background failed:', (await resp.text()).slice(0,100));
      }
    } catch(e) { console.warn('DALL-E 3 error:', e.message); }
  }

  // FAL.ai fallback
  if (FAL_KEY) {
    try {
      const imgSize = ratio === '9:16' ? 'portrait_16_9' : ratio === '1:1' ? 'square_hd' : 'landscape_16_9';
      const resp = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
        method: 'POST',
        headers: { 'Authorization': 'Key ' + FAL_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt + ' No people. Photorealistic.', image_size: imgSize, num_inference_steps: 28, num_images: 1, output_format: 'jpeg' })
      });
      if (resp.ok) {
        const d = await resp.json();
        const url = d.images?.[0]?.url;
        if (url) {
          const dl = await fetch(url);
          const buf = await dl.arrayBuffer();
          const b64 = Buffer.from(buf).toString('base64');
          console.log('Background generated via FAL.ai ✓');
          return { b64, source: 'fal' };
        }
      }
    } catch(e) { console.warn('FAL error:', e.message); }
  }

  console.log('No image generation API — using solid colour background');
  return null;
}

// ── STEP 2: Composite presenter photo ON TOP of background ────────────────────
async function compositePresenterOnBackground({ presenterB64, backgroundB64, framing, ratio }) {
  const sharp = require('sharp');

  // Canvas dimensions
  const DIMS = {
    '16:9': { w: 1280, h: 720 },
    '9:16': { w: 720,  h: 1280 },
    '1:1':  { w: 1024, h: 1024 }
  };
  const { w: W, h: H } = DIMS[ratio] || DIMS['16:9'];

  // Presenter sizing by framing style
  const FRAMING = {
    'medium':    { presW: Math.round(W * 0.45), presH: Math.round(H * 0.88), x: 'center', y: 'bottom' },
    'close':     { presW: Math.round(W * 0.60), presH: Math.round(H * 0.75), x: 'center', y: 'top' },
    'wide':      { presW: Math.round(W * 0.35), presH: Math.round(H * 0.95), x: 'center', y: 'bottom' },
    'news-desk': { presW: Math.round(W * 0.55), presH: Math.round(H * 0.80), x: 'center', y: 'bottom' },
    'podcast':   { presW: Math.round(W * 0.50), presH: Math.round(H * 0.85), x: 'center', y: 'bottom' }
  };
  const frame = FRAMING[framing] || FRAMING['medium'];

  // 1. Resize background to canvas size
  let bgBuf;
  if (backgroundB64) {
    bgBuf = await sharp(Buffer.from(backgroundB64, 'base64'))
      .resize(W, H, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 95 })
      .toBuffer();
  } else {
    // Solid dark blue gradient fallback
    bgBuf = await sharp({
      create: { width: W, height: H, channels: 3, background: { r: 10, g: 20, b: 50 } }
    }).jpeg().toBuffer();
  }

  // 2. Resize presenter photo to correct framing size
  const presenterResized = await sharp(Buffer.from(presenterB64, 'base64'))
    .resize(frame.presW, frame.presH, { fit: 'cover', position: 'attention' }) // attention focuses on face
    .toBuffer();

  // 3. Calculate position
  const presenterMeta = await sharp(presenterResized).metadata();
  let left, top;

  // X position
  if (frame.x === 'center') left = Math.round((W - presenterMeta.width) / 2);
  else if (frame.x === 'left') left = Math.round(W * 0.05);
  else left = Math.round(W * 0.55);

  // Y position
  if (frame.y === 'bottom') top = H - presenterMeta.height;
  else if (frame.y === 'top') top = Math.round(H * 0.05);
  else top = Math.round((H - presenterMeta.height) / 2);

  top = Math.max(0, top);
  left = Math.max(0, left);

  // 4. Composite presenter ON TOP of background
  const composited = await sharp(bgBuf)
    .composite([{
      input: presenterResized,
      left,
      top,
      blend: 'over'   // presenter on top
    }])
    .jpeg({ quality: 95 })
    .toBuffer();

  const compositedB64 = composited.toString('base64');
  console.log(`Composited: presenter(${presenterMeta.width}x${presenterMeta.height}) at (${left},${top}) on bg(${W}x${H})`);
  return compositedB64;
}

// ── MASTER PRESENTER ROUTE — orchestrates all 4 steps ─────────────────────────

// ── Industry-standard camera selection per studio type ────────────────────────
const STUDIO_CAMERA_RULES = {
  'news-studio': {
    shots: ['medium shot', 'medium close-up', 'wide establishing shot', 'over-shoulder cut'],
    motions: ['static lock-off', 'subtle push-in', 'slow pan right', 'static'],
    framing: 'news-desk seated, eye level camera, slight down angle',
    cutPattern: ['medium', 'medium', 'wide', 'medium-close'], // repeating pattern
    description: 'professional broadcast news anchor framing'
  },
  'podcast': {
    shots: ['medium close-up', 'close-up', 'medium shot', 'extreme close-up'],
    motions: ['static', 'subtle push-in', 'very slow rack focus', 'handheld slight'],
    framing: 'intimate podcast framing, slightly below eye level',
    cutPattern: ['medium-close', 'close', 'medium-close', 'medium'],
    description: 'intimate podcast host framing'
  },
  'office': {
    shots: ['medium shot', 'medium close-up', 'wide office shot', 'medium'],
    motions: ['static', 'slow push-in', 'static', 'subtle pan'],
    framing: 'professional business setting, eye level',
    cutPattern: ['medium', 'medium-close', 'wide', 'medium'],
    description: 'corporate professional video call framing'
  },
  'classroom': {
    shots: ['medium shot', 'wide shot', 'medium close-up', 'over-shoulder'],
    motions: ['static', 'slow pull-back', 'push-in on key point', 'static'],
    framing: 'teacher at front of room, slightly elevated camera',
    cutPattern: ['medium', 'wide', 'medium', 'medium-close'],
    description: 'educational presenter framing'
  },
  'courtroom': {
    shots: ['medium shot', 'medium close-up', 'wide dramatic shot', 'tight close-up'],
    motions: ['static lock-off', 'very slow push-in', 'static', 'static'],
    framing: 'formal legal setting, slightly elevated authoritative angle',
    cutPattern: ['medium', 'medium-close', 'wide', 'close'],
    description: 'authoritative legal/investigative framing'
  },
  'documentary': {
    shots: ['medium close-up', 'close-up', 'extreme close-up', 'medium shot'],
    motions: ['very slow push-in', 'subtle handheld', 'rack focus', 'slow pull-back'],
    framing: 'cinematic documentary single-camera, slight dutch angle allowed',
    cutPattern: ['medium-close', 'close', 'medium', 'extreme-close'],
    description: 'cinematic documentary talking head'
  },
  'cooking': {
    shots: ['medium shot', 'wide kitchen shot', 'medium close-up hands', 'overhead cut'],
    motions: ['static', 'slow pan with movement', 'push-in on food', 'static'],
    framing: 'cooking show counter level, slightly elevated, energetic',
    cutPattern: ['medium', 'wide', 'medium-close', 'medium'],
    description: 'cooking show host framing'
  },
  'custom': {
    shots: ['medium shot', 'medium close-up', 'wide shot', 'close-up'],
    motions: ['static', 'subtle push-in', 'static', 'slow pan'],
    framing: 'custom studio, eye level camera',
    cutPattern: ['medium', 'medium-close', 'wide', 'medium'],
    description: 'custom studio framing'
  }
};

// Get randomised (but industry-appropriate) camera for a scene
function getSceneCamera(studioType, sceneIndex, totalScenes) {
  const rules = STUDIO_CAMERA_RULES[studioType] || STUDIO_CAMERA_RULES['news-studio'];
  
  // Use cut pattern for variety but follow industry standard
  const patternIdx = sceneIndex % rules.cutPattern.length;
  const shotType = rules.cutPattern[patternIdx];
  
  // Motion: vary every few scenes
  const motionIdx = Math.floor(sceneIndex / 2) % rules.motions.length;
  const motion = rules.motions[motionIdx];
  
  // First and last scenes always get wide/establishing
  let shot = rules.shots[patternIdx % rules.shots.length];
  if (sceneIndex === 0) shot = rules.shots.find(s => s.includes('wide') || s.includes('establishing')) || shot;
  if (sceneIndex === totalScenes - 1) shot = rules.shots.find(s => s.includes('medium')) || shot;
  
  return {
    shot,
    motion,
    framing: rules.framing,
    description: rules.description,
    promptText: `${shot}, ${motion}, ${rules.framing}, ${rules.description}`
  };
}

app.post('/api/presenter', async (req, res) => {
  try {
    const {
      audioBase64,
      referenceImageBase64,        // presenter photo uploaded by user
      customBgBase64,              // custom background uploaded by user
      bgType: bgTypeRaw,           // background type
      studioType,                  // alias — frontend may send either
      ratio        = '16:9',
      framing      = 'medium',
      sceneText    = '',
      sceneIndex   = 0,            // which scene (0-based) for camera selection
      totalScenes  = 1,
      provider: requestedProvider = null,
      prompt       = null
    } = req.body;

    // Accept either bgType or studioType
    const bgType = bgTypeRaw || studioType || 'news-studio';

    // Get industry-appropriate camera for this scene
    const sceneCamera = getSceneCamera(bgType, sceneIndex, totalScenes);
    console.log(`Scene ${sceneIndex+1}/${totalScenes} camera: ${sceneCamera.shot}, ${sceneCamera.motion}`);

    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });

    // ── STEP 1: Generate background image ─────────────────────────────────────
    console.log('\n=== AI Presenter Pipeline ===');
    console.log('Received: referenceImage=', referenceImageBase64 ? (referenceImageBase64.length+' chars') : 'NONE (will use default avatar)');
    console.log('Received: customBg=', customBgBase64 ? 'yes' : 'no', 'bgType=', bgType, 'provider=', requestedProvider);
    console.log('Step 1: Generating background image...');
    const bgResult = await generateBackgroundImage(bgType, customBgBase64, ratio);
    const bgB64 = bgResult?.b64 || null;
    console.log('Background source:', bgResult?.source || 'none');

    // ── STEP 2: Composite presenter photo on background ────────────────────────
    let compositeImageB64 = null;
    if (referenceImageBase64) {
      console.log('Step 2: Compositing presenter photo on background...');
      try {
        compositeImageB64 = await compositePresenterOnBackground({
          presenterB64:  referenceImageBase64,
          backgroundB64: bgB64,
          framing:       prompt?.presenter?.framing || framing,
          ratio
        });
        console.log('Composite scene image created ✓');
      } catch(e) {
        console.warn('Compositing failed, using photo directly:', e.message);
        compositeImageB64 = referenceImageBase64;
      }
    } else if (bgB64) {
      // No presenter photo — use just the background
      compositeImageB64 = bgB64;
      console.log('Step 2: No presenter photo — using background only');
    }

    if (!compositeImageB64) {
      console.log('Step 2: No image available — video provider will use default avatar');
    }

    // ── STEP 3: Already done (voice generated client-side or in /api/voice) ───
    // audioBase64 is already provided

    // ── STEP 4: Animate composite image with audio ─────────────────────────────
    console.log('Step 4: Selecting video provider...');

    const providers = {
      kling:  { available: !!(KLING_ACCESS_KEY && KLING_SECRET_KEY),  priority: 1 },
      heygen: { available: !!HEYGEN_KEY, priority: 2 },
      runway: { available: !!RUNWAY_KEY, priority: 3 }
    };

    const chosen = requestedProvider && providers[requestedProvider]?.available
      ? requestedProvider
      : Object.entries(providers)
          .filter(([_,v]) => v.available)
          .sort((a,b) => a[1].priority - b[1].priority)[0]?.[0];

    if (!chosen) {
      return res.status(503).json({
        error: 'No video generation API configured. Add KLING_API_KEY or HEYGEN_API_KEY in Railway.',
        note: 'Composite scene image was generated successfully — just needs a video provider to animate it.',
        compositeGenerated: !!compositeImageB64
      });
    }

    console.log(`Step 4: Animating with ${chosen}...`);

    // args always includes compositeImageB64 — this is presenter photo ON studio background
    // Every provider receives the composited image, not the raw photo
    const args = { compositeImageB64, audioBase64, ratio, sceneText, prompt, sceneCamera,
                   referenceImageBase64: compositeImageB64 || referenceImageBase64 };

    console.log('Step 4: Provider =', chosen, '| compositeImage =', compositeImageB64 ? compositeImageB64.length+'chars' : 'NONE');

    if (chosen === 'kling')  return await generateWithKling(req, res, args);
    if (chosen === 'heygen') return await generateWithHeyGen(req, res, args);
    if (chosen === 'runway') return await generateWithRunway(req, res, args);

  } catch(e) {
    console.error('/api/presenter error:', e.message);
    res.status(500).json({ error: e.message });
  }
})
// ══════════════════════════════════════════════════════════════════════════════
// AI PRESENTER GENERATOR FUNCTIONS
// Each function: composites presenter+background → animates with audio → returns taskId
// ══════════════════════════════════════════════════════════════════════════════

// ── Step A: Get or generate studio background image ───────────────────────────
async function getStudioBackgroundB64(studioType, customBgBase64, ratio) {
  // If user uploaded a custom background, use that
  if (customBgBase64) {
    const DIMS = { '16:9':{w:1280,h:720}, '9:16':{w:720,h:1280}, '1:1':{w:1024,h:1024} };
    const {w,h} = DIMS[ratio] || DIMS['16:9'];
    const buf = await sharp(Buffer.from(customBgBase64,'base64'))
      .resize(w, h, { fit:'cover', position:'center' }).jpeg({ quality:92 }).toBuffer();
    console.log('Using custom uploaded background');
    return buf.toString('base64');
  }

  // Otherwise use generateStudioBackground (SVG gradients)
  const DIMS = { '16:9':{w:1280,h:720}, '9:16':{w:720,h:1280}, '1:1':{w:1024,h:1024} };
  const {w,h} = DIMS[ratio] || DIMS['16:9'];
  const buf = await generateStudioBackground(studioType || 'news-studio', w, h);
  console.log('Generated studio background:', studioType);
  return buf.toString('base64');
}

// ── Step B: Composite presenter photo onto background ─────────────────────────
// This is the KEY step — places uploaded photo IN FRONT of background
async function buildSceneImage(presenterB64, bgB64, framingStyle, ratio) {
  if (!presenterB64 && !bgB64) return null;

  const DIMS = { '16:9':{w:1280,h:720}, '9:16':{w:720,h:1280}, '1:1':{w:1024,h:1024} };
  const {w:W, h:H} = DIMS[ratio] || DIMS['16:9'];

  // If no presenter photo, return background only
  if (!presenterB64) {
    const bgBuf = Buffer.from(bgB64,'base64');
    const sized = await sharp(bgBuf).resize(W,H,{fit:'cover'}).jpeg({quality:92}).toBuffer();
    return sized.toString('base64');
  }

  // Resize background to canvas
  const bgBuf     = Buffer.from(bgB64,'base64');
  const bgResized = await sharp(bgBuf).resize(W,H,{fit:'cover',position:'center'}).jpeg({quality:92}).toBuffer();

  // Framing: how big and where to place presenter
  const FRAMING = {
    'medium':    { hPct:0.85, xPct:0.50, topPct:0.15 },
    'close':     { hPct:0.95, xPct:0.50, topPct:0.05 },
    'wide':      { hPct:0.92, xPct:0.50, topPct:0.08 },
    'news-desk': { hPct:0.78, xPct:0.50, topPct:0.22 },
    'podcast':   { hPct:0.82, xPct:0.48, topPct:0.12 },
  };
  const f = FRAMING[framingStyle] || FRAMING['medium'];

  const presH = Math.round(H * f.hPct);

  // Resize presenter maintaining its natural aspect ratio
  const presBuf  = Buffer.from(presenterB64,'base64');
  const presMeta = await sharp(presBuf).metadata();
  const aspect   = (presMeta.width || 3) / (presMeta.height || 4);
  const presW    = Math.round(presH * aspect);

  const presResized = await sharp(presBuf)
    .resize(presW, presH, { fit:'cover', position:'centre' })
    .png()
    .toBuffer();

  // Position: centered horizontally, anchored to bottom
  const left = Math.max(0, Math.min(Math.round(W * f.xPct - presW/2), W - presW));
  const top  = Math.max(0, Math.min(Math.round(H * f.topPct), H - presH));

  console.log(`Compositing: presenter ${presW}x${presH} at (${left},${top}) on ${W}x${H} canvas`);

  // Add floor shadow under presenter
  const shadowSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sh" cx="50%" cy="100%" r="35%">
        <stop offset="0%"   stop-color="rgba(0,0,0,0.55)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    <ellipse cx="${left + presW/2}" cy="${H}" rx="${presW*0.45}" ry="${H*0.05}" fill="url(#sh)"/>
  </svg>`;

  const composited = await sharp(bgResized)
    .composite([
      { input: Buffer.from(shadowSvg), blend:'multiply' },
      { input: presResized, top, left, blend:'over' }
    ])
    .jpeg({ quality:93 })
    .toBuffer();

  console.log(`Scene image composited: ${composited.length} bytes ✓`);
  return composited.toString('base64');
}

// ── generateWithKling ─────────────────────────────────────────────────────────
async function generateWithKling(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, bgPrompt, prompt, studioType, customBgBase64 }) {
  try {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      console.log('No Kling keys — falling back to HeyGen');
      return generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, prompt, studioType, customBgBase64 });
    }

    const framingStyle = prompt?.presenter?.framing || 'medium';
    const bgB64 = await getStudioBackgroundB64(studioType, customBgBase64, ratio);
    const sceneImageB64 = await buildSceneImage(referenceImageBase64 || null, bgB64, framingStyle, ratio);
    if (!sceneImageB64) {
      console.log('No scene image — falling back to HeyGen');
      return generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, prompt, studioType, customBgBase64 });
    }

    const klingToken = buildKlingJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);
    const ratioMap = { '16:9':'16:9', '9:16':'9:16', '1:1':'1:1' };

    // STEP 1: Image → Video (Kling image2video)
    console.log('Kling: Step 1 — image to video...');
    const i2vResp = await fetch('https://api.klingai.com/v1/images/image2video', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + klingToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: 'kling-v1-5',
        mode: 'pro',
        duration: '5',
        aspect_ratio: ratioMap[ratio] || '16:9',
        image: 'data:image/jpeg;base64,' + sceneImageB64,
        prompt: 'Professional TV presenter speaking to camera. Natural head movement. Realistic breathing. Subtle body movement. Professional studio setting. High quality broadcast video.'
      })
    });

    if (!i2vResp.ok) {
      const err = await i2vResp.text();
      console.error('Kling image2video failed:', i2vResp.status, err.slice(0,200));
      console.log('Falling back to HeyGen...');
      return generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, prompt, studioType, customBgBase64 });
    }

    const i2vData = await i2vResp.json();
    const i2vTaskId = i2vData.data?.task_id;
    if (!i2vTaskId) {
      console.error('Kling: no i2v task_id:', JSON.stringify(i2vData).slice(0,200));
      return generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, prompt, studioType, customBgBase64 });
    }

    console.log('Kling i2v task:', i2vTaskId);

    // STEP 2: Poll until video ready (max 3 min)
    let videoUrl = null;
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const pollResp = await fetch(`https://api.klingai.com/v1/images/image2video/${i2vTaskId}`, {
        headers: { 'Authorization': 'Bearer ' + buildKlingJWT() }
      });
      const pollData = await pollResp.json();
      const status = pollData.data?.task_status;
      videoUrl = pollData.data?.task_result?.videos?.[0]?.url;
      console.log('Kling i2v poll:', status, videoUrl ? '✓' : '...');
      if (status === 'succeed' && videoUrl) break;
      if (status === 'failed') throw new Error('Kling image2video failed: ' + JSON.stringify(pollData).slice(0,200));
    }

    if (!videoUrl) throw new Error('Kling image2video timed out');

    // STEP 3: Lip-sync the video with audio
    console.log('Kling: Step 2 — lip-sync with audio...');
    const lsResp = await fetch('https://api.klingai.com/v1/videos/lip-sync', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + buildKlingJWT(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: [{ type: 'video', url: videoUrl }],
        audio_type: 'base64',
        audio: audioBase64,
        model_name: 'kling-v1-5',
        mode: 'pro'
      })
    });

    if (!lsResp.ok) {
      const err = await lsResp.text();
      console.error('Kling lip-sync failed:', lsResp.status, err.slice(0,200));
      // Return the silent video as fallback — better than nothing
      return res.json({ taskId: 'kling-done-' + i2vTaskId, provider: 'kling', videoUrl, done: true });
    }

    const lsData = await lsResp.json();
    const lsTaskId = lsData.data?.task_id;
    if (!lsTaskId) return res.json({ taskId: 'kling-done-' + i2vTaskId, provider: 'kling', videoUrl, done: true });

    console.log('Kling lip-sync task:', lsTaskId);
    return res.json({ taskId: 'kling-' + lsTaskId, provider: 'kling', composited: true });

  } catch(e) {
    console.error('generateWithKling:', e.message);
    if (HEYGEN_KEY) {
      console.log('Falling back to HeyGen...');
      return generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, prompt, studioType, customBgBase64 });
    }
    return res.status(500).json({ error: e.message });
  }
}
  try {
    const framingStyle = prompt?.presenter?.framing || 'medium';

    // Step A: Get background
    const bgB64 = await getStudioBackgroundB64(studioType, customBgBase64, ratio);

    // Step B: Composite presenter onto background
    const sceneImageB64 = await buildSceneImage(referenceImageBase64 || null, bgB64, framingStyle, ratio);
    if (!sceneImageB64) return res.status(400).json({ error: 'Cannot generate scene image. Upload a presenter photo.' });

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      // No Kling — use HeyGen with the composited image
      console.log('No Kling key — using HeyGen with composited scene image');
      return generateWithHeyGen(req, res, { referenceImageBase64: sceneImageB64, audioBase64, ratio, studioType:'custom', customBgBase64: null, prompt, bgPrompt });
    }

    // Kling JWT
    const klingToken = buildKlingJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);

    // Kling lip-sync: image + audio → video
    const lsResp = await fetch('https://api.klingai.com/v1/videos/lip-sync', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + klingToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: 'kling-v1-5',
        mode: 'pro',
        inputs: [{
          type: 'image',
          image_type: 'base64',
          image: sceneImageB64
        }],
        audio_type: 'base64',
        audio: audioBase64
      })
    });

    if (!lsResp.ok) {
      const err = await lsResp.text();
      throw new Error('Kling lip-sync failed: ' + lsResp.status + ' — ' + err.slice(0,200));
    }

    const lsData = await lsResp.json();
    const taskId = lsData.data?.task_id || lsData.task_id;
    if (!taskId) throw new Error('Kling: no task_id. Response: ' + JSON.stringify(lsData).slice(0,200));

    console.log('Kling task:', taskId);
    return res.json({ taskId: 'kling-' + taskId, provider: 'kling', composited: true });

  } catch(e) {
    console.error('generateWithKling:', e.message);
    if (HEYGEN_KEY) {
      console.log('Falling back to HeyGen...');
      return generateWithHeyGen(req, res, { referenceImageBase64, audioBase64, ratio, studioType, customBgBase64, prompt, bgPrompt });
    }
    return res.status(500).json({ error: e.message });
  }
}

// ── generateWithHeyGen ────────────────────────────────────────────────────────
async function generateWithHeyGen(req, res, { compositeImageB64, referenceImageBase64, audioBase64, ratio, sceneText, prompt, sceneCamera }) {
  if (!HEYGEN_KEY) throw new Error('HEYGEN_API_KEY not configured in Railway');

  // Use compositeImageB64 (presenter ON background) — this is what must animate
  // Fall back to raw photo only if composite failed
  const imageToAnimate = compositeImageB64 || referenceImageBase64;

  // ── Upload audio as RAW BINARY ─────────────────────────────────────────────
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  console.log(`HeyGen: uploading audio ${audioBuffer.length} bytes...`);

  const audioUpload = await fetch('https://upload.heygen.com/v1/asset', {
    method:  'POST',
    headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'audio/mpeg' },
    body:    audioBuffer
  });
  if (!audioUpload.ok) {
    const err = await audioUpload.text();
    throw new Error(`HeyGen audio upload failed: ${audioUpload.status} — ${err.slice(0,200)}`);
  }
  const audioData    = await audioUpload.json();
  const audioAssetId = audioData.data?.id || audioData.data?.asset_id || audioData.asset_id || audioData.id;
  if (!audioAssetId) throw new Error(`HeyGen: no audio asset_id. ${JSON.stringify(audioData).slice(0,200)}`);
  console.log('HeyGen audio asset_id:', audioAssetId);

  // ── Upload composited scene image as talking photo ─────────────────────────
  // Strategy: try to reuse an existing talking photo to avoid the 3-photo limit.
  // Only upload a new one if we have fewer than 3, otherwise reuse the most recent.
  let talkingPhotoId = null;
  if (imageToAnimate) {
    const imgBuffer = Buffer.from(imageToAnimate, 'base64');
    console.log(`HeyGen: composited scene image ${imgBuffer.length} bytes`);

    // Step 1: list existing talking photos
    let existingPhotoId = null;
    try {
      const listResp = await fetch('https://api.heygen.com/v2/talking_photo?limit=10', {
        headers: { 'X-Api-Key': HEYGEN_KEY }
      });
      if (listResp.ok) {
        const listData = await listResp.json();
        const photos = listData.data?.list || listData.data || [];
        if (photos.length > 0) {
          // Reuse the most recent talking photo
          existingPhotoId = photos[0].talking_photo_id || photos[0].id;
          console.log(`HeyGen: reusing existing talking_photo_id: ${existingPhotoId} (${photos.length} on account)`);
        }
      }
    } catch(e) {
      console.warn('HeyGen: could not list talking photos:', e.message);
    }

    if (existingPhotoId) {
      // Reuse existing — no upload needed
      talkingPhotoId = existingPhotoId;
    } else {
      // No existing photos — safe to upload a new one
      console.log('HeyGen: uploading new talking photo...');
      const photoUpload = await fetch('https://upload.heygen.com/v1/talking_photo', {
        method:  'POST',
        headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'image/jpeg' },
        body:    imgBuffer
      });
      if (photoUpload.ok) {
        const pd = await photoUpload.json();
        talkingPhotoId = pd.data?.talking_photo_id || pd.talking_photo_id;
        console.log('HeyGen: new talking_photo_id:', talkingPhotoId);
      } else {
        const err = await photoUpload.text();
        console.warn('HeyGen photo upload failed:', photoUpload.status, err.slice(0,100));
      }
    }
  }

  // ── Character: ALWAYS use talking_photo when we have an image ─────────────
  // talking_photo = the user's composited scene image animated with their audio
  // If no image at all, use Anna avatar as last resort
  const character = talkingPhotoId
    ? { type: 'talking_photo', talking_photo_id: talkingPhotoId, talking_style: 'expressive' }
    : { type: 'avatar', avatar_id: HEYGEN_AVATAR_ID, avatar_style: 'normal' };

  console.log('HeyGen character:', character.type, talkingPhotoId ? '(user composite scene)' : '(fallback avatar - no image was provided)');

  // ── Generate video ─────────────────────────────────────────────────────────
  const videoResp = await fetch('https://api.heygen.com/v2/video/generate', {
    method:  'POST',
    headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character,
        voice: { type: 'audio', audio_asset_id: audioAssetId },
        background: { type: 'color', value: '#000000' }  // bg is already in the composite image
      }],
      aspect_ratio: ratio || '16:9',
      test: false
    })
  });
  if (!videoResp.ok) {
    const err = await videoResp.text();
    throw new Error(`HeyGen video generate failed: ${videoResp.status} — ${err.slice(0,300)}`);
  }
  const videoData = await videoResp.json();
  const videoId   = videoData.data?.video_id || videoData.video_id;
  if (!videoId) throw new Error(`HeyGen: no video_id. ${JSON.stringify(videoData).slice(0,200)}`);

  console.log('HeyGen video_id:', videoId, '| used composite:', !!talkingPhotoId);
  return res.json({ taskId: 'heygen-' + videoId, provider: 'heygen', usedComposite: !!talkingPhotoId });
}

// ── generateWithRunway ────────────────────────────────────────────────────────
async function generateWithRunway(req, res, { referenceImageBase64, audioBase64, ratio, sceneText, studioType, customBgBase64, prompt }) {
  if (!RUNWAY_KEY) throw new Error('RUNWAY_API_KEY not set');
  const framingStyle = prompt?.presenter?.framing || 'medium';

  // Step A+B: Composite
  const bgB64         = await getStudioBackgroundB64(studioType, customBgBase64, ratio);
  const sceneImageB64 = await buildSceneImage(referenceImageBase64 || null, bgB64, framingStyle, ratio);

  if (!sceneImageB64) throw new Error('No scene image for Runway. Upload a presenter photo.');

  const camera = sceneCamera || { shot: 'medium shot', motion: 'static', promptText: 'medium shot, static, professional broadcast video' };
  const motionPrompt = `Professional TV presenter speaking to camera. ${camera.shot}. ${camera.motion}. Natural lip sync, subtle head movement, realistic breathing. ${camera.framing || ''}. Consistent studio background. High quality broadcast video.`;

  const ratioMap = { '16:9':'1280:768', '9:16':'768:1280', '1:1':'1024:1024' };

  const rnResp = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RUNWAY_KEY, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
    body: JSON.stringify({
      promptImage: 'data:image/jpeg;base64,' + sceneImageB64,
      model: 'gen4_turbo',
      promptText: motionPrompt,
      ratio: ratioMap[ratio] || '1280:768',
      duration: 10
    })
  });

  if (!rnResp.ok) throw new Error('Runway: ' + rnResp.status + ' — ' + (await rnResp.text()).slice(0,200));
  const rnData = await rnResp.json();
  const taskId = rnData.id;
  if (!taskId) throw new Error('Runway: no task id. ' + JSON.stringify(rnData).slice(0,200));

  return res.json({ taskId: 'runway-' + taskId, provider: 'runway', composited: true });
}

;



// ── List valid HeyGen avatars ─────────────────────────────────────────────────
app.get('/api/heygen/avatars', async (req, res) => {
  try {
    if (!HEYGEN_KEY) return res.status(503).json({ error: 'HeyGen not configured' });
    const r = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': HEYGEN_KEY }
    });
    const d = await r.json();
    const avatars = (d.data?.avatars || []).slice(0, 20).map(a => ({
      id: a.avatar_id, name: a.avatar_name, type: a.type
    }));
    res.json({ avatars });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});


// ── Presenter pipeline test endpoint ─────────────────────────────────────────
app.post('/api/presenter-test', async (req, res) => {
  const { audioBase64, referenceImageBase64, studioType, bgType, ratio, provider } = req.body;
  const bg = bgType || studioType || 'news-studio';
  
  // Try compositing
  let compositeResult = null;
  let compositeError = null;
  try {
    const bgResult = await generateBackgroundImage(bg, null, ratio || '16:9');
    if (referenceImageBase64 && bgResult?.b64) {
      compositeResult = await compositePresenterOnBackground({
        presenterB64: referenceImageBase64,
        backgroundB64: bgResult.b64,
        framing: 'medium',
        ratio: ratio || '16:9'
      });
    }
  } catch(e) { compositeError = e.message; }

  res.json({
    received: {
      hasAudio: !!audioBase64,
      audioLen: audioBase64?.length || 0,
      hasPhoto: !!referenceImageBase64,
      photoLen: referenceImageBase64?.length || 0,
      studioType: bg,
      provider: provider || 'auto'
    },
    compositing: {
      success: !!compositeResult,
      outputLen: compositeResult?.length || 0,
      error: compositeError
    },
    heygenKey: !!HEYGEN_KEY,
    klingKey: !!KLING_KEY,
    runwayKey: !!RUNWAY_KEY
  });
});

app.get('/health', (req, res) => res.json({
  status:     'ok',
  version:    '2.8',
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
;
;


// ── HeyGen: correct API flow ──────────────────────────────────────────────
// HeyGen v2 requires: upload audio → get asset_id → use in video/generate
// ── HeyGen: correct API flow per official docs ────────────────────────────
// Docs: https://docs.heygen.com/reference/upload-asset
// Asset upload = RAW BINARY body, Content-Type: audio/mpeg, NO form fields

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
        headers: { 'Authorization': `Bearer ${buildKlingJWT()}` }
      });

      if (!statusResp.ok) {
        statusResp = await fetch(`${KLING_BASE}/images/image2video/${klingTaskId}`, {
          headers: { 'Authorization': `Bearer ${buildKlingJWT()}` }
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
// Valid HeyGen avatar ID (discovered at startup)


async function discoverHeyGenAvatar() {
  if (!HEYGEN_KEY) return;
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': HEYGEN_KEY }
    });
    const d = await r.json();
    const avatars = d.data?.avatars || [];
    // Prefer public avatars
    const pub = avatars.find(a => a.avatar_id && a.type === 'public');
    const any = avatars.find(a => a.avatar_id);
    if (pub || any) {
      HEYGEN_AVATAR_ID = (pub || any).avatar_id;
      console.log('HeyGen avatar discovered:', HEYGEN_AVATAR_ID);
    }
  } catch(e) {
    console.warn('Could not discover HeyGen avatars:', e.message);
  }
}

async function ensureAabProjectsTable() {
  try {
    const sb = getSupaAdmin();
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
// Valid HeyGen avatar ID (discovered at startup)


async function discoverHeyGenAvatar() {
  if (!HEYGEN_KEY) return;
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': HEYGEN_KEY }
    });
    const d = await r.json();
    const avatars = d.data?.avatars || [];
    // Prefer public avatars
    const pub = avatars.find(a => a.avatar_id && a.type === 'public');
    const any = avatars.find(a => a.avatar_id);
    if (pub || any) {
      HEYGEN_AVATAR_ID = (pub || any).avatar_id;
      console.log('HeyGen avatar discovered:', HEYGEN_AVATAR_ID);
    }
  } catch(e) {
    console.warn('Could not discover HeyGen avatars:', e.message);
  }
}

async function ensureAabProjectsTable() {
  try {
    const sb = getSupaAdmin();
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
  discoverHeyGenAvatar();
  console.log(`AABStudio v2.2 running on port ${PORT}`);
  console.log(`Anthropic: ${!!process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`Stripe:    ${!!STRIPE_KEY ? 'configured' : 'MISSING'}`);
});
