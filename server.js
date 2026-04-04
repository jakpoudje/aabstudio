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

// ═══ ENGINE 1: DOCUMENT INTELLIGENCE ═════════════════════════════════════════
async function extractText(fileName, fileBase64, mimeType) {
  if (!fileBase64) return null;
  const buffer = Buffer.from(fileBase64, 'base64');
  const name = (fileName || '').toLowerCase();
  try {
    if (name.endsWith('.docx') || name.endsWith('.doc')) { const r = await mammoth.extractRawText({ buffer }); return r.value.slice(0, 50000); }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) { const wb = XLSX.read(buffer, { type: 'buffer' }); let t = ''; wb.SheetNames.forEach(s => { t += `[Sheet: ${s}]\n` + XLSX.utils.sheet_to_csv(wb.Sheets[s]) + '\n'; }); return t.slice(0, 50000); }
    if (name.endsWith('.pptx')) { const wb = XLSX.read(buffer, { type: 'buffer' }); let t = ''; wb.SheetNames.forEach((s, i) => { t += `[Slide ${i+1}]\n` + XLSX.utils.sheet_to_txt(wb.Sheets[s]) + '\n'; }); return t.slice(0, 50000); }
    if (name.match(/\.(csv|txt|md|json|html|htm)$/) || (mimeType && mimeType.startsWith('text/'))) return buffer.toString('utf8').slice(0, 50000);
    return null;
  } catch (err) { console.error('Extract error:', err.message); return null; }
}

// ═══ ENGINE 2: ANALYSIS (Balanced — Spec §5) ═════════════════════════════════
app.post('/api/analyse', async (req, res) => {
  try {
    const { request, depth, fileName, fileContent, fileBase64, mimeType } = req.body;
    const name = (fileName || '').toLowerCase();
    const isPDF = name.endsWith('.pdf') || mimeType === 'application/pdf';
    const prompt = `You are AABStudio AI — an intelligence extraction and broadcasting platform. NOT a summarizer.
Analysis request: "${request}" | Depth: ${depth || 'deep'}
CRITICAL: Balanced analysis — merits AND risks in every section.
Return ONLY valid JSON:
{"title":"descriptive title","docType":"type","domain":"Legal|Financial|Research|Investigative|Policy|Technical|General",
"executiveSummary":"3-4 sentences, balanced",
"documentMap":{"totalSections":0,"totalParagraphs":0,"keyEntities":["names"]},
"sections":[{"title":"","sectionId":"SEC_01","body":"4-5 sentences with document refs",
"reasoning":{"observation":"","evidence":"","interpretation":"","merits":"","risks":"","tradeOffs":"","operationalImpact":"","financialImpact":"","recommendation":""},
"evidenceItems":[{"evidenceId":"EV-101","label":"Risk Clause|Financial Data|Legal Provision|Policy Statement|Technical Finding|Statistical Data",
"source":"Page X / Section Y","sourceId":"DOC01_SEC01_PARA02","text":"exact quote","interpretation":"","implication":"","confidence":"High|Medium|Low"}]}]}
Generate 4-6 sections, 2-3 evidence items each, sequential IDs.`;

    let messages;
    if (isPDF && fileBase64) {
      const maxB64 = 120000;
      if (fileBase64.length > maxB64) {
        let docText = await extractText(fileName, fileBase64, mimeType);
        if (docText && docText.length > 100) {
          messages = [{ role: 'user', content: prompt + `\n\nDOCUMENT: ${fileName} (large PDF, text extracted)\n\n${docText}` }];
        } else {
          messages = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64.slice(0, maxB64) } }, { type: 'text', text: prompt + '\n\nNote: PDF truncated due to size.' }] }];
        }
      } else {
        messages = [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }, { type: 'text', text: prompt }] }];
      }
    } else {
      let docText = fileBase64 ? await extractText(fileName, fileBase64, mimeType) : (fileContent || null);
      if (docText && docText.length > 50000) docText = docText.slice(0, 50000) + '\n[Truncated]';
      messages = [{ role: 'user', content: prompt + (docText ? `\n\nDOCUMENT: ${fileName}\n\n${docText}` : `\n\nDocument: "${fileName}" — unavailable.`) }];
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'pdfs-2024-09-25' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4500, messages }) });
    if (!r.ok) return res.status(500).json({ error: 'Anthropic error', details: await r.text() });
    const d = await r.json();
    const report = JSON.parse(d.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim());
    report._tokens = { input: d.usage?.input_tokens || 0, output: d.usage?.output_tokens || 0 };
    res.json(report);
  } catch (err) { res.status(500).json({ error: 'Analysis failed', details: err.message }); }
});

