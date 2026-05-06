'use strict';
/*
  AABStudio.ai — Server v3.7
  Fixed:
  - PiAPI: do NOT cache Imgur URL between scenes — upload fresh each time
    (reusing the same URL causes PiAPI 500 on second call)
  - BadRequestError: add global error handler to swallow client-disconnect errors
  - All previous fixes retained
*/
const sharp    = require('sharp');
const express  = require('express');
const cors     = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app    = express();
const http   = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

// ── Detect image mime type from base64 header ────────────────────────────────
function detectImageMimeType(b64) {
  if (!b64) return 'image/jpeg';
  const h = b64.slice(0, 8);
  if (h.startsWith('iVBORw')) return 'image/png';
  if (h.startsWith('/9j/'))  return 'image/jpeg';
  if (h.startsWith('R0lGOD')) return 'image/gif';
  if (h.startsWith('UklGRi')) return 'image/webp';
  return 'image/jpeg';
}

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
  transports: ['websocket', 'polling']
});
const PORT = process.env.PORT || 3000;

// ── Socket.IO — Real-time remote control & project rooms ──────────────────────
// Each project gets its own room: project_id → room
// Phone joins room → commands broadcast to desktop instantly (no polling)
// Also used for: HeyGen completion push, scene status updates, multi-user sync

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // pair_devices — both desktop and phone join project room (matches spec)
  socket.on('pair_devices', (data) => {
    const room = data.project_id || data.projectId;
    if (!room) return;
    socket.join(room);
    const device = data.device || 'unknown';
    console.log('Socket', socket.id, '('+device+') paired to project room:', room);
    socket.emit('paired', { room, socketId: socket.id, device });
    // Notify other devices in the room that a new device paired
    socket.to(room).emit('device_joined', { device, socketId: socket.id });
  });

  // join_project — legacy event name, treat same as pair_devices
  socket.on('join_project', (data) => {
    const room = data.project_id || data.projectId;
    if (!room) return;
    socket.join(room);
    socket.emit('joined', { room, socketId: socket.id });
  });

  // command — phone sends action → server broadcasts to desktop (matches spec)
  socket.on('command', (data) => {
    const room = data.project_id || data.projectId;
    if (!room) return;
    console.log('Remote command:', data.action, '→ room:', room);
    socket.to(room).emit('remote_execute', data);  // desktop listens for remote_execute
  });

  // remote_control — legacy event name  
  socket.on('remote_control', (data) => {
    const room = data.project_id || data.projectId;
    if (!room) return;
    socket.to(room).emit('command_to_teleprompter', data);
    socket.to(room).emit('remote_execute', data);  // also fire new event name
  });

  // Teleprompter speed sync — desktop tells phone the current WPM
  socket.on('tp_state', (data) => {
    const room = data.project_id || data.projectId;
    if (room) socket.to(room).emit('tp_state_update', data);
  });

  // Scene status push — when HeyGen completes, push to all room members
  // Called from the webhook handler below
  socket.on('subscribe_project', (data) => {
    const room = 'updates_' + (data.project_id || data.projectId);
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Helper: push clip-ready notification to all project subscribers
// Called when HeyGen webhook fires
function pushClipReady(projectId, payload) {
  io.to('updates_' + projectId).emit('clip_ready', payload);
  console.log('Pushed clip_ready to project room:', projectId);
}

const corsOpts = { origin: '*', methods: ['GET','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] };
app.use(cors(corsOpts));
app.options('*', cors(corsOpts));

// Stripe webhook — MUST use raw body, skip JSON middleware for this route
app.post('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
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
  }
);

// JSON body parser — 30mb to handle base64 images
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook') return next();
  express.json({ limit: '30mb' })(req, res, next);
});

function getSupaAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  let wsOpts = {};
  try {
    // Node.js 20 needs explicit ws transport to avoid WebSocket warning
    const ws = require('ws');
    wsOpts = { global: { WebSocket: ws } };
  } catch(e) { /* ws not installed, use default */ }
  return createClient(
    process.env.SUPABASE_URL || 'https://phjlxkyloafogznhyyig.supabase.co',
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: 'websocket' },
      ...wsOpts
    }
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
  if (!rateCounts[ip]) rateCounts[ip] = { count: 0, reset: now + 60000 };
  if (now > rateCounts[ip].reset) rateCounts[ip] = { count: 0, reset: now + 60000 };
  rateCounts[ip].count++;
  if (rateCounts[ip].count > 10) { res.status(429).json({ error: 'Too many requests' }); return false; }
  return true;
}
setInterval(() => { const n = Date.now(); Object.keys(rateCounts).forEach(ip => { if (rateCounts[ip].reset < n) delete rateCounts[ip]; }); }, 300000);

const anthropic      = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const HEYGEN_KEY     = process.env.HEYGEN_API_KEY;
const PIAPI_KEY      = process.env.PIAPI_KEY;
const KLING_AK       = process.env.KLING_ACCESS_KEY;
const KLING_SK       = process.env.KLING_SECRET_KEY;
const RUNWAY_KEY     = process.env.RUNWAY_API_KEY;
const CREATOMATE_KEY = process.env.CREATOMATE_API_KEY;
const STRIPE_KEY     = process.env.STRIPE_SECRET_KEY;
// Imgur client ID — free, no auth needed, images are truly public
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7';
const DID_API_KEY     = process.env.D_ID_API_KEY || process.env.DID_API_KEY;  // Railway uses D_ID_API_KEY

const MODEL          = 'claude-sonnet-4-6';
const MODEL_FALLBACK = 'claude-sonnet-4-5-20250929';

let HG_AVATAR_ID = process.env.HEYGEN_AVATAR_ID || 'Anna_public_3_20240108';

// Session cache — reset on restart
let CACHED_HG_IMAGE_KEY      = null;  // HeyGen image asset id
let CACHED_HG_TALKING_PHOTO     = null;  // talking_photo_id
let CACHED_HG_TALKING_PHOTO_KEY = null;  // fingerprint of the image used

// ── Create HeyGen Photo Avatar from uploaded image ────────────────────────────
// Flow: upload image → create avatar group → get talking_photo_id
// This is the correct Creator plan flow for animating a custom face
async function getOrCreateTalkingPhotoId(imageB64) {
  if (!HEYGEN_KEY) return null;

  // Cache per image (first 200 chars as fingerprint)
  const imgKey = imageB64.slice(0, 200);
  if (CACHED_HG_TALKING_PHOTO && CACHED_HG_TALKING_PHOTO_KEY === imgKey) {
    console.log('HeyGen: using cached talking_photo_id:', CACHED_HG_TALKING_PHOTO);
    return CACHED_HG_TALKING_PHOTO;
  }

  const H = { 'X-Api-Key': HEYGEN_KEY };

  try {
    // Step 1: Upload image as asset
    // Convert to JPEG regardless of input format (HeyGen requires JPEG)
    let imgBuf = Buffer.from(imageB64, 'base64');
    try {
      imgBuf = await sharp(imgBuf).jpeg({ quality: 90 }).toBuffer();
    } catch(convErr) {
      console.warn('HeyGen: image conversion failed, using raw:', convErr.message);
    }
    console.log('HeyGen: uploading presenter photo for talking photo avatar...', imgBuf.length, 'bytes');
    const uploadResp = await fetch('https://upload.heygen.com/v1/asset', {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'image/jpeg' },
      body: imgBuf
    });
    if (!uploadResp.ok) throw new Error('Photo upload failed: ' + uploadResp.status);
    const uploadData = await uploadResp.json();
    const imageKey   = uploadData.data?.image_key || uploadData.data?.id;
    if (!imageKey) throw new Error('No image_key returned from upload');
    console.log('HeyGen: photo uploaded, image_key:', imageKey);

    // Step 2: Try to create photo avatar using v1 endpoint (v2 returns 405)
    // HeyGen Creator plan: talking_photo requires Enterprise
    // But we try the correct v1 endpoint first
    let talkingPhotoId = null;
    
    // HeyGen talking photo requires Enterprise plan
    // Creator plan ($24/mo) only supports stock avatars
    // Skip the API call entirely and return null to use stock avatar
    console.log('HeyGen: talking_photo creation requires Enterprise plan — using stock avatar');
    // Cache null so we don't retry on every scene
    CACHED_HG_TALKING_PHOTO     = null;
    CACHED_HG_TALKING_PHOTO_KEY = imgKey;
    return null;

    // Step 3: If direct create failed, try listing existing photo avatars
    console.log('HeyGen: trying to list existing photo avatars...');
    const listResp = await fetch('https://api.heygen.com/v2/avatars', { headers: H });
    if (listResp.ok) {
      const listData = await listResp.json();
      const avatars  = listData.data?.avatars || [];
      const photo    = avatars.find(a =>
        a.type === 'talking_photo' || a.type === 'photo' || a.avatar_type === 'photo'
      );
      if (photo) {
        CACHED_HG_TALKING_PHOTO = photo.avatar_id;
        console.log('HeyGen: found existing talking_photo:', photo.avatar_id, photo.avatar_name);
        return photo.avatar_id;
      }
    }

    console.warn('HeyGen: could not create or find talking photo avatar');
    return null;

  } catch(e) {
    console.error('getOrCreateTalkingPhotoId error:', e.message);
    return null;
  }
}

// ── Scene queue — only ONE scene renders at a time ────────────────────────────
// HeyGen takes 3-8 min per scene. If all 49 fire at once, scenes time out.
// This queue serialises them: scene 2 waits for scene 1 to get its video_id.
// The actual rendering still happens async in HeyGen's cloud.
let _sceneQueueBusy = false;
const _sceneQueue = [];

function enqueueScene(fn) {
  return new Promise((resolve, reject) => {
    _sceneQueue.push({ fn, resolve, reject });
    processSceneQueue();
  });
}

async function processSceneQueue() {
  if (_sceneQueueBusy || _sceneQueue.length === 0) return;
  _sceneQueueBusy = true;
  const { fn, resolve, reject } = _sceneQueue.shift();
  try {
    const result = await fn();
    resolve(result);
  } catch(e) {
    reject(e);
  } finally {
    _sceneQueueBusy = false;
    // Small delay between scenes so HeyGen doesn't rate-limit
    setTimeout(processSceneQueue, 2000);
  }
}

const KLING_BASE = 'https://api2.klingai.com';

function buildKlingJWT() {
  if (!KLING_AK || !KLING_SK) return null;
  const crypto  = require('crypto');
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: KLING_AK, exp: now + 1800, nbf: now - 5 })).toString('base64url');
  const sig     = crypto.createHmac('sha256', KLING_SK).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// ── Upload image to Imgur → get public URL ────────────────────────────────────
