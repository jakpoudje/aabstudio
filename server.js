'use strict';
/*
  AABStudio.ai — Server v3.4
  Fixed:
  - HeyGen AV4: correct payload structure (audio_asset_id at top level, not in voice)
  - HeyGen v2 fallback: don't use image_key as background (different asset type)
  - PiAPI/Kling: base64 image sent correctly using data URI
*/
const sharp    = require('sharp');
const express  = require('express');
const cors     = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const PORT = process.env.PORT || 3000;

const corsOpts = { origin:'*', methods:['GET','POST','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization'] };
app.use(cors(corsOpts));
app.options('*', cors(corsOpts));

app.post('/api/stripe/webhook', express.raw({ type:'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.json({ received: true });
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event  = stripe.webhooks.constructEvent(req.body, sig, secret);
    const obj    = event.data.object;
    if (event.type === 'checkout.session.completed') {
      const email   = obj.customer_email || obj.customer_details?.email;
      const priceId = obj.line_items?.data?.[0]?.price?.id;
      const plan    = PRICE_TO_PLAN[priceId] || 'creator';
      if (email) await updateUserPlan(email, plan);
    }
    if (event.type === 'customer.subscription.deleted') {
      const s2 = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const c  = await s2.customers.retrieve(obj.customer);
      if (c.email) await updateUserPlan(c.email, 'free');
    }
    res.json({ received: true });
  } catch(e) { res.status(400).send('Webhook error: ' + e.message); }
});

app.use(express.json({ limit: '25mb' }));

function getSupaAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || 'https://phjlxkyloafogznhyyig.supabase.co',
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_CREATOR]:        'creator',
  [process.env.STRIPE_PRICE_CREATOR_ANNUAL]: 'creator',
  [process.env.STRIPE_PRICE_STUDIO]:         'studio',
  [process.env.STRIPE_PRICE_STUDIO_ANNUAL]:  'studio',
  'price_1THCSlBJVJa9ylUXwAYC4LpR': 'creator',
  'price_1TNRx6BJVJa9ylUXwLr11VPm': 'studio',
};

async function updateUserPlan(email, plan) {
  if (!process.env.SUPABASE_SERVICE_KEY) return;
  try {
    const supa = getSupaAdmin();
    const { data: { users } } = await supa.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) return;
    await supa.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, plan } });
    console.log('Plan updated:', email, '->', plan);
  } catch(e) { console.error('updateUserPlan:', e.message); }
}

const rateCounts = {};
function checkRate(req, res) {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  const now = Date.now();
  if (!rateCounts[ip]) rateCounts[ip] = { count:0, reset:now+60000 };
  if (now > rateCounts[ip].reset) rateCounts[ip] = { count:0, reset:now+60000 };
  rateCounts[ip].count++;
  if (rateCounts[ip].count > 10) { res.status(429).json({ error:'Too many requests' }); return false; }
  return true;
}
setInterval(() => {
  const n = Date.now();
  Object.keys(rateCounts).forEach(ip => { if (rateCounts[ip].reset < n) delete rateCounts[ip]; });
}, 300000);

const anthropic        = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY   = process.env.ELEVENLABS_API_KEY;
const HEYGEN_KEY       = process.env.HEYGEN_API_KEY;
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
const PIAPI_KEY        = process.env.PIAPI_KEY;
const RUNWAY_KEY       = process.env.RUNWAY_API_KEY;
const CREATOMATE_KEY   = process.env.CREATOMATE_API_KEY;
const STRIPE_KEY       = process.env.STRIPE_SECRET_KEY;
const MODEL            = 'claude-sonnet-4-6';
const MODEL_FALLBACK   = 'claude-sonnet-4-5-20250929';

let HEYGEN_AVATAR_ID  = process.env.HEYGEN_AVATAR_ID || 'Anna_public_3_20240108';
let HEYGEN_VOICE_ID   = process.env.HEYGEN_VOICE_ID  || '2d5b0e6cf36f460aa7fc47e3eee4ba54';

// Cache per server session
let CACHED_HEYGEN_IMAGE_ASSET_ID = null; // asset id from /v1/asset upload (for background)
let CACHED_HEYGEN_VOICE_FOUND    = false;

const KLING_BASE = 'https://api2.klingai.com';