// ═══ ENGINE 3: SCENE INTELLIGENCE (Spec §6) ══════════════════════════════════
app.post('/api/scenes', async (req, res) => {
  try {
    const { report, presenterMode, speed } = req.body;
    const mode = presenterMode || 'human';
    const sc = { slow:{wpm:110,w:14}, normal:{wpm:140,w:18}, fast:{wpm:170,w:22} }[speed] || {wpm:140,w:18};
    const secs = (report.sections||[]).map((s,i) => ({
      n:i+1, id:s.sectionId||`SEC_0${i+1}`, t:s.title, b:(s.body||'').slice(0,400), r:s.reasoning||{},
      ev:(s.evidenceItems||[]).slice(0,3).map(e=>({id:e.evidenceId,l:e.label,s:e.source,t:(e.text||'').slice(0,150)}))
    }));
    const prompt = `AABStudio Scene Engine. Transform report into broadcast scripts.
DOC: ${report.title} | ${report.docType} | ${report.domain}
SUMMARY: ${report.executiveSummary}
SECTIONS:\n${secs.map(s=>`[${s.id}] ${s.t}: ${s.b}\nMerits:${s.r.merits||''} Risks:${s.r.risks||''}\nEvidence:${s.ev.map(e=>`[${e.id}] ${e.t}`).join('|')}`).join('\n\n')}
MODE: ${mode} | ${sc.wpm}WPM | ${sc.w} words/scene | 8s max
MODES: human=1st person conversational | ai=3rd person authoritative | dual=A asks B explains
VISUAL PROMPTS: describe presenter gesture matching content (pointing=evidence, open hands=explanation, concerned=risks, confident=recommendations), studio setting, camera angle, lighting, document overlay for evidence scenes.
Return ONLY JSON:
{"title":"","presenterMode":"${mode}","speed":"${speed||'normal'}","wordsPerScene":${sc.w},
"discussions":[{"sectionTitle":"","sectionId":"","discussionText":"60-180 words spoken narrative",
"scenes":[{"sceneNumber":1,"type":"Introduction|Evidence|Explanation|Comparison|Recommendation|Conclusion",
"duration":8,"presenterA":"${sc.w} words","presenterB":"dual only else null",
"visualPrompt":"gesture, setting, camera, overlay","evidenceRef":"EV-101 or null","overlayText":"under 6 words or null"}]}]}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:6000,messages:[{role:'user',content:prompt}]}) });
    if (!r.ok) return res.status(500).json({ error:'Scene error', details:await r.text() });
    const d = await r.json();
    const txt = d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim();
    let scenes; try{scenes=JSON.parse(txt);}catch(e){const m=txt.match(/\{[\s\S]*\}/);if(m)scenes=JSON.parse(m[0]);else throw e;}
    let sn=1,ts=0;
    (scenes.discussions||[]).forEach(disc=>{disc.wordCount=disc.discussionText?disc.discussionText.split(/\s+/).length:0;(disc.scenes||[]).forEach(s=>{s.sceneNumber=sn++;s.wordCount=s.presenterA?s.presenterA.split(/\s+/).length:0;s.duration=8;ts++;});});
    scenes.totalScenes=ts; scenes.totalDurationSeconds=ts*8;
    scenes.estimatedDuration=`${Math.floor(ts*8/60)}m ${(ts*8)%60}s`;
    scenes.costEstimate={totalCredits:ts*10,creditsPerScene:10,scenes:ts};
    console.log(`Scenes: ${ts} scenes, ${scenes.estimatedDuration}, ${ts*10} credits`);
    res.json(scenes);
  } catch(err){console.error('Scene error:',err);res.status(500).json({error:'Scene failed',details:err.message});}
});

// ═══ ENGINE 4: DOCUMENT COMPARISON (Spec §11) ════════════════════════════════
app.post('/api/compare', async (req, res) => {
  try {
    const { docA, docB, fileNameA, fileNameB } = req.body;
    const prompt = `Compare these two documents and identify differences.
DOCUMENT A: ${fileNameA}\n${(docA||'').slice(0,15000)}
DOCUMENT B: ${fileNameB}\n${(docB||'').slice(0,15000)}
Return ONLY JSON:
{"title":"Comparison: A vs B","summary":"overview of changes",
"changes":[{"type":"Added|Removed|Modified","category":"Clause|Financial|Policy|Terminology",
"locationA":"section/page in doc A","locationB":"section/page in doc B",
"contentA":"original text","contentB":"changed text","significance":"High|Medium|Low",
"interpretation":"what this change means"}],
"statistics":{"totalChanges":0,"additions":0,"removals":0,"modifications":0},
"recommendation":"overall assessment"}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:4000,messages:[{role:'user',content:prompt}]}) });
    if (!r.ok) return res.status(500).json({ error:'Compare error', details:await r.text() });
    const d = await r.json();
    res.json(JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim()));
  } catch(err){res.status(500).json({error:'Compare failed',details:err.message});}
});