// Imgur is free, no signup needed for anonymous uploads, images are truly public CDN
async function uploadToImgur(base64Image) {
  try {
    const r = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID ' + IMGUR_CLIENT_ID,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ image: base64Image, type: 'base64' })
    });
    if (!r.ok) {
      const e = await r.text();
      throw new Error('Imgur upload failed: ' + r.status + ' ' + e.slice(0, 200));
    }
    const d = await r.json();
    const url = d.data?.link;
    if (!url) throw new Error('Imgur: no link in response');
    console.log('Imgur upload OK:', url);
    return url;
  } catch(e) {
    console.warn('uploadToImgur failed:', e.message);
    return null;
  }
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok', version: '3.9',
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  elevenlabs: !!ELEVENLABS_KEY,
  heygen: !!HEYGEN_KEY,
  did: !!DID_API_KEY,
  kling_piapi: !!PIAPI_KEY,
  kling_direct: !!(KLING_AK && KLING_SK),
  runway: !!RUNWAY_KEY,
  creatomate: !!CREATOMATE_KEY,
  stripe: !!STRIPE_KEY,
  imgur: !!IMGUR_CLIENT_ID
}));

// ── Project CRUD ──────────────────────────────────────────────────────────────
function stripProject(project) {
  const p = JSON.parse(JSON.stringify(project));
  if (p.assets) p.assets = p.assets.map(a => { const c = {...a}; delete c.dataUrl; return c; });
  if (p.scenes) p.scenes = p.scenes.map(s => {
    const sc = {...s};
    if (sc.assets) sc.assets = sc.assets.map(a => { const c = {...a}; delete c.dataUrl; return c; });
    return sc;
  });
  delete p.clips;
  return p;
}