function buildKlingJWT() {
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) return null;
  const crypto  = require('crypto');
  const header  = Buffer.from(JSON.stringify({ alg:'HS256', typ:'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now()/1000);
  const payload = Buffer.from(JSON.stringify({ iss:KLING_ACCESS_KEY, exp:now+1800, nbf:now-5 })).toString('base64url');
  const sig     = crypto.createHmac('sha256', KLING_SECRET_KEY).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

app.get('/health', (req,res) => res.json({
  status:'ok', version:'3.4',
  anthropic:!!process.env.ANTHROPIC_API_KEY, elevenlabs:!!ELEVENLABS_KEY,
  heygen:!!HEYGEN_KEY, kling_piapi:!!PIAPI_KEY,
  kling_direct:!!(KLING_ACCESS_KEY&&KLING_SECRET_KEY),
  runway:!!RUNWAY_KEY, creatomate:!!CREATOMATE_KEY, stripe:!!STRIPE_KEY
}));

function stripProject(project) {
  const p = JSON.parse(JSON.stringify(project));
  if (p.assets) p.assets = p.assets.map(a => { const c={...a}; delete c.dataUrl; return c; });
  if (p.scenes) p.scenes = p.scenes.map(s => {
    const sc={...s};
    if (sc.assets) sc.assets = sc.assets.map(a => { const c={...a}; delete c.dataUrl; return c; });
    return sc;
  });
  delete p.clips;
  return p;
}

app.post('/api/project/save', async (req,res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ','');
    if (!token) return res.status(401).json({ error:'No auth token' });
    const sb = getSupaAdmin();
    const { data:{ user }, error:authErr } = await sb.auth.getUser(token);
    if (authErr||!user) return res.status(401).json({ error:'Invalid token' });
    const { project } = req.body;
    if (!project?.id) return res.status(400).json({ error:'project.id required' });
    const p = stripProject(project);
    const { error } = await sb.from('aab_projects').upsert(
      { id:p.id, user_id:user.id, title:p.title||'My Video', data:p }, { onConflict:'id' }
    );
    if (error) throw error;
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/project/list', async (req,res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ','');
    if (!token) return res.status(401).json({ error:'No auth token' });
    const sb = getSupaAdmin();
    const { data:{ user }, error:authErr } = await sb.auth.getUser(token);
    if (authErr||!user) return res.status(401).json({ error:'Invalid token' });
    const { data, error } = await sb.from('aab_projects')
      .select('id,title,data,updated_at').eq('user_id',user.id)
      .order('updated_at',{ascending:false}).limit(50);
    if (error) throw error;
    res.json({ projects:(data||[]).map(r=>r.data) });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.delete('/api/project/:id', async (req,res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ','');
    if (!token) return res.status(401).json({ error:'No auth token' });
    const sb = getSupaAdmin();
    const { data:{ user }, error:authErr } = await sb.auth.getUser(token);
    if (authErr||!user) return res.status(401).json({ error:'Invalid token' });
    const { error } = await sb.from('aab_projects')
      .delete().eq('id',req.params.id).eq('user_id',user.id);
    if (error) throw error;
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/project/save-all', async (req,res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ','');
    if (!token) return res.status(401).json({ error:'No auth token' });
    const sb = getSupaAdmin();
    const { data:{ user }, error:authErr } = await sb.auth.getUser(token);
    if (authErr||!user) return res.status(401).json({ error:'Invalid token' });
    const { projects } = req.body;
    if (!Array.isArray(projects)) return res.status(400).json({ error:'projects array required' });
    const results = [];
    for (const project of projects) {
      if (!project.id) continue;
      try {
        const p = stripProject(project);
        const { error } = await sb.from('aab_projects').upsert(
          { id:p.id, user_id:user.id, title:p.title||'My Video', data:p }, { onConflict:'id' }
        );
        results.push({ id:project.id, ok:!error, error:error?.message });
      } catch(e) { results.push({ id:project.id, ok:false, error:e.message }); }
    }
    res.json({ results, saved:results.filter(r=>r.ok).length, total:results.length });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/runway/generate', async (req,res) => {
  try {
    if (!RUNWAY_KEY) return res.status(503).json({ error:'RUNWAY_API_KEY not configured' });
    const { promptImage, promptText, duration=5, ratio='1280:720', model='gen4_turbo' } = req.body;
    const body = { model, ratio, duration };
    if (promptText)  body.promptText  = promptText;
    if (promptImage) body.promptImage = promptImage;
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'Content-Type':'application/json', 'X-Runway-Version':'2024-11-06' },
      body:JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Runway '+r.status+': '+(await r.text()).slice(0,200));
    const data = await r.json();
    res.json({ taskId:data.id, status:'pending', provider:'runway' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/runway/status/:taskId', async (req,res) => {
  try {
    if (!RUNWAY_KEY) return res.status(503).json({ error:'RUNWAY_API_KEY not configured' });
    const r = await fetch('https://api.dev.runwayml.com/v1/tasks/'+req.params.taskId, {
      headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'X-Runway-Version':'2024-11-06' }
    });
    const data = await r.json();
    const map = { PENDING:'pending', RUNNING:'processing', SUCCEEDED:'completed', FAILED:'failed' };
    res.json({ taskId:req.params.taskId, status:map[data.status]||data.status, videoUrl:data.output?.[0]||null, progress:data.progressRatio||0, provider:'runway' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/creatomate/stitch', async (req,res) => {
  try {
    if (!CREATOMATE_KEY) return res.status(503).json({ error:'CREATOMATE_API_KEY not configured' });
    const { clips, subtitles=[], musicUrl, outputFormat='mp4', resolution='1080p' } = req.body;
    if (!clips?.length) return res.status(400).json({ error:'clips array required' });
    const resMap = { '720p':[1280,720], '1080p':[1920,1080], '4k':[3840,2160] };
    const [width,height] = resMap[resolution]||[1920,1080];
    const elements = []; let time = 0;
    clips.forEach((clip,i) => {
      elements.push({ type:'video', source:clip.url, time, duration:clip.duration||8, fit:'cover', volume:1 });
      if (subtitles[i]) elements.push({
        type:'text', text:subtitles[i], time, duration:clip.duration||8,
        x:'50%', y:'88%', width:'85%', font_size:'5 vmin', font_weight:'600',
        color:'#ffffff', background_color:'rgba(0,0,0,0.68)', font_family:'Open Sans',
        x_anchor:'50%', y_anchor:'100%'
      });
      time += (clip.duration||8);
    });
    if (musicUrl) elements.push({ type:'audio', source:musicUrl, time:0, duration:time, volume:0.25, audio_fade_out:3 });
    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+CREATOMATE_KEY, 'Content-Type':'application/json' },
      body:JSON.stringify({ output_format:outputFormat, width, height, frame_rate:30, elements })
    });
    if (!r.ok) throw new Error('Creatomate '+r.status+': '+(await r.text()).slice(0,300));
    const data = await r.json();
    const render = Array.isArray(data)?data[0]:data;
    res.json({ taskId:render.id, status:render.status||'pending', outputUrl:render.url||null, provider:'creatomate', totalDuration:time, clipCount:clips.length });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/creatomate/status/:renderId', async (req,res) => {
  try {
    if (!CREATOMATE_KEY) return res.status(503).json({ error:'CREATOMATE_API_KEY not configured' });
    const r = await fetch('https://api.creatomate.com/v1/renders/'+req.params.renderId, {
      headers:{ 'Authorization':'Bearer '+CREATOMATE_KEY }
    });
    const data = await r.json();
    res.json({ taskId:req.params.renderId, status:data.status, progress:data.percent||0, outputUrl:data.url||null, provider:'creatomate' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Sharp compositing ─────────────────────────────────────────────────────────
async function generateStudioBackground(studioType, W, H) {
  const configs = {
    'news-studio': { base:[8,18,60],  accent:[20,60,180],  desk:true  },
    'podcast':     { base:[12,4,28],  accent:[80,20,120],  desk:false },
    'office':      { base:[10,20,10], accent:[20,100,40],  desk:false },
    'classroom':   { base:[20,18,8],  accent:[100,90,20],  desk:true  },
    'courtroom':   { base:[25,12,4],  accent:[120,60,20],  desk:true  },
    'documentary': { base:[5,5,5],    accent:[60,10,10],   desk:false },
    'cooking':     { base:[8,22,8],   accent:[40,130,20],  desk:true  },
  };
  const cfg = configs[studioType] || configs['news-studio'];
  const [br,bg_,bb] = cfg.base, [ar,ag,ab] = cfg.accent;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="rgb(${br},${bg_},${bb})"/>
    <defs><radialGradient id="l1" cx="28%" cy="55%" r="65%">
      <stop offset="0%" stop-color="rgb(${ar},${ag},${ab})" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="rgb(${br},${bg_},${bb})" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#l1)"/>
    ${cfg.desk?`<rect x="${Math.round(W*0.14)}" y="${Math.round(H*0.73)}" width="${Math.round(W*0.72)}" height="${Math.round(H*0.055)}" rx="4" fill="rgb(${Math.min(ar+5,80)},${Math.min(ag+5,50)},${Math.min(ab+15,100)})" opacity="0.85"/>`:''}
  </svg>`;
  return await sharp(Buffer.from(svg)).jpeg({ quality:95 }).toBuffer();
}

async function getStudioBackgroundB64(studioType, customBgBase64, ratio) {
  const DIMS = { '16:9':{w:1280,h:720}, '9:16':{w:720,h:1280}, '1:1':{w:1024,h:1024} };
  const {w,h} = DIMS[ratio]||DIMS['16:9'];
  if (customBgBase64) {
    const buf = await sharp(Buffer.from(customBgBase64,'base64')).resize(w,h,{fit:'cover'}).jpeg({quality:92}).toBuffer();
    return buf.toString('base64');
  }
  const buf = await generateStudioBackground(studioType||'news-studio', w, h);
  return buf.toString('base64');
}

async function buildSceneImage(presenterB64, bgB64, framingStyle, ratio) {
  const DIMS = { '16:9':{w:1280,h:720}, '9:16':{w:720,h:1280}, '1:1':{w:1024,h:1024} };
  const {w:W, h:H} = DIMS[ratio]||DIMS['16:9'];
  let bgResized;
  if (bgB64) {
    bgResized = await sharp(Buffer.from(bgB64,'base64')).resize(W,H,{fit:'cover',position:'center'}).jpeg({quality:92}).toBuffer();
  } else {
    bgResized = await sharp({ create:{width:W,height:H,channels:3,background:{r:10,g:20,b:50}} }).jpeg().toBuffer();
  }
  if (!presenterB64) return bgResized.toString('base64');
  const FRAMING = {
    'medium':    { hPct:0.85, xPct:0.50, topPct:0.15 },
    'close':     { hPct:0.95, xPct:0.50, topPct:0.05 },
    'wide':      { hPct:0.92, xPct:0.50, topPct:0.08 },
    'news-desk': { hPct:0.78, xPct:0.50, topPct:0.22 },
    'podcast':   { hPct:0.82, xPct:0.48, topPct:0.12 },
  };
  const f     = FRAMING[framingStyle]||FRAMING['medium'];
  const presH = Math.round(H*f.hPct);
  const presBuf = Buffer.from(presenterB64,'base64');
  const meta  = await sharp(presBuf).metadata();
  const presW = Math.round(presH * ((meta.width||3)/(meta.height||4)));
  const presResized = await sharp(presBuf).resize(presW, presH, {fit:'cover', position:'centre'}).png().toBuffer();
  const left = Math.max(0, Math.min(Math.round(W*f.xPct - presW/2), W-presW));
  const top  = Math.max(0, Math.min(Math.round(H*f.topPct), H-presH));
  const shadow = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sh" cx="50%" cy="100%" r="35%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient></defs>
    <ellipse cx="${left+presW/2}" cy="${H}" rx="${presW*0.45}" ry="${H*0.05}" fill="url(#sh)"/>
  </svg>`;
  const out = await sharp(bgResized).composite([
    { input:Buffer.from(shadow), blend:'multiply' },
    { input:presResized, top, left, blend:'over' }
  ]).jpeg({quality:93}).toBuffer();
  console.log('Composited:', out.length, 'bytes');
  return out.toString('base64');
}

// ══════════════════════════════════════════════════════════════════════════════
// AI PRESENTER — main route
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/presenter', async (req,res) => {
  try {
    const {
      audioBase64, referenceImageBase64, customBgBase64,
      studioType, bgType, ratio='16:9', framing='medium',
      sceneText='', provider:requestedProvider=null
    } = req.body;

    const bgTypeResolved = bgType||studioType||'news-studio';
    if (!audioBase64) return res.status(400).json({ error:'audioBase64 required' });

    console.log('\n=== AI Presenter v3.4 | bg:', bgTypeResolved, '| provider:', requestedProvider, '| ratio:', ratio);

    const bgB64 = await getStudioBackgroundB64(bgTypeResolved, customBgBase64, ratio);
    let compositeImageB64 = null;
    try {
      compositeImageB64 = await buildSceneImage(referenceImageBase64||null, bgB64, framing, ratio);
      console.log('Composite:', Math.round(compositeImageB64.length/1024)+'KB');
    } catch(e) {
      console.warn('Composite failed:', e.message);
      compositeImageB64 = referenceImageBase64 || bgB64;
    }

    const hasHeygen = !!HEYGEN_KEY;
    const hasKling  = !!(PIAPI_KEY || (KLING_ACCESS_KEY && KLING_SECRET_KEY));
    const hasRunway = !!RUNWAY_KEY;

    let chosen = requestedProvider;
    if (chosen === 'kling'  && !hasKling)  chosen = null;
    if (chosen === 'heygen' && !hasHeygen) chosen = null;
    if (chosen === 'runway' && !hasRunway) chosen = null;
    if (!chosen) chosen = hasHeygen ? 'heygen' : hasKling ? 'kling' : hasRunway ? 'runway' : null;

    if (!chosen) return res.status(503).json({ error:'No video provider configured.' });
    console.log('Provider:', chosen);

    const args = { compositeImageB64, referenceImageBase64, audioBase64, ratio, framing, studioType:bgTypeResolved, sceneText };
    if (chosen === 'heygen') return await generateWithHeyGen(req, res, args);
    if (chosen === 'kling')  return await generateWithKling(req, res, args);
    if (chosen === 'runway') return await generateWithRunway(req, res, args);

  } catch(e) {
    console.error('/api/presenter:', e.message);
    res.status(500).json({ error:e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// HEYGEN — Fixed payload structures
//
// AV4 endpoint payload (from official docs):
// POST /v2/video/av4/generate
// { video_title, image_key, voice: { voice_id }, audio_asset_id, script, aspect_ratio }
// NOTE: audio_asset_id is TOP-LEVEL, not inside voice object
//
// v2 fallback payload:
// POST /v2/video/generate
// { video_inputs: [{ character, voice: { type:'audio', audio_asset_id }, background }] }
// NOTE: background cannot use image_key — must be color or URL
// ══════════════════════════════════════════════════════════════════════════════
async function generateWithHeyGen(req, res, args) {
  const { compositeImageB64, referenceImageBase64, audioBase64, ratio, sceneText } = args;
  try {
    if (!HEYGEN_KEY) throw new Error('HEYGEN_API_KEY not configured');
    const H = { 'X-Api-Key': HEYGEN_KEY };

    // Step 1: Upload audio as raw binary → audio_asset_id
    const audioBuf = Buffer.from(audioBase64, 'base64');
    console.log('HeyGen: uploading audio', audioBuf.length, 'bytes...');
    const audioResp = await fetch('https://upload.heygen.com/v1/asset', {
      method:'POST', headers:{ ...H, 'Content-Type':'audio/mpeg' }, body:audioBuf
    });
    if (!audioResp.ok) {
      const e = await audioResp.text();
      throw new Error('HeyGen audio upload: '+audioResp.status+' — '+e.slice(0,300));
    }
    const audioData    = await audioResp.json();
    const audioAssetId = audioData.data?.id || audioData.data?.asset_id;
    if (!audioAssetId) throw new Error('HeyGen: no audio asset_id. '+JSON.stringify(audioData).slice(0,200));
    console.log('HeyGen audio_asset_id:', audioAssetId);

    // Step 2: Upload presenter image → image_key (cached for session)
    // image_key is ONLY used in av4/generate, not in v2/video/generate
    const imageToUse = compositeImageB64 || referenceImageBase64;
    let imageKey = CACHED_HEYGEN_IMAGE_ASSET_ID;

    if (!imageKey && imageToUse) {
      const imgBuf = Buffer.from(imageToUse, 'base64');
      console.log('HeyGen: uploading image', imgBuf.length, 'bytes...');
      const imgResp = await fetch('https://upload.heygen.com/v1/asset', {
        method:'POST', headers:{ ...H, 'Content-Type':'image/jpeg' }, body:imgBuf
      });
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        // image_key is the full path returned e.g. "image/abc123/original.jpg"
        imageKey = imgData.data?.image_key || imgData.data?.id;
        if (imageKey) {
          CACHED_HEYGEN_IMAGE_ASSET_ID = imageKey;
          console.log('HeyGen image_key:', imageKey);
        }
      } else {
        console.warn('HeyGen image upload failed:', imgResp.status);
      }
    } else if (imageKey) {
      console.log('HeyGen: cached image_key:', imageKey);
    }

    // Discover voice if not done yet
    if (!CACHED_HEYGEN_VOICE_FOUND) {
      try {
        const vr = await fetch('https://api.heygen.com/v2/voices', { headers:H });
        if (vr.ok) {
          const vd = await vr.json();
          const voices = vd.data?.voices || vd.data || [];
          const found  = voices.find(v=>v.language==='English'&&v.gender==='male') || voices[0];
          if (found) { HEYGEN_VOICE_ID = found.voice_id; CACHED_HEYGEN_VOICE_FOUND = true; }
        }
      } catch(e) { console.warn('HeyGen voice discovery:', e.message); }
    }

    // Step 3a: Try Avatar IV
    // CORRECT payload: audio_asset_id is TOP-LEVEL, voice only needs voice_id
    if (imageKey) {
      console.log('HeyGen: Avatar IV...');
      const av4Payload = {
        video_title:    'AABStudio Scene',
        image_key:      imageKey,
        voice: {
          voice_id: HEYGEN_VOICE_ID
          // voice_id required for lip-sync timing
        },
        audio_asset_id: audioAssetId,  // TOP-LEVEL — actual audio content
        script:         sceneText || 'Presenting.',
        aspect_ratio:   ratio || '16:9'
      };
      console.log('HeyGen AV4 payload:', JSON.stringify(av4Payload).slice(0,300));

      const av4Resp = await fetch('https://api.heygen.com/v2/video/av4/generate', {
        method:'POST', headers:{ ...H, 'Content-Type':'application/json' },
        body:JSON.stringify(av4Payload)
      });
      if (av4Resp.ok) {
        const av4Data = await av4Resp.json();
        const videoId = av4Data.data?.video_id || av4Data.video_id;
        if (videoId) {
          console.log('HeyGen AV4 video_id:', videoId);
          return res.json({ taskId:'heygen-'+videoId, provider:'heygen', engine:'av4' });
        }
        console.warn('HeyGen AV4 no video_id:', JSON.stringify(av4Data).slice(0,300));
      } else {
        const e = await av4Resp.text();
        console.warn('HeyGen AV4 failed:', av4Resp.status, e.slice(0,400));
      }
    }

    // Step 3b: Fallback — v2/video/generate with public avatar
    // CORRECT: background is color (never image_key which is different asset type)
    console.log('HeyGen: v2/video/generate fallback...');
    const v2Resp = await fetch('https://api.heygen.com/v2/video/generate', {
      method:'POST', headers:{ ...H, 'Content-Type':'application/json' },
      body:JSON.stringify({
        video_inputs: [{
          character:  { type:'avatar', avatar_id:HEYGEN_AVATAR_ID, avatar_style:'normal' },
          voice:      { type:'audio', audio_asset_id:audioAssetId },
          background: { type:'color', value:'#1a2035' }
        }],
        aspect_ratio: ratio || '16:9',
        test: false
      })
    });
    if (!v2Resp.ok) {
      const e = await v2Resp.text();
      throw new Error('HeyGen v2 failed: '+v2Resp.status+' — '+e.slice(0,400));
    }
    const v2Data  = await v2Resp.json();
    const videoId = v2Data.data?.video_id || v2Data.video_id;
    if (!videoId) throw new Error('HeyGen v2: no video_id. '+JSON.stringify(v2Data).slice(0,300));
    console.log('HeyGen v2 video_id:', videoId);
    return res.json({ taskId:'heygen-'+videoId, provider:'heygen', engine:'v2' });

  } catch(e) {
    console.error('generateWithHeyGen:', e.message);
    return res.status(500).json({ error:e.message });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// KLING via PiAPI proxy
// PiAPI image-to-video uses data URI for base64 images
// POST https://api.piapi.ai/api/v1/task
// ══════════════════════════════════════════════════════════════════════════════
async function generateWithKling(req, res, args) {
  const { compositeImageB64, referenceImageBase64, audioBase64, ratio } = args;
  try {
    const imageToUse = compositeImageB64 || referenceImageBase64;
    if (!imageToUse) return await generateWithHeyGen(req, res, args);

    const ratioMap = { '16:9':'16:9', '9:16':'9:16', '1:1':'1:1' };

    if (PIAPI_KEY) {
      // PiAPI accepts base64 as data URI in image_url field
      console.log('Kling via PiAPI: image2video...');
      const i2vResp = await fetch('https://api.piapi.ai/api/v1/task', {
        method:'POST',
        headers:{ 'x-api-key':PIAPI_KEY, 'Content-Type':'application/json' },
        body:JSON.stringify({
          model:     'kling',
          task_type: 'video_generation',
          input: {
            // PiAPI accepts data URI for base64 images
            image_url:    'data:image/jpeg;base64,'+imageToUse,
            prompt:       'Professional TV presenter speaking to camera. Natural head movement. Realistic breathing. Broadcast quality.',
            negative_prompt: 'blurry, static, low quality, watermark, text',
            cfg_scale:    0.5,
            duration:     5,
            aspect_ratio: ratioMap[ratio]||'16:9',
            mode:         'std'
          }
        })
      });

      if (!i2vResp.ok) {
        const e = await i2vResp.text();
        console.error('PiAPI i2v failed:', i2vResp.status, e.slice(0,300));
        return await generateWithHeyGen(req, res, args);
      }

      const i2vData   = await i2vResp.json();
      const i2vTaskId = i2vData.data?.task_id;
      if (!i2vTaskId) {
        console.error('PiAPI: no task_id:', JSON.stringify(i2vData).slice(0,200));
        return await generateWithHeyGen(req, res, args);
      }
      console.log('PiAPI Kling i2v task:', i2vTaskId);

      // Poll until video ready (max 3 min)
      let videoUrl = null;
      for (let i=0; i<18; i++) {
        await new Promise(r=>setTimeout(r,10000));
        const poll = await fetch('https://api.piapi.ai/api/v1/task/'+i2vTaskId, {
          headers:{ 'x-api-key':PIAPI_KEY }
        });
        const pd     = await poll.json();
        const status = pd.data?.status;
        videoUrl     = pd.data?.output?.video_url;
        console.log('PiAPI poll:', status, videoUrl?'ready':'waiting...');
        if ((status==='completed'||status==='succeed') && videoUrl) break;
        if (status==='failed') {
          console.error('PiAPI task failed:', JSON.stringify(pd.data?.error||pd.data).slice(0,200));
          return await generateWithHeyGen(req, res, args);
        }
      }

      if (!videoUrl) {
        console.error('PiAPI timed out — falling back to HeyGen');
        return await generateWithHeyGen(req, res, args);
      }

      // Return video — audio will be merged client-side or via export pipeline
      // (PiAPI lipsync requires audio URL not base64, so we skip it for now)
      console.log('PiAPI Kling video ready:', videoUrl);
      return res.json({ taskId:'kling-done-piapi', provider:'kling', videoUrl, done:true });

    } else {
      // Direct Kling API fallback (geo-blocked from Railway but kept as option)
      console.log('Kling direct API...');
      const token = buildKlingJWT();
      if (!token) return await generateWithHeyGen(req, res, args);

      const i2vResp = await fetch(KLING_BASE+'/v1/images/image2video', {
        method:'POST',
        headers:{ 'Authorization':'Bearer '+token, 'Content-Type':'application/json' },
        body:JSON.stringify({
          model_name:'kling-v1-5', mode:'pro', duration:'5',
          aspect_ratio:ratioMap[ratio]||'16:9',
          image:'data:image/jpeg;base64,'+imageToUse,
          prompt:'Professional TV presenter speaking to camera. Natural head movement. Broadcast quality.'
        })
      }).catch(e => { throw new Error('Kling direct blocked: '+e.message); });

      if (!i2vResp.ok) {
        console.error('Kling direct failed:', i2vResp.status);
        return await generateWithHeyGen(req, res, args);
      }
      const i2vData   = await i2vResp.json();
      const i2vTaskId = i2vData.data?.task_id;
      if (!i2vTaskId) return await generateWithHeyGen(req, res, args);

      let videoUrl = null;
      for (let i=0; i<18; i++) {
        await new Promise(r=>setTimeout(r,10000));
        const poll = await fetch(KLING_BASE+'/v1/images/image2video/'+i2vTaskId, { headers:{ 'Authorization':'Bearer '+buildKlingJWT() } });
        const pd   = await poll.json();
        const stat = pd.data?.task_status;
        videoUrl   = pd.data?.task_result?.videos?.[0]?.url;
        if (stat==='succeed'&&videoUrl) break;
        if (stat==='failed') throw new Error('Kling direct i2v failed');
      }
      if (!videoUrl) throw new Error('Kling direct timed out');

      const lsResp = await fetch(KLING_BASE+'/v1/videos/lip-sync', {
        method:'POST', headers:{ 'Authorization':'Bearer '+buildKlingJWT(), 'Content-Type':'application/json' },
        body:JSON.stringify({ inputs:[{ type:'video', url:videoUrl }], audio_type:'base64', audio:audioBase64, model_name:'kling-v1-5', mode:'pro' })
      });
      if (!lsResp.ok) return res.json({ taskId:'kling-done-'+i2vTaskId, provider:'kling', videoUrl, done:true });
      const lsData   = await lsResp.json();
      const lsTaskId = lsData.data?.task_id;
      if (!lsTaskId) return res.json({ taskId:'kling-done-'+i2vTaskId, provider:'kling', videoUrl, done:true });
      return res.json({ taskId:'kling-'+lsTaskId, provider:'kling', composited:true });
    }

  } catch(e) {
    console.error('generateWithKling:', e.message);
    if (HEYGEN_KEY) return await generateWithHeyGen(req, res, args);
    return res.status(500).json({ error:e.message });
  }
}

// ── Runway ────────────────────────────────────────────────────────────────────
async function generateWithRunway(req, res, args) {
  const { compositeImageB64, referenceImageBase64, ratio } = args;
  try {
    if (!RUNWAY_KEY) throw new Error('RUNWAY_API_KEY not set');
    const imageToUse = compositeImageB64 || referenceImageBase64;
    if (!imageToUse) throw new Error('No image for Runway');
    const ratioMap = { '16:9':'1280:768', '9:16':'768:1280', '1:1':'1024:1024' };
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'Content-Type':'application/json', 'X-Runway-Version':'2024-11-06' },
      body:JSON.stringify({
        promptImage:'data:image/jpeg;base64,'+imageToUse,
        model:'gen4_turbo',
        promptText:'Professional TV presenter speaking to camera. Natural head movement. High quality broadcast video.',
        ratio:ratioMap[ratio]||'1280:768', duration:10
      })
    });
    if (!r.ok) throw new Error('Runway: '+r.status+' '+(await r.text()).slice(0,200));
    const data = await r.json();
    if (!data.id) throw new Error('Runway: no task id');
    return res.json({ taskId:'runway-'+data.id, provider:'runway', composited:true });
  } catch(e) {
    console.error('generateWithRunway:', e.message);
    return res.status(500).json({ error:e.message });
  }
}

// ── Presenter status ──────────────────────────────────────────────────────────
app.get('/api/presenter-status', async (req,res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error:'taskId required' });
  try {
    if (taskId === 'kling-done-piapi' || taskId.startsWith('kling-done-')) {
      return res.json({ status:'succeed', done:true, failed:false, videoUrl:req.query.videoUrl||null });
    }
    if (taskId.startsWith('kling-piapi-')) {
      const id = taskId.replace('kling-piapi-','');
      const r  = await fetch('https://api.piapi.ai/api/v1/task/'+id, { headers:{ 'x-api-key':PIAPI_KEY } });
      const d  = await r.json();
      const status = d.data?.status;
      return res.json({ status, videoUrl:d.data?.output?.video_url||null, done:status==='completed'||status==='succeed', failed:status==='failed' });
    }
    if (taskId.startsWith('kling-')) {
      const id    = taskId.replace('kling-','');
      const token = buildKlingJWT();
      let sr = await fetch(KLING_BASE+'/v1/videos/lip-sync/'+id, { headers:{ 'Authorization':'Bearer '+token } });
      if (!sr.ok) sr = await fetch(KLING_BASE+'/v1/images/image2video/'+id, { headers:{ 'Authorization':'Bearer '+token } });
      const d    = await sr.json();
      const task = d.data||d;
      const status = task.task_status||task.status;
      return res.json({ status, videoUrl:task.task_result?.videos?.[0]?.url||null, done:status==='succeed', failed:status==='failed' });
    }
    if (taskId.startsWith('heygen-')) {
      const id = taskId.replace('heygen-','');
      const sr = await fetch('https://api.heygen.com/v1/video_status.get?video_id='+id, { headers:{ 'X-Api-Key':HEYGEN_KEY } });
      const sd = await sr.json();
      return res.json({ status:sd.data?.status, videoUrl:sd.data?.video_url||null, done:sd.data?.status==='completed', failed:sd.data?.status==='failed', error:sd.data?.error||null });
    }
    if (taskId.startsWith('runway-')) {
      const id = taskId.replace('runway-','');
      const r  = await fetch('https://api.dev.runwayml.com/v1/tasks/'+id, { headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'X-Runway-Version':'2024-11-06' } });
      const d  = await r.json();
      const map = { PENDING:'pending', RUNNING:'processing', SUCCEEDED:'completed', FAILED:'failed' };
      return res.json({ status:map[d.status]||d.status, videoUrl:d.output?.[0]||null, done:d.status==='SUCCEEDED', failed:d.status==='FAILED' });
    }
    res.status(400).json({ error:'Unknown task provider' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Voice ─────────────────────────────────────────────────────────────────────
app.post('/api/voice', async (req,res) => {
  try {
    const { text, voiceId='EXAVITQu4vr4xnSDxMaL', stability=0.5, similarityBoost=0.75 } = req.body;
    if (!text)           return res.status(400).json({ error:'No text provided.' });
    if (!ELEVENLABS_KEY) return res.status(503).json({ error:'ElevenLabs API key not configured.' });
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+voiceId, {
      method:'POST',
      headers:{ 'xi-api-key':ELEVENLABS_KEY, 'Content-Type':'application/json' },
      body:JSON.stringify({ text, model_id:'eleven_multilingual_v2', voice_settings:{ stability, similarity_boost:similarityBoost, style:0.3, use_speaker_boost:true } })
    });
    if (!r.ok) throw new Error('ElevenLabs: '+r.status+' '+await r.text());
    const buf = await r.arrayBuffer();
    res.json({ audio:Buffer.from(buf).toString('base64') });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Segment ───────────────────────────────────────────────────────────────────
app.post('/api/segment', async (req,res) => {
  if (!checkRate(req,res)) return;
  try {
    const { script, wpm=150, sceneDuration=8, title='My Video' } = req.body;
    if (!script||script.trim().length<10) return res.status(400).json({ error:'Script text required.' });
    if (!process.env.ANTHROPIC_API_KEY)   return res.status(503).json({ error:'Anthropic API key not configured.' });
    const wordsPerScene = Math.round((wpm/60)*sceneDuration);
    const words = script.trim().split(/\s+/);
    const maxW  = 50*wordsPerScene;
    const text  = words.length>maxW ? words.slice(0,maxW).join(' ')+' [Script continues]' : script.trim();
    const isLong = words.length>maxW;
    let r;
    try {
      r = await anthropic.messages.create({
        model:MODEL, max_tokens:16000,
        system:`Split script into teleprompter scenes. Each ~${wordsPerScene} words. Max 10s per scene. Types: INTRO,MAIN,TRANSITION,SUMMARY,CONCLUSION. Return ONLY valid JSON: {"title":"...","totalScenes":0,"estimatedDuration":"0:00","scenes":[{"id":"s_1","sceneNumber":1,"type":"INTRO","narration":"...","wordCount":0,"duration":${sceneDuration},"notes":"","status":"draft"}]}`,
        messages:[{ role:'user', content:'Segment:\n\n'+text+'\n\nReturn ONLY valid JSON.' }]
      });
    } catch(me) {
      r = await anthropic.messages.create({
        model:MODEL_FALLBACK, max_tokens:16000,
        system:'Split into teleprompter scenes. Return ONLY valid JSON.',
        messages:[{ role:'user', content:'Segment:\n\n'+text+'\n\nReturn ONLY valid JSON.' }]
      });
    }
    const raw = r.content.map(c=>c.text||'').join('').trim();
    const j   = raw.indexOf('{');
    if (j===-1) throw new Error('No JSON in response');
    let depth=0, k=-1;
    for (let ci=j; ci<raw.length; ci++) {
      if (raw[ci]==='{') depth++; else if (raw[ci]==='}'){depth--;if(depth===0){k=ci;break;}}
    }
    if (k===-1) throw new Error('Could not find valid JSON');
    let result;
    try {
      result = JSON.parse(raw.slice(j,k+1).replace(/,\s*}/g,'}').replace(/,\s*]/g,']').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' '));
    } catch(e) {
      const rx=/"narration"\s*:\s*"((?:[^\\"]|\\.)*)"/g; const scenes=[]; let m;
      while((m=rx.exec(raw))!==null) {
        scenes.push({ id:'s_'+(scenes.length+1), sceneNumber:scenes.length+1, type:scenes.length===0?'INTRO':'MAIN',
          narration:m[1], wordCount:m[1].split(/\s+/).length, duration:Math.min(sceneDuration,10), notes:'', assets:[], status:'draft' });
      }
      if (!scenes.length) throw new Error('Could not parse AI response');
      result = { scenes, title };
    }
    let scenes = (result.scenes||[]).map((s,i) => ({
      id:s.id||('s_'+(i+1)), sceneNumber:s.sceneNumber||(i+1), type:(s.type||'MAIN').toUpperCase(),
      narration:(s.narration||s.text||'').trim(),
      wordCount:s.wordCount||(s.narration||'').split(/\s+/).filter(Boolean).length,
      duration:Math.min(s.duration||sceneDuration,10), notes:s.notes||'', assets:[], status:'draft'
    })).filter(s=>s.narration.length>0);
    if (isLong&&scenes.length>0) {
      const covered=scenes.reduce((t,s)=>t+(s.wordCount||0),0);
      const rem=words.slice(covered); let wi=0;
      while(wi<rem.length) {
        const chunk=rem.slice(wi,wi+wordsPerScene).join(' ');
        if (chunk.trim().length>5) scenes.push({ id:'s_'+(scenes.length+1), sceneNumber:scenes.length+1, type:'MAIN',
          narration:chunk, wordCount:chunk.split(/\s+/).length, duration:Math.min(sceneDuration,10), notes:'', assets:[], status:'draft' });
        wi+=wordsPerScene;
      }
    }
    const totalSecs=scenes.reduce((t,s)=>t+s.duration,0);
    res.json({ title:result.title||title, totalScenes:scenes.length,
      estimatedDuration:Math.floor(totalSecs/60)+':'+String(totalSecs%60).padStart(2,'0'),
      wpm, sceneDuration, scenes });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Extract text ──────────────────────────────────────────────────────────────
app.post('/api/extract-text', async (req,res) => {
  try {
    const { text, fileBase64, mimeType, fileName } = req.body;
    if (text?.trim().length>10) { const c=text.trim().replace(/\s{3,}/g,'\n\n'); return res.json({ text:c, words:c.split(/\s+/).filter(Boolean).length }); }
    if (!fileBase64) return res.status(400).json({ error:'No file or text provided.' });
    const buf = Buffer.from(fileBase64,'base64');
    if (!mimeType||mimeType==='text/plain'||fileName?.endsWith('.txt')) { const t=buf.toString('utf8').trim(); return res.json({ text:t, words:t.split(/\s+/).filter(Boolean).length }); }
    if (mimeType?.includes('wordprocessingml')||fileName?.endsWith('.docx')) {
      const raw=buf.toString('utf8'), matches=raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)||[];
      const t=matches.map(m=>m.replace(/<[^>]+>/g,'')).join(' ').trim();
      if (t.length>10) return res.json({ text:t, words:t.split(/\s+/).filter(Boolean).length });
      return res.status(400).json({ error:'Could not extract text from DOCX.' });
    }
    return res.status(400).json({ error:'Unsupported file type.' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Stripe checkout ───────────────────────────────────────────────────────────
app.post('/api/stripe/checkout', async (req,res) => {
  try {
    if (!STRIPE_KEY) return res.status(503).json({ error:'Stripe not configured.' });
    const stripe = require('stripe')(STRIPE_KEY);
    const { priceId, mode='subscription', customerEmail } = req.body;
    if (!priceId) return res.status(400).json({ error:'priceId required.' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types:['card'], line_items:[{ price:priceId, quantity:1 }],
      mode, customer_email:customerEmail,
      success_url:'https://aabstudio.ai?checkout=success', cancel_url:'https://aabstudio.ai/pricing',
      subscription_data:mode==='subscription'?{ trial_period_days:7, trial_settings:{ end_behavior:{ missing_payment_method:'cancel' } } }:undefined,
      payment_method_collection:'always'
    });
    res.json({ url:session.url });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── HeyGen avatars ────────────────────────────────────────────────────────────
app.get('/api/heygen/avatars', async (req,res) => {
  try {
    if (!HEYGEN_KEY) return res.status(503).json({ error:'HeyGen not configured' });
    const r = await fetch('https://api.heygen.com/v2/avatars', { headers:{ 'X-Api-Key':HEYGEN_KEY } });
    const d = await r.json();
    res.json({ avatars:(d.data?.avatars||[]).slice(0,20).map(a=>({ id:a.avatar_id, name:a.avatar_name, type:a.type })) });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Script improve ────────────────────────────────────────────────────────────
app.post('/api/script/improve', async (req,res) => {
  if (!checkRate(req,res)) return;
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error:'No text provided.' });
    const r = await anthropic.messages.create({
      model:MODEL, max_tokens:3000,
      system:'Improve this script for spoken video delivery. Keep all content and meaning intact. Improve sentence flow, natural speech rhythm, and clarity only. Return only the improved script text.',
      messages:[{ role:'user', content:text }]
    });
    res.json({ improved:r.content[0]?.text?.trim() });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function discoverHeyGenAvatar() {
  if (!HEYGEN_KEY) return;
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars', { headers:{ 'X-Api-Key':HEYGEN_KEY } });
    const d = await r.json();
    const avatars = d.data?.avatars||[];
    const found = avatars.find(a=>a.avatar_id&&a.type==='public')||avatars.find(a=>a.avatar_id);
    if (found) { HEYGEN_AVATAR_ID=found.avatar_id; console.log('HeyGen avatar:', HEYGEN_AVATAR_ID); }
  } catch(e) { console.warn('HeyGen avatar discovery:', e.message); }
}

async function discoverHeyGenVoice() {
  if (!HEYGEN_KEY) return;
  try {
    const r = await fetch('https://api.heygen.com/v2/voices', { headers:{ 'X-Api-Key':HEYGEN_KEY } });
    if (!r.ok) return;
    const d = await r.json();
    const voices = d.data?.voices||d.data||[];
    const found  = voices.find(v=>v.language==='English'&&v.gender==='male')||voices[0];
    if (found) { HEYGEN_VOICE_ID=found.voice_id; CACHED_HEYGEN_VOICE_FOUND=true; console.log('HeyGen voice:', found.name||found.voice_id); }
  } catch(e) { console.warn('HeyGen voice discovery:', e.message); }
}

async function ensureAabProjectsTable() {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY) return;
    const sb = getSupaAdmin();
    const { error } = await sb.from('aab_projects').select('id').limit(1);
    if (!error) { console.log('✓ aab_projects table ready'); return; }
    if (error.code==='PGRST205') {
      console.warn('⚠ aab_projects table missing. Create in Supabase SQL editor:');
      console.warn('CREATE TABLE IF NOT EXISTS aab_projects (id TEXT PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, title TEXT, data JSONB); ALTER TABLE aab_projects ENABLE ROW LEVEL SECURITY; CREATE POLICY "users_own_aab_projects" ON aab_projects FOR ALL USING (auth.uid() = user_id);');
    }
  } catch(e) { console.warn('ensureAabProjectsTable:', e.message); }
}

app.listen(PORT, () => {
  console.log('AABStudio v3.4 running on port', PORT);
  console.log('Anthropic:    ', !!process.env.ANTHROPIC_API_KEY?'✓':'✗ MISSING');
  console.log('ElevenLabs:   ', !!ELEVENLABS_KEY?'✓':'✗ MISSING');
  console.log('HeyGen:       ', !!HEYGEN_KEY?'✓ (primary)':'✗');
  console.log('Kling/PiAPI:  ', PIAPI_KEY?'✓ (via PiAPI)':(KLING_ACCESS_KEY&&KLING_SECRET_KEY)?'⚠ direct only':'✗');
  console.log('Runway:       ', !!RUNWAY_KEY?'✓':'✗');
  console.log('Stripe:       ', !!STRIPE_KEY?'✓':'✗');
  ensureAabProjectsTable();
  discoverHeyGenAvatar();
  discoverHeyGenVoice();
});