// ═══ ENGINE 5: DOCUMENTARY MODE (Spec §13) ═══════════════════════════════════
app.post('/api/documentary', async (req, res) => {
  try {
    const { report, speed } = req.body;
    const sc = {slow:{w:14},normal:{w:18},fast:{w:22}}[speed]||{w:18};
    const prompt = `Convert this analysis into a documentary-style narrative.
REPORT: ${report.title}\nSUMMARY: ${report.executiveSummary}
SECTIONS:\n${(report.sections||[]).map(s=>`${s.title}: ${s.body}`).join('\n')}
DOCUMENTARY STRUCTURE: Hook → Evidence Reveal → Context Explanation → Implication → Conclusion
Each scene: exactly ${sc.w} words, 8 seconds max.
Return ONLY JSON:
{"title":"Documentary: ...","narrativeStyle":"documentary",
"scenes":[{"sceneNumber":1,"act":"Hook|EvidenceReveal|Context|Implication|Conclusion",
"duration":8,"narration":"${sc.w} words dramatic narration",
"visualPrompt":"cinematic: camera movement, lighting, mood, b-roll description",
"overlayText":"key stat or quote, under 6 words, or null"}]}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:4000,messages:[{role:'user',content:prompt}]}) });
    if (!r.ok) return res.status(500).json({ error:'Documentary error' });
    const d = await r.json();
    const doc = JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim());
    let sn=1; (doc.scenes||[]).forEach(s=>{s.sceneNumber=sn++;s.duration=8;});
    doc.totalScenes=(doc.scenes||[]).length;
    doc.costEstimate={totalCredits:doc.totalScenes*10};
    res.json(doc);
  } catch(err){res.status(500).json({error:'Documentary failed',details:err.message});}
});

// ═══ ENGINE 6: COST ESTIMATOR (Spec §8-9) ════════════════════════════════════
app.post('/api/cost/estimate', (req, res) => {
  const n = req.body.numScenes || 20;
  res.json({ estimatedScenes:n, estimatedDuration:`${Math.floor(n*8/60)}m ${(n*8)%60}s`, estimatedCredits:n*10,
    message:`Estimated video: ${Math.floor(n*8/60)}m ${(n*8)%60}s | ${n} scenes | ${n*10} credits` });
});

// ═══ ENGINE 7: VOICE (ElevenLabs) ════════════════════════════════════════════
app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceId, stability, similarityBoost } = req.body;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId||'EXAVITQu4vr4xnSDxMaL'}`, {
      method:'POST', headers:{'Content-Type':'application/json','xi-api-key':ELEVENLABS_KEY},
      body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:stability||0.5,similarity_boost:similarityBoost||0.75,style:0.3,use_speaker_boost:true}}) });
    if (!r.ok) return res.status(500).json({ error:'Voice error', details:await r.text() });
    res.json({ audio:Buffer.from(await r.arrayBuffer()).toString('base64'), mimeType:'audio/mpeg' });
  } catch(err){res.status(500).json({error:'Voice failed',details:err.message});}
});
app.get('/api/voices', async (req, res) => {
  try { const r=await fetch('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':ELEVENLABS_KEY}}); const d=await r.json(); res.json({voices:(d.voices||[]).map(v=>({id:v.voice_id,name:v.name,category:v.category}))}); }
  catch(err){res.status(500).json({error:err.message});}
});

