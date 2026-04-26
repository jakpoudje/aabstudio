'use strict';
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
  const sig = req.headers['stripe-signature'];
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
setInterval(() => { const n=Date.now(); Object.keys(rateCounts).forEach(ip=>{ if(rateCounts[ip].reset<n) delete rateCounts[ip]; }); }, 300000);

const anthropic        = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY   = process.env.ELEVENLABS_API_KEY;
const HEYGEN_KEY       = process.env.HEYGEN_API_KEY;
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
const RUNWAY_KEY       = process.env.RUNWAY_API_KEY;
const CREATOMATE_KEY   = process.env.CREATOMATE_API_KEY;
const STRIPE_KEY       = process.env.STRIPE_SECRET_KEY;
const MODEL            = 'claude-sonnet-4-6';
const MODEL_FALLBACK   = 'claude-sonnet-4-5-20250929';
let   HEYGEN_AVATAR_ID = process.env.HEYGEN_AVATAR_ID || 'Anna_public_3_20240108';

// Kling uses api2.klingai.com (not api.klingai.com)
const KLING_BASE = 'https://api2.klingai.com';

function buildKlingJWT() {
  const ak = KLING_ACCESS_KEY, sk = KLING_SECRET_KEY;
  if (!ak || !sk) return null;
  const crypto  = require('crypto');
  const header  = Buffer.from(JSON.stringify({ alg:'HS256', typ:'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now()/1000);
  const payload = Buffer.from(JSON.stringify({ iss:ak, exp:now+1800, nbf:now-5 })).toString('base64url');
  const sig     = crypto.createHmac('sha256', sk).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

app.get('/health', (req,res) => res.json({ status:'ok', version:'3.1',
  anthropic:!!process.env.ANTHROPIC_API_KEY, elevenlabs:!!ELEVENLABS_KEY,
  heygen:!!HEYGEN_KEY, kling:!!(KLING_ACCESS_KEY&&KLING_SECRET_KEY),
  runway:!!RUNWAY_KEY, creatomate:!!CREATOMATE_KEY, stripe:!!STRIPE_KEY }));

function stripProject(project) {
  const p = JSON.parse(JSON.stringify(project));
  if (p.assets) p.assets = p.assets.map(a => { const c={...a}; delete c.dataUrl; return c; });
  if (p.scenes) p.scenes = p.scenes.map(s => { const sc={...s}; if(sc.assets) sc.assets=sc.assets.map(a=>{const c={...a};delete c.dataUrl;return c;}); return sc; });
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
    const { error } = await sb.from('aab_projects').upsert({ id:p.id, user_id:user.id, title:p.title||'My Video', data:p }, { onConflict:'id' });
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
    const { data, error } = await sb.from('aab_projects').select('id,title,data,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(50);
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
    const { error } = await sb.from('aab_projects').delete().eq('id',req.params.id).eq('user_id',user.id);
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
        const { error } = await sb.from('aab_projects').upsert({ id:p.id, user_id:user.id, title:p.title||'My Video', data:p }, { onConflict:'id' });
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
      method:'POST', headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'Content-Type':'application/json', 'X-Runway-Version':'2024-11-06' },
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
    const [width,height] = ({ '720p':[1280,720], '1080p':[1920,1080], '4k':[3840,2160] })[resolution]||[1920,1080];
    const elements = []; let time = 0;
    clips.forEach((clip,i) => {
      elements.push({ type:'video', source:clip.url, time, duration:clip.duration||8, fit:'cover', volume:1 });
      if (subtitles[i]) elements.push({ type:'text', text:subtitles[i], time, duration:clip.duration||8, x:'50%', y:'88%', width:'85%', font_size:'5 vmin', font_weight:'600', color:'#ffffff', background_color:'rgba(0,0,0,0.68)', font_family:'Open Sans', x_anchor:'50%', y_anchor:'100%' });
      time += (clip.duration||8);
    });
    if (musicUrl) elements.push({ type:'audio', source:musicUrl, time:0, duration:time, volume:0.25, audio_fade_out:3 });
    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method:'POST', headers:{ 'Authorization':'Bearer '+CREATOMATE_KEY, 'Content-Type':'application/json' },
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
    const r = await fetch('https://api.creatomate.com/v1/renders/'+req.params.renderId, { headers:{ 'Authorization':'Bearer '+CREATOMATE_KEY } });
    const data = await r.json();
    res.json({ taskId:req.params.renderId, status:data.status, progress:data.percent||0, outputUrl:data.url||null, provider:'creatomate' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// Sharp compositing
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
  const f = FRAMING[framingStyle]||FRAMING['medium'];
  const presH = Math.round(H*f.hPct);
  const presBuf  = Buffer.from(presenterB64,'base64');
  const presMeta = await sharp(presBuf).metadata();
  const aspect   = (presMeta.width||3)/(presMeta.height||4);
  const presW    = Math.round(presH*aspect);
  const presResized = await sharp(presBuf).resize(presW, presH, {fit:'cover', position:'centre'}).png().toBuffer();
  const left = Math.max(0, Math.min(Math.round(W*f.xPct - presW/2), W-presW));
  const top  = Math.max(0, Math.min(Math.round(H*f.topPct), H-presH));
  const shadowSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sh" cx="50%" cy="100%" r="35%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient></defs>
    <ellipse cx="${left+presW/2}" cy="${H}" rx="${presW*0.45}" ry="${H*0.05}" fill="url(#sh)"/>
  </svg>`;
  const composited = await sharp(bgResized).composite([
    { input:Buffer.from(shadowSvg), blend:'multiply' },
    { input:presResized, top, left, blend:'over' }
  ]).jpeg({quality:93}).toBuffer();
  console.log('Scene image composited:', composited.length, 'bytes');
  return composited.toString('base64');
}

// Cache the talking photo ID to avoid re-uploading every scene
let CACHED_TALKING_PHOTO_ID = null;

app.post('/api/presenter', async (req,res) => {
  try {
    const { audioBase64, referenceImageBase64, customBgBase64, studioType, bgType,
            ratio='16:9', framing='medium', sceneText='', provider:requestedProvider=null, prompt=null } = req.body;
    const bgTypeResolved = bgType||studioType||'news-studio';
    if (!audioBase64) return res.status(400).json({ error:'audioBase64 required' });
    console.log('\n=== AI Presenter v3.1 | bgType:', bgTypeResolved, '| provider:', requestedProvider, '| ratio:', ratio);

    const bgB64 = await getStudioBackgroundB64(bgTypeResolved, customBgBase64, ratio);
    let compositeImageB64 = null;
    try {
      compositeImageB64 = await buildSceneImage(referenceImageBase64||null, bgB64, framing, ratio);
      console.log('Composite ready:', compositeImageB64 ? Math.round(compositeImageB64.length/1024)+'KB' : 'null');
    } catch(e) {
      console.warn('Composite failed:', e.message);
      compositeImageB64 = referenceImageBase64||bgB64;
    }

    const providers = { kling:!!(KLING_ACCESS_KEY&&KLING_SECRET_KEY), heygen:!!HEYGEN_KEY, runway:!!RUNWAY_KEY };
    const chosen = (requestedProvider&&providers[requestedProvider]) ? requestedProvider
      : providers.kling?'kling' : providers.heygen?'heygen' : providers.runway?'runway' : null;
    if (!chosen) return res.status(503).json({ error:'No video provider configured. Add KLING_ACCESS_KEY+KLING_SECRET_KEY or HEYGEN_API_KEY in Railway.' });
    console.log('Provider:', chosen);

    const args = { compositeImageB64, referenceImageBase64, audioBase64, ratio, framing, studioType:bgTypeResolved, customBgBase64, sceneText, prompt };
    if (chosen==='kling')  return await generateWithKling(req, res, args);
    if (chosen==='heygen') return await generateWithHeyGen(req, res, args);
    if (chosen==='runway') return await generateWithRunway(req, res, args);
  } catch(e) { console.error('/api/presenter:', e.message); res.status(500).json({ error:e.message }); }
});

async function generateWithKling(req, res, args) {
  const { compositeImageB64, referenceImageBase64, audioBase64, ratio } = args;
  try {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      console.log('No Kling keys — using HeyGen');
      return await generateWithHeyGen(req, res, args);
    }
    const imageToUse = compositeImageB64||referenceImageBase64;
    if (!imageToUse) {
      console.log('No image — using HeyGen');
      return await generateWithHeyGen(req, res, args);
    }
    const ratioMap = { '16:9':'16:9', '9:16':'9:16', '1:1':'1:1' };
    const token = buildKlingJWT();

    // Step A: image2video using correct domain api2.klingai.com
    console.log('Kling Step A: image2video...');
    const i2vResp = await fetch(KLING_BASE+'/v1/images/image2video', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+token, 'Content-Type':'application/json' },
      body:JSON.stringify({
        model_name: 'kling-v1-5',
        mode: 'pro',
        duration: '5',
        aspect_ratio: ratioMap[ratio]||'16:9',
        image: 'data:image/jpeg;base64,'+imageToUse,
        prompt: 'Professional TV presenter speaking to camera. Natural head movement. Realistic breathing. High quality broadcast video.'
      })
    });

    if (!i2vResp.ok) {
      const errText = await i2vResp.text();
      console.error('Kling i2v failed:', i2vResp.status, errText.slice(0,300));
      console.log('Falling back to HeyGen...');
      return await generateWithHeyGen(req, res, args);
    }

    const i2vData   = await i2vResp.json();
    const i2vTaskId = i2vData.data?.task_id;
    if (!i2vTaskId) {
      console.error('Kling no task_id:', JSON.stringify(i2vData).slice(0,200));
      return await generateWithHeyGen(req, res, args);
    }
    console.log('Kling i2v task:', i2vTaskId);

    // Step B: Poll until video ready (max 3 min)
    let videoUrl = null;
    for (let i=0; i<18; i++) {
      await new Promise(r=>setTimeout(r,10000));
      const pollResp = await fetch(KLING_BASE+'/v1/images/image2video/'+i2vTaskId, {
        headers:{ 'Authorization':'Bearer '+buildKlingJWT() }
      });
      const pollData = await pollResp.json();
      const status   = pollData.data?.task_status;
      videoUrl       = pollData.data?.task_result?.videos?.[0]?.url;
      console.log('Kling i2v poll:', status, videoUrl?'video ready':'waiting...');
      if (status==='succeed' && videoUrl) break;
      if (status==='failed') throw new Error('Kling image2video task failed');
    }
    if (!videoUrl) throw new Error('Kling image2video timed out after 3 minutes');

    // Step C: Lip-sync the video with audio
    console.log('Kling Step C: lip-sync...');
    const lsResp = await fetch(KLING_BASE+'/v1/videos/lip-sync', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+buildKlingJWT(), 'Content-Type':'application/json' },
      body:JSON.stringify({
        inputs: [{ type:'video', url:videoUrl }],
        audio_type: 'base64',
        audio: audioBase64,
        model_name: 'kling-v1-5',
        mode: 'pro'
      })
    });

    if (!lsResp.ok) {
      const errText = await lsResp.text();
      console.warn('Kling lipsync failed:', lsResp.status, errText.slice(0,200));
      // Return silent video — still better than nothing
      return res.json({ taskId:'kling-done-'+i2vTaskId, provider:'kling', videoUrl, done:true });
    }

    const lsData   = await lsResp.json();
    const lsTaskId = lsData.data?.task_id;
    if (!lsTaskId) {
      return res.json({ taskId:'kling-done-'+i2vTaskId, provider:'kling', videoUrl, done:true });
    }
    console.log('Kling lipsync task:', lsTaskId);
    return res.json({ taskId:'kling-'+lsTaskId, provider:'kling', composited:true });

  } catch(e) {
    console.error('generateWithKling:', e.message);
    if (HEYGEN_KEY) return await generateWithHeyGen(req, res, args);
    return res.status(500).json({ error:e.message });
  }
}

async function generateWithHeyGen(req, res, args) {
  const { compositeImageB64, referenceImageBase64, audioBase64, ratio } = args;
  try {
    if (!HEYGEN_KEY) throw new Error('HEYGEN_API_KEY not configured');
    const imageToAnimate = compositeImageB64||referenceImageBase64;

    // Upload audio
    const audioBuffer = Buffer.from(audioBase64,'base64');
    console.log('HeyGen: uploading audio', audioBuffer.length, 'bytes...');
    const audioUpload = await fetch('https://upload.heygen.com/v1/asset', {
      method:'POST',
      headers:{ 'X-Api-Key':HEYGEN_KEY, 'Content-Type':'audio/mpeg' },
      body:audioBuffer
    });
    if (!audioUpload.ok) {
      const e = await audioUpload.text();
      throw new Error('HeyGen audio upload failed: '+audioUpload.status+' '+e.slice(0,200));
    }
    const audioData    = await audioUpload.json();
    const audioAssetId = audioData.data?.id||audioData.data?.asset_id||audioData.asset_id||audioData.id;
    if (!audioAssetId) throw new Error('HeyGen: no audio asset_id. '+JSON.stringify(audioData).slice(0,200));
    console.log('HeyGen audio asset_id:', audioAssetId);

    // Get or upload talking photo — reuse cached ID to avoid hitting 3-photo limit
    let talkingPhotoId = CACHED_TALKING_PHOTO_ID;

    if (!talkingPhotoId && imageToAnimate) {
      // Try to reuse existing talking photos first
      try {
        const listResp = await fetch('https://api.heygen.com/v2/talking_photo?limit=10', {
          headers:{ 'X-Api-Key':HEYGEN_KEY }
        });
        if (listResp.ok) {
          const listData = await listResp.json();
          const photos   = listData.data?.list||listData.data||[];
          if (photos.length > 0) {
            talkingPhotoId = photos[0].talking_photo_id||photos[0].id;
            CACHED_TALKING_PHOTO_ID = talkingPhotoId;
            console.log('HeyGen: reusing existing talking_photo_id:', talkingPhotoId, '('+photos.length+' on account)');
          }
        }
      } catch(e) { console.warn('HeyGen list photos failed:', e.message); }

      // Only upload new photo if account has fewer than 3
      if (!talkingPhotoId) {
        console.log('HeyGen: uploading new talking photo...');
        const imgBuffer   = Buffer.from(imageToAnimate,'base64');
        const photoUpload = await fetch('https://upload.heygen.com/v1/talking_photo', {
          method:'POST',
          headers:{ 'X-Api-Key':HEYGEN_KEY, 'Content-Type':'image/jpeg' },
          body:imgBuffer
        });
        if (photoUpload.ok) {
          const pd = await photoUpload.json();
          talkingPhotoId = pd.data?.talking_photo_id||pd.talking_photo_id;
          CACHED_TALKING_PHOTO_ID = talkingPhotoId;
          console.log('HeyGen: new talking_photo_id:', talkingPhotoId);
        } else {
          const errText = await photoUpload.text();
          console.warn('HeyGen photo upload failed:', photoUpload.status, errText.slice(0,200));
          // If upload failed due to limit, try listing again
          if (photoUpload.status === 400 || photoUpload.status === 429) {
            const retryList = await fetch('https://api.heygen.com/v2/talking_photo?limit=10', { headers:{ 'X-Api-Key':HEYGEN_KEY } });
            if (retryList.ok) {
              const rd = await retryList.json();
              const rPhotos = rd.data?.list||rd.data||[];
              if (rPhotos.length > 0) {
                talkingPhotoId = rPhotos[0].talking_photo_id||rPhotos[0].id;
                CACHED_TALKING_PHOTO_ID = talkingPhotoId;
                console.log('HeyGen: fallback to existing photo:', talkingPhotoId);
              }
            }
          }
        }
      }
    } else if (talkingPhotoId) {
      console.log('HeyGen: using cached talking_photo_id:', talkingPhotoId);
    }

    const character = talkingPhotoId
      ? { type:'talking_photo', talking_photo_id:talkingPhotoId, talking_style:'expressive' }
      : { type:'avatar', avatar_id:HEYGEN_AVATAR_ID, avatar_style:'normal' };

    console.log('HeyGen character:', character.type, talkingPhotoId?'(composite)':'(fallback avatar)');

    const videoResp = await fetch('https://api.heygen.com/v2/video/generate', {
      method:'POST',
      headers:{ 'X-Api-Key':HEYGEN_KEY, 'Content-Type':'application/json' },
      body:JSON.stringify({
        video_inputs:[{
          character,
          voice:{ type:'audio', audio_asset_id:audioAssetId },
          background:{ type:'color', value:'#000000' }
        }],
        aspect_ratio: ratio||'16:9',
        test: false
      })
    });
    if (!videoResp.ok) {
      const e = await videoResp.text();
      throw new Error('HeyGen video generate failed: '+videoResp.status+' '+e.slice(0,300));
    }
    const videoData = await videoResp.json();
    const videoId   = videoData.data?.video_id||videoData.video_id;
    if (!videoId) throw new Error('HeyGen: no video_id. '+JSON.stringify(videoData).slice(0,200));
    console.log('HeyGen video_id:', videoId);
    return res.json({ taskId:'heygen-'+videoId, provider:'heygen', usedComposite:!!talkingPhotoId });

  } catch(e) {
    console.error('generateWithHeyGen:', e.message);
    return res.status(500).json({ error:e.message });
  }
}

async function generateWithRunway(req, res, args) {
  const { compositeImageB64, referenceImageBase64, ratio } = args;
  try {
    if (!RUNWAY_KEY) throw new Error('RUNWAY_API_KEY not set');
    const imageToUse = compositeImageB64||referenceImageBase64;
    if (!imageToUse) throw new Error('No image for Runway');
    const ratioMap = { '16:9':'1280:768', '9:16':'768:1280', '1:1':'1024:1024' };
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'Content-Type':'application/json', 'X-Runway-Version':'2024-11-06' },
      body:JSON.stringify({
        promptImage: 'data:image/jpeg;base64,'+imageToUse,
        model: 'gen4_turbo',
        promptText: 'Professional TV presenter speaking to camera. Natural head movement. High quality broadcast video.',
        ratio: ratioMap[ratio]||'1280:768',
        duration: 10
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

app.get('/api/presenter-status', async (req,res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error:'taskId required' });
  try {
    if (taskId.startsWith('kling-done-')) {
      return res.json({ status:'succeed', done:true, failed:false, videoUrl:null });
    }
    if (taskId.startsWith('kling-')) {
      const id    = taskId.replace('kling-','');
      const token = buildKlingJWT();
      // Try lipsync status first, then image2video
      let statusResp = await fetch(KLING_BASE+'/v1/videos/lip-sync/'+id, { headers:{ 'Authorization':'Bearer '+token } });
      if (!statusResp.ok) {
        statusResp = await fetch(KLING_BASE+'/v1/images/image2video/'+id, { headers:{ 'Authorization':'Bearer '+token } });
      }
      const data   = await statusResp.json();
      const task   = data.data||data;
      const status = task.task_status||task.status;
      const videoUrl = task.task_result?.videos?.[0]?.url||task.video_url||null;
      return res.json({ status, videoUrl, done:status==='succeed', failed:status==='failed' });
    }
    if (taskId.startsWith('heygen-')) {
      const id = taskId.replace('heygen-','');
      const sr = await fetch('https://api.heygen.com/v1/video_status.get?video_id='+id, {
        headers:{ 'X-Api-Key':HEYGEN_KEY }
      });
      const sd = await sr.json();
      return res.json({
        status:   sd.data?.status,
        videoUrl: sd.data?.video_url||null,
        done:     sd.data?.status==='completed',
        failed:   sd.data?.status==='failed'
      });
    }
    if (taskId.startsWith('runway-')) {
      const id = taskId.replace('runway-','');
      const r = await fetch('https://api.dev.runwayml.com/v1/tasks/'+id, {
        headers:{ 'Authorization':'Bearer '+RUNWAY_KEY, 'X-Runway-Version':'2024-11-06' }
      });
      const data = await r.json();
      const map  = { PENDING:'pending', RUNNING:'processing', SUCCEEDED:'completed', FAILED:'failed' };
      return res.json({ status:map[data.status]||data.status, videoUrl:data.output?.[0]||null, done:data.status==='SUCCEEDED', failed:data.status==='FAILED' });
    }
    res.status(400).json({ error:'Unknown task provider' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

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
    if (!r.ok) throw new Error('ElevenLabs error: '+r.status+' '+await r.text());
    const buf = await r.arrayBuffer();
    res.json({ audio:Buffer.from(buf).toString('base64') });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/segment', async (req,res) => {
  if (!checkRate(req,res)) return;
  try {
    const { script, wpm=150, sceneDuration=8, title='My Video' } = req.body;
    if (!script||script.trim().length<10) return res.status(400).json({ error:'Script text required.' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error:'Anthropic API key not configured.' });
    const wordsPerScene = Math.round((wpm/60)*sceneDuration);
    const words = script.trim().split(/\s+/);
    const maxWords = 50*wordsPerScene;
    const text = words.length>maxWords ? words.slice(0,maxWords).join(' ')+' [Script continues]' : script.trim();
    const isLong = words.length>maxWords;
    let r;
    try {
      r = await anthropic.messages.create({ model:MODEL, max_tokens:16000,
        system:`Split script into teleprompter scenes. Each ~${wordsPerScene} words. Max 10s per scene. Types: INTRO,MAIN,TRANSITION,SUMMARY,CONCLUSION. Return ONLY valid JSON: {"title":"...","totalScenes":0,"estimatedDuration":"0:00","scenes":[{"id":"s_1","sceneNumber":1,"type":"INTRO","narration":"...","wordCount":0,"duration":${sceneDuration},"notes":"","status":"draft"}]}`,
        messages:[{ role:'user', content:'Segment:\n\n'+text+'\n\nReturn ONLY valid JSON.' }]
      });
    } catch(modelErr) {
      r = await anthropic.messages.create({ model:MODEL_FALLBACK, max_tokens:16000,
        system:'Split into teleprompter scenes. Return ONLY valid JSON.',
        messages:[{ role:'user', content:'Segment:\n\n'+text+'\n\nReturn ONLY valid JSON.' }]
      });
    }
    const raw = r.content.map(c=>c.text||'').join('').trim();
    const j   = raw.indexOf('{');
    if (j===-1) throw new Error('No JSON in response');
    let depth=0, k=-1;
    for (let ci=j; ci<raw.length; ci++) { if(raw[ci]==='{') depth++; else if(raw[ci]==='}'){depth--;if(depth===0){k=ci;break;}} }
    if (k===-1) throw new Error('Could not find valid JSON');
    let result;
    try {
      result = JSON.parse(raw.slice(j,k+1).replace(/,\s*}/g,'}').replace(/,\s*]/g,']').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,' '));
    } catch(e) {
      const rx=/"narration"\s*:\s*"((?:[^\\"]|\\.)*)"/g; const scenes=[]; let m;
      while((m=rx.exec(raw))!==null) { scenes.push({ id:'s_'+(scenes.length+1), sceneNumber:scenes.length+1, type:scenes.length===0?'INTRO':'MAIN', narration:m[1], wordCount:m[1].split(/\s+/).length, duration:Math.min(sceneDuration,10), notes:'', assets:[], status:'draft' }); }
      if (!scenes.length) throw new Error('Could not parse AI response');
      result = { scenes, title };
    }
    let scenes = (result.scenes||[]).map((s,i) => ({ id:s.id||('s_'+(i+1)), sceneNumber:s.sceneNumber||(i+1), type:(s.type||'MAIN').toUpperCase(), narration:(s.narration||s.text||'').trim(), wordCount:s.wordCount||(s.narration||'').split(/\s+/).filter(Boolean).length, duration:Math.min(s.duration||sceneDuration,10), notes:s.notes||'', assets:[], status:'draft' })).filter(s=>s.narration.length>0);
    if (isLong&&scenes.length>0) {
      const covered = scenes.reduce((t,s)=>t+(s.wordCount||0),0);
      const remaining = words.slice(covered); let wi=0;
      while(wi<remaining.length) { const chunk=remaining.slice(wi,wi+wordsPerScene).join(' '); if(chunk.trim().length>5) scenes.push({ id:'s_'+(scenes.length+1), sceneNumber:scenes.length+1, type:'MAIN', narration:chunk, wordCount:chunk.split(/\s+/).length, duration:Math.min(sceneDuration,10), notes:'', assets:[], status:'draft' }); wi+=wordsPerScene; }
    }
    const totalSecs=scenes.reduce((t,s)=>t+s.duration,0);
    res.json({ title:result.title||title, totalScenes:scenes.length, estimatedDuration:Math.floor(totalSecs/60)+':'+String(totalSecs%60).padStart(2,'0'), wpm, sceneDuration, scenes });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/extract-text', async (req,res) => {
  try {
    const { text, fileBase64, mimeType, fileName } = req.body;
    if (text?.trim().length>10) { const clean=text.trim().replace(/\s{3,}/g,'\n\n'); return res.json({ text:clean, words:clean.split(/\s+/).filter(Boolean).length }); }
    if (!fileBase64) return res.status(400).json({ error:'No file or text provided.' });
    const buf = Buffer.from(fileBase64,'base64');
    if (!mimeType||mimeType==='text/plain'||fileName?.endsWith('.txt')) { const t=buf.toString('utf8').trim(); return res.json({ text:t, words:t.split(/\s+/).filter(Boolean).length }); }
    if (mimeType?.includes('wordprocessingml')||fileName?.endsWith('.docx')) { const raw=buf.toString('utf8'); const matches=raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)||[]; const t=matches.map(m=>m.replace(/<[^>]+>/g,'')).join(' ').trim(); if(t.length>10) return res.json({ text:t, words:t.split(/\s+/).filter(Boolean).length }); return res.status(400).json({ error:'Could not extract text from DOCX.' }); }
    return res.status(400).json({ error:'Unsupported file type.' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/stripe/checkout', async (req,res) => {
  try {
    if (!STRIPE_KEY) return res.status(503).json({ error:'Stripe not configured.' });
    const stripe = require('stripe')(STRIPE_KEY);
    const { priceId, mode='subscription', customerEmail } = req.body;
    if (!priceId) return res.status(400).json({ error:'priceId required.' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types:['card'], line_items:[{ price:priceId, quantity:1 }], mode, customer_email:customerEmail,
      success_url:'https://aabstudio.ai?checkout=success', cancel_url:'https://aabstudio.ai/pricing',
      subscription_data:mode==='subscription'?{ trial_period_days:7, trial_settings:{ end_behavior:{ missing_payment_method:'cancel' } } }:undefined,
      payment_method_collection:'always'
    });
    res.json({ url:session.url });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/heygen/avatars', async (req,res) => {
  try {
    if (!HEYGEN_KEY) return res.status(503).json({ error:'HeyGen not configured' });
    const r = await fetch('https://api.heygen.com/v2/avatars', { headers:{ 'X-Api-Key':HEYGEN_KEY } });
    const d = await r.json();
    res.json({ avatars:(d.data?.avatars||[]).slice(0,20).map(a=>({ id:a.avatar_id, name:a.avatar_name, type:a.type })) });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

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

async function ensureAabProjectsTable() {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY) return;
    const sb = getSupaAdmin();
    const { error } = await sb.from('aab_projects').select('id').limit(1);
    if (!error) { console.log('✓ aab_projects table ready'); return; }
    if (error.code==='PGRST205') console.warn('⚠ aab_projects table missing. Create it in Supabase SQL editor.');
  } catch(e) { console.warn('ensureAabProjectsTable:', e.message); }
}

app.listen(PORT, () => {
  console.log('AABStudio v3.1 running on port', PORT);
  console.log('Anthropic: ', !!process.env.ANTHROPIC_API_KEY?'✓':'✗ MISSING');
  console.log('ElevenLabs:', !!ELEVENLABS_KEY?'✓':'✗ MISSING');
  console.log('HeyGen:    ', !!HEYGEN_KEY?'✓':'✗');
  console.log('Kling:     ', !!(KLING_ACCESS_KEY&&KLING_SECRET_KEY)?'✓':'✗');
  console.log('Runway:    ', !!RUNWAY_KEY?'✓':'✗');
  console.log('Stripe:    ', !!STRIPE_KEY?'✓':'✗');
  console.log('Kling API: ', KLING_BASE);
  ensureAabProjectsTable();
  discoverHeyGenAvatar();
});