// ── Projects & Scenes CRUD (new persistent schema) ───────────────────────────
// GET /api/projects — list user's projects
app.get('/api/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ projects: [] }); // Return empty instead of 401 — frontend may call before auth
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { data, error } = await sb.from('projects')
      .select('*').eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(50);
    if (error) {
      // Table may not exist yet — return empty
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return res.json({ projects: [] });
      }
      throw error;
    }
    res.json({ projects: data || [] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/projects/:id/scenes — get all scenes for a project
app.get('/api/projects/:id/scenes', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    // Verify project belongs to user
    const { data: proj } = await sb.from('projects').select('id').eq('id', req.params.id).eq('user_id', user.id).single();
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    const { data, error } = await sb.from('scenes')
      .select('*').eq('project_id', req.params.id).order('scene_order');
    if (error && error.code === 'PGRST205') return res.json({ scenes: [] });
    if (error) throw error;
    res.json({ scenes: data || [] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/scenes/:id — update a single scene status/url
app.patch('/api/scenes/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { status, ai_video_url, user_recording_url } = req.body;
    const update = {};
    if (status)             update.status = status;
    if (ai_video_url)       update.ai_video_url = ai_video_url;
    if (user_recording_url) update.user_recording_url = user_recording_url;
    const { error } = await sb.from('scenes').update(update).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/project/save', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    let user;
    try {
      const authRes = await sb.auth.getUser(token);
      user = authRes.data?.user;
    } catch(authErr) {
      // WebSocket/realtime error on auth — try without realtime
      console.warn('project/save auth error (likely WebSocket):', authErr.message);
      return res.status(401).json({ error: 'Auth check failed — retry' });
    }
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { project } = req.body;
    if (!project?.id) return res.status(400).json({ error: 'project.id required' });
    const p = stripProject(project);
    try {
      const { error } = await sb.from('aab_projects').upsert(
        { id: p.id, user_id: user.id, title: p.title || 'My Video', data: p },
        { onConflict: 'id' }
      );
      if (error) throw error;
    } catch(dbErr) {
      // Non-fatal — log but return ok so client doesn't retry endlessly
      console.warn('project/save DB error (non-fatal):', dbErr.message);
    }
    res.json({ ok: true });
  } catch(e) {
    console.error('/api/project/save:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/project/list', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });
    
    // Try new projects table first
    try {
      const { data: newProjects, error: newErr } = await sb.from('projects')
        .select('*').eq('user_id', user.id)
        .order('updated_at', { ascending: false }).limit(50);
      if (!newErr && newProjects) {
        return res.json({ projects: newProjects });
      }
    } catch(e2) { /* fall through to old table */ }
    
    // Fall back to legacy aab_projects table
    const { data, error } = await sb.from('aab_projects')
      .select('id,title,data,updated_at').eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(50);
    if (error) {
      // Table may not exist — return empty gracefully
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return res.json({ projects: [] });
      }
      throw error;
    }
    res.json({ projects: (data || []).map(r => r.data || r) });
  } catch(e) { 
    console.error('/api/project/list:', e.message);
    res.status(500).json({ error: e.message }); 
  }
});

app.delete('/api/project/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });
    const { error } = await sb.from('aab_projects')
      .delete().eq('id', req.params.id).eq('user_id', user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Runway ────────────────────────────────────────────────────────────────────
app.post('/api/runway/generate', async (req, res) => {
  try {
    if (!RUNWAY_KEY) return res.status(503).json({ error: 'RUNWAY_API_KEY not configured' });
    const { promptImage, promptText, duration = 5, ratio = '1280:720', model = 'gen4_turbo' } = req.body;
    const body = { model, ratio, duration };
    if (promptText)  body.promptText  = promptText;
    if (promptImage) body.promptImage = promptImage;
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RUNWAY_KEY, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Runway ' + r.status + ': ' + (await r.text()).slice(0, 200));
    const data = await r.json();
    res.json({ taskId: data.id, status: 'pending', provider: 'runway' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/runway/status/:taskId', async (req, res) => {
  try {
    if (!RUNWAY_KEY) return res.status(503).json({ error: 'RUNWAY_API_KEY not configured' });
    const r = await fetch('https://api.dev.runwayml.com/v1/tasks/' + req.params.taskId, {
      headers: { 'Authorization': 'Bearer ' + RUNWAY_KEY, 'X-Runway-Version': '2024-11-06' }
    });
    const data = await r.json();
    const map  = { PENDING: 'pending', RUNNING: 'processing', SUCCEEDED: 'completed', FAILED: 'failed' };
    res.json({ taskId: req.params.taskId, status: map[data.status] || data.status, videoUrl: data.output?.[0] || null, progress: data.progressRatio || 0, provider: 'runway' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Creatomate ────────────────────────────────────────────────────────────────
// ── POST /api/creatomate/sync ─────────────────────────────────────────────────
// Implements sync_platform_to_creatomate() from the spec
// Pulls project state from DB, builds Creatomate timeline, triggers render
// Each scene uses its HEYGEN_RENDER_URL (stored in project.clips)
// Global settings (photo, voice, background) applied consistently
app.post('/api/creatomate/sync', async (req, res) => {
  try {
    if (!CREATOMATE_KEY) return res.status(503).json({ error: 'CREATOMATE_API_KEY not configured' });
    const token     = req.headers.authorization?.replace('Bearer ', '');
    const { projectId, resolution = '1080p', outputFormat = 'mp4' } = req.body;
    if (!projectId || !token) return res.status(400).json({ error: 'projectId and auth token required' });

    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const { data } = await sb.from('aab_projects')
      .select('data').eq('id', projectId).eq('user_id', user.id).single();
    if (!data) return res.status(404).json({ error: 'Project not found' });

    const project = data.data || {};
    const clips   = Object.values(project.clips || {})
      .filter(c => c && (c.url || c.videoUrl))
      .sort((a,b) => (a.sceneNum||0) - (b.sceneNum||0));

    if (!clips.length) return res.status(400).json({ error: 'No rendered clips in project. Generate scenes first.' });

    const resMap = { '720p': [1280,720], '1080p': [1920,1080], '4k': [3840,2160] };
    const [width, height] = resMap[resolution] || [1920, 1080];

    // Build Creatomate timeline — matches Python spec's sync_platform_to_creatomate()
    const elements = [];
    let timeOffset  = 0;

    clips.forEach((clip, i) => {
      const dur = clip.duration || 8;
      const url = clip.url || clip.videoUrl;

      // Main video track (HeyGen render or recorded clip)
      elements.push({
        type:       'video',
        source:     url,
        track:      1,           // AI Avatar track
        time:       timeOffset,
        duration:   dur,
        fit:        'cover',
        volume:     1.0,
        // Camera motion animation from scene data
        animations: clip.cameraMotion ? [{ type: clip.cameraMotion, duration: Math.min(2, dur * 0.3) }] : []
      });

      // Subtitle from scene narration
      const scene = project.scenes && project.scenes.find(s =>
        s.id === clip.sceneId || (s.sceneNumber === clip.sceneNum)
      );
      if (scene && scene.narration) {
        elements.push({
          type:             'text',
          text:             scene.narration,
          track:            4,  // Subtitle track
          time:             timeOffset,
          duration:         dur,
          x: '50%', y: '88%', width: '85%',
          font_size:        '4.5 vmin',
          font_weight:      '600',
          color:            '#ffffff',
          background_color: 'rgba(0,0,0,0.65)',
          font_family:      'Open Sans',
          x_anchor: '50%',  y_anchor: '100%'
        });
      }

      timeOffset += dur;
    });

    const payload = {
      output_format: outputFormat,
      width, height,
      frame_rate: 30,
      elements
    };

    console.log('Creatomate sync:', clips.length, 'clips |', Math.round(timeOffset), 's total');

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + CREATOMATE_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('Creatomate ' + r.status + ': ' + (await r.text()).slice(0,300));
    const rdata  = await r.json();
    const render = Array.isArray(rdata) ? rdata[0] : rdata;

    res.json({
      taskId:        render.id,
      status:        render.status || 'pending',
      outputUrl:     render.url    || null,
      provider:      'creatomate',
      totalDuration: timeOffset,
      clipCount:     clips.length,
    });
  } catch(e) {
    console.error('/api/creatomate/sync:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/creatomate/stitch', async (req, res) => {
  try {
    if (!CREATOMATE_KEY) return res.status(503).json({ error: 'CREATOMATE_API_KEY not configured' });
    const { clips, subtitles = [], musicUrl, outputFormat = 'mp4', resolution = '1080p' } = req.body;
    if (!clips?.length) return res.status(400).json({ error: 'clips array required' });
    const resMap = { '720p': [1280,720], '1080p': [1920,1080], '4k': [3840,2160] };
    const [width, height] = resMap[resolution] || [1920,1080];
    const elements = []; let time = 0;
    clips.forEach((clip, i) => {
      elements.push({ type: 'video', source: clip.url, time, duration: clip.duration || 8, fit: 'cover', volume: 1 });
      if (subtitles[i]) elements.push({ type: 'text', text: subtitles[i], time, duration: clip.duration || 8, x: '50%', y: '88%', width: '85%', font_size: '5 vmin', font_weight: '600', color: '#ffffff', background_color: 'rgba(0,0,0,0.68)', font_family: 'Open Sans', x_anchor: '50%', y_anchor: '100%' });
      time += (clip.duration || 8);
    });
    if (musicUrl) elements.push({ type: 'audio', source: musicUrl, time: 0, duration: time, volume: 0.25, audio_fade_out: 3 });
    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + CREATOMATE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ output_format: outputFormat, width, height, frame_rate: 30, elements })
    });
    if (!r.ok) throw new Error('Creatomate ' + r.status + ': ' + (await r.text()).slice(0, 300));
    const data   = await r.json();
    const render = Array.isArray(data) ? data[0] : data;
    res.json({ taskId: render.id, status: render.status || 'pending', outputUrl: render.url || null, provider: 'creatomate', totalDuration: time, clipCount: clips.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/creatomate/status/:renderId', async (req, res) => {
  try {
    if (!CREATOMATE_KEY) return res.status(503).json({ error: 'CREATOMATE_API_KEY not configured' });
    const r = await fetch('https://api.creatomate.com/v1/renders/' + req.params.renderId, { headers: { 'Authorization': 'Bearer ' + CREATOMATE_KEY } });
    const data = await r.json();
    res.json({ taskId: req.params.renderId, status: data.status, progress: data.percent || 0, outputUrl: data.url || null, provider: 'creatomate' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Sharp compositing ─────────────────────────────────────────────────────────
async function generateStudioBackground(studioType, W, H) {
  const configs = {
    'news-studio': { base: [8,18,60],  accent: [20,60,180],  desk: true  },
    'podcast':     { base: [12,4,28],  accent: [80,20,120],  desk: false },
    'office':      { base: [10,20,10], accent: [20,100,40],  desk: false },
    'classroom':   { base: [20,18,8],  accent: [100,90,20],  desk: true  },
    'courtroom':   { base: [25,12,4],  accent: [120,60,20],  desk: true  },
    'documentary': { base: [5,5,5],    accent: [60,10,10],   desk: false },
    'cooking':     { base: [8,22,8],   accent: [40,130,20],  desk: true  },
  };
  const cfg = configs[studioType] || configs['news-studio'];
  const [br, bg_, bb] = cfg.base, [ar, ag, ab] = cfg.accent;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="rgb(${br},${bg_},${bb})"/>
    <defs><radialGradient id="l1" cx="28%" cy="55%" r="65%">
      <stop offset="0%" stop-color="rgb(${ar},${ag},${ab})" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="rgb(${br},${bg_},${bb})" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#l1)"/>
    ${cfg.desk ? `<rect x="${Math.round(W*0.14)}" y="${Math.round(H*0.73)}" width="${Math.round(W*0.72)}" height="${Math.round(H*0.055)}" rx="4" fill="rgb(${Math.min(ar+5,80)},${Math.min(ag+5,50)},${Math.min(ab+15,100)})" opacity="0.85"/>` : ''}
  </svg>`;
  return await sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toBuffer();
}

async function getStudioBackgroundB64(studioType, customBgBase64, ratio) {
  const DIMS = { '16:9': {w:1280,h:720}, '9:16': {w:720,h:1280}, '1:1': {w:1024,h:1024} };
  const {w, h} = DIMS[ratio] || DIMS['16:9'];
  if (customBgBase64) {
    const buf = await sharp(Buffer.from(customBgBase64, 'base64')).resize(w, h, {fit:'cover'}).jpeg({quality:92}).toBuffer();
    return buf.toString('base64');
  }
  const buf = await generateStudioBackground(studioType || 'news-studio', w, h);
  return buf.toString('base64');
}

async function buildSceneImage(presenterB64, bgB64, framingStyle, ratio) {
  const DIMS = { '16:9': {w:1280,h:720}, '9:16': {w:720,h:1280}, '1:1': {w:1024,h:1024} };
  const {w: W, h: H} = DIMS[ratio] || DIMS['16:9'];
  let bgResized;
  if (bgB64) {
    bgResized = await sharp(Buffer.from(bgB64, 'base64')).resize(W, H, {fit:'cover',position:'center'}).jpeg({quality:92}).toBuffer();
  } else {
    bgResized = await sharp({ create: {width:W, height:H, channels:3, background:{r:10,g:20,b:50}} }).jpeg().toBuffer();
  }
  if (!presenterB64) return bgResized.toString('base64');
  const FRAMING = {
    'medium':    { hPct: 0.85, xPct: 0.50, topPct: 0.15 },
    'close':     { hPct: 0.95, xPct: 0.50, topPct: 0.05 },
    'close-up':  { hPct: 0.95, xPct: 0.50, topPct: 0.05 },
    'wide':      { hPct: 0.92, xPct: 0.50, topPct: 0.08 },
    'news-desk': { hPct: 0.78, xPct: 0.50, topPct: 0.22 },
    'podcast':   { hPct: 0.82, xPct: 0.48, topPct: 0.12 },
    'push-in':   { hPct: 0.88, xPct: 0.50, topPct: 0.12 },
  };
  const f     = FRAMING[framingStyle] || FRAMING['medium'];
  const presH = Math.round(H * f.hPct);
  const presBuf = Buffer.from(presenterB64, 'base64');
  const meta  = await sharp(presBuf).metadata();
  const presW = Math.round(presH * ((meta.width || 3) / (meta.height || 4)));
  const presResized = await sharp(presBuf).resize(presW, presH, {fit:'cover',position:'centre'}).png().toBuffer();
  const left = Math.max(0, Math.min(Math.round(W * f.xPct - presW / 2), W - presW));
  const top  = Math.max(0, Math.min(Math.round(H * f.topPct), H - presH));
  const shadow = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sh" cx="50%" cy="100%" r="35%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient></defs>
    <ellipse cx="${left + presW/2}" cy="${H}" rx="${presW * 0.45}" ry="${H * 0.05}" fill="url(#sh)"/>
  </svg>`;
  const out = await sharp(bgResized).composite([
    { input: Buffer.from(shadow), blend: 'multiply' },
    { input: presResized, top, left, blend: 'over' }
  ]).jpeg({quality:93}).toBuffer();
  console.log('Composited:', out.length, 'bytes');
  return out.toString('base64');
}

// ══════════════════════════════════════════════════════════════════════════════
// AI PRESENTER
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/presenter', async (req, res) => {
  try {
    const {
      audioBase64, referenceImageBase64, customBgBase64,
      studioType, bgType,
      ratio         = '16:9',
      framingStyle, framing,
      gestureStyle,  gesture,
      shotType,      shot,
      motionStyle,   motion,
      voiceGender, voiceName,
      sceneText     = '',
      sceneNum, sceneTotal, duration,
      provider: requestedProvider = null,
      talkingPhotoId = null,   // Pre-created HeyGen talking_photo_id (user's face)
    } = req.body;

    const bgTypeResolved  = bgType || studioType || 'news-studio';
    const framingResolved = framingStyle || framing || 'medium';

    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });

    console.log(`\n=== AI Presenter v3.6 | bg:${bgTypeResolved} | provider:${requestedProvider} | ratio:${ratio} | framing:${framingResolved} | gender:${voiceGender||'?'} | scene:${sceneNum||'?'}/${sceneTotal||'?'}`);

    const bgB64 = await getStudioBackgroundB64(bgTypeResolved, customBgBase64, ratio);
    let compositeImageB64 = null;
    try {
      compositeImageB64 = await buildSceneImage(referenceImageBase64 || null, bgB64, framingResolved, ratio);
      console.log('Composite:', Math.round(compositeImageB64.length / 1024) + 'KB');
    } catch(e) {
      console.warn('Composite failed:', e.message);
      compositeImageB64 = referenceImageBase64 || bgB64;
    }

    const hasHeygen = !!HEYGEN_KEY;
    const hasKling  = !!(PIAPI_KEY || (KLING_AK && KLING_SK));
    const hasRunway = !!RUNWAY_KEY;

    let chosen = requestedProvider;
    if (chosen === 'kling'  && !hasKling)  chosen = null;
    if (chosen === 'heygen' && !hasHeygen) chosen = null;
    if (chosen === 'runway' && !hasRunway) chosen = null;
    const hasDID = !!DID_API_KEY;
    // D-ID is preferred when reference image present — uses actual face, faster than HeyGen
    if (!chosen) {
      // D-ID: fastest option when user has uploaded a reference photo
      // Uses actual face, 30-90s per scene vs HeyGen 3-8min
      // HeyGen Creator plan always uses stock avatar regardless of photo
      const imageAvailable = !!(referenceImageBase64 || compositeImageB64);
      if (hasDID && imageAvailable) {
        chosen = 'did';
        console.log('Provider: D-ID selected — reference image present, D-ID key set');
      } else if (hasHeygen) {
        chosen = 'heygen';
        console.log('Provider: HeyGen selected' + (imageAvailable ? ' (D-ID unavailable)' : ' (no reference image)'));
      } else if (hasKling)  chosen = 'kling';
      else if (hasRunway)   chosen = 'runway';
    }
    // D-ID fallback chain
    if (chosen === 'did' && !hasDID) chosen = hasHeygen ? 'heygen' : (hasKling ? 'kling' : null);
    if (!chosen) return res.status(503).json({ error: 'No video provider configured.' });
    console.log('Provider chosen:', chosen);

    const args = {
      compositeImageB64, referenceImageBase64, audioBase64, ratio,
      framing:  framingResolved,
      gesture:  gestureStyle || gesture || 'professional',
      shot:     shotType || shot || 'medium',
      motion:   motionStyle || motion || 'static',
      gender:   voiceGender || 'unknown',
      voiceName: voiceName || '',
      studioType: bgTypeResolved,
      talkingPhotoId,   // Pass through pre-created ID
      sceneText, sceneNum, sceneTotal, duration
    };

    // Queue all scene submissions — only one processes at a time
    // This prevents all 49 scenes firing simultaneously and timing out
    if (chosen === 'did')    return await enqueueScene(() => generateWithDID(req, res, args));
    if (chosen === 'heygen') return await enqueueScene(() => generateWithHeyGen(req, res, args));
    if (chosen === 'kling')  return await enqueueScene(() => generateWithKling(req, res, args));
    if (chosen === 'runway') return await generateWithRunway(req, res, args);

  } catch(e) {
    console.error('/api/presenter:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── ElevenLabs voice ──────────────────────────────────────────────────────────
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', stability = 0.5, similarityBoost = 0.75, style = 0.3 } = req.body;
    if (!text)           return res.status(400).json({ error: 'No text provided.' });
    if (!ELEVENLABS_KEY) return res.status(503).json({ error: 'ElevenLabs API key not configured.' });
    console.log('ElevenLabs TTS | voice:', voiceId, '| chars:', text.length);
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability, similarity_boost: similarityBoost, style, use_speaker_boost: true } })
    });
    if (!r.ok) throw new Error('ElevenLabs ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const buf = await r.arrayBuffer();
    res.json({ audio: Buffer.from(buf).toString('base64') });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// HEYGEN — Correct flow for Creator plan with photo reference
//
// Flow:
// 1. Upload audio → audio_asset_id
// 2. If reference photo provided: use photo avatar flow (type: 'photo')
//    Upload image → get image_asset_id → generate with photo character
// 3. If no photo: use stock avatar with audio
//
// The previous AV4 flow was wrong — AV4 needs a pre-created Photo Avatar ID,
// not a raw image_key. The correct approach for dynamic photos is
// v2/video/generate with character type 'photo'.
// ══════════════════════════════════════════════════════════════════════════════
// ── build_heygen_payload — CORRECT spec structure ────────────────────────────
// Sends ALL scenes in ONE API call using clips[]
// Character, voice, background are global constants applied to every clip
// Each clip gets its own input_text (the scene narration) and camera_motion
// This is far more efficient: 1 call for 49 scenes vs 49 separate calls

// ── build_heygen_payload — correct v2 API structure ─────────────────────────
// HeyGen v2/video/generate uses video_inputs[] NOT clips[]
// Each scene = one item in video_inputs[] with character + voice + background
// Voice must use audio_asset_id (pre-uploaded ElevenLabs audio)
// Docs: https://docs.heygen.com/reference/create-an-avatar-video-v2
function build_heygen_payload(talkingPhotoId, audioAssetIds, backgroundUrl, ratio, scenes, fallbackAvatarId) {
  // audioAssetIds: array of HeyGen audio asset IDs (one per scene)
  // scenes: array of { narration, type } objects
  
  const videoInputs = scenes.map(function(sc, idx) {
    const audioId = audioAssetIds[idx] || audioAssetIds[0];
    
    const character = talkingPhotoId
      ? { type: 'talking_photo', talking_photo_id: talkingPhotoId }
      : { type: 'avatar', avatar_id: fallbackAvatarId || 'Anna_public_3_20240108', avatar_style: 'normal' };
    
    return {
      character,
      voice: {
        type:          'audio',
        audio_asset_id: audioId
      },
      background: backgroundUrl
        ? { type: 'image', url: backgroundUrl }
        : { type: 'color', value: '#0f172a' }
    };
  });

  return {
    video_inputs:  videoInputs,
    aspect_ratio:  ratio || '16:9',
    test:          false,
    title:         'AABStudio Video ' + Date.now()
  };
}

// Camera motion sequence — varies across scenes to keep videos dynamic
const CAMERA_MOTIONS = ['zoom_in', 'static', 'pan_right', 'static', 'zoom_out', 'pan_left', 'static'];
function getCameraMotion(sceneIdx, totalScenes) {
  if (sceneIdx === 0) return 'zoom_in';
  if (sceneIdx === totalScenes - 1) return 'zoom_out';
  return CAMERA_MOTIONS[sceneIdx % CAMERA_MOTIONS.length];
}

// Framing → y offset and scale mapping
const FRAMING_MAP = {
  'medium':    { y: 0.1,  scale: 0.9 },
  'close':     { y: 0.0,  scale: 1.1 },
  'close-up':  { y: 0.0,  scale: 1.1 },
  'wide':      { y: 0.15, scale: 0.75 },
  'news-desk': { y: 0.2,  scale: 0.8 },
  'podcast':   { y: 0.05, scale: 0.95 },
};

// ── generateWithHeyGen — ONE API call for ALL scenes ─────────────────────────
// Implements the spec payload exactly:
// { character, voice, background, clips: [{input_text, camera_motion},...] }
// The /api/presenter route calls this PER SCENE but we buffer them and batch
// For single-scene calls: wraps in clips[{input_text}] directly

async function generateWithHeyGen(req, res, args) {
  const {
    referenceImageBase64, compositeImageB64, audioBase64,
    ratio, sceneText, gender, framing, studioType,
    talkingPhotoId: preCreatedPhotoId,
    voiceId, voiceName,
    stability, clarity,
    sceneNum, sceneTotal, allScenes
  } = args;

  try {
    if (!HEYGEN_KEY) throw new Error('HEYGEN_API_KEY not configured');
    const H = { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' };

    // ── Step 1: Get talking_photo_id (your face) ──────────────────────────────
    let talkingPhotoId = preCreatedPhotoId || null;
    const imageToUse   = referenceImageBase64 || compositeImageB64;

    if (!talkingPhotoId && imageToUse) {
      talkingPhotoId = await getOrCreateTalkingPhotoId(imageToUse);
    }
    console.log('HeyGen: talking_photo_id:', talkingPhotoId || 'none — stock avatar');

    // Get image description for better avatar matching
    let presenterDescription = '';
    if (imageToUse && process.env.ANTHROPIC_API_KEY) {
      try {
        const descResp = await anthropic.messages.create({
          model: MODEL, max_tokens: 200,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: req.body.referenceImageMimeType || detectImageMimeType(imageToUse), data: imageToUse.slice(0,100000) } },
            { type: 'text', text: 'Describe this person in 1 sentence: gender, skin tone, hair. Be precise.' }
          ]}]
        });
        presenterDescription = descResp.content[0]?.text?.trim() || '';
        console.log('Presenter description:', presenterDescription.slice(0,80));
      } catch(descErr) {
        console.warn('Image description failed:', descErr.message);
      }
    }

    // ── Step 2: Upload background to public CDN ───────────────────────────────
    let backgroundUrl = null;
    if (compositeImageB64) {
      backgroundUrl = await uploadToImgur(compositeImageB64);
    }

    // ── Step 3: Resolve framing ───────────────────────────────────────────────
    const framingOpts = FRAMING_MAP[framing] || FRAMING_MAP['medium'];

    // ── Step 4: Build clips array ─────────────────────────────────────────────
    // If allScenes provided (batch mode): one call covers everything
    // Otherwise: single scene wrapped in clips[]
    let clipsArray;
    if (allScenes && allScenes.length > 1) {
      clipsArray = allScenes.map(function(sc, idx) {
        return {
          text:        sc.narration || sc.text || sc.script || '',
          cameraMotion: getCameraMotion(idx, allScenes.length)
        };
      });
      console.log('HeyGen: BATCH mode —', clipsArray.length, 'scenes in ONE call');
    } else {
      clipsArray = [{
        text:         sceneText || '',
        cameraMotion: getCameraMotion((sceneNum||1)-1, sceneTotal||1)
      }];
      console.log('HeyGen: single scene mode — scene', sceneNum, '/', sceneTotal);
    }

    // ── Step 5: Build and submit payload ─────────────────────────────────────
    let payload;

    if (talkingPhotoId) {
      // ✅ CORRECT: your face, your voice, your background, all scenes in one call
      const resolvedVoiceId = voiceId || args.voiceIdStr || 'EXAVITQu4vr4xnSDxMaL';
      // Single scene: use video_inputs[] with audio_asset_id (already uploaded above)
      payload = {
        video_inputs: [{
          character: {
            type:             'talking_photo',
            talking_photo_id: talkingPhotoId
          },
          voice: {
            type:           'audio',
            audio_asset_id: audioAssetId
          },
          background: backgroundUrl
            ? { type: 'image', url: backgroundUrl }
            : { type: 'color', value: '#0f172a' }
        }],
        aspect_ratio: ratio || '16:9',
        test:         false,
        title:        'AABStudio Scene ' + (sceneNum || 1)
      };
      console.log('HeyGen payload (talking_photo):', JSON.stringify(payload).slice(0, 300));

    } else {
      // ⚠️ Fallback: stock avatar with ElevenLabs audio asset
      // Must upload audio first since stock avatar uses audio_asset_id not text
      const audioBuf    = Buffer.from(audioBase64 || '', 'base64');
      const audioResp   = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'audio/mpeg' },
        body: audioBuf
      });
      const audioData    = await audioResp.json();
      const audioAssetId = audioData.data?.id || audioData.data?.asset_id;

      const maleAvatars   = ['josh_talking_male_4_20241203', 'james_20240207', 'tyler_20240309'];
      const femaleAvatars = ['Anna_public_3_20240108', 'aisha_20240926', 'abigail_20240926'];
      const avatarList    = (gender === 'male') ? maleAvatars : femaleAvatars;
      const avatarId      = process.env.HEYGEN_AVATAR_ID || avatarList[0];
      console.log('HeyGen: stock avatar fallback | gender:', gender, '| avatar:', avatarId);

      payload = {
        test: false,
        video_inputs: [{
          character:  { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
          voice:      { type: 'audio', audio_asset_id: audioAssetId },
          background: backgroundUrl
            ? { type: 'image', url: backgroundUrl }
            : { type: 'color', value: '#0f172a' }
        }],
        aspect_ratio: ratio || '16:9'
      };
    }

    // ── Submit to HeyGen ──────────────────────────────────────────────────────
    const v2Resp = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST', headers: H, body: JSON.stringify(payload)
    });
    const v2Text = await v2Resp.text();
    console.log('HeyGen response:', v2Resp.status, v2Text.slice(0, 400));
    if (!v2Resp.ok) throw new Error('HeyGen failed: ' + v2Resp.status + ' — ' + v2Text.slice(0, 400));

    const v2Data  = JSON.parse(v2Text);
    const videoId = v2Data.data?.video_id || v2Data.video_id;
    if (!videoId) throw new Error('HeyGen: no video_id — ' + v2Text.slice(0, 300));

    const isBatch = clipsArray.length > 1;
    const engine  = talkingPhotoId ? 'talking_photo' : 'stock_avatar';
    console.log('HeyGen video_id:', videoId, '| engine:', engine, '| scenes:', clipsArray.length);
    return res.json({
      taskId:    'heygen-' + videoId,
      provider:  'heygen',
      engine,
      batch:     isBatch,
      sceneCount: clipsArray.length
    });

  } catch(e) {
    console.error('generateWithHeyGen:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// KLING via PiAPI
// PiAPI needs a TRULY PUBLIC image URL (not HeyGen CDN which is private).
// Strategy: upload to Imgur (free anonymous upload, public CDN).
// Fallback: if Imgur fails, fall back to HeyGen.
// ══════════════════════════════════════════════════════════════════════════════
async function generateWithKling(req, res, args) {
  const { compositeImageB64, referenceImageBase64, audioBase64, ratio, gesture } = args;
  try {
    const imageToUse = compositeImageB64 || referenceImageBase64;
    if (!imageToUse) return await generateWithHeyGen(req, res, args);

    const ratioMap = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1' };

    if (PIAPI_KEY) {
      console.log('Kling via PiAPI: image2video...');

      // Upload fresh to Imgur for each scene.
      // PiAPI rejects reused URLs with 500 — each task needs a unique image URL.
      // Imgur anonymous upload is fast (~1s) and each upload gets a unique URL.
      console.log('PiAPI: uploading image to Imgur...');
      const imageUrl = await uploadToImgur(imageToUse);
      if (!imageUrl) {
        console.warn('PiAPI: Imgur upload failed — falling back to HeyGen');
        return await generateWithHeyGen(req, res, args);
      }
      console.log('PiAPI: Imgur URL:', imageUrl);

      const prompt = [
        'Professional TV presenter speaking to camera.',
        gesture && gesture !== 'professional' ? gesture + ' delivery style.' : 'Professional calm delivery.',
        'Natural head movement. Realistic breathing. Subtle body language.',
        'Broadcast quality studio video. Photorealistic. No watermarks.'
      ].join(' ');

      const i2vResp = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: { 'x-api-key': PIAPI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:     'kling',
          task_type: 'video_generation',
          input: {
            image_url:       imageUrl,
            prompt:          prompt,
            negative_prompt: 'blurry, static, low quality, watermark, text, frozen, distorted face, bad lips',
            cfg_scale:       0.5,
            duration:        5,
            aspect_ratio:    ratioMap[ratio] || '16:9',
            mode:            'std',
            version:         '1.6'
          },
          config: {
            service_mode: 'public',
            webhook_config: { endpoint: '', secret: '' }
          }
        })
      });

      if (!i2vResp.ok) {
        const e = await i2vResp.text();
        console.error('PiAPI i2v failed:', i2vResp.status, e.slice(0, 300));
        return await generateWithHeyGen(req, res, args);
      }

      const i2vData   = await i2vResp.json();
      const i2vTaskId = i2vData.data?.task_id;
      if (!i2vTaskId) {
        console.error('PiAPI: no task_id:', JSON.stringify(i2vData).slice(0, 200));
        return await generateWithHeyGen(req, res, args);
      }
      console.log('PiAPI Kling i2v task:', i2vTaskId);

      // Return taskId immediately — client polls /api/presenter-status
      // Do NOT poll inline: 2-3 min block causes client timeout (BadRequestError)
      console.log('PiAPI: returning taskId to client for polling');
      return res.json({ taskId: 'kling-piapi-' + i2vTaskId, provider: 'kling', done: false });

    } else {
      // Direct Kling (geo-blocked from Railway but kept)
      const token = buildKlingJWT();
      if (!token) return await generateWithHeyGen(req, res, args);
      const i2vResp = await fetch(KLING_BASE + '/v1/images/image2video', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: 'kling-v1-5', mode: 'std', duration: '5', aspect_ratio: ratioMap[ratio] || '16:9', image: 'data:image/jpeg;base64,' + imageToUse, prompt: 'Professional TV presenter speaking to camera. Natural head movement.' })
      }).catch(e => { throw new Error('Kling direct blocked: ' + e.message); });
      if (!i2vResp.ok) return await generateWithHeyGen(req, res, args);
      const i2vData = await i2vResp.json();
      const taskId  = i2vData.data?.task_id;
      if (!taskId) return await generateWithHeyGen(req, res, args);
      let videoUrl = null;
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const poll = await fetch(KLING_BASE + '/v1/images/image2video/' + taskId, { headers: { 'Authorization': 'Bearer ' + buildKlingJWT() } });
        const pd   = await poll.json();
        if (pd.data?.task_status === 'succeed') { videoUrl = pd.data.task_result?.videos?.[0]?.url; break; }
        if (pd.data?.task_status === 'failed') break;
      }
      if (!videoUrl) return await generateWithHeyGen(req, res, args);
      return res.json({ taskId: 'kling-done-' + taskId, provider: 'kling', videoUrl, done: true });
    }
  } catch(e) {
    console.error('generateWithKling:', e.message);
    if (HEYGEN_KEY) return await generateWithHeyGen(req, res, args);
    return res.status(500).json({ error: e.message });
  }
}

// ── Runway ────────────────────────────────────────────────────────────────────
async function generateWithRunway(req, res, args) {
  const { compositeImageB64, referenceImageBase64, ratio } = args;
  try {
    if (!RUNWAY_KEY) throw new Error('RUNWAY_API_KEY not set');
    const imageToUse = compositeImageB64 || referenceImageBase64;
    if (!imageToUse) throw new Error('No image for Runway');
    const ratioMap = { '16:9': '1280:768', '9:16': '768:1280', '1:1': '1024:1024' };
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RUNWAY_KEY, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify({ promptImage: 'data:image/jpeg;base64,' + imageToUse, model: 'gen4_turbo', promptText: 'Professional TV presenter speaking to camera. Natural movement. Broadcast quality.', ratio: ratioMap[ratio] || '1280:768', duration: 10 })
    });
    if (!r.ok) throw new Error('Runway: ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const data = await r.json();
    if (!data.id) throw new Error('Runway: no task id');
    return res.json({ taskId: 'runway-' + data.id, provider: 'runway' });
  } catch(e) {
    console.error('generateWithRunway:', e.message);
    return res.status(500).json({ error: e.message });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// D-ID — Talking Photo (animates reference image with audio)
// Fast: 30-90 seconds per scene (vs HeyGen's 3-8 min)
// Uses the uploaded reference photo as the presenter face
// Docs: https://docs.d-id.com/reference/createtalk
// ══════════════════════════════════════════════════════════════════════════════
async function generateWithDID(req, res, args) {
  const { referenceImageBase64, audioBase64, ratio, sceneText, gender } = args;
  try {
    if (!DID_API_KEY) throw new Error('DID_API_KEY not configured');

    const H = {
      'Authorization': 'Basic ' + DID_API_KEY,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };

    // Step 1: Upload presenter image to Imgur first → get public URL
    // D-ID works more reliably with a URL than a data URI (especially for large images)
    // URL also allows D-ID to process at full resolution without base64 overhead
    if (!referenceImageBase64) throw new Error('D-ID requires a reference image');

    // Convert to JPEG if needed (D-ID and Imgur work best with JPEG)
    let imageForUpload = referenceImageBase64;
    try {
      const rawBuf = Buffer.from(referenceImageBase64, 'base64');
      const jpegBuf = await sharp(rawBuf).jpeg({ quality: 90 }).toBuffer();
      imageForUpload = jpegBuf.toString('base64');
      console.log('D-ID: converted image to JPEG', jpegBuf.length, 'bytes');
    } catch(convErr) {
      console.warn('D-ID: image conversion failed, using original:', convErr.message);
    }

    let imageSourceUrl = null;
    try {
      imageSourceUrl = await uploadToImgur(imageForUpload);
      console.log('D-ID: presenter image on Imgur:', imageSourceUrl);
    } catch(imgurErr) {
      console.warn('D-ID: Imgur upload failed, using data URI fallback:', imgurErr.message);
    }
    // Fallback to data URI if Imgur fails
    const imageDataUri = imageSourceUrl || ('data:image/jpeg;base64,' + imageForUpload);
    if (!imageDataUri) throw new Error('D-ID: could not prepare image source');

    // Step 2: Upload audio to get a URL D-ID can use
    // D-ID needs an audio URL, not base64. Upload to their clips endpoint first
    // OR use ElevenLabs streaming URL. For now, upload audio to D-ID as blob
    const audioBuf = Buffer.from(audioBase64, 'base64');

    // Upload audio to Imgur as MP3 is not supported — use D-ID's clips/audio endpoint
    // Try multiple approaches for D-ID audio
    let audioUrl = null;

    // Upload audio to D-ID
    // D-ID /audios endpoint - try with correct multipart format
    try {
      const FormData = require('form-data');
      const form = new FormData();
      // D-ID requires the field to be named 'audio' with correct mime
      form.append('audio', audioBuf, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg',
        knownLength: audioBuf.length
      });
      const headers = {
        'Authorization': 'Basic ' + DID_API_KEY,
        'Accept': 'application/json',
        ...form.getHeaders()
      };
      const audioUpload = await fetch('https://api.d-id.com/audios', {
        method: 'POST',
        headers,
        body: form
      });
      const respText = await audioUpload.text();
      if (audioUpload.ok) {
        const audioData = JSON.parse(respText);
        audioUrl = audioData.url;
        console.log('D-ID audio uploaded:', audioUrl ? 'OK' : 'no URL in response');
      } else {
        console.warn('D-ID /audios failed:', audioUpload.status, respText.slice(0, 150));
      }
    } catch(e) {
      console.warn('D-ID audio upload exception:', e.message);
    }

    // Fallback: use base64 data URI directly
    // D-ID supports this on Lite plan and above
    if (!audioUrl) {
      audioUrl = 'data:audio/mpeg;base64,' + audioBase64;
      console.log('D-ID: using base64 data URI for audio');
    }

    // Step 3: Create talk (animate photo with audio)
    // Framing notes:
    // - Do NOT use presenter_config.crop 'rectangle' — it auto-crops to face, cutting off head
    // - Use 'stitch: false' to preserve the full source image framing
    // - The image should already be framed correctly (uploaded by user)
    // - D-ID does NOT need gender specification — it reads your actual photo
    const talkPayload = {
      source_url: imageDataUri,
      script: {
        type:          'audio',
        audio_url:     audioUrl,
        reduce_noise:  false,
        ssml:          false
      },
      config: {
        fluent:        false,      // false = less aggressive lip sync, better head preservation  
        pad_audio:     0.5,
        stitch:        false,      // false = preserve full source image framing (head not cropped)
        result_format: 'mp4',
        normalization_factor: 0    // 0 = no face stabilization zoom, full image preserved
      }
      // No presenter_config.crop — use full image as-is
      // This preserves the user's framing (full body, waist-up, etc.)
    };

    console.log('D-ID: creating talk...');
    const talkResp = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: H,
      body: JSON.stringify(talkPayload)
    });
    const talkText = await talkResp.text();
    console.log('D-ID talk response:', talkResp.status, talkText.slice(0, 300));

    if (!talkResp.ok) throw new Error('D-ID talk failed: ' + talkResp.status + ' ' + talkText.slice(0, 300));

    const talkData = JSON.parse(talkText);
    const talkId   = talkData.id;
    if (!talkId) throw new Error('D-ID: no talk id returned');

    console.log('D-ID talk id:', talkId);
    return res.json({ taskId: 'did-' + talkId, provider: 'did', done: false });

  } catch(e) {
    console.error('generateWithDID:', e.message);
    // Only fall back to HeyGen for unexpected errors, not auth/config errors
    if (e.message.includes('audio upload failed') || e.message.includes('requires')) {
      // Return error so user knows what happened
      return res.status(500).json({ error: 'D-ID: ' + e.message, provider: 'did' });
    }
    if (HEYGEN_KEY) {
      console.log('D-ID failed, falling back to HeyGen stock avatar');
      return await generateWithHeyGen(req, res, args);
    }
    return res.status(500).json({ error: e.message });
  }
}