// ═══ ENGINE 8: MUSIC (ElevenLabs) ════════════════════════════════════════════
app.post('/api/music/generate', async (req, res) => {
  try {
    const { prompt, duration } = req.body;
    let r = await fetch('https://api.elevenlabs.io/v1/sound-generation', { method:'POST', headers:{'Content-Type':'application/json','xi-api-key':ELEVENLABS_KEY}, body:JSON.stringify({text:prompt,duration_seconds:Math.min(Math.max(duration||22,1),22)}) });
    if (!r.ok) r = await fetch('https://api.elevenlabs.io/v1/text-to-sound-effects', { method:'POST', headers:{'Content-Type':'application/json','xi-api-key':ELEVENLABS_KEY}, body:JSON.stringify({text:prompt,duration_seconds:Math.min(duration||22,22)}) });
    if (!r.ok) return res.status(500).json({ error:'Music failed — check ElevenLabs permissions' });
    res.json({ audio:Buffer.from(await r.arrayBuffer()).toString('base64'), mimeType:'audio/mpeg' });
  } catch(err){res.status(500).json({error:err.message});}
});

// ═══ ENGINE 9: VIDEO RENDER (Runway + rate limit cache) ══════════════════════
let runwayLimitUntil = null;
app.post('/api/video/generate', async (req, res) => {
  try {
    if (runwayLimitUntil && new Date() < runwayLimitUntil) return res.status(429).json({error:'Runway daily limit (cached)',retryable:false});
    const { prompt, duration, ratio, referenceImageBase64 } = req.body;
    const body = { model:'gen3a_turbo', promptText:prompt, duration:10, ratio:{'1280:768':'1280:768','768:1280':'768:1280','1024:1024':'1024:1024'}[ratio]||'1280:768', watermark:false };
    if (referenceImageBase64) body.promptImage = `data:image/jpeg;base64,${referenceImageBase64}`;
    console.log(`Runway: ${prompt.slice(0,60)}...`);
    const r = await fetch('https://api.dev.runwayml.com/v1/image_to_video', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${RUNWAY_KEY}`,'X-Runway-Version':'2024-11-06'}, body:JSON.stringify(body) });
    if (!r.ok) {
      const e = await r.text(); let d=e; try{d=JSON.parse(e).error||e;}catch(x){}
      if (r.status===429){runwayLimitUntil=new Date(Date.now()+3600000);console.log('Runway limited');return res.status(429).json({error:'Runway daily limit',retryable:false});}
      return res.status(500).json({error:'Runway error',details:d});
    }
    const d=await r.json(); console.log('Runway task:',d.id); res.json({taskId:d.id,status:d.status});
  } catch(err){res.status(500).json({error:err.message});}
});
app.get('/api/video/status/:id', async (req, res) => {
  try {
    const r=await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.id}`,{headers:{'Authorization':`Bearer ${RUNWAY_KEY}`,'X-Runway-Version':'2024-11-06'}});
    if (!r.ok) return res.status(500).json({error:'Status failed'});
    const d=await r.json();
    res.json({taskId:d.id,status:d.status,progress:d.progress||0,videoUrl:d.output?(Array.isArray(d.output)?d.output[0]:d.output):null,error:d.failure||null});
  } catch(err){res.status(500).json({error:err.message});}
});

// ═══ ENGINE 10: AUDIO STORE + CREATOMATE ═════════════════════════════════════
const audioStore = new Map();
setInterval(()=>{const n=new Date();for(const[k,v]of audioStore)if(v.expires<n)audioStore.delete(k);},1800000);
app.get('/api/audio/:id',(req,res)=>{const i=audioStore.get(req.params.id);if(!i||i.expires<new Date()){audioStore.delete(req.params.id);return res.status(404).send('Gone');}res.set('Content-Type',i.mime).set('Cache-Control','public,max-age=3600').send(i.data);});
function storeAudio(b64,mime){const id=Math.random().toString(36).slice(2)+Date.now().toString(36);audioStore.set(id,{data:Buffer.from(b64,'base64'),mime:mime||'audio/mpeg',expires:new Date(Date.now()+7200000)});return id;}

