// ════════════════════════════════════════════════════════════════════════════
// AABStudio Platform v3.0
// Fixes: CSS leak on homepage, timeline wiring, mobile PWA, smooth animations
// D-ID as primary provider, HeyGen fallback
// ════════════════════════════════════════════════════════════════════════════
(function() {
'use strict';

// ── Only run inside the app (not on homepage) ─────────────────────────────
var isApp = !!document.getElementById('aab-v5');
var isHomepage = !isApp;

// ── PWA manifest injection ─────────────────────────────────────────────────
if (!document.querySelector('link[rel="manifest"]')) {
  var manifestData = {
    name: 'AABStudio.ai',
    short_name: 'AABStudio',
    description: 'Professional AI Video Studio',
    start_url: 'https://aabstudio.ai/app',
    display: 'standalone',
    background_color: '#080d14',
    theme_color: '#00d4aa',
    orientation: 'any',
    icons: [
      { src: 'https://aabstudio.ai/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'https://aabstudio.ai/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
  var blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
  var link = document.createElement('link');
  link.rel = 'manifest';
  link.href = URL.createObjectURL(blob);
  document.head.appendChild(link);
}

// ── Meta tags for PWA / mobile ─────────────────────────────────────────────
var metas = [
  { name: 'mobile-web-app-capable',           content: 'yes' },
  { name: 'apple-mobile-web-app-capable',     content: 'yes' },
  { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
  { name: 'apple-mobile-web-app-title',       content: 'AABStudio' },
  { name: 'theme-color',                      content: '#00d4aa' }
];
metas.forEach(function(m) {
  if (!document.querySelector('meta[name="' + m.name + '"]')) {
    var el = document.createElement('meta');
    el.name = m.name; el.content = m.content;
    document.head.appendChild(el);
  }
});

// ── CSS: ONLY inject app styles inside the app, not homepage ─────────────
if (isApp) {
  var CSS = `
/* ── AABStudio v3 tokens ── */
:root{--aab-teal:#00d4aa;--aab-gold:#f59e0b;--aab-red:#ef4444;--aab-blue:#3b82f6;--aab-green:#10b981;--aab-purple:#8b5cf6;--aab-ink:#e2e8f0;--aab-muted:#64748b;--aab-surface:#0d1117;--aab-card:rgba(255,255,255,.04);--aab-bdr:rgba(255,255,255,.08)}

/* ── Colour-coded buttons ── */
.btn-primary{background:linear-gradient(135deg,#00d4aa,#00b894)!important;color:#000!important;font-weight:700!important;border:none!important;border-radius:8px!important;padding:10px 20px!important;cursor:pointer!important;transition:all .2s!important}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,212,170,.4)!important}
.btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626)!important;color:#fff!important;font-weight:700!important;border:none!important;border-radius:8px!important;padding:10px 20px!important;cursor:pointer!important;transition:all .2s!important}
.btn-danger:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(239,68,68,.4)!important}
.btn-gold{background:linear-gradient(135deg,#f59e0b,#d97706)!important;color:#000!important;font-weight:700!important;border:none!important;border-radius:8px!important;padding:10px 20px!important;cursor:pointer!important;transition:all .2s!important}
.btn-ghost{background:transparent!important;color:#e2e8f0!important;font-weight:600!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important;padding:10px 20px!important;cursor:pointer!important;transition:all .2s!important}
.btn-ghost:hover{background:rgba(255,255,255,.04)!important;border-color:#00d4aa!important}

/* ── Animations ── */
@keyframes aab-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes aab-slide-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes aab-spin{to{transform:rotate(360deg)}}
.aab-animate{animation:aab-slide-in .35s cubic-bezier(.4,0,.2,1) both}
.aab-animate:nth-child(1){animation-delay:.05s}
.aab-animate:nth-child(2){animation-delay:.1s}
.aab-animate:nth-child(3){animation-delay:.15s}
.aab-animate:nth-child(4){animation-delay:.2s}
.aab-animate:nth-child(5){animation-delay:.25s}

/* ── Progress ── */
.aab-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.1);border-top-color:#00d4aa;border-radius:50%;animation:aab-spin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}

/* ── Timeline clips ── */
.tl-clip-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px;cursor:pointer;transition:all .2s;position:relative;will-change:transform}
.tl-clip-card:hover{border-color:#00d4aa;transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,212,170,.15)}
.tl-clip-card.tl-ai{border-left:3px solid #8b5cf6}
.tl-clip-card.tl-rec{border-left:3px solid #ef4444}
.tl-clip-card.tl-did{border-left:3px solid #00d4aa}
.tl-del{position:absolute;top:6px;right:6px;background:rgba(239,68,68,.15);color:#ef4444;border:none;border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer;opacity:0;transition:opacity .2s}
.tl-clip-card:hover .tl-del{opacity:1}

/* ── Teleprompter smooth ── */
#tp-text span{transition:color .12s,font-weight .12s,text-shadow .12s}
#tp-text span.tp-done{color:rgba(255,255,255,.15)!important;font-weight:400!important}
#tp-text span.tp-current{color:#f59e0b!important;font-weight:700!important;text-shadow:0 0 24px rgba(245,158,11,.6)!important}

/* ── Next step hint ── */
.aab-next-step{display:flex;align-items:center;gap:8px;font-size:13px;color:#00d4aa;background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.2);border-radius:8px;padding:10px 14px;cursor:pointer;animation:aab-pulse 2.5s ease infinite}

/* ── Mobile: Portrait stacking ── */
@media(max-width:768px){
  .studio-layout{flex-direction:column!important}
  .studio-cam{width:100%!important;height:50vw!important;min-height:200px}
  .studio-tp{width:100%!important;height:auto!important;min-height:180px}
  .pg-header,.edit-header{flex-wrap:wrap;gap:8px}
  #aab-export-btn{width:100%}
  .scene-card,.scene-row{font-size:13px}
}
@media(max-width:480px){
  .pg{padding:8px!important}
  .top-bar,.topnav{padding:0 10px!important}
}

/* ── Export panel ── */
#aab-export-panel{position:fixed;right:0;top:0;bottom:0;width:min(340px,100vw);background:#080d14;border-left:1px solid rgba(255,255,255,.08);z-index:9999;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);overflow-y:auto;padding:24px}
#aab-export-panel.open{transform:translateX(0)}
.export-opt{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all .2s}
.export-opt:hover{border-color:#00d4aa;background:rgba(0,212,170,.06)}
.export-opt h4{font-size:13px;font-weight:700;color:#e2e8f0;margin:0 0 4px}
.export-opt p{font-size:11px;color:#64748b;margin:0}
.export-badge{font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;float:right}
.badge-free{background:rgba(16,185,129,.2);color:#10b981}
.badge-pro{background:rgba(139,92,246,.2);color:#8b5cf6}
.badge-fast{background:rgba(0,212,170,.2);color:#00d4aa}

/* ── Retake bar ── */
#studio-retake-bar{display:none}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  `;
  var s = document.createElement('style');
  s.id = 'aab-v3-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

if (isHomepage) {
  console.log('AABStudio Platform v3.0 — homepage mode (no app styles injected)');
  return; // Stop here for homepage — don't run any app code
}

// ════════════════════════════════════════════════════════════════════════════
// Everything below only runs inside the app
// ════════════════════════════════════════════════════════════════════════════

// ── Staggered entrance animations on page nav ─────────────────────────────
// Defer nav override until after page load so homepage buttons still work
setTimeout(function() {
var _origNav = window.nav;
window.nav = function(pg) {
  if (typeof _origNav === 'function') _origNav.apply(this, arguments);
  setTimeout(function() {
    var page = document.getElementById(pg);
    if (!page) return;
    var cards = page.querySelectorAll('.card,.scene-card,.scene-row,.clip-card,.tl-clip-card,.proj-card,.feature-card,.dashboard-card');
    cards.forEach(function(c, i) {
      c.style.opacity = '0';
      c.style.transform = 'translateY(16px)';
      setTimeout(function() {
        c.style.transition = 'opacity .35s cubic-bezier(.4,0,.2,1), transform .35s cubic-bezier(.4,0,.2,1)';
        c.style.opacity    = '1';
        c.style.transform  = 'translateY(0)';
      }, i * 50);
    });
    if (pg === 'edit-pg') setTimeout(function() { aab_refreshTimeline(); }, 150);
  }, 80);
};

// ── GSAP-style hardware-accelerated transition helper ─────────────────────
function aab_fadeIn(el, delay) {
  if (!el) return;
  el.style.cssText += ';will-change:transform,opacity;opacity:0;transform:translateY(12px)';
  setTimeout(function() {
    el.style.transition = 'opacity .3s ease, transform .3s ease';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    setTimeout(function() { el.style.willChange = 'auto'; }, 400);
  }, delay || 0);
}

// ══════════════════════════════════════════════════════════════════════════
// TIMELINE — auto-refresh and clip display
// ══════════════════════════════════════════════════════════════════════════

window.aps_addClipToTimeline = function(sc) {
  if (!sc || !sc.videoUrl) return;
  if (!PROJECT.clips) PROJECT.clips = {};
  PROJECT.clips[sc.id] = {
    sceneId:   sc.id,
    sceneNum:  sc.num,
    url:       sc.videoUrl,
    videoUrl:  sc.videoUrl,
    duration:  sc.duration || 8,
    source:    'ai-presenter',
    provider:  (window.APS && APS.settings && APS.settings.provider) || 'did',
    sceneName: 'Scene ' + sc.num + (sc.type ? ' · ' + sc.type : ''),
    ts:        Date.now()
  };
  if (PROJECT.scenes) {
    var s = PROJECT.scenes.find(function(x){ return x.id === sc.id; });
    if (s) s.status = 'recorded';
  }
  if (typeof saveProject === 'function') saveProject();
  aab_refreshTimeline();
  aab_showNextStep('edit-pg', '🎬 Scene ready — go to Edit Suite to review & export');
};

function aab_refreshTimeline() {
  ['renderEditSuite','renderEditClips','tl_render','tl_buildTracksFromProject'].forEach(function(fn) {
    if (typeof window[fn] === 'function') { try { window[fn](); } catch(e){} }
  });
  if (typeof PROJECT !== 'undefined') aab_buildClipsPanel();
}

function aab_buildClipsPanel() {
  if (typeof PROJECT === 'undefined') return;
  var clips = PROJECT && PROJECT.clips;
  if (!clips) return;
  var keys = Object.keys(clips).sort(function(a,b){ return (clips[a].sceneNum||0)-(clips[b].sceneNum||0); });
  if (!keys.length) return;

  // Find generated clips bar in APS
  var apsBar = document.getElementById('aps-clips-bar') || document.querySelector('.aps-clips-inner, #clips-bar-inner');
  if (apsBar) {
    var existing = apsBar.querySelectorAll('.aab-clip-thumb');
    existing.forEach(function(e){ e.remove(); });
    keys.forEach(function(k) {
      var c = clips[k]; if (!c.url) return;
      if (apsBar.querySelector('[data-clip-id="'+k+'"]')) return;
      var div = document.createElement('div');
      div.className = 'aab-clip-thumb';
      div.dataset.clipId = k;
      div.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;margin-right:8px;';
      div.innerHTML = '<video src="'+c.url+'" style="width:80px;height:52px;object-fit:cover;border-radius:6px;border:2px solid rgba(0,212,170,.4);" muted preload="metadata"></video>'
        + '<span style="font-size:10px;color:#64748b;">Scene '+c.sceneNum+'</span>';
      div.onclick = function(){ aab_previewClip(k); };
      apsBar.appendChild(div);
      aab_fadeIn(div, 100);
    });
  }

  // Build or update edit suite clips panel
  var editPg = document.getElementById('edit-pg');
  if (!editPg || !editPg.classList.contains('on')) return;

  var panel = document.getElementById('aab-clips-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'aab-clips-panel';
    panel.style.cssText = 'padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06);';
    var insertAfter = editPg.querySelector('.edit-header, .pg-header, #edit-top');
    if (insertAfter) insertAfter.after(panel);
    else editPg.prepend(panel);
  }

  panel.innerHTML = '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">'
    + keys.length + ' clip' + (keys.length!==1?'s':'') + ' · click to preview</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:10px;">'
    + keys.map(function(k) {
        var c = clips[k];
        var src = c.source === 'did' ? 'tl-did' : c.source === 'ai-presenter' ? 'tl-ai' : 'tl-rec';
        var label = c.source === 'did' ? '🤖 D-ID' : c.source === 'ai-presenter' ? '🤖 AI' : '🎥 REC';
        var color = c.source === 'did' ? '#00d4aa' : c.source === 'ai-presenter' ? '#8b5cf6' : '#ef4444';
        return '<div class="tl-clip-card aab-animate '+src+'" style="width:150px;" onclick="aab_previewClip(\''+k+'\')">'
          + '<div style="font-size:11px;font-weight:700;color:'+color+';margin-bottom:4px;">'+label+'</div>'
          + '<div style="font-size:12px;color:#e2e8f0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+( c.sceneName||'Scene '+c.sceneNum)+'</div>'
          + '<div style="font-size:11px;color:#64748b;margin-top:2px;">'+(c.duration?Math.round(c.duration)+'s':'—')+'</div>'
          + (c.url ? '<video src="'+c.url+'" style="width:100%;height:72px;object-fit:cover;border-radius:4px;margin-top:6px;" muted preload="metadata"></video>' : '')
          + '<button class="tl-del" onclick="event.stopPropagation();aab_removeClip(\''+k+'\')">✕</button>'
          + '</div>';
      }).join('')
    + '</div>'
    + '<div style="margin-top:12px;display:flex;gap:8px;">'
    + '<button class="btn-primary" style="padding:8px 18px;font-size:13px;" onclick="aab_openExport()">🎬 Export Video</button>'
    + '<button class="btn-ghost" style="padding:8px 14px;font-size:13px;" onclick="aab_exportDirect()">⬇ Download All</button>'
    + '</div>';
}

window.aab_previewClip = function(id) {
  var clip = PROJECT.clips && PROJECT.clips[id];
  if (!clip || !clip.url) return;
  var m = document.createElement('div');
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;animation:aab-slide-in .2s ease';
  m.onclick = function(e){ if(e.target===m) m.remove(); };
  m.innerHTML = '<div style="max-width:900px;width:94%;background:#0d1117;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.08);">'
    + '<video src="'+clip.url+'" controls autoplay playsinline style="width:100%;display:block;max-height:72vh;"></video>'
    + '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">'
    + '<span style="color:#e2e8f0;font-size:13px;font-weight:600;">'+(clip.sceneName||'Clip')+'</span>'
    + '<div style="display:flex;gap:8px;">'
    + '<a href="'+clip.url+'" download class="btn-gold" style="padding:8px 16px;font-size:12px;text-decoration:none;border-radius:6px;">⬇ Download</a>'
    + '<button onclick="this.closest(\'[style*=fixed]\').remove()" class="btn-ghost" style="padding:8px 14px;font-size:12px;">Close</button>'
    + '</div></div></div>';
  document.body.appendChild(m);
};

window.aab_removeClip = function(id) {
  if (!confirm('Remove this clip from the timeline?')) return;
  if (PROJECT.clips) delete PROJECT.clips[id];
  if (typeof saveProject === 'function') saveProject();
  aab_refreshTimeline();
};

// ══════════════════════════════════════════════════════════════════════════
// EXPORT PANEL
// ══════════════════════════════════════════════════════════════════════════

function aab_buildExportPanel() {
  if (document.getElementById('aab-export-panel')) return;
  var p = document.createElement('div');
  p.id = 'aab-export-panel';
  p.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">'
    + '<h3 style="font-size:16px;font-weight:700;color:#e2e8f0;margin:0;">🎬 Export Video</h3>'
    + '<button onclick="document.getElementById(\'aab-export-panel\').classList.remove(\'open\')" style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1;">✕</button>'
    + '</div>'
    + '<div id="aab-export-clip-count" style="font-size:12px;color:#64748b;margin-bottom:16px;"></div>'
    + '<div class="export-opt" onclick="aab_exportDirect()">'
    + '<span class="export-badge badge-free">FREE</span><h4>⬇ Download All Clips</h4><p>Save each clip as an MP4 file</p></div>'
    + '<div class="export-opt" onclick="aab_exportStitch()">'
    + '<span class="export-badge badge-pro">CREATOMATE</span><h4>🎞 Stitch into One Video</h4><p>Merge all clips with transitions (1-3 min)</p></div>'
    + '<div id="aab-export-status" style="margin-top:16px;display:none;">'
    + '<div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;"><div id="aab-export-bar" style="height:100%;background:#00d4aa;width:0%;transition:width .5s;"></div></div>'
    + '<p id="aab-export-msg" style="font-size:12px;color:#64748b;margin-top:8px;"></p></div>'
    + '<div id="aab-export-result" style="margin-top:16px;display:none;"></div>';
  document.body.appendChild(p);
}

window.aab_openExport = function() {
  aab_buildExportPanel();
  var clips = PROJECT.clips || {};
  var count = Object.keys(clips).length;
  var el = document.getElementById('aab-export-clip-count');
  if (el) el.textContent = count + ' clip' + (count!==1?'s':'') + ' ready';
  document.getElementById('aab-export-result').style.display = 'none';
  document.getElementById('aab-export-status').style.display = 'none';
  document.getElementById('aab-export-panel').classList.add('open');
};

window.aab_exportDirect = function() {
  var clips = PROJECT.clips || {};
  var keys = Object.keys(clips);
  if (!keys.length) { alert('No clips yet. Generate scenes first.'); return; }
  keys.forEach(function(k,i) {
    var c = clips[k]; if (!c.url) return;
    setTimeout(function() {
      var a = document.createElement('a');
      a.href = c.url;
      a.download = 'aabstudio-scene-' + (c.sceneNum||i+1) + '.mp4';
      document.body.appendChild(a); a.click(); a.remove();
    }, i * 800);
  });
  if (typeof toast === 'function') toast('Downloading ' + keys.length + ' clips...', 'ok');
  document.getElementById('aab-export-panel').classList.remove('open');
};

window.aab_exportStitch = async function() {
  var clips = PROJECT.clips || {};
  var keys  = Object.keys(clips).sort(function(a,b){ return (clips[a].sceneNum||0)-(clips[b].sceneNum||0); });
  var valid  = keys.filter(function(k){ return clips[k].url; });
  if (valid.length < 2) { alert('Need at least 2 clips to stitch.'); return; }
  var statusEl = document.getElementById('aab-export-status');
  var barEl    = document.getElementById('aab-export-bar');
  var msgEl    = document.getElementById('aab-export-msg');
  var resultEl = document.getElementById('aab-export-result');
  statusEl.style.display = 'block'; resultEl.style.display = 'none';
  msgEl.textContent = 'Submitting...';
  try {
    var res = await fetch(API + '/api/creatomate/stitch', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        clips: valid.map(function(k){ return { url:clips[k].url, duration:clips[k].duration||8 }; }),
        resolution: '1080p', outputFormat: 'mp4'
      })
    });
    var data = await res.json();
    if (data.error) throw new Error(data.error);
    msgEl.textContent = 'Rendering...';
    var pct = 0;
    var timer = setInterval(async function() {
      var sr = await fetch(API + '/api/creatomate/status/' + data.taskId);
      var sd = await sr.json();
      pct = sd.progress || pct;
      barEl.style.width = pct + '%';
      msgEl.textContent = 'Rendering... ' + Math.round(pct) + '%';
      if (sd.status === 'succeeded' && sd.outputUrl) {
        clearInterval(timer);
        barEl.style.width = '100%';
        msgEl.textContent = 'Done!';
        resultEl.style.display = 'block';
        resultEl.innerHTML = '<a href="'+sd.outputUrl+'" target="_blank" class="btn-primary" style="display:block;text-align:center;padding:12px;text-decoration:none;border-radius:8px;font-size:14px;">⬇ Download Final Video</a>';
        if (typeof toast === 'function') toast('Export complete!', 'ok');
      }
      if (sd.status === 'failed') { clearInterval(timer); msgEl.textContent = 'Export failed — try downloading individually'; }
    }, 5000);
  } catch(e) { msgEl.textContent = 'Error: ' + e.message; }
};

// Wire export button to edit suite header
setTimeout(function() {
  var editHeader = document.querySelector('#edit-pg .edit-header, #edit-pg .pg-header, #edit-pg > div:first-child');
  if (editHeader && !document.getElementById('aab-export-btn')) {
    var btn = document.createElement('button');
    btn.id = 'aab-export-btn';
    btn.className = 'btn-primary';
    btn.style.cssText = 'margin-left:auto;padding:8px 18px;font-size:13px;';
    btn.innerHTML = '🎬 Export';
    btn.onclick = window.aab_openExport;
    editHeader.appendChild(btn);
  }
  aab_buildExportPanel();
  if (typeof PROJECT !== 'undefined') aab_refreshTimeline();
}, 800);

// ══════════════════════════════════════════════════════════════════════════
// RECORDING → TIMELINE
// ══════════════════════════════════════════════════════════════════════════

var _origStopRec = window.stopRec;
window.stopRec = function() {
  if (typeof _origStopRec === 'function') _origStopRec.apply(this, arguments);
  setTimeout(function() {
    var idx   = window.STUDIO && STUDIO.currentScene || 0;
    var scene = PROJECT.scenes && PROJECT.scenes[idx];
    if (!scene) return;
    var clip  = PROJECT.clips && PROJECT.clips[scene.id];
    if (!clip || !clip.url) return;
    clip.source    = clip.source    || 'recording';
    clip.sceneName = clip.sceneName || 'Scene ' + (idx + 1);
    clip.ts = Date.now();
    if (typeof saveProject === 'function') saveProject();
    aab_refreshTimeline();
    aab_showRetakeBar(idx);
    aab_showNextStep('edit-pg', '✓ Clip saved — go to Edit Suite or record next scene');
  }, 700);
};

// ══════════════════════════════════════════════════════════════════════════
// SMOOTH TELEPROMPTER
// ══════════════════════════════════════════════════════════════════════════

window.tpScroll = function() {
  var TP = window.TP;
  if (!TP) return;
  clearInterval(TP.scrollTimer);
  var wrap = document.getElementById('tp-text');
  if (!wrap) return;
  var spans = wrap.querySelectorAll('span[id^="tpw"]');
  if (!spans.length) return;
  var total  = spans.length;
  var msPerW = 60000 / (TP.speed || 80);
  TP.scrollTimer = setInterval(function() {
    var wi = TP.currentWord;
    if (wi > 0) {
      var prev = document.getElementById('tpw' + (wi-1));
      if (prev) { prev.className = 'tp-done'; }
    }
    var cur = document.getElementById('tpw' + wi);
    if (cur) {
      cur.className = 'tp-current';
      cur.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    TP.currentWord++;
    if (TP.currentWord >= total) {
      clearInterval(TP.scrollTimer);
      TP.playing = false;
      var btn = document.getElementById('tp-play-btn');
      if (btn) btn.textContent = '▶ Play';
    }
  }, msPerW);
};

// ══════════════════════════════════════════════════════════════════════════
// PHONE REMOTE
// ══════════════════════════════════════════════════════════════════════════

var _bc = null;
try { _bc = new BroadcastChannel('aab_tp_remote'); } catch(e) {}

function aab_remoteCmd(cmd, val) {
  var TP    = window.TP;
  var inTp  = document.getElementById('teleprompter-pg') && document.getElementById('teleprompter-pg').classList.contains('on');
  var inRec = document.getElementById('record-pg') && document.getElementById('record-pg').classList.contains('on');
  if (cmd==='toggle') { if(inTp&&typeof tpToggle==='function') tpToggle(); else if(inRec&&typeof studioTpToggle==='function') studioTpToggle(); }
  if (cmd==='play'  && inTp && TP && !TP.playing && typeof tpToggle==='function') tpToggle();
  if (cmd==='pause' && inTp && TP && TP.playing  && typeof tpToggle==='function') tpToggle();
  if (cmd==='restart' && inTp && TP) { TP.currentWord=0; clearInterval(TP.scrollTimer); if(TP.playing) tpScroll(); }
  if (cmd==='next' && inRec && typeof studioNext==='function') studioNext();
  if (cmd==='prev' && inRec && typeof studioPrev==='function') studioPrev();
  if (cmd==='rec'  && inRec && typeof toggleRecording==='function') toggleRecording();
  if (cmd==='slower') aab_remoteCmd('speed', Math.max(20, ((inTp&&TP?TP.speed:window.STUDIO&&STUDIO.tpSpeed)||80) - 15));
  if (cmd==='faster') aab_remoteCmd('speed', Math.min(300,((inTp&&TP?TP.speed:window.STUDIO&&STUDIO.tpSpeed)||80) + 15));
  if (cmd==='speed' && val) {
    var s = parseInt(val);
    if (inTp && TP) { TP.speed=s; var sl=document.getElementById('tp-spd'); if(sl)sl.value=s; var sd=document.getElementById('tp-spd-disp'); if(sd)sd.textContent=s; if(TP.playing){clearInterval(TP.scrollTimer);tpScroll();} }
  }
}

if (_bc) _bc.onmessage = function(e){ if(e.data&&e.data.cmd) aab_remoteCmd(e.data.cmd,e.data.val); };

var _lastCmd = '';
setInterval(function() {
  try {
    var sid = window._aabSid || localStorage.getItem('aab_remote_session');
    if (!sid) return;
    var v = localStorage.getItem('aab_remote_cmd_' + sid);
    if (v && v !== _lastCmd) { _lastCmd = v; var p=v.split(':'); aab_remoteCmd(p[0],p[1]); }
  } catch(e){}
}, 250);

window.remoteSend = function(cmd, val) {
  var sid = new URLSearchParams(window.location.search).get('remote') || window._aabSid || localStorage.getItem('aab_remote_session');
  if (!sid) return;
  localStorage.setItem('aab_remote_cmd_' + sid, cmd + (val!==undefined?':'+val:''));
  if (_bc) _bc.postMessage({cmd:cmd,val:val});
};

window.tpShowRemote = function() {
  var modal = document.getElementById('tp-remote-modal');
  if (modal) modal.classList.add('on');
  var sid = 'aab_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  window._aabSid = sid;
  localStorage.setItem('aab_remote_session', sid);
  var url = location.origin + location.pathname + '?remote=' + sid;
  var qr  = document.getElementById('tp-qr');
  if (qr) qr.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(url)+'" style="width:200px;height:200px;border-radius:8px;">';
  var ud = document.getElementById('tp-remote-url-disp');
  if (ud) ud.textContent = url;
};

// ── Remote page ────────────────────────────────────────────────────────────
var _rsid = new URLSearchParams(location.search).get('remote');
if (_rsid) {
  window._aabSid = _rsid;
  document.querySelectorAll('.pg,.pg-flex,.pg-full').forEach(function(p){ p.classList.remove('on'); });
  var tn = document.getElementById('topnav'); if(tn) tn.style.display='none';
  var rp = document.getElementById('remote-pg');
  if (!rp) {
    rp = document.createElement('div');
    rp.style.cssText='position:fixed;inset:0;background:#080d14;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;';
    rp.innerHTML='<div style="font-size:22px;font-weight:800;color:#e2e8f0;">📱 Remote Control</div>'
      +'<div style="font-size:12px;color:#64748b;margin-bottom:8px;">Controlling AABStudio</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:320px;">'
      +'<button class="btn-primary" style="padding:18px;font-size:16px;" onclick="remoteSend(\'play\')">▶ Play</button>'
      +'<button class="btn-danger"  style="padding:18px;font-size:16px;" onclick="remoteSend(\'pause\')">⏸ Pause</button>'
      +'<button class="btn-ghost"   style="padding:18px;font-size:16px;" onclick="remoteSend(\'restart\')">↺ Restart</button>'
      +'<button class="btn-ghost"   style="padding:18px;font-size:16px;" onclick="remoteSend(\'toggle\')">⏯ Toggle</button>'
      +'<button class="btn-ghost"   style="padding:18px;font-size:14px;" onclick="remoteSend(\'slower\')">🐢 Slower</button>'
      +'<button class="btn-ghost"   style="padding:18px;font-size:14px;" onclick="remoteSend(\'faster\')">🐇 Faster</button>'
      +'<button class="btn-gold"    style="padding:18px;font-size:14px;" onclick="remoteSend(\'prev\')">← Prev</button>'
      +'<button class="btn-gold"    style="padding:18px;font-size:14px;" onclick="remoteSend(\'next\')">Next →</button>'
      +'</div>'
      +'<button class="btn-danger" style="margin-top:8px;padding:16px 40px;font-size:16px;" onclick="remoteSend(\'rec\')">⏺ Record</button>';
    document.body.appendChild(rp);
  } else { rp.classList.add('on'); }
}

// ══════════════════════════════════════════════════════════════════════════
// USER GUIDE
// ══════════════════════════════════════════════════════════════════════════

function aab_showNextStep(targetPage, message) {
  var h = document.getElementById('aab-next-hint');
  if (!h) {
    h = document.createElement('div');
    h.id = 'aab-next-hint';
    h.className = 'aab-next-step';
    h.style.cssText = 'cursor:pointer;position:fixed;bottom:72px;left:50%;transform:translateX(-50%);z-index:9000;max-width:400px;width:90%;';
    document.body.appendChild(h);
  }
  h.textContent = message;
  h.style.display = 'flex';
  h.onclick = function(){ if(typeof nav==='function') nav(targetPage); h.style.display='none'; };
  clearTimeout(h._t);
  h._t = setTimeout(function(){ h.style.display='none'; }, 10000);
}

function aab_showRetakeBar(idx) {
  var bar = document.getElementById('studio-retake-bar');
  if (!bar) return;
  bar.style.display='block';
  bar.style.animation='slideUp .3s ease';
  bar.innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:12px 18px;background:rgba(16,185,129,.1);border-top:1px solid rgba(16,185,129,.2);">'
    +'<span style="font-size:13px;color:#10b981;font-weight:700;">✓ Scene '+(idx+1)+' saved</span>'
    +'<div style="flex:1"></div>'
    +'<button class="btn-danger"  style="padding:6px 14px;font-size:12px;" onclick="if(typeof retakeScene===\'function\')retakeScene()">↺ Retake</button>'
    +'<button class="btn-ghost"   style="padding:6px 14px;font-size:12px;" onclick="if(typeof studioNext===\'function\'){studioNext();document.getElementById(\'studio-retake-bar\').style.display=\'none\';}">Next →</button>'
    +'<button class="btn-primary" style="padding:6px 14px;font-size:12px;" onclick="if(typeof nav===\'function\')nav(\'edit-pg\')">🎥 Edit Suite</button>'
    +'</div>';
}

// ══════════════════════════════════════════════════════════════════════════
// SCENE GENERATION — D-ID primary, HeyGen fallback
// ══════════════════════════════════════════════════════════════════════════

window.aps_generateScene = async function(idx) {
  var sc = APS.scenes[idx];
  if (!sc || !sc.narration.trim()) {
    if(sc){sc.status='failed';if(typeof aps_updateSceneRow==='function')aps_updateSceneRow(sc);}
    return false;
  }
  sc.status = 'generating';
  if (typeof aps_updateSceneRow==='function') aps_updateSceneRow(sc);
  if (idx===APS.currentIdx && typeof aps_selectScene==='function') aps_selectScene(idx);

  try {
    if (typeof aps_saveSettings==='function') aps_saveSettings();
    if (!APS.photoB64) {
      var sp = localStorage.getItem('aps_presenter_photo');
      if (sp) APS.photoB64 = sp.split(',')[1];
    }

    // Step 1: Voice (ElevenLabs)
    var vr = await fetch(API+'/api/voice', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        text:            sc.narration,
        voiceId:         APS.settings.voiceId,
        stability:       APS.settings.stability  || 0.5,
        similarityBoost: APS.settings.clarity    || 0.75
      })
    });
    var vd = await vr.json();
    if (!vd.audio) throw new Error('Voice failed: '+(vd.error||'no audio'));

    // Step 2: Submit to presenter (D-ID preferred → returns taskId immediately)
    var pr = await fetch(API+'/api/presenter', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        audioBase64:          vd.audio,
        referenceImageBase64: APS.photoB64    || null,
        customBgBase64:       APS.customBgB64 || null,
        studioType:           APS.settings.bg,
        ratio:                APS.settings.ratio,
        sceneText:            sc.narration,
        provider:             APS.settings.provider || 'did',
        framingStyle:         APS.settings.framing,
        gestureStyle:         APS.settings.gesture  || 'professional',
        shotType:             APS.settings.shot     || 'medium',
        motionStyle:          APS.settings.motion   || 'static',
        voiceGender:          APS.settings.voiceGender,
        sceneNum:             sc.num,
        sceneTotal:           sc.total,
        duration:             sc.duration
      })
    });
    var pd = await pr.json();
    if (pd.error) throw new Error(pd.error);
    sc.taskId = pd.taskId;
    console.log('Scene', sc.num, 'taskId:', pd.taskId, 'provider:', pd.provider);

    if (pd.done && pd.videoUrl) return aab_sceneDone(sc, idx, pd.videoUrl);

    // Step 3: Poll
    // D-ID: 30-90s, HeyGen: 3-8 min — max 15 min total
    var pollMs = pd.provider === 'did' ? 8000 : 15000;
    var maxPolls = pd.provider === 'did' ? 60 : 60; // 8s×60=8min for D-ID, 15s×60=15min for HeyGen

    for (var i = 0; i < maxPolls && !APS.stopRequested; i++) {
      await new Promise(function(r){ setTimeout(r, pollMs); });
      var sr = await fetch(API+'/api/presenter-status?taskId='+encodeURIComponent(pd.taskId));
      if (!sr.ok) { console.warn('Poll HTTP', sr.status); continue; }
      var stat = await sr.json();
      var elapsed = Math.round((i+1)*pollMs/1000);
      console.log('Scene', sc.num, 'poll', (i+1)+'/'+maxPolls+':', stat.status, stat.videoUrl?'✓':'', elapsed+'s');
      if (stat.done && stat.videoUrl) return aab_sceneDone(sc, idx, stat.videoUrl);
      if (stat.failed) throw new Error('Render failed: '+(stat.error||'provider error'));
    }
    throw new Error('Timed out after '+ Math.round(maxPolls*pollMs/60000) +' min');

  } catch(e) {
    sc.status='failed'; sc.error=e.message;
    if(typeof aps_updateSceneRow==='function') aps_updateSceneRow(sc);
    if(idx===APS.currentIdx&&typeof aps_selectScene==='function') aps_selectScene(idx);
    if(typeof toast==='function') toast('Scene '+sc.num+' failed: '+e.message.slice(0,60),'error');
    console.error('Scene', idx, 'error:', e.message);
    return false;
  }
};

function aab_sceneDone(sc, idx, videoUrl) {
  sc.status='done'; sc.videoUrl=videoUrl;
  APS.results[sc.id]=videoUrl;
  if(typeof aps_updateSceneRow==='function') aps_updateSceneRow(sc);
  if(idx===APS.currentIdx&&typeof aps_selectScene==='function') aps_selectScene(idx);
  if(typeof aps_addClipToBar==='function') aps_addClipToBar(sc);
  window.aps_addClipToTimeline(sc);
  if(typeof saveProject==='function') saveProject();
  if(typeof toast==='function') toast('Scene '+sc.num+' done ✓','ok');
  return true;
}

window.aps_generateAll = async function() {
  if(typeof aps_saveSettings==='function') aps_saveSettings();
  APS.stopRequested=false; APS.generating=true;
  var stopBtn=document.getElementById('aps-stop-btn'), genBtn=document.getElementById('aps-gen-all-btn');
  if(stopBtn)stopBtn.style.display='block';
  if(genBtn)genBtn.style.display='none';
  var toGen=APS.scenes.filter(function(s){return s.status!=='done';});
  if(typeof toast==='function') toast('Generating '+toGen.length+' scenes...','info');
  for(var i=0;i<toGen.length&&!APS.stopRequested;i++){
    if(typeof aps_updateProgress==='function') aps_updateProgress(i+1,toGen.length,'Scene '+toGen[i].num+' of '+toGen[i].total);
    if(typeof aps_selectScene==='function') aps_selectScene(toGen[i].num-1);
    await window.aps_generateScene(toGen[i].num-1);
  }
  APS.generating=false;
  if(stopBtn)stopBtn.style.display='none';
  if(genBtn)genBtn.style.display='block';
  var done=APS.scenes.filter(function(s){return s.status==='done';}).length;
  var fail=APS.scenes.filter(function(s){return s.status==='failed';}).length;
  if(typeof toast==='function') toast(done+' done · '+fail+' failed', done>0?'ok':'error');
  if(done>0) aab_showNextStep('edit-pg','🎬 All done! Go to Edit Suite to review & export');
};

window.aps_generateSelected = async function() {
  if(typeof aps_saveSettings==='function') aps_saveSettings();
  APS.stopRequested=false; APS.generating=true;
  var sel=APS.scenes.filter(function(s){return s.selected&&s.status!=='done';});
  if(!sel.length){if(typeof toast==='function')toast('No scenes selected','info');APS.generating=false;return;}
  for(var i=0;i<sel.length&&!APS.stopRequested;i++) await window.aps_generateScene(sel[i].num-1);
  APS.generating=false;
};

console.log('AABStudio Platform v3.0 ✓ — D-ID+HeyGen, Timeline, Export, PWA, Mobile');

})();