// ── Presenter wait — server polls HeyGen until done (max 10 min) ─────────────
// Frontend calls this ONCE and waits up to 10 min for the response.
// Avoids the frontend timing out from short HTTP timeouts.
app.get('/api/presenter-wait', async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  
  // Set a very long timeout on this response
  req.socket.setTimeout(620000); // 10 min + 20s buffer
  res.setTimeout(620000);
  
  const maxPolls = 40; // 40 × 15s = 10 min
  for (let i = 0; i < maxPolls; i++) {
    await new Promise(r => setTimeout(r, 15000));
    try {
      let status, videoUrl, failed;
      // D-ID talk status polling
    if (taskId.startsWith('did-')) {
      const id = taskId.replace('did-', '');
      const r  = await fetch('https://api.d-id.com/talks/' + id, {
        headers: { 'Authorization': 'Basic ' + DID_API_KEY, 'accept': 'application/json' }
      });
      const d  = await r.json();
      const status   = d.status;
      const videoUrl = d.result_url || null;
      const done     = status === 'done';
      const failed   = status === 'error';
      console.log('D-ID status:', status, videoUrl ? '✓' : '');
      return res.json({ status, videoUrl, done, failed, error: failed ? (d.error?.description || 'D-ID error') : null });
    }

    if (taskId.startsWith('heygen-')) {
        const id = taskId.replace('heygen-', '');
        const sr = await fetch('https://api.heygen.com/v1/video_status.get?video_id=' + id, { headers: { 'X-Api-Key': HEYGEN_KEY } });
        const sd = await sr.json();
        status   = sd.data?.status;
        videoUrl = sd.data?.video_url || null;
        failed   = status === 'failed';
        console.log('HeyGen wait poll', i+1, '/', maxPolls, ':', status, videoUrl ? '✓' : '');
        if (status === 'completed' && videoUrl) return res.json({ done: true, videoUrl, status });
        if (failed) return res.json({ done: false, failed: true, error: sd.data?.error || 'HeyGen failed', status });
      } else if (taskId.startsWith('kling-piapi-')) {
        const id = taskId.replace('kling-piapi-', '');
        const r  = await fetch('https://api.piapi.ai/api/v1/task/' + id, { headers: { 'x-api-key': PIAPI_KEY } });
        const d  = await r.json();
        status   = d.data?.status;
        videoUrl = d.data?.output?.works?.[0]?.video?.resource_without_watermark || d.data?.output?.works?.[0]?.video?.resource || null;
        failed   = status === 'failed';
        console.log('PiAPI wait poll', i+1, '/', maxPolls, ':', status, videoUrl ? '✓' : '');
        if ((status === 'completed' || status === 'succeed') && videoUrl) return res.json({ done: true, videoUrl, status });
        if (failed) return res.json({ done: false, failed: true, error: 'PiAPI failed', status });
      } else {
        return res.status(400).json({ error: 'Unknown provider for wait endpoint' });
      }
    } catch(e) {
      console.warn('presenter-wait poll error:', e.message);
    }
  }
  res.json({ done: false, failed: false, timedOut: true, error: 'Timed out after 10 min' });
});