app.post('/api/render', async (req, res) => {
  try {
    const { scenes, studioConfig, musicConfig, outputFormat } = req.body;
    const valid = scenes.filter(s=>s.audioBase64);
    if (!valid.length) return res.status(400).json({error:'No scenes with audio'});
    const fmt={'16:9':{w:1920,h:1080},'9:16':{w:1080,h:1920},'1:1':{w:1080,h:1080}}[outputFormat]||{w:1920,h:1080};
    const bg=studioConfig?.bgColor||'#1a3a5c';
    const base=process.env.BASE_URL||'https://aabstudio-production.up.railway.app';
    const tc={Introduction:'#b8942a',Evidence:'#c0392b',Explanation:'#1a7a4a',Comparison:'#8a6200',Recommendation:'#2d5f8e',Conclusion:'#1a3a5c'};
    const els=[];let t=0;
    for(const s of valid){
      const d=s.duration||8;
      if(s.videoUrl)els.push({type:'video',track:1,time:t,duration:d,source:s.videoUrl,fit:'cover',width:'100%',height:'100%'});
      else els.push({type:'shape',track:1,time:t,duration:d,x:'50%',y:'50%',width:'100%',height:'100%',fill_color:bg,path:'M 0 0 L 100 0 L 100 100 L 0 100 Z'});
      if(s.audioBase64){const aid=storeAudio(s.audioBase64,'audio/mpeg');els.push({type:'audio',track:2,time:t,duration:d,source:`${base}/api/audio/${aid}`,volume:'100%'});}
      if(s.type)els.push({type:'text',track:3,time:t,duration:2.5,text:s.type.toUpperCase(),x:'5%',y:'8%',width:'25%',height:'5%',x_anchor:'0%',y_anchor:'50%',font_family:'Montserrat',font_weight:700,font_size:null,font_size_minimum:'1 vmin',font_size_maximum:'3 vmin',fill_color:'#ffffff',background_color:tc[s.type]||bg,background_x_padding:'50%',background_y_padding:'30%',background_border_radius:'50%'});
      if(s.overlayText&&s.overlayText!=='null')els.push({type:'text',track:4,time:t+0.5,duration:d-1,text:String(s.overlayText),x:'50%',y:'90%',width:'90%',height:'8%',x_alignment:'50%',y_alignment:'50%',font_family:'Montserrat',font_weight:600,font_size:null,font_size_minimum:'1 vmin',font_size_maximum:'4 vmin',fill_color:'#ffffff',background_color:'rgba(26,58,92,0.85)',background_x_padding:'30%',background_y_padding:'20%',background_border_radius:'8%'});
      t+=d;
    }
    if(musicConfig?.audioBase64){const mid=storeAudio(musicConfig.audioBase64,'audio/mpeg');els.push({type:'audio',track:5,time:0,duration:t,source:`${base}/api/audio/${mid}`,volume:`${musicConfig.volume||30}%`,audio_fade_in:1,audio_fade_out:2});}
    const source={output_format:'mp4',width:fmt.w,height:fmt.h,frame_rate:24,duration:t,elements:els.filter(e=>e&&e.type)};
    console.log(`Creatomate: ${valid.length} scenes, ${Math.round(t)}s, ${source.elements.length} els`);
    const r=await fetch('https://api.creatomate.com/v1/renders',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${CREATOMATE_KEY}`},body:JSON.stringify({source})});
    if(!r.ok){const e=await r.text();console.error('Creatomate:',r.status,e);return res.status(500).json({error:'Creatomate error',details:e});}
    const d=await r.json();const rid=Array.isArray(d)?d[0].id:d.id;
    console.log('Creatomate render:',rid);res.json({renderId:rid,status:'rendering'});
  } catch(err){console.error('Render:',err);res.status(500).json({error:'Render failed',details:err.message});}
});
app.get('/api/render/status/:id',async(req,res)=>{try{const r=await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`,{headers:{'Authorization':`Bearer ${CREATOMATE_KEY}`}});if(!r.ok)return res.status(500).json({error:'Failed'});const d=await r.json();res.json({renderId:d.id,status:d.status,url:d.url||null,progress:d.progress||0,error:d.error_message||null});}catch(e){res.status(500).json({error:e.message});}});
app.get('/api/render/check/:id',async(req,res)=>{try{const r=await fetch(`https://api.creatomate.com/v1/renders/${req.params.id}`,{headers:{'Authorization':`Bearer ${CREATOMATE_KEY}`}});if(!r.ok)return res.status(r.status).json({error:'Not found'});const d=await r.json();res.json({renderId:d.id,status:d.status,url:d.url||null,progress:d.progress||0,duration:d.duration,fileSize:d.file_size,error:d.error_message||null});}catch(e){res.status(500).json({error:e.message});}});

// ═══ ENGINE 11: EXPORT METADATA ══════════════════════════════════════════════
app.post('/api/export/metadata', async (req, res) => {
  try {
    const { report, platform } = req.body;
    const g={youtube:'title 100chars, description+chapters, 3-5 tags',instagram:'caption 2200, 20-30 tags',tiktok:'hook first, 150chars, 3-5 tags',linkedin:'professional 1300chars, 3-5 tags',twitter:'280chars, 1-2 tags',facebook:'conversational, 1-3 tags'};
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Generate ${platform} metadata. Report: ${report.title}|${report.docType}\nSummary: ${report.executiveSummary}\nGuide: ${g[platform]||''}\nReturn ONLY JSON:{"title":"","description":"","hashtags":[""],"chapters":[{"time":"0:00","title":""}]}`}]})});
    const d=await r.json();res.json(JSON.parse(d.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim()));
  } catch(err){res.status(500).json({error:err.message});}
});

// ═══ ENGINE 12: STRIPE ═══════════════════════════════════════════════════════
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const{priceId,mode,customerEmail}=req.body;
    const p={mode:mode||'subscription',payment_method_types:['card'],line_items:[{price:priceId,quantity:1}],success_url:'https://aabstudio.ai?checkout=success',cancel_url:'https://aabstudio.ai?checkout=cancelled',customer_email:customerEmail,allow_promotion_codes:true};
    if(mode==='subscription')p.subscription_data={trial_period_days:7};
    const s=await stripe.checkout.sessions.create(p);res.json({url:s.url,sessionId:s.id});
  } catch(err){res.status(500).json({error:err.message});}
});
app.post('/api/stripe/webhook',(req,res)=>{try{const e=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);console.log('Webhook:',e.type);res.json({received:true});}catch(e){res.status(400).send(e.message);}});

// ═══ TEST ENDPOINTS ══════════════════════════════════════════════════════════
app.get('/api/test/creatomate',async(req,res)=>{try{const s={output_format:'mp4',width:1280,height:720,duration:5,elements:[{type:'shape',track:1,time:0,duration:5,x:'50%',y:'50%',width:'100%',height:'100%',fill_color:'#1a3a5c',path:'M 0 0 L 100 0 L 100 100 L 0 100 Z'},{type:'text',track:2,time:0,duration:5,text:'AABStudio v9',x:'50%',y:'50%',width:'80%',height:'20%',x_alignment:'50%',y_alignment:'50%',font_family:'Montserrat',font_weight:700,font_size:null,font_size_minimum:'3 vmin',font_size_maximum:'10 vmin',fill_color:'#ffffff'}]};const r=await fetch('https://api.creatomate.com/v1/renders',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${CREATOMATE_KEY}`},body:JSON.stringify({source:s})});const t=await r.text();res.json({status:r.status,ok:r.ok,body:JSON.parse(t)});}catch(e){res.json({error:e.message});}});
app.get('/api/test/elevenlabs',async(req,res)=>{try{const r=await fetch('https://api.elevenlabs.io/v1/voices',{headers:{'xi-api-key':ELEVENLABS_KEY}});const d=await r.json();res.json({status:r.status,voices:(d.voices||[]).length});}catch(e){res.json({error:e.message});}});
app.get('/api/test/runway',async(req,res)=>{try{if(runwayLimitUntil&&new Date()<runwayLimitUntil)return res.json({status:'rate_limited',until:runwayLimitUntil.toISOString()});const r=await fetch('https://api.dev.runwayml.com/v1/tasks/x',{headers:{'Authorization':`Bearer ${RUNWAY_KEY}`,'X-Runway-Version':'2024-11-06'}});res.json({status:r.status,auth:r.status!==401});}catch(e){res.json({error:e.message});}});
app.get('/api/test/anthropic',async(req,res)=>{try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:20,messages:[{role:'user',content:'Say OK'}]})});const d=await r.json();res.json({status:r.status,reply:d.content?.[0]?.text});}catch(e){res.json({error:e.message});}});

// ═══ HEALTH ══════════════════════════════════════════════════════════════════
app.get('/health',(req,res)=>res.json({status:'ok',platform:'AABStudio API v9',engines:['DocIntelligence','Analysis','SceneIntelligence','DocComparison','DocumentaryMode','CostEstimator','Voice','Music','VideoRender','Creatomate','ExportMeta'],apis:{anthropic:!!ANTHROPIC_KEY,elevenlabs:!!ELEVENLABS_KEY,runway:!!RUNWAY_KEY,creatomate:!!CREATOMATE_KEY,runwayLimited:!!runwayLimitUntil},audio:audioStore.size}));
const PORT=process.env.PORT||3000;app.listen(PORT,()=>console.log(`AABStudio API v9 on port ${PORT}`));