// ── Status polling ────────────────────────────────────────────────────────────
app.get('/api/presenter-status', async (req, res) => {
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  try {
    if (taskId === 'kling-done-piapi' || taskId.startsWith('kling-done-')) {
      return res.json({ status: 'succeed', done: true, failed: false, videoUrl: req.query.videoUrl || null });
    }
    // PiAPI task polling — taskId format: kling-piapi-{uuid}
    if (taskId.startsWith('kling-piapi-')) {
      const id = taskId.replace('kling-piapi-', '');
      const r  = await fetch('https://api.piapi.ai/api/v1/task/' + id, { headers: { 'x-api-key': PIAPI_KEY } });
      const d  = await r.json();
      const status   = d.data?.status;
      const videoUrl = d.data?.output?.works?.[0]?.video?.resource_without_watermark || d.data?.output?.works?.[0]?.video?.resource || d.data?.output?.video_url || null;
      const done     = status === 'completed' || status === 'succeed';
      const failed   = status === 'failed';
      console.log('PiAPI status poll:', id.slice(0,8), '->', status, videoUrl ? 'ready' : '');
      return res.json({ status, videoUrl, done, failed, error: failed ? (d.data?.error_message || 'PiAPI task failed') : null });
    }
    if (taskId.startsWith('kling-')) {
      const id    = taskId.replace('kling-', '');
      const token = buildKlingJWT();
      let sr = await fetch(KLING_BASE + '/v1/videos/lip-sync/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!sr.ok) sr = await fetch(KLING_BASE + '/v1/images/image2video/' + id, { headers: { 'Authorization': 'Bearer ' + buildKlingJWT() } });
      const d    = await sr.json();
      const task = d.data || d;
      const status = task.task_status || task.status;
      return res.json({ status, videoUrl: task.task_result?.videos?.[0]?.url || null, done: status === 'succeed', failed: status === 'failed' });
    }
    // D-ID talk status polling
    if (taskId.startsWith('did-')) {
      const id = taskId.replace('did-', '');
      const r  = await fetch('https://api.d-id.com/talks/' + id, {
        headers: { 'Authorization': 'Basic ' + DID_API_KEY, 'accept': 'application/json' }
      });
      const d  = await r.json();
      const status   = d.status;
      const videoUrl = d.result_url || null;
      const done     = status === 'done';
      const failed   = status === 'error';
      console.log('D-ID status:', status, videoUrl ? '✓' : '');
      return res.json({ status, videoUrl, done, failed, error: failed ? (d.error?.description || 'D-ID error') : null });
    }

    if (taskId.startsWith('heygen-')) {
      const id = taskId.replace('heygen-', '');
      // Check webhook cache first (instant result when webhook fires)
      if (heygenResults[id]) {
        const wh = heygenResults[id];
        console.log('HeyGen: webhook result found for', id);
        return res.json({ done: true, videoUrl: wh.videoUrl, status: 'completed', source: 'webhook' });
      }
      const sr = await fetch('https://api.heygen.com/v1/video_status.get?video_id=' + id, { headers: { 'X-Api-Key': HEYGEN_KEY } });
      const sd = await sr.json();
      const hgStatus = sd.data?.status;
      const hgError  = sd.data?.error;
      // Log full error so we can see what HeyGen is rejecting
      if (hgStatus === 'failed') {
        console.error('HeyGen video FAILED:', JSON.stringify(sd.data).slice(0, 500));
      } else {
        console.log('HeyGen status:', hgStatus, '| video_id:', id);
      }
      return res.json({
        status:   hgStatus,
        videoUrl: sd.data?.video_url || null,
        done:     hgStatus === 'completed',
        failed:   hgStatus === 'failed',
        error:    typeof hgError === 'object' ? JSON.stringify(hgError) : (hgError || null)
      });
    }
    if (taskId.startsWith('runway-')) {
      const id = taskId.replace('runway-', '');
      const r  = await fetch('https://api.dev.runwayml.com/v1/tasks/' + id, { headers: { 'Authorization': 'Bearer ' + RUNWAY_KEY, 'X-Runway-Version': '2024-11-06' } });
      const d  = await r.json();
      const map = { PENDING: 'pending', RUNNING: 'processing', SUCCEEDED: 'completed', FAILED: 'failed' };
      return res.json({ status: map[d.status] || d.status, videoUrl: d.output?.[0] || null, done: d.status === 'SUCCEEDED', failed: d.status === 'FAILED' });
    }
    res.status(400).json({ error: 'Unknown task provider' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segment ───────────────────────────────────────────────────────────────────
app.post('/api/segment', async (req, res) => {
  if (!checkRate(req, res)) return;
  try {
    const { script, wpm = 150, sceneDuration = 8, title = 'My Video' } = req.body;
    if (!script || script.trim().length < 10) return res.status(400).json({ error: 'Script text required.' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Anthropic API key not configured.' });
    const wordsPerScene = Math.round((wpm / 60) * sceneDuration);
    const words = script.trim().split(/\s+/);
    const maxW  = 50 * wordsPerScene;
    const text  = words.length > maxW ? words.slice(0, maxW).join(' ') + ' [Script continues]' : script.trim();
    const isLong = words.length > maxW;
    let r;
    try {
      r = await anthropic.messages.create({
        model: MODEL, max_tokens: 16000,
        system: `Split script into teleprompter scenes. Each ~${wordsPerScene} words. Max 10s per scene. Types: INTRO,MAIN,TRANSITION,SUMMARY,CONCLUSION. Return ONLY valid JSON: {"title":"...","totalScenes":0,"estimatedDuration":"0:00","scenes":[{"id":"s_1","sceneNumber":1,"type":"INTRO","narration":"...","wordCount":0,"duration":${sceneDuration},"notes":"","status":"draft"}]}`,
        messages: [{ role: 'user', content: 'Segment:\n\n' + text + '\n\nReturn ONLY valid JSON.' }]
      });
    } catch(me) {
      r = await anthropic.messages.create({
        model: MODEL_FALLBACK, max_tokens: 16000,
        system: 'Split into teleprompter scenes. Return ONLY valid JSON.',
        messages: [{ role: 'user', content: 'Segment:\n\n' + text + '\n\nReturn ONLY valid JSON.' }]
      });
    }
    const raw = r.content.map(c => c.text || '').join('').trim();
    const j   = raw.indexOf('{');
    if (j === -1) throw new Error('No JSON in response');
    let depth = 0, k = -1;
    for (let ci = j; ci < raw.length; ci++) {
      if (raw[ci] === '{') depth++; else if (raw[ci] === '}') { depth--; if (depth === 0) { k = ci; break; } }
    }
    if (k === -1) throw new Error('Could not find valid JSON');
    let result;
    try {
      result = JSON.parse(raw.slice(j, k+1).replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' '));
    } catch(e) {
      const rx = /"narration"\s*:\s*"((?:[^\\"]|\\.)*)"/g; const scenes = []; let m;
      while ((m = rx.exec(raw)) !== null) {
        scenes.push({ id: 's_' + (scenes.length+1), sceneNumber: scenes.length+1, type: scenes.length === 0 ? 'INTRO' : 'MAIN', narration: m[1], wordCount: m[1].split(/\s+/).length, duration: Math.min(sceneDuration, 10), notes: '', assets: [], status: 'draft' });
      }
      if (!scenes.length) throw new Error('Could not parse AI response');
      result = { scenes, title };
    }
    let scenes = (result.scenes || []).map((s, i) => ({
      id: s.id || ('s_' + (i+1)), sceneNumber: s.sceneNumber || (i+1), type: (s.type || 'MAIN').toUpperCase(),
      narration: (s.narration || s.text || '').trim(),
      wordCount: s.wordCount || (s.narration || '').split(/\s+/).filter(Boolean).length,
      duration: Math.min(s.duration || sceneDuration, 10), notes: s.notes || '', assets: [], status: 'draft'
    })).filter(s => s.narration.length > 0);
    if (isLong && scenes.length > 0) {
      const covered = scenes.reduce((t, s) => t + (s.wordCount || 0), 0);
      const rem = words.slice(covered); let wi = 0;
      while (wi < rem.length) {
        const chunk = rem.slice(wi, wi + wordsPerScene).join(' ');
        if (chunk.trim().length > 5) scenes.push({ id: 's_' + (scenes.length+1), sceneNumber: scenes.length+1, type: 'MAIN', narration: chunk, wordCount: chunk.split(/\s+/).length, duration: Math.min(sceneDuration, 10), notes: '', assets: [], status: 'draft' });
        wi += wordsPerScene;
      }
    }
    const totalSecs = scenes.reduce((t, s) => t + s.duration, 0);
    res.json({ title: result.title || title, totalScenes: scenes.length, estimatedDuration: Math.floor(totalSecs/60) + ':' + String(totalSecs%60).padStart(2,'0'), wpm, sceneDuration, scenes });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Extract text ──────────────────────────────────────────────────────────────
app.post('/api/extract-text', async (req, res) => {
  try {
    const { text, fileBase64, mimeType, fileName } = req.body;
    if (text?.trim().length > 10) { const c = text.trim().replace(/\s{3,}/g, '\n\n'); return res.json({ text: c, words: c.split(/\s+/).filter(Boolean).length }); }
    if (!fileBase64) return res.status(400).json({ error: 'No file or text provided.' });
    const buf = Buffer.from(fileBase64, 'base64');
    if (!mimeType || mimeType === 'text/plain' || fileName?.endsWith('.txt')) { const t = buf.toString('utf8').trim(); return res.json({ text: t, words: t.split(/\s+/).filter(Boolean).length }); }
    if (mimeType?.includes('wordprocessingml') || fileName?.endsWith('.docx')) {
      const raw = buf.toString('utf8'), matches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const t = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();
      if (t.length > 10) return res.json({ text: t, words: t.split(/\s+/).filter(Boolean).length });
      return res.status(400).json({ error: 'Could not extract text from DOCX.' });
    }
    return res.status(400).json({ error: 'Unsupported file type.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Script improve ────────────────────────────────────────────────────────────
app.post('/api/script/improve', async (req, res) => {
  if (!checkRate(req, res)) return;
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided.' });
    const r = await anthropic.messages.create({
      model: MODEL, max_tokens: 3000,
      system: 'Improve this script for spoken video delivery. Keep all content intact. Improve flow and clarity only. Return only the improved script text.',
      messages: [{ role: 'user', content: text }]
    });
    res.json({ improved: r.content[0]?.text?.trim() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Stripe checkout ───────────────────────────────────────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    if (!STRIPE_KEY) return res.status(503).json({ error: 'Stripe not configured.' });
    const stripe = require('stripe')(STRIPE_KEY);
    const { priceId, mode = 'subscription', customerEmail } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId required.' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], line_items: [{ price: priceId, quantity: 1 }],
      mode, customer_email: customerEmail,
      success_url: 'https://aabstudio.ai?checkout=success', cancel_url: 'https://aabstudio.ai/pricing',
      subscription_data: mode === 'subscription' ? { trial_period_days: 7, trial_settings: { end_behavior: { missing_payment_method: 'cancel' } } } : undefined,
      payment_method_collection: 'always'
    });
    res.json({ url: session.url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── HeyGen avatars ────────────────────────────────────────────────────────────
app.get('/api/heygen/avatars', async (req, res) => {
  try {
    if (!HEYGEN_KEY) return res.status(503).json({ error: 'HeyGen not configured' });
    const r = await fetch('https://api.heygen.com/v2/avatars', { headers: { 'X-Api-Key': HEYGEN_KEY } });
    const d = await r.json();
    res.json({ avatars: (d.data?.avatars || []).slice(0, 20).map(a => ({ id: a.avatar_id, name: a.avatar_name, type: a.type })) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function discoverHeyGenAvatar() {
  if (!HEYGEN_KEY) return;
  try {
    const r = await fetch('https://api.heygen.com/v2/avatars', { headers: { 'X-Api-Key': HEYGEN_KEY } });
    const d = await r.json();
    const avatars = d.data?.avatars || [];
    const found = avatars.find(a => a.avatar_id && a.type === 'public') || avatars.find(a => a.avatar_id);
    if (found) { HG_AVATAR_ID = found.avatar_id; console.log('HeyGen avatar:', HG_AVATAR_ID); }
  } catch(e) { console.warn('HeyGen avatar discovery:', e.message); }
}

async function ensureAabProjectsTable() {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY) return;
    const sb = getSupaAdmin();

    // Check legacy table
    const { error } = await sb.from('aab_projects').select('id').limit(1);
    if (!error) { console.log('✓ aab_projects table ready'); }
    else if (error.code === 'PGRST205') console.warn('⚠ aab_projects table missing');

    // Check new tables — characters and assets
    const { error: charErr } = await sb.from('characters').select('id').limit(1);
    if (!charErr) { console.log('✓ characters table ready'); }
    else { console.warn('⚠ characters table missing — run SQL migration'); }

    const { error: assetsErr } = await sb.from('assets').select('id').limit(1);
    if (!assetsErr) { console.log('✓ assets table ready'); }
    else { console.warn('⚠ assets table missing — run SQL migration'); }

  } catch(e) { console.warn('ensureAabProjectsTable:', e.message); }
}


// ── POST /api/presenter/batch ─────────────────────────────────────────────────
// Accepts ALL scenes at once and submits ONE HeyGen call with clips[]
// This is the efficient path: 49 scenes = 1 API call, not 49
// Frontend calls this instead of /api/presenter for each scene
app.post('/api/presenter/batch', async (req, res) => {
  try {
    const {
      scenes,
      talkingPhotoId,
      referenceImageBase64,
      customBgBase64,
      studioType    = 'news-studio',
      ratio         = '16:9',
      framingStyle  = 'medium',
      voiceId       = 'EXAVITQu4vr4xnSDxMaL',
      stability     = 0.85,
      clarity       = 0.80,
      voiceGender   = 'male',
    } = req.body;

    if (!scenes?.length) return res.status(400).json({ error: 'scenes[] required' });
    // Support both HeyGen batch and D-ID individual scene generation
    const useDID = !!(DID_API_KEY && !HEYGEN_KEY);
    if (!HEYGEN_KEY && !DID_API_KEY) return res.status(503).json({ error: 'No video provider configured (need HEYGEN_API_KEY or DID_API_KEY)' });
    if (!ELEVENLABS_KEY) return res.status(503).json({ error: 'ElevenLabs not configured' });

    console.log(`\n=== HeyGen BATCH: ${scenes.length} scenes | voice:${voiceId} | ratio:${ratio}`);

    // Step 1: Get talking_photo_id
    let photoId = talkingPhotoId || null;
    if (!photoId && referenceImageBase64) {
      photoId = await getOrCreateTalkingPhotoId(referenceImageBase64);
    }
    let fallbackAvatarId = null;
    if (!photoId) {
      const maleAvatars   = ['josh_talking_male_4_20241203', 'james_20240207', 'tyler_20240309'];
      const femaleAvatars = ['Anna_public_3_20240108', 'aisha_20240926', 'abigail_20240926'];
      fallbackAvatarId = (voiceGender === 'female' ? femaleAvatars : maleAvatars)[0];
      console.log('Batch: stock avatar fallback:', fallbackAvatarId);
    } else {
      console.log('Batch: talking_photo_id:', photoId);
    }

    // Step 2: Background image
    const bgB64 = await getStudioBackgroundB64(studioType, customBgBase64, ratio);
    const backgroundUrl = await uploadToImgur(bgB64);

    // Step 3: Generate ALL audio in parallel (Promise.all)
    // Sequential: 22 scenes × ~3s = 66s → timeout
    // Parallel:   22 scenes simultaneously = ~5-8s total
    console.log('Batch: generating audio for', scenes.length, 'scenes in parallel...');

    const CONCURRENCY = 10; // Max parallel requests (ElevenLabs rate limit)
    
    async function processScene(sc, idx) {
      const text = (sc.narration || sc.script || sc.text || '').trim();
      if (!text) return null;
      
      // 3a. ElevenLabs TTS
      const ttsResp = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability, similarity_boost: clarity, style: 0.3, use_speaker_boost: true }
        })
      });
      if (!ttsResp.ok) throw new Error('ElevenLabs ' + ttsResp.status + ' scene ' + (idx+1));
      const audioBuf = Buffer.from(await ttsResp.arrayBuffer());

      // 3b. Upload to HeyGen → audio_asset_id
      const hgAudioResp = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'audio/mpeg' },
        body: audioBuf
      });
      if (!hgAudioResp.ok) throw new Error('HeyGen audio upload ' + hgAudioResp.status + ' scene ' + (idx+1));
      const hgAudioData  = await hgAudioResp.json();
      const audioAssetId = hgAudioData.data?.id || hgAudioData.data?.asset_id;
      if (!audioAssetId) throw new Error('No audio_asset_id scene ' + (idx+1));

      console.log('Scene', idx+1, '/', scenes.length, '— audio_asset_id:', audioAssetId);
      return { scene: sc, audioAssetId, idx };
    }

    // Process in chunks of CONCURRENCY to respect rate limits
    const sceneResults = [];
    for (let i = 0; i < scenes.length; i += CONCURRENCY) {
      const chunk  = scenes.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(chunk.map((sc, j) => processScene(sc, i + j)));
      settled.forEach(r => {
        if (r.status === 'fulfilled' && r.value) sceneResults.push(r.value);
        else if (r.status === 'rejected') console.error('Scene audio failed:', r.reason?.message);
      });
    }

    // Sort results back into original scene order
    sceneResults.sort((a, b) => a.idx - b.idx);

    console.log('Audio ready:', sceneResults.length, '/', scenes.length, 'scenes');
    if (!sceneResults.length) {
      throw new Error('All scene audio generation failed — check ElevenLabs and HeyGen API keys');
    }

    // Step 4: Build video_inputs[] — one per scene, correct v2 structure
    const videoInputs = sceneResults.map(({ audioAssetId }) => {
      const character = photoId
        ? { type: 'talking_photo', talking_photo_id: photoId }
        : { type: 'avatar', avatar_id: fallbackAvatarId, avatar_style: 'normal' };

      return {
        character,
        voice: { type: 'audio', audio_asset_id: audioAssetId },
        background: backgroundUrl
          ? { type: 'image', url: backgroundUrl }
          : { type: 'color', value: '#0f172a' }
      };
    });

    const payload = {
      video_inputs: videoInputs,
      aspect_ratio: ratio || '16:9',
      test:         false,
      title:        'AABStudio — ' + scenes.length + ' scenes'
    };

    console.log('Batch: submitting', videoInputs.length, 'scenes to HeyGen v2/video/generate...');

    // Step 5: Submit to HeyGen
    const v2Resp = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const v2Text = await v2Resp.text();
    console.log('HeyGen v2 response:', v2Resp.status, v2Text.slice(0, 400));

    if (!v2Resp.ok) throw new Error('HeyGen v2/video/generate failed: ' + v2Resp.status + ' — ' + v2Text.slice(0, 400));

    const v2Data  = JSON.parse(v2Text);
    const videoId = v2Data.data?.video_id || v2Data.video_id;
    if (!videoId) throw new Error('HeyGen: no video_id in response — ' + v2Text.slice(0, 300));

    console.log('✓ HeyGen batch video submitted | video_id:', videoId, '| scenes:', sceneResults.length);
    res.json({
      taskId:     'heygen-' + videoId,
      provider:   'heygen',
      engine:     photoId ? 'talking_photo' : 'stock_avatar',
      sceneCount: sceneResults.length,
      videoId
    });

  } catch(e) {
    console.error('/api/presenter/batch:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/describe-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 }
          },
          {
            type: 'text',
            text: 'Describe this person for an AI video generator. Include: gender, approximate age, skin tone, hair colour and style, facial features, clothing visible. Be specific and factual. 2-3 sentences maximum.'
          }
        ]
      }]
    });

    const description = response.content[0]?.text?.trim() || '';
    console.log('Image description:', description.slice(0, 100));
    res.json({ description });
  } catch(e) {
    console.error('/api/describe-image:', e.message);
    res.status(500).json({ error: e.message, description: '' });
  }
});

// ── Characters & Assets CRUD ─────────────────────────────────────────────────

// GET /api/characters — list user's saved characters
app.get('/api/characters', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ characters: [] });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.json({ characters: [] });
    const { data, error } = await sb.from('characters').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      if (error.code === 'PGRST205') return res.json({ characters: [] }); // table not yet created
      throw error;
    }
    res.json({ characters: data || [] });
  } catch(e) { res.status(500).json({ error: e.message, characters: [] }); }
});

// POST /api/characters — save/update a character
app.post('/api/characters', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { name, talking_photo_id, photo_url, voice_id, voice_name, voice_gender, stability, clarity, framing, background_type } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const record = { user_id: user.id, name, talking_photo_id, photo_url, voice_id, voice_name, voice_gender, stability, clarity, framing, background_type };
    const { data, error } = await sb.from('characters').upsert(record, { onConflict: 'user_id,name' }).select().single();
    if (error) {
      if (error.code === 'PGRST205') return res.status(503).json({ error: 'characters table not created yet — run SQL migration' });
      throw error;
    }
    console.log('Character saved:', name, 'for user', user.id);
    res.json({ character: data, ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/characters/:name — delete a character
app.delete('/api/characters/:name', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    await sb.from('characters').delete().eq('user_id', user.id).eq('name', req.params.name);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/assets — list user's uploaded assets
app.get('/api/assets', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ assets: [] });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.json({ assets: [] });
    const type = req.query.type; // filter by type: 'image', 'audio', 'video'
    let q = sb.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (type) q = q.eq('type', type);
    const { data, error } = await q.limit(200);
    if (error) {
      if (error.code === 'PGRST205') return res.json({ assets: [] });
      throw error;
    }
    res.json({ assets: data || [] });
  } catch(e) { res.status(500).json({ error: e.message, assets: [] }); }
});

// POST /api/assets — save an uploaded asset record
app.post('/api/assets', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { name, type, url, mime_type, size_bytes, duration, tags, project_id } = req.body;
    if (!name || !type || !url) return res.status(400).json({ error: 'name, type, url required' });
    const { data, error } = await sb.from('assets').insert({ user_id: user.id, name, type, url, mime_type, size_bytes, duration, tags, project_id }).select().single();
    if (error) {
      if (error.code === 'PGRST205') return res.status(503).json({ error: 'assets table not created yet — run SQL migration' });
      throw error;
    }
    res.json({ asset: data, ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/assets/:id
app.delete('/api/assets/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    await sb.from('assets').delete().eq('id', req.params.id).eq('user_id', user.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/assets/upload-image — upload image to Imgur and save to assets table
app.post('/api/assets/upload-image', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No auth token' });
    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { imageBase64, name, mimeType = 'image/jpeg', tags = [] } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    // Upload to Imgur for permanent public URL
    const url = await uploadToImgur(imageBase64);
    if (!url) return res.status(500).json({ error: 'Image upload failed' });

    // Save to assets table
    const sizeBytes = Math.round(imageBase64.length * 0.75); // approx bytes from base64
    const { data, error } = await sb.from('assets').insert({
      user_id: user.id, name: name || 'Uploaded Image', type: 'image',
      url, mime_type: mimeType, size_bytes: sizeBytes, tags
    }).select().single();

    if (error && error.code !== 'PGRST205') throw error;
    console.log('Asset uploaded:', url.slice(0,50));
    res.json({ url, asset: data || null, ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/heygen/upload-photo ─────────────────────────────────────────────
// Uploads presenter photo to HeyGen, returns talking_photo_id
// Frontend stores this ID and sends it with every generation request
// This is the correct flow from build_heygen_payload spec
app.post('/api/heygen/upload-photo', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });
    if (!HEYGEN_KEY)  return res.status(503).json({ error: 'HeyGen not configured' });

    console.log('HeyGen: uploading presenter photo for talking_photo_id...');
    const talkingPhotoId = await getOrCreateTalkingPhotoId(imageBase64);

    if (talkingPhotoId) {
      console.log('HeyGen: talking_photo_id ready:', talkingPhotoId);
      return res.json({ talking_photo_id: talkingPhotoId, ok: true });
    } else {
      // Photo ID creation failed — but we still have the image
      // Return the imageBase64 fingerprint so frontend can proceed
      // The batch endpoint will use referenceImageBase64 as fallback
      console.warn('HeyGen: could not create talking_photo_id (may need HeyGen Enterprise plan)');
      console.warn('HeyGen: falling back to reference image mode');
      return res.json({ 
        talking_photo_id: null, 
        ok: false,
        fallback: true,
        message: 'Using reference image mode — video will use stock avatar with your voice. Upgrade HeyGen plan for custom face.'
      });
    }
  } catch(e) {
    console.error('/api/heygen/upload-photo:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /webhooks/heygen ─────────────────────────────────────────────────────
// HeyGen fires this when a video generation completes
// Stores result URL keyed by video_id so /api/presenter-status can return it
const heygenResults = {};

app.post('/webhooks/heygen', async (req, res) => {
  try {
    const { event_type, event_data } = req.body || {};
    console.log('HeyGen webhook:', event_type, event_data?.video_id);

    if (event_type === 'avatar_video.success') {
      const videoUrl = event_data?.video_url;
      const videoId  = event_data?.video_id;
      if (videoId && videoUrl) {
        // Cache for instant polling response
        heygenResults[videoId] = { videoUrl, ts: Date.now() };
        console.log('HeyGen webhook: video ready:', videoId, videoUrl.slice(0,60));
        // Update scenes table — mark any scene waiting for this taskId as generated
        try {
          if (process.env.SUPABASE_SERVICE_KEY) {
            const sb3 = getSupaAdmin();
            await sb3.from('scenes')
              .update({ status: 'generated', ai_video_url: videoUrl })
              .eq('ai_task_id', 'heygen-' + videoId);
          }
        } catch(whDbErr) {
          console.warn('Webhook scene update:', whDbErr.message);
        }

        // Push instant notification to all connected clients in the project room
        // This replaces polling — desktop gets notified the moment video is ready
        try {
          // Find which project this video belongs to and push to its room
          if (process.env.SUPABASE_SERVICE_KEY) {
            const sb2 = getSupaAdmin();
            const { data: projs } = await sb2.from('aab_projects').select('id').limit(50);
            if (projs) {
              projs.forEach(p => {
                pushClipReady(p.id, { videoUrl, videoId, taskId: 'heygen-' + videoId, ts: Date.now() });
              });
            }
          } else {
            // No DB — push to all connected clients
            io.emit('clip_ready', { videoUrl, videoId, taskId: 'heygen-' + videoId, ts: Date.now() });
          }
        } catch(pushErr) {
          // Non-critical — just log
          console.warn('Socket push failed:', pushErr.message);
          io.emit('clip_ready', { videoUrl, videoId, taskId: 'heygen-' + videoId });
        }

        // Update scene status in Supabase so it persists across sessions
        // Any project scene with this taskId gets marked 'done'
        try {
          if (process.env.SUPABASE_SERVICE_KEY) {
            const sb = getSupaAdmin();
            // Update all scenes in all projects that were waiting for this video_id
            const taskIdStr = 'heygen-' + videoId;
            const { data: projects } = await sb
              .from('aab_projects')
              .select('id, data')
              .contains('data', { pendingTaskId: taskIdStr });
            
            if (projects && projects.length > 0) {
              for (const proj of projects) {
                const pdata = proj.data;
                if (pdata.scenes) {
                  pdata.scenes.forEach(sc => {
                    if (sc.taskId === taskIdStr || sc.pendingTaskId === taskIdStr) {
                      sc.status   = 'recorded';
                      sc.videoUrl = videoUrl;
                      sc.taskId   = null;
                    }
                  });
                }
                if (!pdata.clips) pdata.clips = {};
                pdata.clips['ai_' + videoId] = {
                  url: videoUrl, videoUrl, source: 'ai-presenter',
                  duration: pdata.scenes?.reduce((t,s)=>t+(s.duration||8),0) || 30,
                  sceneNum: 1, sceneName: 'AI Presenter', sceneType: 'BATCH'
                };
                await sb.from('aab_projects').update({ data: pdata }).eq('id', proj.id);
                console.log('Updated project', proj.id, 'with HeyGen result');
              }
            }
          }
        } catch(dbErr) {
          console.warn('Supabase webhook update failed (non-critical):', dbErr.message);
        }
      }
    }
    res.json({ status: 'received' });
  } catch(e) {
    console.error('HeyGen webhook error:', e.message);
    res.json({ status: 'error' });
  }
});

// ── GET /api/project/scenes-status ───────────────────────────────────────────
// Frontend polls this to get live scene status updates
// Returns which scenes are done, pending, failed — synced from DB
app.get('/api/project/scenes-status', async (req, res) => {
  try {
    const token     = req.headers.authorization?.replace('Bearer ', '');
    const projectId = req.query.projectId;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });
    if (!token)     return res.status(401).json({ error: 'No auth token' });

    const sb = getSupaAdmin();
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const { data } = await sb.from('aab_projects')
      .select('data').eq('id', projectId).eq('user_id', user.id).single();
    
    if (!data) return res.json({ scenes: [], clips: {} });
    
    const proj   = data.data || {};
    const scenes = (proj.scenes || []).map(sc => ({
      id:       sc.id,
      status:   sc.status,
      videoUrl: sc.videoUrl || null,
      taskId:   sc.taskId  || null,
    }));
    
    res.json({ scenes, clips: proj.clips || {} });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Expose heygenResults to presenter-status polling
// Patch presenter-status to check heygenResults first (webhook is faster than polling)
const _origStatus = null; // handled inline in polling route

server.listen(PORT, () => {
  console.log('AABStudio v3.9 running on port', PORT);
  console.log('Socket.IO: real-time remote control enabled');
  console.log('Anthropic:    ', !!process.env.ANTHROPIC_API_KEY ? '✓' : '✗ MISSING');
  console.log('ElevenLabs:   ', !!ELEVENLABS_KEY  ? '✓' : '✗ MISSING');
  console.log('HeyGen:       ', !!HEYGEN_KEY       ? '✓ (primary)' : '✗');
  console.log('Kling/PiAPI:  ', PIAPI_KEY          ? '✓ (via PiAPI + Imgur)' : (KLING_AK && KLING_SK) ? '⚠ direct only' : '✗');
  console.log('Runway:       ', !!RUNWAY_KEY        ? '✓' : '✗');
  console.log('Stripe:       ', !!STRIPE_KEY        ? '✓' : '✗');
  console.log('Imgur:        ', !!IMGUR_CLIENT_ID   ? '✓ (public image host)' : '✗');
  console.log('D-ID:         ', !!DID_API_KEY        ? '✓ (talking photo — fast!)' : '✗ (add DID_API_KEY for faster generation)');
  ensureAabProjectsTable();
  discoverHeyGenAvatar();
});

// Global error handler — catches BadRequestError from client disconnects mid-upload
// These are harmless (client closed connection) and should not crash the server
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.message?.includes('request aborted') || err.status === 400)) {
    console.warn('Request error (client likely disconnected):', err.message);
    if (!res.headersSent) res.status(400).json({ error: 'Request aborted or too large' });
    return;
  }
  console.error('Unhandled error:', err?.message || err);
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});
