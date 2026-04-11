<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AABStudio.ai — Document Intelligence Platform</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --white:#ffffff;--off-white:#f9f8f6;--warm:#f4f1ec;
  --gold:#b8942a;--gold-light:#d4aa3a;--gold-pale:#f7f0dc;--gold-border:rgba(184,148,42,0.2);
  --blue:#1a3a5c;--blue-mid:#2d5f8e;--blue-light:#e8f0f8;--blue-pale:#f0f5fb;
  --ink:#1a1a1a;--ink-mid:#3a3a3a;--muted:#7a7570;--muted-light:#a8a49f;
  --bdr:rgba(0,0,0,0.08);--bdr2:rgba(0,0,0,0.13);
  --green:#1a7a4a;--green-bg:#edf7f2;--red:#c0392b;--red-bg:#fdf0ef;
  --amber:#8a6200;--amber-bg:#fdf5e0;
  --teal:#0d7377;--teal-light:#e0f5f5;
  --navy:#0d1b2a;--navy-mid:#1a2d42;
  --radius:10px;--radius-lg:14px;--radius-xl:20px;
}
html{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);scroll-behavior:smooth;}
body{min-height:100vh;}
.topnav{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:62px;border-bottom:0.5px solid var(--bdr);background:var(--white);position:sticky;top:0;z-index:100;}
.logo{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:var(--blue);cursor:pointer;text-decoration:none;letter-spacing:0.3px;}
.logo .dot{color:var(--gold);}.logo .tld{color:var(--gold);font-size:14px;margin-left:2px;}
.nav-links{display:flex;align-items:center;gap:4px;}
.nav-link{padding:7px 14px;border-radius:8px;font-size:14px;cursor:pointer;color:var(--muted);transition:all .15s;border:none;background:transparent;font-family:'DM Sans',sans-serif;text-decoration:none;}
.nav-link:hover{color:var(--ink);background:var(--warm);}
.credit-badge{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:var(--gold-pale);border:0.5px solid var(--gold-border);font-size:12px;font-weight:500;color:var(--gold);cursor:pointer;}
.credit-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);}
.btn-primary{padding:10px 22px;border-radius:9px;font-size:14px;font-weight:500;background:var(--blue);color:#fff;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .15s;box-shadow:0 2px 8px rgba(26,58,92,.2);}
.btn-primary:hover{background:#243f66;}
.btn-gold{padding:9px 20px;border-radius:8px;font-size:14px;font-weight:500;background:var(--gold);color:#fff;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;}
.btn-outline{padding:10px 20px;border-radius:9px;font-size:14px;font-weight:400;background:transparent;color:var(--blue);cursor:pointer;border:1.5px solid rgba(26,58,92,.2);font-family:'DM Sans',sans-serif;transition:all .15s;}
.btn-outline:hover{background:var(--blue-pale);}
.btn-teal{padding:9px 20px;border-radius:8px;font-size:14px;font-weight:500;background:var(--teal);color:#fff;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;}
.btn-danger{padding:7px 14px;border-radius:8px;font-size:13px;background:transparent;color:var(--red);cursor:pointer;border:none;font-family:'DM Sans',sans-serif;}
.full-btn{width:100%;padding:12px;border-radius:var(--radius);font-size:14px;font-weight:500;background:var(--blue);color:#fff;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;margin-top:4px;transition:all .15s;}
.full-btn:hover{background:#243f66;}.full-btn.gold{background:var(--gold);}.full-btn.gold:hover{background:var(--gold-light);}
.full-btn.outline{background:transparent;color:var(--ink);border:0.5px solid var(--bdr2);}.full-btn.outline:hover{background:var(--warm);}
.full-btn.teal{background:var(--teal);}.full-btn.teal:hover{background:#0a5f63;}
.pg{display:none;}.pg.on{display:block;}.pg-flex{display:none;min-height:calc(100vh - 62px);}.pg-flex.on{display:flex;}
.hero{padding:80px 48px 64px;text-align:center;background:linear-gradient(145deg,var(--navy) 0%,var(--navy-mid) 50%,#1a2d4a 100%);border-bottom:0.5px solid rgba(255,255,255,.05);position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(184,148,42,.12) 0%,transparent 70%);pointer-events:none;}
.hero::after{content:'';position:absolute;bottom:-60px;left:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(13,115,119,.1) 0%,transparent 70%);pointer-events:none;}
.hero-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:20px;border:0.5px solid rgba(184,148,42,.3);background:rgba(184,148,42,.1);margin-bottom:26px;}
.hero-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);}.hero-eyebrow-txt{font-size:12px;font-weight:500;color:var(--gold);letter-spacing:.6px;text-transform:uppercase;}
.hero h1{font-family:'Cormorant Garamond',serif;font-size:62px;font-weight:600;line-height:1.08;margin-bottom:20px;color:#fff;letter-spacing:-1px;}.hero h1 em{font-style:italic;color:var(--gold);}
.hero-sub{font-size:17px;color:rgba(255,255,255,.6);line-height:1.7;max-width:540px;margin:0 auto 38px;}
.social-proof{display:flex;align-items:center;justify-content:center;gap:24px;padding:18px 48px;border-bottom:0.5px solid var(--bdr);background:var(--off-white);flex-wrap:wrap;}
.sp-item{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted);}.sp-item strong{color:var(--ink);font-weight:500;}.sp-div{width:1px;height:16px;background:var(--bdr2);}
.use-cases{padding:64px 48px;border-bottom:0.5px solid var(--bdr);}
.section-header{text-align:center;margin-bottom:36px;}.section-header h2{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:600;color:var(--blue);margin-bottom:10px;}.section-header p{font-size:15px;color:var(--muted);max-width:440px;margin:0 auto;}
.uc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:960px;margin:0 auto;}
.uc-card{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:26px;transition:all .2s;position:relative;overflow:hidden;}
.uc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue),var(--teal));opacity:0;transition:opacity .2s;}
.uc-card:hover{border-color:rgba(26,58,92,.2);transform:translateY(-3px);box-shadow:0 8px 24px rgba(26,58,92,.08);}.uc-card:hover::before{opacity:1;}
.uc-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
.uc-title{font-size:15px;font-weight:500;color:var(--blue);margin-bottom:6px;}.uc-desc{font-size:13px;color:var(--muted);line-height:1.6;}
.pipeline-section{padding:64px 48px;background:var(--navy);}
.pipeline-section .section-header h2{color:#fff;}.pipeline-section .section-header p{color:rgba(255,255,255,.5);}
.pipeline-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.07);border-radius:var(--radius);overflow:hidden;max-width:900px;margin:0 auto;}
.pipe-step{background:var(--navy-mid);padding:28px 20px;text-align:center;transition:background .2s;}.pipe-step:hover{background:#1e3550;}
.ps-num{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--gold);margin-bottom:8px;}.ps-title{font-size:14px;font-weight:500;color:#fff;margin-bottom:5px;}.ps-desc{font-size:12px;color:rgba(255,255,255,.4);line-height:1.55;}
.testimonials{padding:64px 48px;border-bottom:0.5px solid var(--bdr);background:var(--off-white);}
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:960px;margin:0 auto;}
.t-card{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:26px;transition:all .2s;}.t-card:hover{border-color:rgba(184,148,42,.25);box-shadow:0 4px 16px rgba(0,0,0,.06);}
.t-stars{display:flex;gap:3px;margin-bottom:12px;}.t-quote{font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--ink-mid);line-height:1.65;margin-bottom:16px;}
.t-author{display:flex;align-items:center;gap:10px;}.t-avatar{width:36px;height:36px;border-radius:50%;background:var(--blue-light);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:var(--blue);flex-shrink:0;}
.t-name{font-size:14px;font-weight:500;color:var(--ink);}.t-role{font-size:12px;color:var(--muted);}
.cta-section{padding:72px 48px;text-align:center;background:linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 100%);}
.cta-section h2{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:600;color:#fff;margin-bottom:12px;}
.cta-section p{font-size:16px;color:rgba(255,255,255,.6);margin-bottom:32px;max-width:440px;margin-left:auto;margin-right:auto;}
footer{padding:28px 48px;border-top:0.5px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;background:var(--off-white);flex-wrap:wrap;gap:12px;}
.footer-links{display:flex;gap:20px;}.footer-links a{font-size:13px;color:var(--muted);text-decoration:none;cursor:pointer;}.footer-links a:hover{color:var(--blue);}
.centered-page{flex:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,var(--navy) 0%,var(--navy-mid) 60%,#1a2d4a 100%);padding:24px;}
.auth-box{width:100%;max-width:400px;padding:36px 38px;background:var(--white);border-radius:var(--radius-xl);border:0.5px solid var(--bdr);box-shadow:0 8px 40px rgba(13,27,42,.3);}
.auth-logo{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;color:var(--blue);text-align:center;margin-bottom:4px;}.auth-logo .dot{color:var(--gold);}
.auth-tagline{text-align:center;font-size:13px;color:var(--muted);margin-bottom:24px;}
.auth-tabs{display:flex;background:var(--warm);border-radius:9px;padding:3px;margin-bottom:20px;}
.auth-tab{flex:1;padding:8px;text-align:center;font-size:13px;cursor:pointer;border-radius:7px;color:var(--muted);transition:all .15s;}.auth-tab.on{background:var(--white);color:var(--blue);font-weight:500;box-shadow:0 1px 4px rgba(0,0,0,.1);}
.field{margin-bottom:14px;}.field label{display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;}
.field input{width:100%;padding:11px 13px;border-radius:var(--radius);font-size:14px;font-family:'DM Sans',sans-serif;background:var(--white);border:0.5px solid var(--bdr2);color:var(--ink);}.field input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,58,92,.08);}
.auth-divider{text-align:center;font-size:12px;color:var(--muted);margin:16px 0;position:relative;}.auth-divider::before,.auth-divider::after{content:'';position:absolute;top:50%;width:44%;height:0.5px;background:var(--bdr2);}.auth-divider::before{left:0;}.auth-divider::after{right:0;}
.social-btn{width:100%;padding:11px;border-radius:var(--radius);font-size:13px;cursor:pointer;border:0.5px solid var(--bdr2);background:var(--white);color:var(--ink);font-family:'DM Sans',sans-serif;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:9px;transition:all .15s;}.social-btn:hover{background:var(--warm);}
.auth-err{background:var(--red-bg);border:0.5px solid rgba(192,57,43,.2);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--red);margin-bottom:14px;display:none;}.auth-err.on{display:block;}
.auth-footer{text-align:center;font-size:12px;color:var(--muted);margin-top:18px;}.auth-footer a{color:var(--blue);cursor:pointer;}
.ob-box{width:100%;max-width:520px;padding:40px;background:var(--white);border-radius:var(--radius-xl);border:0.5px solid var(--bdr);}
.ob-steps{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:28px;}.ob-step{width:32px;height:4px;border-radius:4px;background:var(--bdr2);}.ob-step.done{background:var(--green);}.ob-step.active{background:var(--blue);}
.ob-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:var(--blue);margin-bottom:8px;}.ob-sub{font-size:14px;color:var(--muted);margin-bottom:22px;line-height:1.6;}
.ob-option{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:var(--radius);border:1px solid var(--bdr2);cursor:pointer;margin-bottom:8px;transition:all .15s;}.ob-option:hover,.ob-option.sel{border-color:var(--blue);background:var(--blue-pale);}
.ob-dot{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--muted);flex-shrink:0;}.ob-option.sel .ob-dot{border-color:var(--blue);background:var(--blue);}
.ob-opt-name{font-size:14px;font-weight:500;color:var(--ink);}.ob-opt-desc{font-size:12px;color:var(--muted);}
.ob-skip{text-align:center;font-size:13px;color:var(--muted);margin-top:12px;cursor:pointer;}.ob-skip:hover{color:var(--blue);}
.app-layout{display:flex;flex:1;overflow:hidden;min-height:calc(100vh - 62px);}
.app-sidebar{width:220px;flex-shrink:0;background:var(--navy-mid);border-right:0.5px solid rgba(255,255,255,.07);padding:20px 14px;display:flex;flex-direction:column;}
.app-main{flex:1;overflow-y:auto;background:var(--off-white);}
.sb-item{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:8px;font-size:13px;cursor:pointer;color:rgba(255,255,255,.5);margin-bottom:3px;border-left:2px solid transparent;transition:all .15s;}
.sb-item:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.07);}
.sb-item.on{color:#fff;background:rgba(255,255,255,.1);border-left-color:var(--gold);font-weight:500;}
.sb-item.danger{color:rgba(192,57,43,.7);}.sb-item.danger:hover{background:rgba(192,57,43,.15);color:var(--red);}
.pad{padding:28px 32px;}.page-title{font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--blue);margin-bottom:4px;}.page-sub{font-size:13px;color:var(--muted);margin-bottom:24px;}
.upload-zone{border:1.5px dashed rgba(26,58,92,.25);border-radius:var(--radius-lg);padding:40px 28px;text-align:center;cursor:pointer;background:var(--blue-pale);margin-bottom:18px;transition:all .2s;}
.upload-zone:hover{border-color:var(--blue);background:var(--blue-light);}.upload-zone.has-file{border-style:solid;border-color:var(--green);background:var(--green-bg);}
.req-box{width:100%;padding:12px 14px;border-radius:var(--radius);font-size:14px;font-family:'DM Sans',sans-serif;background:var(--white);border:0.5px solid var(--bdr2);color:var(--ink);resize:vertical;min-height:90px;line-height:1.6;}.req-box:focus{outline:none;border-color:var(--blue);}
.section-label{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:9px;}
.depth-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:18px;}
.d-opt{padding:9px 10px;border-radius:8px;border:0.5px solid var(--bdr);cursor:pointer;font-size:13px;text-align:center;color:var(--muted);background:var(--white);transition:all .15s;}.d-opt:hover,.d-opt.on{border-color:var(--blue);color:var(--blue);background:var(--blue-pale);}.d-opt.on{font-weight:500;}
.o-opt{display:flex;align-items:center;gap:9px;padding:11px 14px;border-radius:var(--radius);border:0.5px solid var(--bdr);cursor:pointer;background:var(--white);margin-bottom:7px;transition:all .15s;}.o-opt:hover,.o-opt.on{border-color:var(--blue);background:var(--blue-pale);}
.o-dot{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--muted);flex-shrink:0;}.o-opt.on .o-dot{border-color:var(--blue);background:var(--blue);}.o-txt{font-size:13px;color:var(--muted);}.o-opt.on .o-txt{color:var(--blue);}
.spin{width:16px;height:16px;border:2px solid var(--bdr2);border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}@keyframes spin{to{transform:rotate(360deg);}}
.loading-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted);padding:16px 0;}
.proc-page{flex:1;display:flex;align-items:center;justify-content:center;background:var(--navy);padding:24px;}
.proc-box{width:100%;max-width:460px;padding:40px;background:rgba(255,255,255,.03);border-radius:var(--radius-xl);border:0.5px solid rgba(255,255,255,.08);text-align:center;}
.proc-box h2{font-family:'Cormorant Garamond',serif;font-size:26px;color:#fff;margin-bottom:6px;}.proc-box p{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:22px;}
.prog-track{height:3px;background:rgba(255,255,255,.08);border-radius:3px;margin-bottom:8px;}.prog-fill{height:100%;border-radius:3px;background:var(--gold);transition:width .5s ease;}
.proc-status{font-size:12px;color:rgba(255,255,255,.4);text-align:left;margin-bottom:16px;}
.ei{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;margin-bottom:5px;font-size:13px;background:rgba(255,255,255,.03);border:0.5px solid rgba(255,255,255,.06);color:rgba(255,255,255,.3);transition:all .3s;}
.ei.run{border-color:rgba(13,115,119,.4);background:rgba(13,115,119,.08);color:var(--teal);}
.ei.done{border-color:rgba(26,122,74,.2);background:rgba(26,122,74,.06);color:var(--green);}.ei.wait{opacity:.4;}
.edot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0;}.ei.run .edot{background:var(--teal);animation:pulse .9s infinite;}.ei.done .edot{background:var(--green);}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.2;}}
.report-layout{display:grid;grid-template-columns:220px 1fr;flex:1;min-height:calc(100vh - 104px);}
.rpt-sidebar{background:var(--navy-mid);border-right:0.5px solid rgba(255,255,255,.07);padding:20px 14px;overflow-y:auto;}
.rpt-nav-item{padding:8px 10px;border-radius:7px;font-size:13px;cursor:pointer;color:rgba(255,255,255,.4);margin-bottom:3px;transition:all .15s;}
.rpt-nav-item:hover,.rpt-nav-item.on{color:#fff;background:rgba(255,255,255,.07);}
.rpt-nav-item.on{font-weight:500;border-left:2px solid var(--gold);padding-left:8px;}
.rpt-content{padding:32px 40px;overflow-y:auto;background:var(--off-white);}
.rpt-title{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:var(--blue);margin-bottom:6px;}.rpt-sub{font-size:13px;color:var(--muted);margin-bottom:24px;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;}
.b-blue{background:var(--blue-light);color:var(--blue);}.b-gold{background:var(--gold-pale);color:var(--gold);}
.b-green{background:var(--green-bg);color:var(--green);}.b-red{background:var(--red-bg);color:var(--red);}
.b-amber{background:var(--amber-bg);color:var(--amber);}.b-teal{background:var(--teal-light);color:var(--teal);}
.rpt-sec-hd{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.rpt-sec-num{font-size:11px;color:var(--gold);font-weight:500;font-family:'DM Mono',monospace;}
.rpt-sec-title{font-size:18px;font-weight:500;color:var(--blue);}
.rpt-body{font-size:14px;line-height:1.8;color:var(--ink-mid);}
.reasoning-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0;}
.reasoning-cell{padding:12px 14px;border-radius:var(--radius);border:0.5px solid var(--bdr);background:var(--white);}
.rc-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;}
.rc-label.obs{color:var(--blue);}.rc-label.mer{color:var(--green);}.rc-label.risk{color:var(--red);}
.rc-label.trade{color:var(--amber);}.rc-label.ops{color:var(--blue-mid);}.rc-label.fin{color:var(--gold);}.rc-label.rec{color:var(--teal);}
.rc-text{font-size:13px;color:var(--ink-mid);line-height:1.6;}
.ev-card{margin:14px 0;border:0.5px solid var(--bdr);border-radius:var(--radius-lg);overflow:hidden;}
.ev-card-header{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--off-white);border-bottom:0.5px solid var(--bdr);}
.ev-card-id{font-family:'DM Mono',monospace;font-size:11px;color:var(--gold);font-weight:500;}
.ev-card-label{font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;}
.ev-card-body{padding:12px 14px;}
.ev-row{display:flex;gap:8px;margin-bottom:6px;font-size:13px;}
.ev-row-label{color:var(--muted);min-width:90px;flex-shrink:0;font-size:12px;}.ev-row-val{color:var(--ink-mid);line-height:1.5;}
.ev-quote{font-style:italic;color:var(--blue);padding:8px 12px;background:var(--blue-pale);border-left:3px solid var(--blue);border-radius:0 4px 4px 0;margin:8px 0;font-size:13px;line-height:1.6;}
.ev-conf{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;margin-top:6px;}
.conf-high{background:var(--green-bg);color:var(--green);}.conf-med{background:var(--amber-bg);color:var(--amber);}.conf-low{background:var(--red-bg);color:var(--red);}
.divider{height:0.5px;background:var(--bdr);margin:24px 0;}
.cont-banner{background:var(--navy);border-radius:var(--radius-lg);padding:22px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:12px;}
.cont-banner h3{font-size:16px;font-weight:500;color:#fff;margin-bottom:4px;}.cont-banner p{font-size:13px;color:rgba(255,255,255,.5);}
.pipebar{display:flex;align-items:center;padding:0 24px;height:42px;border-bottom:0.5px solid var(--bdr);background:var(--off-white);overflow-x:auto;}
.pip{display:flex;align-items:center;gap:5px;padding:6px 10px;font-size:12px;color:var(--muted);cursor:pointer;border-radius:7px;white-space:nowrap;transition:all .15s;}
.pip:hover{color:var(--ink);background:rgba(0,0,0,.05);}.pip.done{color:var(--green);}.pip.done:hover{background:var(--green-bg);}
.pip.active{color:var(--blue);background:var(--blue-pale);font-weight:500;cursor:default;}
.pip.back{color:var(--muted);font-size:12px;margin-right:4px;border-right:0.5px solid var(--bdr);padding-right:14px;border-radius:0;}
.pip.back:hover{color:var(--blue);background:transparent;}
.pip-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;}.pip-arr{color:var(--bdr2);font-size:10px;padding:0 2px;}
.pricing-wrap{max-width:1040px;margin:0 auto;padding:0 24px;}
.pricing-hero{text-align:center;padding:52px 24px 32px;border-bottom:0.5px solid var(--bdr);background:linear-gradient(145deg,var(--navy) 0%,var(--navy-mid) 100%);}
.pricing-hero h1{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:600;color:#fff;margin-bottom:10px;}
.billing-toggle{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;}
.bt-lbl{font-size:14px;color:rgba(255,255,255,.4);}.bt-lbl.on{color:#fff;font-weight:500;}
.tog-track{width:42px;height:24px;border-radius:20px;background:rgba(255,255,255,.15);cursor:pointer;position:relative;transition:background .2s;}
.tog-track.on{background:var(--blue);}.tog-thumb{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:left .2s;}.tog-track.on .tog-thumb{left:21px;}
.save-pill{background:var(--green-bg);color:var(--green);font-size:12px;padding:3px 10px;border-radius:20px;font-weight:500;}
.tier-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:28px 0 40px;}
.tier{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:22px 18px;position:relative;}
.tier.pop{border:2px solid var(--blue);background:var(--blue-pale);}
.tier-pop-badge{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:10px;font-weight:500;padding:3px 14px;border-radius:0 0 8px 8px;white-space:nowrap;}
.tier-name{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;color:var(--muted);}
.tier.pop .tier-name{color:var(--blue);}
.tier-amount{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;color:var(--blue);line-height:1;}
.tier-period{font-size:13px;color:var(--muted);}
.tier-desc{font-size:13px;color:var(--muted);margin:10px 0 16px;line-height:1.55;min-height:40px;}
.tier-cta{width:100%;padding:11px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;margin-bottom:18px;transition:all .15s;}
.tc-free{background:var(--warm);color:var(--ink);border:0.5px solid var(--bdr2)!important;}
.tc-pro{background:var(--blue);color:#fff;}.tc-pro:hover{background:var(--blue-mid);}
.tc-studio{background:var(--gold);color:#fff;}.tc-studio:hover{background:var(--gold-light);}
.tc-ent{background:transparent;color:var(--blue);border:1.5px solid var(--blue)!important;}
.tier-features{list-style:none;}.tier-features li{font-size:13px;color:var(--muted);padding:5px 0;border-bottom:0.5px solid var(--bdr);display:flex;align-items:center;gap:8px;}
.tier-features li:last-child{border:none;}.tier-features li.yes{color:var(--ink-mid);}
.tfc-yes{width:16px;height:16px;border-radius:4px;background:var(--green-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.tfc-no{width:16px;height:16px;border-radius:4px;background:var(--warm);flex-shrink:0;}
.credits-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.credit-card{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:22px;}
.credit-card.best{border-color:rgba(184,148,42,.4);background:var(--gold-pale);}
.cc-best{display:inline-block;background:var(--gold-pale);color:var(--gold);font-size:11px;padding:3px 10px;border-radius:10px;font-weight:500;margin-bottom:8px;border:0.5px solid var(--gold-border);}
.cc-name{font-size:15px;font-weight:500;color:var(--ink);margin-bottom:3px;}.cc-credits{font-size:13px;color:var(--muted);margin-bottom:14px;}
.cc-price{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:var(--blue);margin-bottom:2px;}.cc-per{font-size:12px;color:var(--muted);margin-bottom:14px;}
.cc-btn{width:100%;padding:10px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid var(--bdr2);background:var(--white);color:var(--ink);font-family:'DM Sans',sans-serif;margin-bottom:10px;transition:all .15s;}
.cc-btn:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-pale);}
.cc-note{font-size:12px;color:var(--muted);line-height:1.6;}
.modal-back{display:none;position:fixed;inset:0;background:rgba(13,27,42,.5);z-index:999;align-items:center;justify-content:center;padding:24px;}
.modal-back.on{display:flex;}
.modal{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-xl);padding:30px 32px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;}
.modal h2{font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--blue);margin-bottom:4px;}
.modal-sub{font-size:13px;color:var(--muted);margin-bottom:20px;}
.order-summary{background:var(--off-white);border:0.5px solid var(--bdr);border-radius:var(--radius);padding:14px 16px;margin-bottom:18px;}
.os-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:0.5px solid var(--bdr);}
.os-row:last-child{border:none;font-weight:500;font-size:14px;padding-top:10px;}
.stripe-note{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--muted);margin-bottom:16px;}
.cost-estimate-box{background:linear-gradient(135deg,var(--navy-mid),var(--navy));border:0.5px solid rgba(255,255,255,.08);border-radius:var(--radius-lg);padding:18px 20px;margin-bottom:16px;}
.ce-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:0.5px solid rgba(255,255,255,.06);}
.ce-row:last-child{border:none;padding-top:10px;font-size:15px;font-weight:500;}
.ce-label{color:rgba(255,255,255,.5);}.ce-val{color:#fff;font-family:'DM Mono',monospace;}.ce-val.gold{color:var(--gold);}
.credit-warning{background:rgba(192,57,43,.1);border:0.5px solid rgba(192,57,43,.2);border-radius:var(--radius);padding:12px 14px;margin-bottom:12px;font-size:13px;color:var(--red);}
.empty-state{text-align:center;padding:48px 24px;}
.empty-state h3{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--blue);margin-bottom:6px;}
.empty-state p{font-size:14px;color:var(--muted);margin-bottom:20px;max-width:320px;margin-left:auto;margin-right:auto;}
.usage-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
.usage-item{background:var(--off-white);border-radius:8px;padding:13px;border:0.5px solid var(--bdr);}
.ui-label{font-size:11px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px;}
.ui-nums{display:flex;align-items:baseline;gap:5px;margin-bottom:6px;}
.ui-used{font-size:20px;font-weight:500;color:var(--blue);}.ui-total{font-size:12px;color:var(--muted);}
.ui-bar{height:4px;background:var(--bdr2);border-radius:4px;}.ui-fill{height:100%;border-radius:4px;}
.acc-section{display:none;}.acc-section.on{display:block;}
.success-box{width:100%;max-width:400px;padding:40px;background:var(--white);border-radius:var(--radius-xl);border:0.5px solid var(--bdr);text-align:center;}
.success-icon{width:64px;height:64px;border-radius:50%;background:var(--green-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}
.success-box h2{font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--blue);margin-bottom:8px;}
.success-box p{font-size:14px;color:var(--muted);margin-bottom:22px;}
.scene-card{background:var(--white);border-radius:var(--radius-lg);margin-bottom:10px;overflow:hidden;transition:all .2s;border:0.5px solid var(--bdr);}
.scene-card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.07);}
.scene-card.type-introduction{border-left:4px solid #2d5f8e;}.scene-card.type-evidence{border-left:4px solid #b8942a;}
.scene-card.type-explanation{border-left:4px solid #1a7a4a;}.scene-card.type-comparison{border-left:4px solid #8a6200;}
.scene-card.type-recommendation{border-left:4px solid #0d7377;}.scene-card.type-conclusion{border-left:4px solid #1a3a5c;}
.scene-card-header{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--off-white);border-bottom:0.5px solid var(--bdr);cursor:pointer;}
.scene-num{font-family:'DM Mono',monospace;font-size:11px;color:var(--gold);font-weight:500;min-width:56px;}
.scene-type{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;padding:3px 10px;border-radius:20px;}
.st-intro{background:var(--blue-light);color:var(--blue);}.st-evidence{background:var(--gold-pale);color:#8a6200;}
.st-explanation{background:var(--green-bg);color:var(--green);}.st-comparison{background:var(--amber-bg);color:var(--amber);}
.st-recommendation{background:var(--teal-light);color:var(--teal);}.st-conclusion{background:var(--blue-pale);color:var(--blue-mid);}
.scene-duration{font-size:11px;color:var(--muted);margin-left:auto;background:var(--warm);padding:2px 8px;border-radius:10px;}
.scene-card-body{padding:14px 16px;}
.scene-script{font-family:'DM Mono',monospace;font-size:13px;line-height:1.75;color:var(--ink);background:var(--off-white);padding:12px 14px;border-radius:var(--radius);margin-bottom:10px;border-left:3px solid var(--blue);}
.scene-script-b{border-left-color:var(--gold);}
.scene-presenter-label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:5px;font-weight:600;}
.scene-visual{font-size:12px;color:var(--muted);display:flex;align-items:flex-start;gap:7px;margin-top:8px;padding:8px 10px;background:linear-gradient(135deg,var(--warm),var(--off-white));border-radius:7px;border:0.5px solid var(--bdr);}
.evidence-overlay-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;background:var(--gold-pale);border:0.5px solid var(--gold-border);font-size:11px;color:var(--gold);font-weight:500;margin-top:6px;font-family:'DM Mono',monospace;}
.scene-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
.ss-item{text-align:center;background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:14px 10px;}
.ss-num{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:var(--blue);}
.ss-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;}
.disc-block{margin-bottom:32px;}
.disc-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,var(--blue-pale),var(--off-white));border-radius:var(--radius-lg);border:0.5px solid rgba(26,58,92,.1);}
.disc-num{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:var(--gold);}
.disc-title{font-size:15px;font-weight:500;color:var(--blue);}
.presenter-toggle{display:flex;background:var(--warm);border-radius:9px;padding:3px;gap:2px;}
.pt-btn{flex:1;padding:8px 12px;text-align:center;font-size:13px;cursor:pointer;border-radius:7px;color:var(--muted);transition:all .15s;border:none;background:transparent;font-family:'DM Sans',sans-serif;}
.pt-btn.on{background:var(--white);color:var(--blue);font-weight:500;border:0.5px solid var(--bdr);box-shadow:0 1px 4px rgba(0,0,0,.08);}
.export-platform-card{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;cursor:pointer;transition:all .2s;}
.export-platform-card:hover{border-color:rgba(26,58,92,.2);transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.08);}
.export-platform-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;}
.export-platform-btns button{padding:7px 12px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid var(--bdr2);background:var(--off-white);color:var(--ink);font-family:'DM Sans',sans-serif;transition:all .15s;font-weight:500;}
.export-platform-btns button:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-pale);}
.avatar-card{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:12px 8px;cursor:pointer;text-align:center;transition:all .2s;}
.avatar-card:hover{border-color:rgba(26,58,92,.2);transform:translateY(-2px);}
.avatar-card.on{border:2px solid var(--blue);background:var(--blue-pale);}
.avatar-img{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#fff;margin:0 auto 8px;box-shadow:0 2px 8px rgba(0,0,0,.15);}
.avatar-name{font-size:13px;font-weight:500;color:var(--ink);}.avatar-role{font-size:10px;color:var(--muted);margin-top:1px;}
.render-scene-item{background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:14px;position:relative;}
.rsi-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.rsi-num{font-family:'DM Mono',monospace;font-size:10px;color:var(--gold);font-weight:500;}
.rsi-status{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;margin-left:auto;}
.rsi-pending{background:var(--warm);color:var(--muted);}.rsi-voice{background:var(--amber-bg);color:var(--amber);}
.rsi-video{background:var(--blue-pale);color:var(--blue);}.rsi-done{background:var(--green-bg);color:var(--green);}
.rsi-error{background:var(--red-bg);color:var(--red);}
.rsi-script{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:8px;}
.rsi-progress{height:3px;background:var(--bdr2);border-radius:3px;overflow:hidden;}
.rsi-fill{height:100%;border-radius:3px;background:var(--blue);transition:width .5s ease;}
.meta-field{margin-bottom:14px;}
.meta-field label{display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px;}
.meta-value{width:100%;padding:10px 12px;border-radius:var(--radius);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--off-white);border:0.5px solid var(--bdr);color:var(--ink);line-height:1.65;white-space:pre-wrap;}
.meta-copy-btn{margin-top:6px;padding:6px 14px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid var(--bdr2);background:var(--white);color:var(--blue);font-family:'DM Sans',sans-serif;font-weight:500;}
.meta-copy-btn:hover{background:var(--blue-pale);}
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.compare-diff{border-left:3px solid var(--gold);padding:10px 14px;margin-bottom:8px;border-radius:0 var(--radius) var(--radius) 0;background:var(--gold-pale);}
.compare-diff.added{border-left-color:var(--green);background:var(--green-bg);}
.compare-diff.removed{border-left-color:var(--red);background:var(--red-bg);}
.compare-diff.changed{border-left-color:var(--amber);background:var(--amber-bg);}
.diff-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
.diff-label.added{color:var(--green);}.diff-label.removed{color:var(--red);}.diff-label.changed{color:var(--amber);}
@media(max-width:768px){.scene-stats{grid-template-columns:1fr 1fr;}.topnav{padding:0 16px;}.hero{padding:48px 24px 40px;}.hero h1{font-size:36px;}.uc-grid,.t-grid{grid-template-columns:1fr;}.tier-grid{grid-template-columns:1fr;}.credits-grid{grid-template-columns:1fr;}.pad{padding:20px 16px;}.pipeline-steps{grid-template-columns:1fr 1fr;}.app-layout{flex-direction:column;}.report-layout{grid-template-columns:1fr;}.rpt-sidebar{display:none;}.compare-grid{grid-template-columns:1fr;}.reasoning-grid{grid-template-columns:1fr;}}
</style>
</head>
<body>
<!-- NAV -->
<nav class="topnav" id="topnav">
  <a class="logo" onclick="nav('home')" href="#">AAB<span class="dot">Studio</span><span class="tld">.ai</span></a>
  <div class="nav-links" id="nav-links">
    <a class="nav-link" onclick="nav('pricing-pg')">Pricing</a>
    <a class="nav-link" id="nav-compare" style="display:none;" onclick="nav('compare-pg')">Compare docs</a>
    <a class="nav-link" id="nav-specialist" style="display:none;" onclick="nav('specialist-pg')">Specialist modes</a>
    <a class="nav-link" id="nav-dash" style="display:none;" onclick="nav('dashboard-pg')">Dashboard</a>
  </div>
  <div style="display:flex;gap:8px;align-items:center;" id="nav-right">
    <div class="credit-badge" id="nav-credits" style="display:none;" onclick="nav('pricing-pg')">
      <span class="credit-badge-dot"></span><span id="nav-credit-num">0</span> credits
    </div>
    <button class="btn-outline" id="nav-signin" onclick="nav('auth-pg')">Sign in</button>
    <button class="btn-primary" id="nav-start" onclick="heroStart()">Start free</button>
    <button class="btn-primary" id="nav-analysis" style="display:none;" onclick="nav('analysis-pg')">New analysis</button>
    <button class="btn-danger" id="nav-signout" style="display:none;" onclick="signOut()">Sign out</button>
  </div>
</nav>

<!-- HOME -->
<div id="home" class="pg on">
  <div class="hero">
    <div class="hero-eyebrow"><span class="hero-eyebrow-dot"></span><span class="hero-eyebrow-txt">Universal Document Intelligence</span></div>
    <h1>Turn any document into<br>a <em>broadcast-ready</em> production</h1>
    <p class="hero-sub">Deep analysis, presenter scripts, AI video scenes, and live broadcast — all from a single upload. Built for lawyers, journalists, analysts, and creators.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-primary" style="font-size:15px;padding:14px 32px;" onclick="heroStart()">Start for free</button>
      <button class="btn-outline" style="font-size:15px;padding:14px 32px;color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.2);" onclick="nav('pricing-pg')">See pricing</button>
      <button class="btn-gold" style="font-size:15px;padding:14px 32px;" onclick="nav('analysis-pg')">Try a demo</button>
    </div>
  </div>
  <div class="social-proof">
    <div class="sp-item"><strong>22 engines</strong> in the pipeline</div><div class="sp-div"></div>
    <div class="sp-item"><strong>8-second</strong> AI video scenes</div><div class="sp-div"></div>
    <div class="sp-item"><strong>5 phases</strong> from upload to broadcast</div><div class="sp-div"></div>
    <div class="sp-item">Powered by <strong>Claude AI</strong></div>
  </div>
  <div class="use-cases">
    <div class="section-header"><h2>Built for every professional</h2><p>One platform, six professional use cases, zero compromise on depth.</p></div>
    <div class="uc-grid">
      <div class="uc-card"><div class="uc-icon" style="background:var(--blue-light);"><svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke="var(--blue)" stroke-width="1.4"/><path d="M5 7h8M5 10h5" stroke="var(--blue)" stroke-width="1.2" stroke-linecap="round"/></svg></div><div class="uc-title">Legal &amp; contracts</div><div class="uc-desc">Obligations, risk clauses, hidden liabilities, and compliance gaps surfaced automatically.</div></div>
      <div class="uc-card"><div class="uc-icon" style="background:var(--green-bg);"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 14l4-5 3 3 6-7" stroke="var(--green)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="uc-title">Financial analysis</div><div class="uc-desc">Anomalies, irregularities, audit exposure, and risk indicators extracted and reasoned.</div></div>
      <div class="uc-card"><div class="uc-icon" style="background:var(--gold-pale);"><svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" fill="none" stroke="var(--gold)" stroke-width="1.4"/><path d="M9 6v3.5l2.5 2.5" stroke="var(--gold)" stroke-width="1.3" stroke-linecap="round"/></svg></div><div class="uc-title">Investigative research</div><div class="uc-desc">Patterns, actors, contradictions, and implications from any public record or document.</div></div>
      <div class="uc-card"><div class="uc-icon" style="background:var(--blue-light);"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 14V7l5-3 5 3v7" stroke="var(--blue)" stroke-width="1.4" fill="none" stroke-linejoin="round"/><rect x="6" y="9" width="6" height="5" rx="1" fill="none" stroke="var(--blue)" stroke-width="1.2"/></svg></div><div class="uc-title">Research &amp; academic</div><div class="uc-desc">Methodology critique, findings extraction, and lecture-ready explainer content.</div></div>
      <div class="uc-card"><div class="uc-icon" style="background:var(--teal-light);"><svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="5" width="14" height="9" rx="1.5" fill="none" stroke="var(--teal)" stroke-width="1.4"/><polygon points="7,8 7,12 13,10" fill="var(--teal)" fill-opacity=".75"/></svg></div><div class="uc-title">Creator &amp; documentary</div><div class="uc-desc">AI video scenes, documentary mode, debate format, and broadcast-ready exports.</div></div>
      <div class="uc-card"><div class="uc-icon" style="background:var(--red-bg);"><svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="3.5" fill="var(--red)" fill-opacity=".4"/><circle cx="9" cy="9" r="7" fill="none" stroke="var(--red)" stroke-width="1.4"/></svg></div><div class="uc-title">Live broadcast</div><div class="uc-desc">Teleprompter, evidence overlays, graphics queue, and on-air presenter flow.</div></div>
    </div>
  </div>
  <div class="pipeline-section">
    <div class="section-header"><h2>From upload to broadcast in minutes</h2><p>A 22-engine intelligence pipeline that thinks like a professional studio.</p></div>
    <div class="pipeline-steps">
      <div class="pipe-step"><div class="ps-num">01</div><div class="ps-title">Upload &amp; analyse</div><div class="ps-desc">Any document type. Six intelligence engines in sequence.</div></div>
      <div class="pipe-step"><div class="ps-num">02</div><div class="ps-title">Report &amp; evidence</div><div class="ps-desc">Balanced deep report with evidence cards and full reasoning.</div></div>
      <div class="pipe-step"><div class="ps-num">03</div><div class="ps-title">Script &amp; scenes</div><div class="ps-desc">Discussion blocks segmented into 8-second presenter scenes.</div></div>
      <div class="pipe-step"><div class="ps-num">04</div><div class="ps-title">Video &amp; broadcast</div><div class="ps-desc">AI video generation, stitching, export, or live teleprompter.</div></div>
    </div>
  </div>
  <div class="testimonials">
    <div class="section-header"><h2>Trusted by professionals</h2></div>
    <div class="t-grid">
      <div class="t-card"><div class="t-stars"><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg></div><div class="t-quote">"I uploaded a 140-page procurement contract and had a complete risk analysis in under three minutes. The evidence cards with source references are extraordinary."</div><div class="t-author"><div class="t-avatar">SC</div><div><div class="t-name">Sarah Chen</div><div class="t-role">Commercial Solicitor, London</div></div></div></div>
      <div class="t-card"><div class="t-stars"><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg></div><div class="t-quote">"The investigative analysis found patterns our team had missed across 300 pages. The balanced reasoning with merits and risks on every finding is exceptional."</div><div class="t-author"><div class="t-avatar">MO</div><div><div class="t-name">Marcus O'Brien</div><div class="t-role">Investigative Journalist</div></div></div></div>
      <div class="t-card"><div class="t-stars"><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg><svg width="14" height="14" viewBox="0 0 14 14" fill="var(--gold)"><polygon points="7,1 8.8,5.1 13,5.5 9.9,8.4 10.8,13 7,10.7 3.2,13 4.1,8.4 1,5.5 5.2,5.1"/></svg></div><div class="t-quote">"I turned a 60-page research paper into a full documentary-style lecture video with AI presenter in about 20 minutes. My students said it was the clearest explanation they'd seen."</div><div class="t-author"><div class="t-avatar">PW</div><div><div class="t-name">Dr. Priya Williams</div><div class="t-role">Senior Lecturer, UCL</div></div></div></div>
    </div>
  </div>
  <div class="cta-section">
    <h2>Ready to transform your documents?</h2>
    <p>Start free — no credit card required. Upgrade when you need more power.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-primary" style="font-size:15px;padding:14px 32px;" onclick="heroStart()">Start for free</button>
      <button class="btn-outline" style="font-size:15px;padding:14px 32px;color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.2);" onclick="nav('pricing-pg')">View pricing</button>
    </div>
  </div>
  <footer>
    <a class="logo" href="#" onclick="nav('home')">AAB<span class="dot">Studio</span><span class="tld">.ai</span></a>
    <div style="font-size:13px;color:var(--muted);">© 2026 AABStudio.ai · All rights reserved</div>
    <div class="footer-links"><a onclick="nav('pricing-pg')">Pricing</a><a>Privacy</a><a>Terms</a><a>Contact</a></div>
  </footer>
</div>
<!-- ONBOARDING -->
<div id="onboard-pg" class="pg-flex">
  <div class="centered-page">
    <div class="ob-box">
      <div class="ob-steps"><div class="ob-step active" id="obs1"></div><div class="ob-step" id="obs2"></div><div class="ob-step" id="obs3"></div></div>
      <div id="ob1">
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--blue);text-align:center;margin-bottom:4px;">AAB<span style="color:var(--gold);">Studio</span>.ai</div>
        <div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:24px;">Let's personalise your experience</div>
        <div class="ob-title">What best describes you?</div>
        <div class="ob-sub">We'll tailor the analysis depth and output to your work.</div>
        <div id="ob-roles">
          <div class="ob-option" onclick="pickRole(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">Solicitor / Lawyer</div><div class="ob-opt-desc">Contracts, legal review, compliance analysis</div></div></div>
          <div class="ob-option" onclick="pickRole(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">Financial Analyst / Auditor</div><div class="ob-opt-desc">Budgets, audits, financial documents</div></div></div>
          <div class="ob-option" onclick="pickRole(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">Journalist / Investigator</div><div class="ob-opt-desc">Public records, investigative research</div></div></div>
          <div class="ob-option" onclick="pickRole(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">Researcher / Academic</div><div class="ob-opt-desc">Papers, policy, academic content</div></div></div>
          <div class="ob-option" onclick="pickRole(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">Content Creator / Presenter</div><div class="ob-opt-desc">Videos, scripts, broadcast content</div></div></div>
        </div>
        <button class="full-btn" style="margin-top:16px;" onclick="obGo(2)">Continue</button>
        <div class="ob-skip" onclick="nav('auth-pg')">Skip — go straight to sign up</div>
      </div>
      <div id="ob2" style="display:none;">
        <div class="ob-title">What will you mainly use AABStudio for?</div>
        <div class="ob-sub">Choose your primary output. You can always change this later.</div>
        <div id="ob-outputs">
          <div class="ob-option sel" onclick="pickOutput(this)"><div class="ob-dot" style="border-color:var(--blue);background:var(--blue);"></div><div><div class="ob-opt-name">Deep analysis reports</div><div class="ob-opt-desc">Professional PDF and DOCX reports with evidence cards</div></div></div>
          <div class="ob-option" onclick="pickOutput(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">Presenter scripts &amp; scenes</div><div class="ob-opt-desc">Teleprompter, scene studio, live broadcast</div></div></div>
          <div class="ob-option" onclick="pickOutput(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">AI video &amp; documentary</div><div class="ob-opt-desc">Full presenter videos, documentary mode, debate format</div></div></div>
          <div class="ob-option" onclick="pickOutput(this)"><div class="ob-dot"></div><div><div class="ob-opt-name">All of the above</div><div class="ob-opt-desc">Use the full platform end to end</div></div></div>
        </div>
        <button class="full-btn" style="margin-top:16px;" onclick="obGo(3)">Continue</button>
        <div class="ob-skip" onclick="obGo(3)">Skip</div>
      </div>
      <div id="ob3" style="display:none;text-align:center;">
        <div style="width:60px;height:60px;border-radius:50%;background:var(--blue-light);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;"><svg width="26" height="26" viewBox="0 0 26 26"><path d="M5 13l5.5 5.5L21 7" stroke="var(--blue)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="ob-title" style="text-align:center;">You're all set</div>
        <div class="ob-sub" style="text-align:center;">Create your free account to save your work and access all features.</div>
        <button class="full-btn" onclick="nav('auth-pg')">Create free account</button>
        <button class="full-btn outline" style="margin-top:8px;" onclick="nav('analysis-pg')">Try without signing up</button>
      </div>
    </div>
  </div>
</div>

<!-- AUTH -->
<div id="auth-pg" class="pg-flex">
  <div class="centered-page">
    <div class="auth-box">
      <div class="auth-logo">AAB<span class="dot">Studio</span></div>
      <div class="auth-tagline">Document Intelligence Platform</div>
      <div class="auth-tabs"><div class="auth-tab on" id="tab-si" onclick="switchAuth('si')">Sign in</div><div class="auth-tab" id="tab-su" onclick="switchAuth('su')">Create account</div></div>
      <div class="auth-err" id="auth-err">Please fill in all fields.</div>
      <div id="si-form">
        <div class="field"><label>Email</label><input type="email" id="si-email" placeholder="you@example.com"></div>
        <div class="field"><label>Password</label><input type="password" id="si-pass" placeholder="••••••••"></div>
        <button class="full-btn" onclick="doSignIn()">Sign in to AABStudio</button>
      </div>
      <div id="su-form" style="display:none;">
        <div class="field"><label>Full name</label><input type="text" id="su-name" placeholder="Your full name"></div>
        <div class="field"><label>Email</label><input type="email" id="su-email" placeholder="you@example.com"></div>
        <div class="field"><label>Password</label><input type="password" id="su-pass" placeholder="Minimum 8 characters"></div>
        <button class="full-btn" onclick="doSignUp()">Create free account</button>
      </div>
      <div class="auth-divider">or continue with</div>
      <button class="social-btn" onclick="doSocial('Google')"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M15.5 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.2a3.6 3.6 0 01-1.56 2.36v1.96h2.52c1.47-1.36 2.34-3.36 2.34-5.78z" fill="#4285F4"/><path d="M8 16c2.1 0 3.87-.7 5.16-1.88l-2.52-1.96c-.7.47-1.6.75-2.64.75-2.03 0-3.75-1.37-4.36-3.21H1.04v2.02A8 8 0 008 16z" fill="#34A853"/><path d="M3.64 9.7A4.8 4.8 0 013.38 8c0-.59.1-1.16.26-1.7V4.28H1.04A8 8 0 000 8c0 1.3.3 2.52.84 3.62L3.64 9.7z" fill="#FBBC05"/><path d="M8 3.18c1.14 0 2.17.39 2.98 1.16l2.23-2.23C11.87.79 10.1 0 8 0A8 8 0 001.04 4.28l2.6 2.02C4.25 4.55 5.97 3.18 8 3.18z" fill="#EA4335"/></svg>Continue with Google</button>
      <div class="auth-footer">By signing up you agree to our <a onclick="alert('Terms')">Terms</a> and <a onclick="alert('Privacy')">Privacy Policy</a></div>
    </div>
  </div>
</div>

<!-- ANALYSIS -->
<div id="analysis-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar">
    <div class="pip back" onclick="nav(APP.user?'dashboard-pg':'home')">← Back</div>
    <div class="pip active"><span class="pip-dot"></span>New analysis</div><span class="pip-arr">›</span>
    <div class="pip"><span class="pip-dot"></span>Report</div><span class="pip-arr">›</span>
    <div class="pip"><span class="pip-dot"></span>Scenes</div><span class="pip-arr">›</span>
    <div class="pip"><span class="pip-dot"></span>Studio</div><span class="pip-arr">›</span>
    <div class="pip"><span class="pip-dot"></span>Render</div><span class="pip-arr">›</span>
    <div class="pip"><span class="pip-dot"></span>Live</div>
  </div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">New analysis</div>
      <div class="page-sub">Upload your document and describe what you need. AABStudio handles the rest.</div>
      <div class="upload-zone" id="uz" onclick="document.getElementById('fi').click()">
        <svg width="40" height="40" viewBox="0 0 40 40" style="margin:0 auto 14px;display:block;"><rect x="8" y="5" width="24" height="30" rx="3" fill="none" stroke="var(--blue)" stroke-width="1.6"/><path d="M14 18h12M14 22h9M14 26h7" stroke="var(--blue)" stroke-width="1.3" stroke-linecap="round" opacity=".5"/><path d="M26 5v8h8" fill="none" stroke="var(--blue)" stroke-width="1.6" stroke-linejoin="round"/></svg>
        <div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:6px;" id="uz-title">Drop your document here</div>
        <div style="font-size:13px;color:var(--muted);">PDF, DOCX, TXT, XLSX, PPTX, CSV, JSON, HTML — or click to browse</div>
        <input type="file" id="fi" style="display:none;" onchange="handleFile(this)" accept=".pdf,.docx,.txt,.xlsx,.pptx,.csv,.json,.html,.doc">
      </div>
      <div id="file-pill"></div>
      <div style="margin-bottom:18px;"><div class="section-label">Analysis request</div><textarea class="req-box" id="req-box" placeholder="e.g. 'Review this contract for hidden liabilities and risk clauses'..."></textarea></div>
      <div style="margin-bottom:18px;">
        <div class="section-label">Output mode</div>
        <div class="o-opt on" onclick="pickOut(this)"><div class="o-dot" style="border-color:var(--blue);background:var(--blue);"></div><div class="o-txt">Report only — structured analysis with evidence cards</div></div>
        <div class="o-opt" onclick="pickOut(this)"><div class="o-dot"></div><div class="o-txt">Continue to presentation — scripts &amp; scenes</div></div>
        <div class="o-opt" onclick="pickOut(this)"><div class="o-dot"></div><div class="o-txt">Continue to video — AI presenter generation</div></div>
        <div class="o-opt" onclick="pickOut(this)"><div class="o-dot"></div><div class="o-txt">Prepare for live broadcast</div></div>
      </div>
      <div id="analysis-err-doc" style="display:none;background:var(--red-bg);border:0.5px solid rgba(192,57,43,.2);border-radius:var(--radius);padding:10px 14px;font-size:13px;color:var(--red);margin-bottom:14px;">Please upload a document before generating.</div>
      <div id="analysis-err-req" style="display:none;background:var(--red-bg);border:0.5px solid rgba(192,57,43,.2);border-radius:var(--radius);padding:10px 14px;font-size:13px;color:var(--red);margin-bottom:14px;">Please enter an analysis request before generating.</div>
    </div>
    <div style="width:268px;flex-shrink:0;border-left:0.5px solid var(--bdr);padding:22px 20px;overflow-y:auto;background:var(--off-white);">
      <div class="section-label">Analysis depth</div>
      <div class="depth-grid">
        <div class="d-opt" onclick="pickDepth(this,'standard')">Standard</div><div class="d-opt on" onclick="pickDepth(this,'deep')">Deep</div>
        <div class="d-opt" onclick="pickDepth(this,'investigative')">Investigative</div><div class="d-opt" onclick="pickDepth(this,'executive')">Executive</div>
        <div class="d-opt" onclick="pickDepth(this,'legal')">Legal</div><div class="d-opt" onclick="pickDepth(this,'financial')">Financial</div>
        <div class="d-opt" onclick="pickDepth(this,'research')">Research</div><div class="d-opt" onclick="pickDepth(this,'presentation')">Presentation</div>
      </div>
      <div class="section-label">Analysis type</div>
      <div style="margin-bottom:18px;">
        <div class="o-opt on" onclick="pickAnalysisType(this)"><div class="o-dot" style="border-color:var(--blue);background:var(--blue);"></div><div class="o-txt" style="font-size:12px;">Explain &amp; summarise</div></div>
        <div class="o-opt" onclick="pickAnalysisType(this)"><div class="o-dot"></div><div class="o-txt" style="font-size:12px;">Investigate &amp; detect</div></div>
        <div class="o-opt" onclick="pickAnalysisType(this)"><div class="o-dot"></div><div class="o-txt" style="font-size:12px;">Financial analysis</div></div>
        <div class="o-opt" onclick="pickAnalysisType(this)"><div class="o-dot"></div><div class="o-txt" style="font-size:12px;">Legal review</div></div>
        <div class="o-opt" onclick="pickAnalysisType(this)"><div class="o-dot"></div><div class="o-txt" style="font-size:12px;">Generate presentation</div></div>
      </div>
      <div class="section-label">Pipeline</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.9;margin-bottom:22px;">
        <div>1. Parse &amp; classify document</div><div>2. Extract evidence &amp; entities</div>
        <div>3. Apply balanced reasoning</div><div>4. Build evidence cards</div><div>5. Generate structured report</div>
      </div>
      <button class="full-btn" onclick="startAnalysis()">Generate analysis</button>
      <button class="full-btn outline" style="margin-top:8px;" onclick="nav(APP.user?'dashboard-pg':'home')">Cancel</button>
      <div style="margin-top:16px;padding-top:14px;border-top:0.5px solid var(--bdr);">
        <button class="full-btn teal" onclick="nav('compare-pg')">Compare two documents →</button>
      </div>
    </div>
  </div>
</div>

<!-- PROCESSING -->
<div id="proc-pg" class="pg-flex" style="flex-direction:column;">
  <div class="proc-page"><div class="proc-box">
    <h2>Analysing your document</h2><p>Running 6 core intelligence engines. Balanced reasoning applied to all findings.</p>
    <div class="prog-track"><div class="prog-fill" id="proc-fill" style="width:0%"></div></div>
    <div class="proc-status" id="proc-status">Initialising engines...</div>
    <div id="eng-list">
      <div class="ei wait" id="e0"><span class="edot"></span>Document parsing &amp; extraction</div>
      <div class="ei wait" id="e1"><span class="edot"></span>Document intelligence &amp; classification</div>
      <div class="ei wait" id="e2"><span class="edot"></span>User intent &amp; context engine</div>
      <div class="ei wait" id="e3"><span class="edot"></span>Evidence extraction &amp; entity detection</div>
      <div class="ei wait" id="e4"><span class="edot"></span>Balanced reasoning — merits, risks, tradeoffs</div>
      <div class="ei wait" id="e5"><span class="edot"></span>Structured report &amp; evidence card generation</div>
    </div>
  </div></div>
</div>

<!-- REPORT -->
<div id="report-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar">
    <div class="pip back" onclick="nav('analysis-pg')">← Analysis</div>
    <div class="pip active"><span class="pip-dot"></span>Report</div><span class="pip-arr">›</span>
    <div class="pip" onclick="nav('scenes-pg')"><span class="pip-dot"></span>Scenes</div><span class="pip-arr">›</span>
    <div class="pip" onclick="nav('studio-pg')"><span class="pip-dot"></span>Studio</div><span class="pip-arr">›</span>
    <div class="pip" onclick="nav('render-pg')"><span class="pip-dot"></span>Render</div><span class="pip-arr">›</span>
    <div class="pip" onclick="nav('live-pg')"><span class="pip-dot"></span>Live</div>
  </div>
  <div class="report-layout">
    <div class="rpt-sidebar">
      <div class="section-label" style="margin-bottom:8px;color:rgba(255,255,255,.3);">Sections</div>
      <div id="rpt-nav"></div>
      <div style="margin-top:16px;padding-top:14px;border-top:0.5px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:7px;">
        <button class="full-btn outline" style="margin:0;padding:9px;font-size:13px;" onclick="exportReportPDF()">Export PDF</button>
        <button class="full-btn outline" style="margin:0;padding:9px;font-size:13px;" onclick="exportReportDOCX()">Export DOCX</button>
        <button class="full-btn" style="margin:0;padding:9px;font-size:13px;" onclick="nav('scenes-pg')">→ Scene studio</button>
      </div>
    </div>
    <div class="rpt-content" id="rpt-content"><div class="loading-row"><div class="spin"></div>Generating your report...</div></div>
  </div>
</div>

<!-- DOCUMENT COMPARISON -->
<div id="compare-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar">
    <div class="pip back" onclick="nav('analysis-pg')">← Analysis</div>
    <div class="pip active"><span class="pip-dot"></span>Document comparison</div>
  </div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">Compare two documents</div>
      <div class="page-sub">Upload Document A and B to detect added clauses, removed content, changed values, and risk differences.</div>
      <div class="compare-grid">
        <div>
          <div class="section-label">Document A — Original</div>
          <div class="upload-zone" id="uz-a" onclick="document.getElementById('fi-a').click()" style="padding:20px;">
            <div style="font-size:14px;font-weight:500;color:var(--blue);" id="uz-a-title">Upload Document A</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">PDF, DOCX, TXT</div>
            <input type="file" id="fi-a" style="display:none;" onchange="handleCompareFile('a',this)" accept=".pdf,.docx,.txt">
          </div>
        </div>
        <div>
          <div class="section-label">Document B — Revised</div>
          <div class="upload-zone" id="uz-b" onclick="document.getElementById('fi-b').click()" style="padding:20px;">
            <div style="font-size:14px;font-weight:500;color:var(--blue);" id="uz-b-title">Upload Document B</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">PDF, DOCX, TXT</div>
            <input type="file" id="fi-b" style="display:none;" onchange="handleCompareFile('b',this)" accept=".pdf,.docx,.txt">
          </div>
        </div>
      </div>
      <div style="margin-bottom:18px;">
        <div class="section-label">Comparison focus</div>
        <div class="o-opt on" onclick="pickCompareType(this)"><div class="o-dot" style="border-color:var(--blue);background:var(--blue);"></div><div class="o-txt">Full comparison — all changes detected</div></div>
        <div class="o-opt" onclick="pickCompareType(this)"><div class="o-dot"></div><div class="o-txt">Risk changes only — new liabilities and risk shifts</div></div>
        <div class="o-opt" onclick="pickCompareType(this)"><div class="o-dot"></div><div class="o-txt">Financial values — changed numbers and amounts</div></div>
        <div class="o-opt" onclick="pickCompareType(this)"><div class="o-dot"></div><div class="o-txt">Policy differences — structural and policy changes</div></div>
      </div>
      <button class="full-btn" onclick="startComparison()" style="max-width:280px;">Run comparison analysis</button>
      <div id="compare-results" style="display:none;margin-top:28px;">
        <div class="divider"></div>
        <div class="page-title" style="margin-bottom:16px;">Comparison report</div>
        <div id="compare-output"></div>
      </div>
    </div>
    <div style="width:268px;flex-shrink:0;border-left:0.5px solid var(--bdr);padding:22px 20px;background:var(--off-white);">
      <div class="section-label">What we detect</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.85;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;"></span>Added clauses</div>
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--red);flex-shrink:0;"></span>Removed clauses</div>
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--amber);flex-shrink:0;"></span>Changed values</div>
        <div style="display:flex;align-items:center;gap:7px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;"></span>Risk level changes</div>
      </div>
      <div style="background:var(--blue-pale);border-radius:var(--radius);padding:12px 14px;font-size:13px;color:var(--blue-mid);line-height:1.6;">
        <strong>Tip:</strong> For best results, upload the same type of document — two versions of the same contract.
      </div>
    </div>
  </div>
</div>

<!-- COMPARE PROCESSING -->
<div id="compare-proc-pg" class="pg-flex" style="flex-direction:column;">
  <div class="proc-page"><div class="proc-box">
    <h2>Comparing documents</h2><p>Running the document comparison engine.</p>
    <div class="prog-track"><div class="prog-fill" id="compare-fill" style="width:0%"></div></div>
    <div class="proc-status" id="compare-status">Parsing both documents...</div>
    <div>
      <div class="ei wait" id="ce0"><span class="edot"></span>Parsing Document A</div>
      <div class="ei wait" id="ce1"><span class="edot"></span>Parsing Document B</div>
      <div class="ei wait" id="ce2"><span class="edot"></span>Structural alignment</div>
      <div class="ei wait" id="ce3"><span class="edot"></span>Difference detection engine</div>
      <div class="ei wait" id="ce4"><span class="edot"></span>Risk change analysis</div>
      <div class="ei wait" id="ce5"><span class="edot"></span>Building comparison report</div>
    </div>
  </div></div>
</div>
<!-- PRICING -->
<div id="pricing-pg" class="pg">
  <div class="pricing-hero"><div class="pricing-wrap">
    <h1>Simple, transparent pricing</h1>
    <p style="font-size:15px;color:rgba(255,255,255,.5);max-width:420px;margin:0 auto 4px;">Start free. Upgrade when you need more power.</p>
    <div class="billing-toggle"><span class="bt-lbl on" id="tog-m">Monthly</span><div class="tog-track" id="bill-tog" onclick="toggleBill()"><div class="tog-thumb"></div></div><span class="bt-lbl" id="tog-a">Annual</span><span class="save-pill">Save 20%</span></div>
  </div></div>
  <div style="overflow-y:auto;background:var(--off-white);"><div class="pricing-wrap">
    <div class="tier-grid">
      <div class="tier"><div class="tier-name">Free</div><div style="margin-bottom:12px;"><span class="tier-amount">£0</span><span class="tier-period">/mo</span></div><div class="tier-desc">Get started with deep analysis and report generation.</div><button class="tier-cta tc-free" onclick="pricingCTA('free')">Start free</button><ul class="tier-features"><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>3 projects</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Standard depth</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Report download</li><li><span class="tfc-no"></span>Scene studio</li><li><span class="tfc-no"></span>Voice generation</li><li><span class="tfc-no"></span>Video generation</li></ul></div>
      <div class="tier pop"><div class="tier-pop-badge">Most popular</div><div class="tier-name">Pro</div><div style="margin-bottom:12px;"><span class="tier-amount" id="pro-amt">£24</span><span class="tier-period">/mo</span></div><div class="tier-desc">Unlimited reports, scene studio, voice, and live broadcast.</div><button class="tier-cta tc-pro" onclick="pricingCTA('pro')">Start 7-day free trial</button><ul class="tier-features"><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Unlimited projects</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>All depth modes</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Scene studio</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Voice generation</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Live broadcast</li><li><span class="tfc-no"></span>Video generation</li></ul></div>
      <div class="tier"><div class="tier-name">Studio</div><div style="margin-bottom:12px;"><span class="tier-amount" id="studio-amt">£69</span><span class="tier-period">/mo</span></div><div class="tier-desc">Pro plus AI video generation credits every month.</div><button class="tier-cta tc-studio" onclick="pricingCTA('studio')">Start 7-day free trial</button><ul class="tier-features"><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Everything in Pro</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>5 video projects/mo</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Documentary mode</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Video stitching</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Top-up credits</li></ul></div>
      <div class="tier"><div class="tier-name">Enterprise</div><div style="margin-bottom:12px;"><span class="tier-amount">£249</span><span class="tier-period">/mo</span></div><div class="tier-desc">Full platform, team seats, white-label, and support.</div><button class="tier-cta tc-ent" onclick="alert('Contact sales@aabstudio.ai')">Contact sales</button><ul class="tier-features"><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>Everything in Studio</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>20 video projects/mo</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>5 team seats</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>White-label</li><li class="yes"><span class="tfc-yes"><svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="var(--green)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></span>API access</li></ul></div>
    </div>
    <div style="margin-bottom:40px;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:var(--blue);margin-bottom:6px;">Video credit bundles</div>
      <div style="font-size:14px;color:var(--muted);margin-bottom:22px;">1 scene = 10 credits. Credits never expire.</div>
      <div class="credits-grid">
        <div class="credit-card"><div class="cc-name">Starter pack</div><div class="cc-credits">400 credits — ~40 video scenes</div><div class="cc-price">£19</div><div class="cc-per">£0.048 per credit</div><button class="cc-btn" onclick="openCheckout('cred-starter')">Buy credits</button><div class="cc-note">Great for trying video generation.</div></div>
        <div class="credit-card best"><div class="cc-best">Best value</div><div class="cc-name">Creator pack</div><div class="cc-credits">1,000 credits — ~100 video scenes</div><div class="cc-price">£49</div><div class="cc-per">£0.049 per credit</div><button class="cc-btn" onclick="openCheckout('cred-creator')">Buy credits</button><div class="cc-note">Best for regular creators and journalists.</div></div>
        <div class="credit-card"><div class="cc-name">Studio pack</div><div class="cc-credits">2,500 credits — ~250 video scenes</div><div class="cc-price">£99</div><div class="cc-per">£0.040 per credit</div><button class="cc-btn" onclick="openCheckout('cred-studio')">Buy credits</button><div class="cc-note">Best rate for agencies and high-volume creators.</div></div>
      </div>
    </div>
  </div></div>
</div>

<!-- CHECKOUT MODAL -->
<div id="checkout-modal" class="modal-back"><div class="modal">
  <h2 id="m-title">Upgrade to Pro</h2><div class="modal-sub" id="m-sub">7-day free trial</div>
  <div class="order-summary" id="m-order"></div>
  <div class="stripe-note"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1.5" fill="none" stroke="var(--muted)" stroke-width="1"/></svg>Secured by Stripe · 256-bit SSL</div>
  <div id="pay-err" style="display:none;background:var(--red-bg);border:0.5px solid rgba(192,57,43,.2);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--red);margin-bottom:14px;">Something went wrong. Please try again.</div>
  <button class="full-btn gold" id="pay-btn" onclick="processPayment()">Start free trial</button>
  <button class="full-btn outline" onclick="closeCheckout()" style="margin-top:8px;">Cancel</button>
</div></div>

<!-- COST ESTIMATE MODAL -->
<div id="cost-modal" class="modal-back"><div class="modal">
  <h2>Confirm render</h2>
  <div class="modal-sub">Review estimated cost before starting video generation</div>
  <div class="cost-estimate-box">
    <div class="ce-row"><span class="ce-label">Estimated scenes</span><span class="ce-val" id="ce-scenes">0</span></div>
    <div class="ce-row"><span class="ce-label">Video runtime</span><span class="ce-val" id="ce-runtime">0s</span></div>
    <div class="ce-row"><span class="ce-label">Credits per scene</span><span class="ce-val">10</span></div>
    <div class="ce-row"><span class="ce-label">Credits required</span><span class="ce-val gold" id="ce-credits">0</span></div>
    <div class="ce-row"><span class="ce-label">Your balance</span><span class="ce-val" id="ce-balance">0</span></div>
    <div class="ce-row"><span class="ce-label">Balance after render</span><span class="ce-val" id="ce-after">0</span></div>
  </div>
  <div id="ce-warning" class="credit-warning" style="display:none;">Not enough credits. Buy more to continue.</div>
  <button class="full-btn" id="ce-confirm-btn" onclick="confirmRender()">Start render</button>
  <button class="full-btn outline" onclick="closeCostModal()" style="margin-top:8px;">Cancel</button>
  <button class="full-btn gold" id="ce-buy-btn" style="display:none;margin-top:8px;" onclick="closeCostModal();nav('pricing-pg');">Buy credits →</button>
</div></div>

<!-- SUCCESS -->
<div id="success-pg" class="pg-flex"><div class="centered-page"><div class="success-box">
  <div class="success-icon"><svg width="28" height="28" viewBox="0 0 28 28"><path d="M5 14l6 6L23 8" stroke="var(--green)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
  <h2 id="suc-title">Subscription active</h2><p id="suc-body">Your plan is now active.</p>
  <button class="full-btn" onclick="nav('analysis-pg')">Start your first analysis →</button>
</div></div></div>

<!-- DASHBOARD -->
<div id="dashboard-pg" class="pg-flex" style="flex-direction:column;">
  <div class="app-layout">
    <div class="app-sidebar">
      <div style="text-align:center;padding-bottom:16px;border-bottom:0.5px solid rgba(255,255,255,.07);margin-bottom:14px;">
        <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#fff;margin:0 auto 10px;border:2px solid rgba(255,255,255,.12);" id="dash-av">?</div>
        <div style="font-size:14px;font-weight:500;color:#fff;margin-bottom:2px;" id="dash-name">—</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);" id="dash-email">—</div>
        <div style="display:inline-block;margin-top:7px;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:500;background:rgba(184,148,42,.15);color:var(--gold);" id="dash-plan-badge">Free plan</div>
      </div>
      <div class="sb-item on" onclick="dashNav('projects',this)"><svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>Projects</div>
      <div class="sb-item" onclick="dashNav('account',this)"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>Account</div>
      <div class="sb-item" onclick="nav('specialist-pg')"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>Specialist modes</div>
      <div class="sb-item" onclick="nav('compare-pg')"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 3h5v8H1zM8 3h5v8H8z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>Compare docs</div>
      <div class="sb-item" onclick="nav('pricing-pg')"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 7h8M7 4l4 3-4 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Upgrade plan</div>
      <div style="flex:1;"></div>
      <div class="sb-item danger" onclick="signOut()"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M6 7h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Sign out</div>
    </div>
    <div class="app-main" id="dash-main">
      <div class="acc-section on pad" id="dash-projects">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;"><div><div class="page-title">Projects</div><div class="page-sub">Your analysis history</div></div><button class="btn-primary" onclick="nav('analysis-pg')">New analysis</button></div>
        <div id="proj-list"><div class="loading-row"><div class="spin"></div>Loading...</div></div>
      </div>
      <div class="acc-section pad" id="dash-account">
        <div class="page-title">Account &amp; Credits</div><div class="page-sub">Your plan, credit balance, and usage.</div>
        <div style="background:linear-gradient(135deg,var(--navy),var(--navy-mid));border-radius:var(--radius-lg);padding:22px 24px;margin-bottom:16px;color:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.4);margin-bottom:4px;">Current plan</div><div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;" id="acc-plan-name">Free</div></div><div style="text-align:right;"><div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:var(--gold);" id="acc-plan-price">£0<span style="font-size:14px;opacity:.7;">/mo</span></div></div></div>
          <button class="full-btn gold" style="margin:0;padding:9px 20px;font-size:13px;width:auto;" onclick="nav('pricing-pg')">Upgrade plan →</button>
        </div>
        <div style="background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;margin-bottom:16px;">
          <div style="font-size:14px;font-weight:500;color:var(--blue);margin-bottom:14px;">Video production credits</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            <div style="background:var(--blue-pale);border-radius:var(--radius-lg);padding:14px;text-align:center;"><div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--blue);" id="credits-remaining">0</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;">Remaining</div></div>
            <div style="background:var(--green-bg);border-radius:var(--radius-lg);padding:14px;text-align:center;"><div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--green);" id="credits-used">0</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;">Used</div></div>
            <div style="background:var(--warm);border-radius:var(--radius-lg);padding:14px;text-align:center;"><div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--ink);" id="credits-total">0</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;">Total</div></div>
          </div>
          <button class="full-btn outline" style="margin:0;padding:9px;font-size:13px;" onclick="nav('pricing-pg')">Buy more credits</button>
        </div>
        <div class="usage-grid">
          <div class="usage-item"><div class="ui-label">Projects used</div><div class="ui-nums"><span class="ui-used" id="usage-projects">0</span><span class="ui-total">/ Unlimited</span></div><div class="ui-bar"><div class="ui-fill" style="width:0%;background:var(--blue);"></div></div></div>
          <div class="usage-item"><div class="ui-label">Reports generated</div><div class="ui-nums"><span class="ui-used" id="usage-reports">0</span><span class="ui-total">/ Unlimited</span></div><div class="ui-bar"><div class="ui-fill" style="width:100%;background:var(--green);"></div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- SCENES -->
<div id="scenes-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('report-pg')">← Report</div><div class="pip done" onclick="nav('report-pg')"><span class="pip-dot"></span>Report</div><span class="pip-arr">›</span><div class="pip active"><span class="pip-dot"></span>Scenes</div><span class="pip-arr">›</span><div class="pip" onclick="nav('studio-pg')"><span class="pip-dot"></span>Studio</div><span class="pip-arr">›</span><div class="pip" onclick="nav('render-pg')"><span class="pip-dot"></span>Render</div><span class="pip-arr">›</span><div class="pip" onclick="nav('live-pg')"><span class="pip-dot"></span>Live</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="width:260px;flex-shrink:0;border-right:0.5px solid var(--bdr);padding:22px 18px;background:var(--off-white);overflow-y:auto;">
      <div class="section-label">Presenter mode</div>
      <div class="presenter-toggle" style="margin-bottom:10px;">
        <button class="pt-btn on" id="pm-human" onclick="setPresenterMode('human',this)">Human</button>
        <button class="pt-btn" id="pm-ai" onclick="setPresenterMode('ai',this)">AI</button>
        <button class="pt-btn" id="pm-dual" onclick="setPresenterMode('dual',this)">Debate</button>
        <button class="pt-btn" id="pm-doc" onclick="setPresenterMode('documentary',this)">Doc</button>
      </div>
      <div id="pm-desc" style="font-size:12px;color:var(--muted);padding:8px 10px;background:var(--blue-pale);border-radius:7px;margin-bottom:14px;line-height:1.55;">Human presenter with teleprompter and recording studio.</div>
      <div class="section-label">Scene pacing</div>
      <div style="margin-bottom:18px;">
        <div class="o-opt on" onclick="setPacing(this,'normal')"><div class="o-dot" style="border-color:var(--blue);background:var(--blue);"></div><div class="o-txt">Normal — 140 wpm / 18 words / 8s</div></div>
        <div class="o-opt" onclick="setPacing(this,'slow')"><div class="o-dot"></div><div class="o-txt">Slow — 110 wpm / 14 words / 8s</div></div>
        <div class="o-opt" onclick="setPacing(this,'fast')"><div class="o-dot"></div><div class="o-txt">Fast — 170 wpm / 22 words / 8s</div></div>
      </div>
      <button class="full-btn" id="gen-scenes-btn" onclick="generateScenes()">Generate scenes</button>
      <button class="full-btn outline" style="margin-top:8px;" onclick="nav('report-pg')">← Back to report</button>
      <div style="margin-top:16px;padding-top:14px;border-top:0.5px solid var(--bdr);display:flex;flex-direction:column;gap:7px;">
        <button class="full-btn outline" style="margin:0;padding:9px;font-size:13px;" onclick="exportScriptTxt()">Export script .txt</button>
        <button class="full-btn" style="margin:0;padding:9px;font-size:13px;" onclick="nav('studio-pg')">→ Studio setup</button>
        <button class="full-btn teal" style="margin:0;padding:9px;font-size:13px;" onclick="launchLiveFromScenes()">→ Go live now</button>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;" class="pad" id="scenes-content">
      <div style="text-align:center;padding:48px 24px;"><div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--blue);margin-bottom:8px;">Scene Studio</div><div style="font-size:14px;color:var(--muted);max-width:380px;margin:0 auto;">Choose your presenter mode and pacing, then click Generate scenes.</div></div>
    </div>
  </div>
</div>

<!-- SCENE PROCESSING -->
<div id="scene-proc-pg" class="pg-flex" style="flex-direction:column;">
  <div class="proc-page"><div class="proc-box"><h2>Building your scenes</h2><p>Expanding report sections into 8-second presenter scenes.</p><div class="prog-track"><div class="prog-fill" id="scene-proc-fill" style="width:0%"></div></div><div class="proc-status" id="scene-proc-status">Initialising...</div><div><div class="ei wait" id="se0"><span class="edot"></span>Discussion expansion engine</div><div class="ei wait" id="se1"><span class="edot"></span>Scene planning engine</div><div class="ei wait" id="se2"><span class="edot"></span>Scene script engine</div><div class="ei wait" id="se3"><span class="edot"></span>Visual &amp; evidence overlay generation</div><div class="ei wait" id="se4"><span class="edot"></span>Presenter mode formatting</div></div></div></div>
</div>

<!-- STUDIO -->
<div id="studio-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip done" onclick="nav('report-pg')"><span class="pip-dot"></span>Report</div><span class="pip-arr">›</span><div class="pip done" onclick="nav('scenes-pg')"><span class="pip-dot"></span>Scenes</div><span class="pip-arr">›</span><div class="pip active"><span class="pip-dot"></span>Studio</div><span class="pip-arr">›</span><div class="pip" onclick="nav('render-pg')"><span class="pip-dot"></span>Render</div><span class="pip-arr">›</span><div class="pip" onclick="nav('live-pg')"><span class="pip-dot"></span>Live</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="width:300px;flex-shrink:0;border-right:0.5px solid var(--bdr);padding:22px 18px;background:var(--off-white);overflow-y:auto;">
      <div class="section-label">Presenter mode</div>
      <div class="presenter-toggle" style="margin-bottom:18px;"><button class="pt-btn on" id="spm-ai" onclick="setStudioMode('ai',this)">AI</button><button class="pt-btn" id="spm-dual" onclick="setStudioMode('dual',this)">Dual AI</button><button class="pt-btn" id="spm-doc" onclick="setStudioMode('documentary',this)">Doc</button><button class="pt-btn" id="spm-human" onclick="setStudioMode('human',this)">Human</button></div>
      <div id="studio-ai-controls">
        <div class="section-label">Character style</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;" id="char-style-grid">
          <div class="d-opt on" onclick="pickCharStyle(this,'realistic')" style="font-size:11px;padding:7px 4px;">Realistic</div>
          <div class="d-opt" onclick="pickCharStyle(this,'cartoon')" style="font-size:11px;padding:7px 4px;">Cartoon</div>
          <div class="d-opt" onclick="pickCharStyle(this,'anime')" style="font-size:11px;padding:7px 4px;">Anime</div>
          <div class="d-opt" onclick="pickCharStyle(this,'clay')" style="font-size:11px;padding:7px 4px;">Clay</div>
          <div class="d-opt" onclick="pickCharStyle(this,'illustrated')" style="font-size:11px;padding:7px 4px;">Illustrated</div>
          <div class="d-opt" onclick="pickCharStyle(this,'avatar3d')" style="font-size:11px;padding:7px 4px;">3D Avatar</div>
        </div>
        <div class="section-label">Avatar</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;" id="avatar-grid-a">
          <div class="avatar-card on" onclick="selectAvatar('a',this,'alex')"><div class="avatar-img" style="background:linear-gradient(135deg,#1a3a5c,#2d5f8e);">A</div><div class="avatar-name">Alex</div><div class="avatar-role">Legal</div></div>
          <div class="avatar-card" onclick="selectAvatar('a',this,'maya')"><div class="avatar-img" style="background:linear-gradient(135deg,#1a7a4a,#2d9e60);">M</div><div class="avatar-name">Maya</div><div class="avatar-role">Research</div></div>
          <div class="avatar-card" onclick="selectAvatar('a',this,'marcus')"><div class="avatar-img" style="background:linear-gradient(135deg,#c0392b,#e74c3c);">M</div><div class="avatar-name">Marcus</div><div class="avatar-role">Journalist</div></div>
          <div class="avatar-card" onclick="selectAvatar('a',this,'sophia')"><div class="avatar-img" style="background:linear-gradient(135deg,#8a6200,#d4aa3a);">S</div><div class="avatar-name">Sophia</div><div class="avatar-role">Academic</div></div>
          <div class="avatar-card" onclick="selectAvatar('a',this,'james')"><div class="avatar-img" style="background:linear-gradient(135deg,#2c3e50,#4a6fa5);">J</div><div class="avatar-name">James</div><div class="avatar-role">News</div></div>
          <div class="avatar-card" onclick="selectAvatar('a',this,'priya')"><div class="avatar-img" style="background:linear-gradient(135deg,#6c3483,#9b59b6);">P</div><div class="avatar-name">Priya</div><div class="avatar-role">Creator</div></div>
        </div>
        <div style="margin-bottom:12px;"><div class="section-label">Or upload your photo</div><div class="upload-zone" style="padding:10px;" onclick="document.getElementById('avatar-upload-a').click()"><div style="font-size:12px;color:var(--blue);" id="avatar-upload-label-a">Upload reference photo</div><input type="file" id="avatar-upload-a" style="display:none;" accept="image/*" onchange="handleAvatarUpload('a',this)"></div></div>
      </div>
      <div id="studio-dual-controls" style="display:none;"><div class="section-label">Presenter A</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;"><div class="avatar-card on" onclick="selectAvatar('da',this,'alex')"><div class="avatar-img" style="background:linear-gradient(135deg,#1a3a5c,#2d5f8e);">A</div><div class="avatar-name">Alex</div></div><div class="avatar-card" onclick="selectAvatar('da',this,'marcus')"><div class="avatar-img" style="background:linear-gradient(135deg,#c0392b,#e74c3c);">M</div><div class="avatar-name">Marcus</div></div></div><div class="section-label">Presenter B</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;"><div class="avatar-card on" onclick="selectAvatar('db',this,'priya')"><div class="avatar-img" style="background:linear-gradient(135deg,#6c3483,#9b59b6);">P</div><div class="avatar-name">Priya</div></div><div class="avatar-card" onclick="selectAvatar('db',this,'sophia')"><div class="avatar-img" style="background:linear-gradient(135deg,#8a6200,#d4aa3a);">S</div><div class="avatar-name">Sophia</div></div></div><div style="font-size:12px;color:var(--muted);padding:8px 10px;background:var(--blue-pale);border-radius:7px;margin-bottom:12px;">Debate: A argues a position, B responds with a counter-perspective.</div></div>
      <div id="studio-documentary-controls" style="display:none;"><div style="background:var(--teal-light);border:0.5px solid rgba(13,115,119,.2);border-radius:var(--radius-lg);padding:14px;margin-bottom:12px;"><div style="font-size:14px;font-weight:500;color:var(--teal);margin-bottom:6px;">Documentary mode</div><div style="font-size:12px;color:var(--muted);line-height:1.6;">Hook → Evidence reveal → Context → Implication → Conclusion. Ideal for YouTube and journalism.</div></div></div>
      <div id="studio-human-controls" style="display:none;"><div style="background:var(--blue-pale);border:0.5px solid rgba(26,58,92,.2);border-radius:var(--radius-lg);padding:14px;margin-bottom:12px;"><div style="font-size:14px;font-weight:500;color:var(--blue);margin-bottom:4px;">Human presenter mode</div><div style="font-size:12px;color:var(--muted);line-height:1.6;">Record yourself reading the scripts.</div></div><button class="full-btn" style="margin-bottom:8px;" onclick="nav('record-pg')">Open recording studio →</button></div>
      <div id="studio-bg-section">
        <div class="section-label">Cinematography preset</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;" id="cine-preset-grid">
          <div class="d-opt on" onclick="pickCinePreset(this,'news')" style="font-size:11px;">News desk</div>
          <div class="d-opt" onclick="pickCinePreset(this,'documentary')" style="font-size:11px;">Documentary</div>
          <div class="d-opt" onclick="pickCinePreset(this,'cinematic')" style="font-size:11px;">Cinematic</div>
          <div class="d-opt" onclick="pickCinePreset(this,'corporate')" style="font-size:11px;">Corporate</div>
          <div class="d-opt" onclick="pickCinePreset(this,'investigative')" style="font-size:11px;">Investigative</div>
          <div class="d-opt" onclick="pickCinePreset(this,'academic')" style="font-size:11px;">Academic</div>
        </div>
        <div id="cine-preview" style="font-size:11px;color:var(--muted);padding:8px 10px;background:var(--blue-pale);border-radius:7px;margin-bottom:12px;line-height:1.55;">Three-point lighting, slow push-in, neutral grade, broadcast studio.</div>
        <div class="section-label">Studio background</div>
        <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">
          <div class="o-opt on" onclick="selectStudioBg(this,'news','News Desk','Modern news studio anchor desk blue ambient lighting multiple screens professional broadcast 4K')"><div class="o-dot" style="border-color:var(--blue);background:var(--blue);"></div><div class="o-txt">News Desk</div></div>
          <div class="o-opt" onclick="selectStudioBg(this,'documentary','Documentary','Dark documentary studio single dramatic key light cinematic colour grade moody')"><div class="o-dot"></div><div class="o-txt">Documentary</div></div>
          <div class="o-opt" onclick="selectStudioBg(this,'corporate','Corporate','Clean bright corporate studio white seamless background soft diffused professional')"><div class="o-dot"></div><div class="o-txt">Corporate</div></div>
          <div class="o-opt" onclick="selectStudioBg(this,'academic','Academic','Warm academic library wooden bookshelves tungsten lighting scholarly')"><div class="o-dot"></div><div class="o-txt">Academic</div></div>
          <div class="o-opt" onclick="selectStudioBg(this,'investigative','Investigative','Dark investigative office evidence board dramatic side lighting noir')"><div class="o-dot"></div><div class="o-txt">Investigative</div></div>
          <div class="o-opt" onclick="selectStudioBg(this,'tech','Tech','Futuristic dark studio deep blue neon accents holographic data elements')"><div class="o-dot"></div><div class="o-txt">Tech / Digital</div></div>
        </div>
        <div class="upload-zone" style="padding:10px;margin-bottom:12px;" onclick="document.getElementById('bg-upload').click()"><div style="font-size:12px;color:var(--blue);" id="bg-upload-label">Upload custom background</div><input type="file" id="bg-upload" style="display:none;" accept="image/*" onchange="handleBgUpload(this)"></div>
      </div>
      <div id="studio-voice-section">
        <div class="section-label">Voice</div>
        <select id="studio-voice" style="width:100%;padding:10px 12px;border-radius:var(--radius);font-size:13px;border:0.5px solid var(--bdr2);background:var(--white);color:var(--ink);font-family:'DM Sans',sans-serif;margin-bottom:8px;"><option value="EXAVITQu4vr4xnSDxMaL">Sarah — Clear &amp; Professional</option><option value="21m00Tcm4TlvDq8ikWAM">Rachel — Warm &amp; Authoritative</option><option value="AZnzlk1XvdvUeBnXmlld">Domi — Strong &amp; Confident</option><option value="MF3mGyEYCl7XYWbV9V6O">Elli — Friendly &amp; Energetic</option><option value="TxGEqnHWrfWFTfGW9XjX">Josh — Deep &amp; Authoritative</option><option value="VR6AewLTigWG4xSOukaG">Arnold — Powerful &amp; Direct</option><option value="pNInz6obpgDQGcFmaJgB">Adam — Professional &amp; Clear</option></select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;"><div class="field"><label>Stability <span id="stab-val">50</span>%</label><input type="range" id="studio-stab" min="0" max="100" value="50" oninput="document.getElementById('stab-val').textContent=this.value" style="width:100%;margin-top:4px;"></div><div class="field"><label>Clarity <span id="sim-val">75</span>%</label><input type="range" id="studio-sim" min="0" max="100" value="75" oninput="document.getElementById('sim-val').textContent=this.value" style="width:100%;margin-top:4px;"></div></div>
        <button class="full-btn outline" style="margin:0 0 12px;padding:7px;font-size:12px;" onclick="previewVoice()">▶ Preview voice</button><div id="voice-preview"></div>
      </div>
      <div class="section-label">Background music</div>
      <div class="presenter-toggle" style="margin-bottom:10px;"><button class="pt-btn on" id="music-none-btn" onclick="setMusicMode('none',this)">None</button><button class="pt-btn" id="music-gen-btn" onclick="setMusicMode('generate',this)">Generate</button><button class="pt-btn" id="music-up-btn" onclick="setMusicMode('upload',this)">Upload</button><button class="pt-btn" id="music-suno-btn" onclick="setMusicMode('suno',this)">Suno</button></div>
      <div id="music-generate-area" style="display:none;margin-bottom:10px;"><textarea id="music-prompt" class="req-box" style="min-height:55px;font-size:12px;" placeholder="e.g. tense investigative documentary, no lyrics"></textarea><button class="full-btn outline" style="margin:6px 0 0;padding:7px;font-size:12px;" onclick="generateMusic()">Generate with ElevenLabs</button><div id="music-gen-result" style="margin-top:8px;"></div></div>
      <div id="music-upload-area" style="display:none;margin-bottom:10px;"><div class="upload-zone" style="padding:10px;" onclick="document.getElementById('music-fi').click()"><div style="font-size:12px;color:var(--blue);" id="music-file-label">Upload MP3, WAV or M4A</div><input type="file" id="music-fi" style="display:none;" accept=".mp3,.wav,.m4a" onchange="handleMusicUpload(this)"></div><div id="music-file-info"></div></div>
      <div id="music-suno-area" style="display:none;margin-bottom:10px;"><div style="background:var(--gold-pale);border:0.5px solid var(--gold-border);border-radius:var(--radius);padding:10px;margin-bottom:8px;font-size:12px;color:var(--muted);">Generate music on Suno, download, then upload here.</div><textarea id="suno-prompt" class="req-box" style="min-height:50px;font-size:12px;" placeholder="corporate news background no vocals"></textarea><button class="full-btn outline" style="margin:6px 0 0;padding:7px;font-size:12px;" onclick="openSuno()">Open Suno →</button></div>
      <div id="music-controls" style="display:none;margin-bottom:12px;"><div class="field"><label>Volume <span id="music-vol-val">30</span>%</label><input type="range" id="music-vol" min="0" max="100" value="30" oninput="document.getElementById('music-vol-val').textContent=this.value" style="width:100%;margin-top:4px;"></div><div class="field"><label>Duck level <span id="music-duck-val">15</span>%</label><input type="range" id="music-duck" min="0" max="50" value="15" oninput="document.getElementById('music-duck-val').textContent=this.value" style="width:100%;margin-top:4px;"></div><div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--blue-pale);border-radius:7px;"><input type="checkbox" id="music-sidechain" checked style="margin:0;"><label for="music-sidechain" style="font-size:12px;color:var(--blue);cursor:pointer;">Auto-sidechain during speech</label></div><button class="full-btn outline" style="margin-top:8px;padding:7px;font-size:12px;" onclick="saveMusicToAccount()">💾 Save to channel</button></div>
      <div class="section-label">Output format</div>
      <div style="margin-bottom:14px;"><div class="o-opt on" onclick="pickOutputFormat(this,'16:9')"><div class="o-dot" style="border-color:var(--blue);background:var(--blue);"></div><div class="o-txt">16:9 — YouTube / LinkedIn</div></div><div class="o-opt" onclick="pickOutputFormat(this,'9:16')"><div class="o-dot"></div><div class="o-txt">9:16 — TikTok / Reels</div></div><div class="o-opt" onclick="pickOutputFormat(this,'1:1')"><div class="o-dot"></div><div class="o-txt">1:1 — Instagram / Facebook</div></div></div>
      <button class="full-btn" onclick="showCostEstimate()">Estimate cost &amp; render →</button>
      <button class="full-btn outline" style="margin-top:8px;" onclick="nav('scenes-pg')">← Back to scenes</button>
    </div>
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">Studio setup</div><div class="page-sub">Configure your production before rendering.</div>
      <div style="background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;margin-bottom:16px;"><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:12px;">Production summary</div><div id="studio-summary"><div style="font-size:13px;color:var(--muted);">Generate scenes first.</div></div></div>
      <div style="background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;"><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:4px;">Scene scripts</div><div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Click any scene to edit before rendering.</div><div id="studio-scene-editor"></div></div>
    </div>
  </div>
</div>

<!-- RECORD -->
<div id="record-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip done" onclick="nav('studio-pg')">← Studio</div><span class="pip-arr">›</span><div class="pip active"><span class="pip-dot"></span>Record</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="width:220px;flex-shrink:0;border-right:0.5px solid var(--bdr);padding:16px 12px;background:var(--off-white);overflow-y:auto;"><div class="section-label">Scene queue</div><div id="record-scene-list"></div><div style="margin-top:12px;padding-top:12px;border-top:0.5px solid var(--bdr);"><div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Total</span><span id="rec-total">0</span></div><div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Recorded</span><span id="rec-done" style="color:var(--green);">0</span></div></div><button class="full-btn" style="margin-top:12px;" onclick="exportRecordedScenes()">Export recorded →</button></div>
    <div style="flex:1;display:flex;flex-direction:column;background:var(--navy);">
      <div style="flex:1;padding:24px 32px;overflow-y:auto;">
        <div style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:10px;text-align:center;" id="rec-scene-label">Scene 1 of 0</div>
        <div style="font-size:24px;font-weight:500;color:#fff;line-height:1.65;font-family:'DM Mono',monospace;text-align:center;padding:22px;background:rgba(255,255,255,.04);border-radius:var(--radius-lg);margin-bottom:20px;border-left:3px solid var(--gold);" id="rec-teleprompter">Select a scene to begin</div>
        <div style="position:relative;max-width:520px;margin:0 auto;border-radius:var(--radius-lg);overflow:hidden;background:#000;aspect-ratio:16/9;"><video id="camera-preview" style="width:100%;height:100%;object-fit:cover;" autoplay muted playsinline></video><div id="rec-indicator" style="display:none;position:absolute;top:12px;right:12px;align-items:center;gap:5px;padding:4px 10px;background:rgba(192,57,43,.9);border-radius:20px;"><div style="width:6px;height:6px;border-radius:50%;background:#fff;animation:pulse .9s infinite;"></div><span style="font-size:11px;color:#fff;font-weight:500;">REC</span></div></div>
      </div>
      <div style="padding:14px 24px;background:rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <button id="cam-btn" onclick="toggleCamera()" style="padding:9px 16px;border-radius:8px;font-size:13px;cursor:pointer;border:0.5px solid rgba(255,255,255,.2);background:transparent;color:#fff;font-family:'DM Sans',sans-serif;">📷 Camera</button>
        <button id="rec-btn" onclick="toggleRecording()" style="padding:9px 16px;border-radius:8px;font-size:13px;cursor:pointer;border:0.5px solid rgba(192,57,43,.4);background:rgba(192,57,43,.2);color:#ffaaaa;font-family:'DM Sans',sans-serif;" disabled>⏺ Record</button>
        <button onclick="recPrev()" style="padding:9px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:0.5px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;">← Prev</button>
        <button onclick="recNext()" style="padding:9px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:0.5px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;">Next →</button>
        <span id="rec-timer" style="font-family:'DM Mono',monospace;font-size:16px;color:var(--gold);margin-left:auto;">0:00</span>
      </div>
    </div>
  </div>
</div>

<!-- RENDER -->
<div id="render-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip done" onclick="nav('report-pg')"><span class="pip-dot"></span>Report</div><span class="pip-arr">›</span><div class="pip done" onclick="nav('scenes-pg')"><span class="pip-dot"></span>Scenes</div><span class="pip-arr">›</span><div class="pip done" onclick="nav('studio-pg')"><span class="pip-dot"></span>Studio</div><span class="pip-arr">›</span><div class="pip active"><span class="pip-dot"></span>Render</div><span class="pip-arr">›</span><div class="pip" onclick="nav('live-pg')"><span class="pip-dot"></span>Live</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="width:220px;flex-shrink:0;border-right:0.5px solid var(--bdr);padding:22px 18px;background:var(--off-white);overflow-y:auto;">
      <div class="section-label" style="margin-bottom:8px;">Queue</div><div id="render-queue-list"></div>
      <div style="margin-top:14px;padding-top:12px;border-top:0.5px solid var(--bdr);">
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Total</span><span id="rq-total" style="font-weight:500;">0</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Voice</span><span id="rq-voice" style="font-weight:500;color:var(--green);">0</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Video</span><span id="rq-video" style="font-weight:500;color:var(--blue);">0</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Stitch</span><span id="rq-stitch" style="font-weight:500;color:var(--gold);">—</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--muted);">Failed</span><span id="rq-failed" style="font-weight:500;color:var(--red);">0</span></div>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div><div class="page-title">Render queue</div><div class="page-sub" id="render-status-text">Preparing...</div></div>
        <button class="btn-primary" id="render-export-btn" style="display:none;" onclick="nav('export-pg')">→ Export centre</button>
      </div>
      <div style="background:var(--off-white);border-radius:var(--radius);padding:10px 14px;margin-bottom:14px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;"><span style="color:var(--muted);">Overall progress</span><span id="render-pct" style="font-weight:500;">0%</span></div><div class="prog-track" style="height:5px;"><div class="prog-fill" id="render-total-fill" style="width:0%;"></div></div></div>
      <div id="render-scene-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;"></div>
      <div id="stitch-status" style="display:none;margin-top:16px;"><div style="background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;text-align:center;"><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:6px;">Stitching final video</div><div style="font-size:13px;color:var(--muted);margin-bottom:12px;" id="stitch-status-text">Combining scenes with Creatomate...</div><div class="prog-track" style="height:4px;max-width:280px;margin:0 auto;"><div class="prog-fill" id="stitch-fill" style="width:0%;background:var(--gold);"></div></div></div></div>
    </div>
  </div>
</div>

<!-- EXPORT -->
<div id="export-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip done"><span class="pip-dot"></span>Report</div><span class="pip-arr">›</span><div class="pip done"><span class="pip-dot"></span>Scenes</div><span class="pip-arr">›</span><div class="pip done"><span class="pip-dot"></span>Studio</div><span class="pip-arr">›</span><div class="pip done"><span class="pip-dot"></span>Render</div><span class="pip-arr">›</span><div class="pip active"><span class="pip-dot"></span>Export</div></div>
  <div style="overflow-y:auto;flex:1;" class="pad">
    <div class="page-title">Export centre</div><div class="page-sub">Download or publish your production to any platform.</div>
    <div id="final-video-wrap" style="display:none;background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;"><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:12px;">Final video</div><video id="final-video" controls style="width:100%;border-radius:var(--radius);max-height:360px;background:#000;"></video><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;"><a id="final-download-btn" class="btn-primary" style="text-decoration:none;" download="AABStudio-production.mp4">⬇ Download MP4</a><button class="btn-outline" onclick="rerenderDifferentFormat()">Re-render different format</button></div></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
      <div class="export-platform-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:36px;height:36px;border-radius:8px;background:#FF0000;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="16" height="12" viewBox="0 0 16 12" fill="white"><path d="M15.7 1.9c-.2-.7-.7-1.2-1.4-1.4C13 0 8 0 8 0S3 0 1.7.5C1 .7.5 1.2.3 1.9 0 3.2 0 6 0 6s0 2.8.3 4.1c.2.7.7 1.2 1.4 1.4C3 12 8 12 8 12s5 0 6.3-.5c.7-.2 1.2-.7 1.4-1.4C16 8.8 16 6 16 6s0-2.8-.3-4.1zM6.4 8.6V3.4L10.6 6 6.4 8.6z"/></svg></div><div><div style="font-size:14px;font-weight:500;">YouTube</div><div style="font-size:11px;color:var(--muted);">16:9</div></div></div><div class="export-platform-btns"><button onclick="downloadExport('youtube')">⬇ Download</button><button onclick="generatePlatformMeta('youtube')">✦ Metadata</button></div></div>
      <div class="export-platform-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="4" stroke="white" stroke-width="1.5"/><circle cx="8" cy="8" r="3" stroke="white" stroke-width="1.5"/></svg></div><div><div style="font-size:14px;font-weight:500;">Instagram</div><div style="font-size:11px;color:var(--muted);">9:16 Reels</div></div></div><div class="export-platform-btns"><button onclick="downloadExport('instagram')">⬇ Reels</button><button onclick="generatePlatformMeta('instagram')">✦ Caption</button></div></div>
      <div class="export-platform-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:36px;height:36px;border-radius:8px;background:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="16" viewBox="0 0 14 16" fill="white"><path d="M10 0h-3v11a2 2 0 11-2-2v-3a5 5 0 105 5V5a7 7 0 004 1V3a4 4 0 01-4-3z"/></svg></div><div><div style="font-size:14px;font-weight:500;">TikTok</div><div style="font-size:11px;color:var(--muted);">9:16</div></div></div><div class="export-platform-btns"><button onclick="downloadExport('tiktok')">⬇ Download</button><button onclick="generatePlatformMeta('tiktok')">✦ Caption</button></div></div>
      <div class="export-platform-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:36px;height:36px;border-radius:8px;background:#0A66C2;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="0" y="4" width="3" height="10"/><circle cx="1.5" cy="1.5" r="1.5"/><path d="M5 4h3v1.5C8.5 4.5 9.5 4 11 4c2 0 3 1 3 3.5V14h-3V8c0-1-.5-1.5-1.5-1.5S8 7 8 8v6H5V4z"/></svg></div><div><div style="font-size:14px;font-weight:500;">LinkedIn</div><div style="font-size:11px;color:var(--muted);">16:9</div></div></div><div class="export-platform-btns"><button onclick="downloadExport('linkedin')">⬇ Download</button><button onclick="generatePlatformMeta('linkedin')">✦ Post</button></div></div>
      <div class="export-platform-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:36px;height:36px;border-radius:8px;background:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M11 1h2l-4.5 5.1L14 13h-3.5l-3-4-3.5 4H2l4.8-5.5L0 1h3.5l2.7 3.6L11 1z"/></svg></div><div><div style="font-size:14px;font-weight:500;">Twitter / X</div><div style="font-size:11px;color:var(--muted);">16:9</div></div></div><div class="export-platform-btns"><button onclick="downloadExport('twitter')">⬇ Download</button><button onclick="generatePlatformMeta('twitter')">✦ Tweet</button></div></div>
      <div class="export-platform-card"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:36px;height:36px;border-radius:8px;background:#1877F2;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="16" viewBox="0 0 10 16" fill="white"><path d="M7 3H10V0H7C5 0 3 2 3 4V6H0V9H3V16H6V9H9L10 6H6V4C6 3.4 6.4 3 7 3Z"/></svg></div><div><div style="font-size:14px;font-weight:500;">Facebook</div><div style="font-size:11px;color:var(--muted);">16:9</div></div></div><div class="export-platform-btns"><button onclick="downloadExport('facebook')">⬇ Download</button><button onclick="generatePlatformMeta('facebook')">✦ Post</button></div></div>
    </div>
    <div id="export-meta-panel" style="display:none;background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div style="font-size:16px;font-weight:500;color:var(--blue);" id="meta-platform-title">Metadata</div><button onclick="document.getElementById('export-meta-panel').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:20px;">×</button></div><div id="meta-loading" style="display:none;"><div class="loading-row"><div class="spin"></div>Generating...</div></div><div id="meta-content"></div></div>
    <div style="background:var(--white);border:0.5px solid var(--bdr);border-radius:var(--radius-lg);padding:20px;"><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:12px;">Saved channel music</div><div id="saved-music-list"><div style="font-size:13px;color:var(--muted);">No saved music yet.</div></div></div>
  </div>
</div>

<!-- ══ SPECIALIST MODES PAGE ══ -->
<div id="specialist-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar">
    <div class="pip back" onclick="nav(APP.user?'dashboard-pg':'home')">← Back</div>
    <div class="pip active"><span class="pip-dot"></span>Specialist modes</div>
  </div>
  <div style="overflow-y:auto;flex:1;" class="pad">
    <div class="page-title">Specialist modes</div>
    <div class="page-sub">Advanced analysis engines built for specific professional workflows.</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:32px;">

      <!-- Earnings Call -->
      <div class="uc-card" style="cursor:pointer;" onclick="nav('earnings-pg')">
        <div class="uc-icon" style="background:var(--green-bg);"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 14l4-5 3 3 6-7" stroke="var(--green)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="uc-title">Earnings call analyser</div>
        <div class="uc-desc">Extract revenue, EPS, guidance, beats/misses, management tone and sentiment from earnings documents.</div>
        <div style="margin-top:12px;"><span class="badge b-green">Finance</span></div>
      </div>

      <!-- Legal Redline -->
      <div class="uc-card" style="cursor:pointer;" onclick="nav('redline-pg')">
        <div class="uc-icon" style="background:var(--red-bg);"><svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke="var(--red)" stroke-width="1.4"/><path d="M5 7h8M5 10h5" stroke="var(--red)" stroke-width="1.2" stroke-linecap="round"/></svg></div>
        <div class="uc-title">Legal redline</div>
        <div class="uc-desc">Compare two contract versions. Every change classified as risk increased, risk reduced, new obligation, or removed protection.</div>
        <div style="margin-top:12px;"><span class="badge b-red">Legal</span></div>
      </div>

      <!-- Academic Lecture -->
      <div class="uc-card" style="cursor:pointer;" onclick="nav('lecture-pg')">
        <div class="uc-icon" style="background:var(--blue-light);"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 14V7l5-3 5 3v7" stroke="var(--blue)" stroke-width="1.4" fill="none" stroke-linejoin="round"/></svg></div>
        <div class="uc-title">Academic lecture</div>
        <div class="uc-desc">Convert research papers into structured lectures with slide notes, learning objectives, citations, and student Q&A.</div>
        <div style="margin-top:12px;"><span class="badge b-blue">Academic</span></div>
      </div>

      <!-- Multi-Document Synthesis -->
      <div class="uc-card" style="cursor:pointer;" onclick="nav('synthesis-pg')">
        <div class="uc-icon" style="background:var(--gold-pale);"><svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" fill="none" stroke="var(--gold)" stroke-width="1.4"/><path d="M6 9h6M9 6v6" stroke="var(--gold)" stroke-width="1.3" stroke-linecap="round"/></svg></div>
        <div class="uc-title">Multi-document synthesis</div>
        <div class="uc-desc">Upload up to 6 documents simultaneously. Find cross-document patterns, contradictions, and insights that only appear together.</div>
        <div style="margin-top:12px;"><span class="badge b-gold">Research</span></div>
      </div>

      <!-- Podcast -->
      <div class="uc-card" style="cursor:pointer;" onclick="nav('podcast-pg')">
        <div class="uc-icon" style="background:var(--teal-light);"><svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="7" r="4" fill="none" stroke="var(--teal)" stroke-width="1.4"/><path d="M5 15c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="var(--teal)" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></div>
        <div class="uc-title">Podcast generator</div>
        <div class="uc-desc">Convert any document into a natural two-host podcast conversation with chapter markers, show notes, and MP3 export.</div>
        <div style="margin-top:12px;"><span class="badge b-teal">Creator</span></div>
      </div>

      <!-- Contradiction Detector -->
      <div class="uc-card" style="cursor:pointer;" onclick="nav('contradict-pg')">
        <div class="uc-icon" style="background:var(--amber-bg);"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 3v7M9 13v2" stroke="var(--amber)" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9" r="7" fill="none" stroke="var(--amber)" stroke-width="1.4"/></svg></div>
        <div class="uc-title">Contradiction detector</div>
        <div class="uc-desc">Automatically finds where a document contradicts itself. Clause 4.2 says one thing, Clause 11.7 says the opposite.</div>
        <div style="margin-top:12px;"><span class="badge b-amber">Legal · Compliance</span></div>
      </div>

    </div>
  </div>
</div>

<!-- ══ EARNINGS CALL PAGE ══ -->
<div id="earnings-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('specialist-pg')">← Specialist modes</div><div class="pip active"><span class="pip-dot"></span>Earnings call analyser</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">Earnings call analyser</div>
      <div class="page-sub">Upload an earnings release, annual report, or earnings call transcript for instant financial intelligence.</div>
      <div class="upload-zone" id="uz-earn" onclick="document.getElementById('fi-earn').click()">
        <div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:6px;" id="uz-earn-title">Upload earnings document</div>
        <div style="font-size:13px;color:var(--muted);">PDF, DOCX, TXT — earnings release, transcript, annual report</div>
        <input type="file" id="fi-earn" style="display:none;" onchange="handleEarningsFile(this)" accept=".pdf,.docx,.txt">
      </div>
      <div id="earn-pill"></div>
      <div class="field"><label>Ticker symbol (optional)</label><input type="text" id="earn-ticker" placeholder="e.g. AAPL, TSLA, NVDA" style="max-width:200px;"></div>
      <button class="full-btn" style="max-width:280px;" onclick="runEarnings()">Analyse earnings →</button>
      <div id="earn-results" style="display:none;margin-top:28px;"></div>
    </div>
    <div style="width:260px;flex-shrink:0;border-left:0.5px solid var(--bdr);padding:22px 20px;background:var(--off-white);">
      <div class="section-label">What we extract</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.85;">
        <div>📈 Revenue vs estimate</div><div>💰 EPS beat/miss</div><div>📊 Gross margin</div>
        <div>🔭 Forward guidance</div><div>😊 Management sentiment</div><div>⚠️ Risk factors</div>
        <div>✦ Opportunities</div><div>🎙 Q&amp;A highlights</div><div>📱 Social caption</div>
      </div>
    </div>
  </div>
</div>

<!-- ══ LEGAL REDLINE PAGE ══ -->
<div id="redline-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('specialist-pg')">← Specialist modes</div><div class="pip active"><span class="pip-dot"></span>Legal redline</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">Legal redline</div>
      <div class="page-sub">Upload two versions of a contract to see every change classified by risk impact.</div>
      <div class="compare-grid">
        <div>
          <div class="section-label">Version A — Original contract</div>
          <div class="upload-zone" id="uz-rl-a" onclick="document.getElementById('fi-rl-a').click()" style="padding:20px;">
            <div style="font-size:14px;font-weight:500;color:var(--blue);" id="uz-rl-a-title">Upload Version A</div>
            <input type="file" id="fi-rl-a" style="display:none;" onchange="handleRedlineFile('a',this)" accept=".pdf,.docx,.txt">
          </div>
        </div>
        <div>
          <div class="section-label">Version B — Revised contract</div>
          <div class="upload-zone" id="uz-rl-b" onclick="document.getElementById('fi-rl-b').click()" style="padding:20px;">
            <div style="font-size:14px;font-weight:500;color:var(--blue);" id="uz-rl-b-title">Upload Version B</div>
            <input type="file" id="fi-rl-b" style="display:none;" onchange="handleRedlineFile('b',this)" accept=".pdf,.docx,.txt">
          </div>
        </div>
      </div>
      <button class="full-btn" style="max-width:280px;" onclick="runRedline()">Run legal redline →</button>
      <div id="redline-results" style="display:none;margin-top:28px;"></div>
    </div>
    <div style="width:260px;flex-shrink:0;border-left:0.5px solid var(--bdr);padding:22px 20px;background:var(--off-white);">
      <div class="section-label">Change classifications</div>
      <div style="font-size:13px;line-height:2;">
        <div><span style="color:var(--red);font-weight:600;">● RISK INCREASED</span></div>
        <div><span style="color:var(--green);font-weight:600;">● RISK REDUCED</span></div>
        <div><span style="color:var(--amber);font-weight:600;">● NEW OBLIGATION</span></div>
        <div><span style="color:var(--red);font-weight:600;">● REMOVED PROTECTION</span></div>
        <div><span style="color:var(--muted);font-weight:600;">● NEUTRAL CHANGE</span></div>
      </div>
    </div>
  </div>
</div>

<!-- ══ PODCAST PAGE ══ -->
<div id="podcast-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('specialist-pg')">← Specialist modes</div><div class="pip active"><span class="pip-dot"></span>Podcast generator</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">Podcast generator</div>
      <div class="page-sub">Run an analysis first, then convert it into a natural two-host podcast conversation.</div>
      <div id="podcast-no-report" style="background:var(--amber-bg);border:0.5px solid rgba(138,98,0,.2);border-radius:var(--radius);padding:14px;margin-bottom:20px;font-size:13px;color:var(--amber);display:none;">No report loaded. <a onclick="nav('analysis-pg')" style="cursor:pointer;text-decoration:underline;">Run an analysis first →</a></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;">
        <div class="field"><label>Host A name</label><input type="text" id="pod-host-a" placeholder="Alex" value="Alex"></div>
        <div class="field"><label>Host B name</label><input type="text" id="pod-host-b" placeholder="Priya" value="Priya"></div>
      </div>
      <div class="field"><label>Episode duration</label>
        <div style="display:flex;gap:8px;">
          <div class="d-opt on" onclick="pickPodDuration(this,3)" style="flex:1;">3 min</div>
          <div class="d-opt" onclick="pickPodDuration(this,5)" style="flex:1;">5 min</div>
          <div class="d-opt" onclick="pickPodDuration(this,10)" style="flex:1;">10 min</div>
          <div class="d-opt" onclick="pickPodDuration(this,20)" style="flex:1;">20 min</div>
        </div>
      </div>
      <button class="full-btn" style="max-width:280px;" onclick="runPodcast()">Generate podcast →</button>
      <div id="podcast-results" style="display:none;margin-top:28px;"></div>
    </div>
    <div style="width:260px;flex-shrink:0;border-left:0.5px solid var(--bdr);padding:22px 20px;background:var(--off-white);">
      <div class="section-label">Output includes</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.85;">
        <div>🎙 Natural two-host dialogue</div><div>📖 Chapter markers</div><div>📝 Show notes</div>
        <div>🏷 Episode hashtags</div><div>⏱ Timestamps</div><div>🔊 Voice generation ready</div>
      </div>
    </div>
  </div>
</div>

<!-- ══ SYNTHESIS PAGE ══ -->
<div id="synthesis-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('specialist-pg')">← Specialist modes</div><div class="pip active"><span class="pip-dot"></span>Multi-document synthesis</div></div>
  <div style="flex:1;overflow-y:auto;" class="pad">
    <div class="page-title">Multi-document synthesis</div>
    <div class="page-sub">Upload up to 6 documents. Find patterns, contradictions, and insights that only appear when read together.</div>
    <div id="synth-upload-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;">
      <div class="upload-zone" onclick="document.getElementById('fi-s0').click()" style="padding:16px;"><div style="font-size:13px;font-weight:500;color:var(--blue);" id="sz-0">Document 1</div><input type="file" id="fi-s0" style="display:none;" onchange="handleSynthFile(0,this)" accept=".pdf,.docx,.txt"></div>
      <div class="upload-zone" onclick="document.getElementById('fi-s1').click()" style="padding:16px;"><div style="font-size:13px;font-weight:500;color:var(--blue);" id="sz-1">Document 2</div><input type="file" id="fi-s1" style="display:none;" onchange="handleSynthFile(1,this)" accept=".pdf,.docx,.txt"></div>
      <div class="upload-zone" onclick="document.getElementById('fi-s2').click()" style="padding:16px;"><div style="font-size:13px;font-weight:500;color:var(--blue);" id="sz-2">Document 3 (optional)</div><input type="file" id="fi-s2" style="display:none;" onchange="handleSynthFile(2,this)" accept=".pdf,.docx,.txt"></div>
      <div class="upload-zone" onclick="document.getElementById('fi-s3').click()" style="padding:16px;"><div style="font-size:13px;font-weight:500;color:var(--blue);" id="sz-3">Document 4 (optional)</div><input type="file" id="fi-s3" style="display:none;" onchange="handleSynthFile(3,this)" accept=".pdf,.docx,.txt"></div>
      <div class="upload-zone" onclick="document.getElementById('fi-s4').click()" style="padding:16px;"><div style="font-size:13px;font-weight:500;color:var(--blue);" id="sz-4">Document 5 (optional)</div><input type="file" id="fi-s4" style="display:none;" onchange="handleSynthFile(4,this)" accept=".pdf,.docx,.txt"></div>
      <div class="upload-zone" onclick="document.getElementById('fi-s5').click()" style="padding:16px;"><div style="font-size:13px;font-weight:500;color:var(--blue);" id="sz-5">Document 6 (optional)</div><input type="file" id="fi-s5" style="display:none;" onchange="handleSynthFile(5,this)" accept=".pdf,.docx,.txt"></div>
    </div>
    <div class="field"><label>Synthesis request</label><textarea class="req-box" id="synth-req" placeholder="e.g. 'Find contradictions between these three supplier contracts' or 'Synthesise these annual reports into one strategic view'"></textarea></div>
    <button class="full-btn" style="max-width:280px;" onclick="runSynthesis()">Run synthesis →</button>
    <div id="synth-results" style="display:none;margin-top:28px;"></div>
  </div>
</div>

<!-- ══ CONTRADICTION DETECTOR PAGE ══ -->
<div id="contradict-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('specialist-pg')">← Specialist modes</div><div class="pip active"><span class="pip-dot"></span>Contradiction detector</div></div>
  <div style="flex:1;overflow-y:auto;" class="pad">
    <div class="page-title">Contradiction detector</div>
    <div class="page-sub">Automatically finds where a document contradicts itself. Run an analysis first, then scan for contradictions.</div>
    <div id="contradict-no-report" style="background:var(--amber-bg);border:0.5px solid rgba(138,98,0,.2);border-radius:var(--radius);padding:14px;margin-bottom:20px;font-size:13px;color:var(--amber);">No report loaded. <a onclick="nav('analysis-pg')" style="cursor:pointer;text-decoration:underline;">Run an analysis first →</a></div>
    <button class="full-btn" style="max-width:280px;" onclick="runContradictions()">Scan for contradictions →</button>
    <div id="contradict-results" style="display:none;margin-top:28px;"></div>
  </div>
</div>

<!-- ══ LECTURE PAGE ══ -->
<div id="lecture-pg" class="pg-flex" style="flex-direction:column;">
  <div class="pipebar"><div class="pip back" onclick="nav('specialist-pg')">← Specialist modes</div><div class="pip active"><span class="pip-dot"></span>Academic lecture</div></div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;" class="pad">
      <div class="page-title">Academic lecture generator</div>
      <div class="page-sub">Convert research analysis into a structured lecture. Run an analysis first.</div>
      <div class="section-label">Audience level</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px;">
        <div class="d-opt on" onclick="pickAudienceLevel(this,'public')">Public</div>
        <div class="d-opt" onclick="pickAudienceLevel(this,'undergraduate')">Undergraduate</div>
        <div class="d-opt" onclick="pickAudienceLevel(this,'postgraduate')">Postgraduate</div>
        <div class="d-opt" onclick="pickAudienceLevel(this,'professional')">Professional</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><input type="checkbox" id="lec-qa" checked><label for="lec-qa" style="font-size:13px;color:var(--ink);cursor:pointer;">Include student Q&amp;A section</label></div>
      <button class="full-btn" style="max-width:280px;" onclick="runLecture()">Generate lecture →</button>
      <div id="lecture-results" style="display:none;margin-top:28px;"></div>
    </div>
    <div style="width:260px;flex-shrink:0;border-left:0.5px solid var(--bdr);padding:22px 20px;background:var(--off-white);">
      <div class="section-label">Output includes</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.85;">
        <div>🎯 Learning objectives</div><div>📋 Slide notes per section</div>
        <div>🎙 Presenter script</div><div>❓ Student Q&amp;A</div>
        <div>📚 Citations</div><div>📖 Further reading</div>
      </div>
    </div>
  </div>
</div>

<!-- LIVE BROADCAST -->
<div id="live-pg" class="pg-flex" style="flex-direction:row;">
  <div style="width:220px;flex-shrink:0;background:var(--navy-mid);border-right:0.5px solid rgba(255,255,255,.07);display:flex;flex-direction:column;">
    <div style="padding:14px;border-bottom:0.5px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;"><span style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.3);">Scene queue</span><div style="display:flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;background:rgba(192,57,43,.15);border:0.5px solid rgba(192,57,43,.3);"><div style="width:5px;height:5px;border-radius:50%;background:var(--red);animation:pulse .9s infinite;"></div><span style="font-size:11px;color:var(--red);font-weight:500;">Live</span></div></div>
    <div style="flex:1;overflow-y:auto;padding:8px;" id="live-sq"></div>
    <div style="padding:10px 12px;border-top:0.5px solid rgba(255,255,255,.07);display:flex;gap:5px;">
      <button onclick="livePrev()" style="flex:1;padding:8px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;">← Prev</button>
      <button onclick="liveNext()" style="flex:1;padding:8px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;">Next →</button>
      <button onclick="nav('dashboard-pg')" style="flex:1;padding:8px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid rgba(192,57,43,.3);background:transparent;color:var(--red);font-family:'DM Sans',sans-serif;">End</button>
    </div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;background:var(--navy);">
    <div style="padding:10px 20px;background:rgba(0,0,0,.2);display:flex;align-items:center;gap:12px;flex-shrink:0;">
      <span style="padding:3px 10px;border-radius:5px;font-size:11px;font-weight:500;background:rgba(255,255,255,.1);color:#fff;" id="live-badge">Scene 1</span>
      <span style="font-size:12px;color:rgba(255,255,255,.4);" id="live-section">Executive Summary</span>
      <span style="margin-left:auto;font-size:12px;font-weight:500;color:var(--gold);" id="live-timing">8s</span>
    </div>
    <div style="height:2px;background:rgba(255,255,255,.06);flex-shrink:0;"><div style="height:100%;background:var(--gold);transition:width .4s linear;" id="live-prog"></div></div>
    <div style="flex:1;overflow-y:auto;padding:36px 44px;">
      <div style="font-size:15px;color:rgba(255,255,255,.15);line-height:1.8;margin-bottom:20px;font-family:'DM Mono',monospace;" id="live-prev"></div>
      <div style="font-size:26px;font-weight:500;line-height:1.55;color:#fff;margin-bottom:20px;font-family:'DM Mono',monospace;padding:22px 24px;background:rgba(255,255,255,.04);border-left:3px solid var(--gold);" id="live-cur"></div>
      <div style="font-size:15px;color:rgba(255,255,255,.2);line-height:1.8;font-family:'DM Mono',monospace;" id="live-nxt"></div>
    </div>
    <div style="padding:12px 20px;background:rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,.5);"><span>Speed</span><input type="range" min="80" max="200" value="150" step="5" oninput="setLiveSpd(this.value)" style="width:80px;"><span style="font-size:13px;font-weight:500;color:var(--gold);min-width:52px;" id="live-spd">150 wpm</span></div>
      <button id="live-auto-btn" onclick="toggleLiveAuto()" style="padding:7px 14px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;">Auto: off</button>
      <button onclick="liveNext()" style="padding:7px 14px;border-radius:7px;font-size:12px;cursor:pointer;border:0.5px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;margin-left:auto;">Next →</button>
    </div>
  </div>
  <div style="width:210px;flex-shrink:0;background:var(--navy-mid);border-left:0.5px solid rgba(255,255,255,.07);display:flex;flex-direction:column;">
    <div style="padding:13px 14px;border-bottom:0.5px solid rgba(255,255,255,.07);font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.3);">Evidence queue</div>
    <div style="flex:1;overflow-y:auto;padding:8px 10px;" id="live-ovq"></div>
    <div style="padding:10px 12px;border-top:0.5px solid rgba(255,255,255,.07);">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;"><span style="color:rgba(255,255,255,.35);">Scene</span><span id="l-rs-scene" style="font-weight:500;color:#fff;">1/6</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;"><span style="color:rgba(255,255,255,.35);">Elapsed</span><span id="l-rs-el" style="font-weight:500;color:var(--gold);">0:00</span></div>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
// ── CORE ─────────────────────────────────────────────────────────────────────
var SUPA=null;
function getSupa(){if(!SUPA&&window.supabase)SUPA=window.supabase.createClient('https://phjlxkyloafogznhyyig.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoamx4a3lsb2Fmb2d6bmh5eWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTcxNDgsImV4cCI6MjA5MDYzMzE0OH0.wI9E9CIHwwFN6d_lgJXwO0_G7J3aq4zesp7eU9TCDiI');return SUPA;}
var APP={annual:false,user:null,checkoutItem:null,uploadedFile:null,uploadedBase64:null,uploadedMime:null,compareFileA:null,compareBase64A:null,compareMimeA:null,compareFileB:null,compareBase64B:null,compareMimeB:null,compareType:'full',liveScene:0,liveAuto:false,liveWpm:150,liveTimer:null,liveElTimer:null,liveElapsed:0,projects:[],depth:'deep',lastReport:null};
var LIVE_SCENES=[{num:1,section:'Executive Summary',script:'What this analysis reveals is a document that demands careful attention from senior decision-makers.',secs:8},{num:2,section:'Key Findings',script:'The platform has identified several areas of significance requiring immediate review.',secs:8},{num:3,section:'Evidence Review',script:'Each finding is supported by direct evidence extracted from the source document with confidence scoring.',secs:8},{num:4,section:'Implications',script:'The implications extend beyond the document itself into broader operational concerns.',secs:8},{num:5,section:'Recommendations',script:'Three priority actions emerge from this analysis to address within the next thirty days.',secs:8},{num:6,section:'Conclusion',script:'This analysis provides a foundation for informed decision-making based on evidence.',secs:8}];
var CHECKOUT_DATA={pro:{title:'Upgrade to Pro',sub:'7-day free trial',rows:[['Plan','Pro monthly'],['Trial','7 days free'],['After trial','£24.00/mo'],['Today','£0.00']],btn:'Start free trial'},studio:{title:'Upgrade to Studio',sub:'7-day free trial',rows:[['Plan','Studio monthly'],['After trial','£69.00/mo'],['Today','£0.00']],btn:'Start free trial'},'cred-starter':{title:'Starter Pack',sub:'400 credits',rows:[['Credits','400'],['Scenes','~40'],['Today','£19.00']],btn:'Pay £19.00'},'cred-creator':{title:'Creator Pack',sub:'1,000 credits',rows:[['Credits','1,000'],['Scenes','~100'],['Today','£49.00']],btn:'Pay £49.00'},'cred-studio':{title:'Studio Pack',sub:'2,500 credits',rows:[['Credits','2,500'],['Scenes','~250'],['Today','£99.00']],btn:'Pay £99.00'}};
var CREDITS={remaining:0,used:0,total:0};
function loadCreditsDisplay(){var s=JSON.parse(localStorage.getItem('aab_credits')||'null');if(s)CREDITS=s;['credits-remaining','credits-used','credits-total'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=CREDITS[id.replace('credits-','')]||0;});var nc=document.getElementById('nav-credit-num');if(nc)nc.textContent=CREDITS.remaining||0;var nb=document.getElementById('nav-credits');if(nb&&APP.user)nb.style.display='flex';}
function saveCredits(){localStorage.setItem('aab_credits',JSON.stringify(CREDITS));}

// ── NAV ──────────────────────────────────────────────────────────────────────
function updateNav(){var li=!!APP.user;['nav-signin','nav-start'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display=li?'none':'';});['nav-analysis','nav-signout','nav-dash','nav-compare','nav-specialist'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display=li?'':'none';});var nb=document.getElementById('nav-credits');if(nb)nb.style.display=li?'flex':'none';if(li&&APP.user){var ini=(APP.user.name||APP.user.email||'U').split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();var av=document.getElementById('dash-av');if(av)av.textContent=ini;var dn=document.getElementById('dash-name');if(dn)dn.textContent=APP.user.name||APP.user.email;var de=document.getElementById('dash-email');if(de)de.textContent=APP.user.email;}}
function nav(pg){document.querySelectorAll('.pg,.pg-flex').forEach(function(p){p.classList.remove('on');});var el=document.getElementById(pg);if(el)el.classList.add('on');if(pg==='live-pg')initLive();if(pg==='dashboard-pg'){loadAndRenderProjects();loadCreditsDisplay();}if(pg==='studio-pg'){updateStudioSummary();renderSavedMusic();}if(pg==='record-pg')initRecordingPage();if(pg==='export-pg'){renderSavedMusic();checkPreviousRender();}window.scrollTo(0,0);}
function heroStart(){if(APP.user)nav('analysis-pg');else nav('onboard-pg');}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function showToast(msg,type){var box=document.createElement('div');var bg=type==='error'?'var(--red-bg)':type==='warning'?'var(--amber-bg)':'var(--green-bg)';var col=type==='error'?'var(--red)':type==='warning'?'var(--amber)':'var(--green)';var bdr=type==='error'?'rgba(192,57,43,.2)':type==='warning'?'rgba(138,98,0,.2)':'rgba(26,122,74,.2)';box.style.cssText='position:fixed;top:76px;right:20px;background:'+bg+';border:0.5px solid '+bdr+';border-radius:14px;padding:14px 18px;font-size:14px;color:'+col+';z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:320px;line-height:1.5;';box.textContent=msg;document.body.appendChild(box);setTimeout(function(){box.style.opacity='0';box.style.transition='opacity .3s';setTimeout(function(){box.remove();},300);},4500);}
function showAuthErr(msg){var el=document.getElementById('auth-err');if(!el)return;el.textContent=msg||'Please fill in all fields.';el.style.display='block';setTimeout(function(){el.style.display='none';},4000);}

// ── AUTH ─────────────────────────────────────────────────────────────────────
function switchAuth(t){document.getElementById('tab-si').className='auth-tab'+(t==='si'?' on':'');document.getElementById('tab-su').className='auth-tab'+(t==='su'?' on':'');document.getElementById('si-form').style.display=t==='si'?'block':'none';document.getElementById('su-form').style.display=t==='su'?'block':'none';}
async function doSignIn(){var e=document.getElementById('si-email').value.trim(),p=document.getElementById('si-pass').value;if(!e||!p){showAuthErr('Please fill in all fields.');return;}var btn=document.querySelector('#si-form .full-btn');btn.textContent='Signing in...';btn.disabled=true;try{var r=await getSupa().auth.signInWithPassword({email:e,password:p});btn.textContent='Sign in to AABStudio';btn.disabled=false;if(r.error){showAuthErr(r.error.message);return;}var u=r.data.user;APP.user={id:u.id,name:u.user_metadata&&u.user_metadata.name?u.user_metadata.name:e.split('@')[0],email:u.email};updateNav();nav('analysis-pg');}catch(err){btn.textContent='Sign in to AABStudio';btn.disabled=false;showAuthErr('Sign in failed: '+err.message);}}
async function doSignUp(){var n=document.getElementById('su-name').value.trim(),e=document.getElementById('su-email').value.trim(),p=document.getElementById('su-pass').value;if(!n||!e||!p){showAuthErr('Please fill in all fields.');return;}if(p.length<8){showAuthErr('Password must be at least 8 characters.');return;}var btn=document.querySelector('#su-form .full-btn');btn.textContent='Creating...';btn.disabled=true;try{var r=await getSupa().auth.signUp({email:e,password:p,options:{data:{name:n},emailRedirectTo:'https://aabstudio.ai'}});btn.textContent='Create free account';btn.disabled=false;if(r.error){showAuthErr(r.error.message);return;}if(r.data.session){var u=r.data.user;APP.user={id:u.id,name:n,email:u.email};updateNav();showToast('Welcome to AABStudio!','success');nav('analysis-pg');}else if(r.data.user&&!r.data.session){showToast('Check your email to confirm, then sign in.','success');switchAuth('si');document.getElementById('si-email').value=e;}}catch(err){btn.textContent='Create free account';btn.disabled=false;showAuthErr('Sign up failed: '+err.message);}}
async function doSocial(p){try{var r=await getSupa().auth.signInWithOAuth({provider:p.toLowerCase(),options:{redirectTo:'https://aabstudio.ai'}});if(r.error)showAuthErr(r.error.message);}catch(e){showAuthErr('Login failed: '+e.message);}}
async function signOut(){await getSupa().auth.signOut();APP.user=null;APP.projects=[];updateNav();nav('home');}
function pickRole(el){document.querySelectorAll('#ob-roles .ob-option').forEach(function(o){o.classList.remove('sel');o.querySelector('.ob-dot').style.cssText='';});el.classList.add('sel');el.querySelector('.ob-dot').style.cssText='border-color:var(--blue);background:var(--blue)';}
function pickOutput(el){document.querySelectorAll('#ob-outputs .ob-option').forEach(function(o){o.classList.remove('sel');o.querySelector('.ob-dot').style.cssText='';});el.classList.add('sel');el.querySelector('.ob-dot').style.cssText='border-color:var(--blue);background:var(--blue)';}
function obGo(s){document.getElementById('ob'+(s-1)).style.display='none';document.getElementById('ob'+s).style.display='block';for(var i=1;i<=3;i++)document.getElementById('obs'+i).className='ob-step'+(i<s?' done':i===s?' active':'');}

// ── FILE HANDLING ─────────────────────────────────────────────────────────────
function handleFile(inp){if(!inp.files.length)return;var file=inp.files[0];APP.uploadedFile=file;APP.uploadedBase64=null;APP.uploadedMime=file.type||'application/octet-stream';document.getElementById('uz').classList.add('has-file');document.getElementById('uz-title').textContent=file.name+' — ready';document.getElementById('file-pill').innerHTML='<div style="display:flex;align-items:center;gap:9px;padding:10px 13px;background:var(--green-bg);border:0.5px solid rgba(26,122,74,.2);border-radius:10px;font-size:13px;color:var(--green);margin-bottom:14px;"><strong>'+file.name+'</strong> ('+Math.round(file.size/1024)+' KB) — ready</div>';var rd=new FileReader();rd.onload=function(e){var d=e.target.result;APP.uploadedBase64=d.indexOf(',')>-1?d.split(',')[1]:d;};rd.readAsDataURL(file);}
function handleCompareFile(slot,inp){if(!inp.files.length)return;var file=inp.files[0];document.getElementById('uz-'+slot).classList.add('has-file');document.getElementById('uz-'+slot+'-title').textContent='✓ '+file.name;var rd=new FileReader();rd.onload=function(e){var d=e.target.result,b64=d.indexOf(',')>-1?d.split(',')[1]:d;if(slot==='a'){APP.compareFileA=file;APP.compareBase64A=b64;APP.compareMimeA=file.type;}else{APP.compareFileB=file;APP.compareBase64B=b64;APP.compareMimeB=file.type;}};rd.readAsDataURL(file);}
function pickOut(el){var par=el.closest('[style]');if(par)par.querySelectorAll('.o-opt').forEach(function(o){o.classList.remove('on');o.querySelector('.o-dot').style.cssText='';});el.classList.add('on');el.querySelector('.o-dot').style.cssText='border-color:var(--blue);background:var(--blue)';}
function pickDepth(el,d){document.querySelectorAll('.d-opt').forEach(function(o){o.classList.remove('on');});el.classList.add('on');APP.depth=d;}
function pickAnalysisType(el){var sb=el.closest('[style*="width:268px"]');if(sb)sb.querySelectorAll('.o-opt').forEach(function(o){o.classList.remove('on');o.querySelector('.o-dot').style.cssText='';});el.classList.add('on');el.querySelector('.o-dot').style.cssText='border-color:var(--blue);background:var(--blue)';}
function pickCompareType(el){var par=el.closest('[style]');if(par)par.querySelectorAll('.o-opt').forEach(function(o){o.classList.remove('on');o.querySelector('.o-dot').style.cssText='';});el.classList.add('on');el.querySelector('.o-dot').style.cssText='border-color:var(--blue);background:var(--blue)';var t=el.querySelector('.o-txt').textContent;APP.compareType=t.indexOf('Risk')>-1?'risk':t.indexOf('Financial')>-1?'financial':t.indexOf('Policy')>-1?'policy':'full';}

// ── ANALYSIS ──────────────────────────────────────────────────────────────────
function startAnalysis(){var req=document.getElementById('req-box').value.trim();if(!APP.uploadedFile){document.getElementById('analysis-err-doc').style.display='block';setTimeout(function(){document.getElementById('analysis-err-doc').style.display='none';},3500);return;}if(!req){document.getElementById('analysis-err-req').style.display='block';setTimeout(function(){document.getElementById('analysis-err-req').style.display='none';},3500);return;}if(!APP.uploadedBase64){var att=0,w=setInterval(function(){att++;if(APP.uploadedBase64){clearInterval(w);nav('proc-pg');runEngines(req);}else if(att>20){clearInterval(w);showToast('File not ready. Try again.','error');}},200);return;}nav('proc-pg');runEngines(req);}
function runEngines(req){var steps=[{id:'e0',label:'Parsing document structure...',pct:16},{id:'e1',label:'Classifying document type...',pct:32},{id:'e2',label:'Interpreting your request...',pct:48},{id:'e3',label:'Extracting evidence & entities...',pct:64},{id:'e4',label:'Balanced reasoning — merits, risks, tradeoffs...',pct:80},{id:'e5',label:'Building report & evidence cards...',pct:94}];var i=0;function next(){if(i>0){document.getElementById(steps[i-1].id).classList.remove('run');document.getElementById(steps[i-1].id).classList.add('done');}if(i>=steps.length){document.getElementById('proc-fill').style.width='100%';document.getElementById('proc-status').textContent='Calling Claude AI...';callAnalysis(req);return;}var s=steps[i];document.getElementById(s.id).classList.remove('wait');document.getElementById(s.id).classList.add('run');document.getElementById('proc-fill').style.width=s.pct+'%';document.getElementById('proc-status').textContent=s.label;i++;setTimeout(next,750);}setTimeout(next,300);}
async function callAnalysis(req){try{var res=await fetch('https://aabstudio-production.up.railway.app/api/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request:req,depth:APP.depth||'deep',fileName:APP.uploadedFile?APP.uploadedFile.name:'document',fileBase64:APP.uploadedBase64,mimeType:APP.uploadedMime||''})});if(!res.ok)throw new Error('Backend returned HTTP '+res.status+' — check Railway is deployed');var report=await res.json();if(report.error)throw new Error(report.error);if(APP.user&&APP.user.id){try{await getSupa().from('projects').insert({user_id:APP.user.id,title:report.title,doc_type:report.docType,domain:report.domain,file_name:APP.uploadedFile?APP.uploadedFile.name:'',request:req,report:report});}catch(dbErr){console.warn('Project save failed (non-fatal):',dbErr.message);}}APP.projects.unshift({id:Date.now(),title:report.title,docType:report.docType,domain:report.domain,date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),report:report});buildReport(report);}catch(e){var msg=e.message||'Unknown error';var isNetwork=msg.indexOf('fetch')<0&&(msg.indexOf('Failed')<0)&&(msg.indexOf('HTTP')<0);buildReport({title:'Analysis Failed',docType:'Unknown',domain:'General',executiveSummary:'Error: '+msg+(isNetwork?'':' — visit aabstudio-production.up.railway.app/health to check backend status.'),sections:[{title:'What to check',body:'1. Visit aabstudio-production.up.railway.app/health in your browser.\n2. If it fails, redeploy on Railway.\n3. Make sure ANTHROPIC_API_KEY is set in Railway environment variables.',evidenceItems:[]}]});}nav('report-pg');}

// ── COMPARISON ────────────────────────────────────────────────────────────────
function startComparison(){if(!APP.compareBase64A||!APP.compareBase64B){showToast('Upload both documents first.','error');return;}nav('compare-proc-pg');var steps=[{id:'ce0',pct:16},{id:'ce1',pct:32},{id:'ce2',pct:48},{id:'ce3',pct:64},{id:'ce4',pct:80},{id:'ce5',pct:94}],labels=['Parsing Document A...','Parsing Document B...','Structural alignment...','Detecting differences...','Risk change analysis...','Building comparison report...'],i=0;function next(){if(i>0){document.getElementById(steps[i-1].id).classList.remove('run');document.getElementById(steps[i-1].id).classList.add('done');}if(i>=steps.length){document.getElementById('compare-fill').style.width='100%';document.getElementById('compare-status').textContent='Calling comparison engine...';callCompare();return;}document.getElementById(steps[i].id).classList.remove('wait');document.getElementById(steps[i].id).classList.add('run');document.getElementById('compare-fill').style.width=steps[i].pct+'%';document.getElementById('compare-status').textContent=labels[i];i++;setTimeout(next,700);}setTimeout(next,300);}
async function callCompare(){try{var res=await fetch('https://aabstudio-production.up.railway.app/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({docABase64:APP.compareBase64A,docAMime:APP.compareMimeA,docAName:APP.compareFileA?APP.compareFileA.name:'Doc A',docBBase64:APP.compareBase64B,docBMime:APP.compareMimeB,docBName:APP.compareFileB?APP.compareFileB.name:'Doc B',compareType:APP.compareType})});if(!res.ok)throw new Error('HTTP '+res.status);var data=await res.json();if(data.error)throw new Error(data.error);buildCompareReport(data);}catch(e){buildCompareReport({summary:'Comparison failed: '+e.message,changes:[]});}nav('compare-pg');document.getElementById('compare-results').style.display='block';}
function buildCompareReport(data){var html='';if(data.summary)html+='<div style="background:var(--blue-pale);border:0.5px solid rgba(26,58,92,.15);border-radius:14px;padding:16px 20px;margin-bottom:20px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--blue);margin-bottom:6px;">Summary</div><div style="font-size:14px;color:var(--ink-mid);line-height:1.7;">'+data.summary+'</div></div>';(data.changes||[]).forEach(function(c){var cl=c.type==='added'?'added':c.type==='removed'?'removed':'changed';html+='<div class="compare-diff '+cl+'"><div class="diff-label '+cl+'">'+c.label.toUpperCase()+'</div><div style="font-size:13px;color:var(--ink-mid);line-height:1.6;">'+c.text+'</div>'+(c.before&&c.after?'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;"><div style="font-size:12px;padding:7px 10px;background:rgba(192,57,43,.06);border-radius:6px;color:var(--red);font-family:\'DM Mono\',monospace;">Before: '+c.before+'</div><div style="font-size:12px;padding:7px 10px;background:rgba(26,122,74,.06);border-radius:6px;color:var(--green);font-family:\'DM Mono\',monospace;">After: '+c.after+'</div></div>':'')+'</div>';});if(!data.changes||!data.changes.length)html+='<div style="font-size:14px;color:var(--muted);">No significant changes detected.</div>';if(data.riskChanges)html+='<div class="divider"></div><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:10px;">Risk assessment changes</div><div style="font-size:14px;color:var(--ink-mid);line-height:1.75;">'+data.riskChanges+'</div>';document.getElementById('compare-output').innerHTML=html;}

// ── REPORT BUILDER ────────────────────────────────────────────────────────────
function buildReport(r){APP.lastReport=r;var navHtml='<div class="rpt-nav-item on" onclick="scrollSec(0,this)">Executive summary</div>';(r.sections||[]).forEach(function(s,i){navHtml+='<div class="rpt-nav-item" onclick="scrollSec('+(i+1)+',this)">'+s.title+'</div>';});document.getElementById('rpt-nav').innerHTML=navHtml;var c='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:22px;"><span class="badge b-blue">'+(r.docType||'Document')+'</span><span class="badge b-gold">Balanced analysis</span><span class="badge b-green">Complete</span></div><div class="rpt-title">'+r.title+'</div><div class="rpt-sub">Generated by AABStudio.ai · '+(r.sections||[]).length+' sections · Claude AI</div><div class="rpt-sec-hd" id="sec-0"><span class="rpt-sec-num">EXEC</span><span class="rpt-sec-title">Executive summary</span></div><div class="rpt-body" style="margin-bottom:20px;">'+r.executiveSummary+'</div><div class="divider"></div>';
(r.sections||[]).forEach(function(s,i){
  c+='<div id="sec-'+(i+1)+'"><div class="rpt-sec-hd"><span class="rpt-sec-num">0'+(i+1)+'</span><span class="rpt-sec-title">'+s.title+'</span></div>';
  c+='<div class="rpt-body" style="margin-bottom:16px;">'+s.body+'</div>';

  // SWOT grid — only render if any SWOT fields present
  var hasSwot=(s.strengths&&s.strengths.length)||(s.weaknesses&&s.weaknesses.length)||(s.risks&&s.risks.length)||(s.opportunities&&s.opportunities.length);
  if(hasSwot){
    c+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">';
    if(s.strengths&&s.strengths.length){
      c+='<div style="background:var(--green-bg);border:0.5px solid rgba(26,122,74,.15);border-radius:var(--radius);padding:14px;">';
      c+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--green);margin-bottom:8px;">✦ Strengths</div>';
      c+=s.strengths.map(function(x){return'<div style="font-size:13px;color:var(--ink-mid);padding:3px 0;border-bottom:0.5px solid rgba(26,122,74,.1);">'+x+'</div>';}).join('');
      c+='</div>';
    }
    if(s.weaknesses&&s.weaknesses.length){
      c+='<div style="background:var(--amber-bg);border:0.5px solid rgba(138,98,0,.15);border-radius:var(--radius);padding:14px;">';
      c+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--amber);margin-bottom:8px;">⚠ Weaknesses</div>';
      c+=s.weaknesses.map(function(x){return'<div style="font-size:13px;color:var(--ink-mid);padding:3px 0;border-bottom:0.5px solid rgba(138,98,0,.1);">'+x+'</div>';}).join('');
      c+='</div>';
    }
    if(s.risks&&s.risks.length){
      c+='<div style="background:var(--red-bg);border:0.5px solid rgba(192,57,43,.15);border-radius:var(--radius);padding:14px;">';
      c+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--red);margin-bottom:8px;">▲ Risks</div>';
      c+=s.risks.map(function(x){return'<div style="font-size:13px;color:var(--ink-mid);padding:3px 0;border-bottom:0.5px solid rgba(192,57,43,.1);">'+x+'</div>';}).join('');
      c+='</div>';
    }
    if(s.opportunities&&s.opportunities.length){
      c+='<div style="background:var(--teal-light);border:0.5px solid rgba(13,115,119,.15);border-radius:var(--radius);padding:14px;">';
      c+='<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--teal);margin-bottom:8px;">◆ Opportunities</div>';
      c+=s.opportunities.map(function(x){return'<div style="font-size:13px;color:var(--ink-mid);padding:3px 0;border-bottom:0.5px solid rgba(13,115,119,.1);">'+x+'</div>';}).join('');
      c+='</div>';
    }
    c+='</div>';
  }

  // Fallback: old reasoning format (backwards compatible)
  if(!hasSwot&&s.reasoning){
    c+='<div style="margin-bottom:16px;"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);font-weight:600;margin-bottom:8px;">Balanced reasoning</div><div class="reasoning-grid">';
    if(s.reasoning.observation)c+='<div class="reasoning-cell"><div class="rc-label obs">Observation</div><div class="rc-text">'+s.reasoning.observation+'</div></div>';
    if(s.reasoning.merits)c+='<div class="reasoning-cell"><div class="rc-label mer">Merits</div><div class="rc-text">'+s.reasoning.merits+'</div></div>';
    if(s.reasoning.risks)c+='<div class="reasoning-cell"><div class="rc-label risk">Risks</div><div class="rc-text">'+s.reasoning.risks+'</div></div>';
    if(s.reasoning.tradeoffs)c+='<div class="reasoning-cell"><div class="rc-label trade">Trade-offs</div><div class="rc-text">'+s.reasoning.tradeoffs+'</div></div>';
    if(s.reasoning.operationalImpact)c+='<div class="reasoning-cell"><div class="rc-label ops">Operational impact</div><div class="rc-text">'+s.reasoning.operationalImpact+'</div></div>';
    if(s.reasoning.financialImpact)c+='<div class="reasoning-cell"><div class="rc-label fin">Financial impact</div><div class="rc-text">'+s.reasoning.financialImpact+'</div></div>';
    if(!s.reasoning.merits&&s.reasoning.implication)c+='<div class="reasoning-cell"><div class="rc-label risk">Implication</div><div class="rc-text">'+s.reasoning.implication+'</div></div>';
    c+='</div>';
    if(s.reasoning.recommendation)c+='<div style="background:var(--teal-light);border:0.5px solid rgba(13,115,119,.2);border-radius:10px;padding:12px 14px;margin-top:8px;"><div class="rc-label rec" style="margin-bottom:4px;">Recommendation</div><div class="rc-text">'+s.reasoning.recommendation+'</div></div>';
    c+='</div>';
  }

  // Recommendation banner
  if(s.recommendation){
    c+='<div style="background:var(--teal-light);border:0.5px solid rgba(13,115,119,.2);border-radius:var(--radius);padding:12px 16px;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px;">';
    c+='<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--teal);white-space:nowrap;margin-top:2px;">Recommendation</span>';
    c+='<span style="font-size:13px;color:var(--ink-mid);line-height:1.6;">'+s.recommendation+'</span></div>';
  }

  // Confidence badge
  if(s.confidence){
    var confCls=s.confidence==='High'?'b-green':s.confidence==='Medium'?'b-amber':'b-red';
    c+='<div style="margin-bottom:14px;"><span class="badge '+confCls+'">'+s.confidence+' confidence</span></div>';
  }

  // Evidence cards
  (s.evidenceItems||[]).forEach(function(ev,j){
    var cc=ev.confidence==='High'?'conf-high':ev.confidence==='Medium'?'conf-med':'conf-low';
    c+='<div class="ev-card"><div class="ev-card-header"><span class="ev-card-id">EV-'+(i+1)+'0'+(j+1)+'</span><span class="ev-card-label">'+ev.label+'</span><span class="ev-conf '+cc+'" style="margin-left:auto;">'+ev.confidence+' confidence</span></div><div class="ev-card-body">';
    if(ev.source)c+='<div class="ev-row"><span class="ev-row-label">Source</span><span class="ev-row-val">'+ev.source+'</span></div>';
    if(ev.text)c+='<div class="ev-quote">'+ev.text+'</div>';
    if(ev.interpretation)c+='<div class="ev-row"><span class="ev-row-label">Interpretation</span><span class="ev-row-val">'+ev.interpretation+'</span></div>';
    if(ev.implication)c+='<div class="ev-row"><span class="ev-row-label">Implication</span><span class="ev-row-val">'+ev.implication+'</span></div>';
    c+='</div></div>';
  });
  c+='</div><div class="divider"></div>';
});
c+='<div class="cont-banner"><div><h3>Continue to Scene Studio</h3><p>Expand into 8-second presenter scenes and AI video.</p></div><button class="btn-primary" onclick="nav(\'scenes-pg\')">Continue →</button></div>';
document.getElementById('rpt-content').innerHTML=c;}
function scrollSec(i,el){document.querySelectorAll('.rpt-nav-item').forEach(function(n){n.classList.remove('on');});el.classList.add('on');var sec=document.getElementById('sec-'+i);if(sec)sec.scrollIntoView({behavior:'smooth',block:'start'});}
async function exportReportPDF(){if(!APP.lastReport){showToast('No report.','error');return;}try{var r=await fetch('https://aabstudio-production.up.railway.app/api/export/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport})});if(!r.ok)throw new Error();var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(APP.lastReport.title||'Report')+'.pdf';a.click();}catch(e){showToast('PDF export coming soon.','warning');}}
async function exportReportDOCX(){if(!APP.lastReport){showToast('No report.','error');return;}try{var r=await fetch('https://aabstudio-production.up.railway.app/api/export/docx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport})});if(!r.ok)throw new Error();var b=await r.blob();var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(APP.lastReport.title||'Report')+'.docx';a.click();}catch(e){showToast('DOCX export coming soon.','warning');}}

// ── PRICING & BILLING ─────────────────────────────────────────────────────────
function pricingCTA(plan){if(plan==='free'){if(APP.user)nav('analysis-pg');else nav('auth-pg');return;}if(!APP.user){nav('auth-pg');return;}openCheckout(plan);}
function toggleBill(){APP.annual=!APP.annual;document.getElementById('bill-tog').classList.toggle('on');document.getElementById('tog-m').className='bt-lbl'+(APP.annual?'':' on');document.getElementById('tog-a').className='bt-lbl'+(APP.annual?' on':'');document.getElementById('pro-amt').textContent=APP.annual?'£19':'£24';document.getElementById('studio-amt').textContent=APP.annual?'£55':'£69';}
function openCheckout(item){if(!APP.user){nav('auth-pg');return;}APP.checkoutItem=item;var c=CHECKOUT_DATA[item];if(!c)return;document.getElementById('m-title').textContent=c.title;document.getElementById('m-sub').textContent=c.sub;document.getElementById('m-order').innerHTML=c.rows.map(function(r,i){var last=i===c.rows.length-1;return'<div class="os-row"><span>'+r[0]+'</span><span'+(last?' style="color:var(--gold);font-size:15px;font-weight:600;"':'')+'>'+r[1]+'</span></div>';}).join('');document.getElementById('pay-btn').textContent=c.btn;document.getElementById('pay-err').style.display='none';document.getElementById('checkout-modal').classList.add('on');}
function closeCheckout(){document.getElementById('checkout-modal').classList.remove('on');}
async function processPayment(){var PRICES={pro:'price_1THCR2BJVJa9ylUXim1sQVRq',studio:'price_1THCSlBJVJa9ylUXwAYC4LpR','cred-starter':'price_1THCVTBJVJa9ylUXd0U3vSrg','cred-creator':'price_1THCWzBJVJa9ylUXVpbhJgrQ','cred-studio':'price_1THCZpBJVJa9ylUXsWsb6cHQ'};var isC=APP.checkoutItem.startsWith('cred'),pid=PRICES[APP.checkoutItem],btn=document.getElementById('pay-btn');btn.textContent='Redirecting...';btn.disabled=true;try{var r=await fetch('https://aabstudio-production.up.railway.app/api/stripe/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({priceId:pid,mode:isC?'payment':'subscription',customerEmail:APP.user?APP.user.email:undefined})});var d=await r.json();if(d.url)window.location.href=d.url;else{document.getElementById('pay-err').style.display='block';btn.textContent=CHECKOUT_DATA[APP.checkoutItem].btn;btn.disabled=false;}}catch(e){document.getElementById('pay-err').style.display='block';btn.textContent=CHECKOUT_DATA[APP.checkoutItem].btn;btn.disabled=false;}}

// ── COST ESTIMATE MODAL ───────────────────────────────────────────────────────
function showCostEstimate(){if(!APP_SCENES.data){showToast('Generate scenes first.','error');nav('scenes-pg');return;}var total=0;(APP_SCENES.data.discussions||[]).forEach(function(d){total+=(d.scenes||[]).length;});var secs=total*8,mins=Math.floor(secs/60),s=secs%60,credits=total*10,bal=CREDITS.remaining||0,after=bal-credits;document.getElementById('ce-scenes').textContent=total;document.getElementById('ce-runtime').textContent=(mins>0?mins+'m ':'')+s+'s';document.getElementById('ce-credits').textContent=credits;document.getElementById('ce-balance').textContent=bal;document.getElementById('ce-after').textContent=after;var warn=document.getElementById('ce-warning'),cb=document.getElementById('ce-confirm-btn'),bb=document.getElementById('ce-buy-btn');if(after<0){warn.style.display='block';cb.style.display='none';bb.style.display='block';}else{warn.style.display='none';cb.style.display='block';bb.style.display='none';}document.getElementById('cost-modal').classList.add('on');}
function closeCostModal(){document.getElementById('cost-modal').classList.remove('on');}
function confirmRender(){closeCostModal();startRender();}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function dashNav(sec,el){document.querySelectorAll('.sb-item').forEach(function(i){i.classList.remove('on');});document.querySelectorAll('.acc-section').forEach(function(s){s.classList.remove('on');});el.classList.add('on');document.getElementById('dash-'+sec).classList.add('on');}
async function loadAndRenderProjects(){var list=document.getElementById('proj-list');list.innerHTML='<div class="loading-row"><div class="spin"></div>Loading...</div>';if(APP.user&&APP.user.id){try{var r=await getSupa().from('projects').select('*').eq('user_id',APP.user.id).order('created_at',{ascending:false});if(r.data&&r.data.length)APP.projects=r.data.map(function(p){return{id:p.id,title:p.title,docType:p.doc_type,domain:p.domain,date:new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),report:p.report};});}catch(e){}}if(!APP.projects.length){list.innerHTML='<div class="empty-state"><h3>No projects yet</h3><p>Upload your first document to get started.</p><button class="btn-primary" onclick="nav(\'analysis-pg\')">Start first analysis</button></div>';return;}list.innerHTML=APP.projects.map(function(p,i){return'<div style="background:var(--white);border:0.5px solid var(--bdr);border-radius:14px;padding:16px 20px;margin-bottom:8px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:border-color .15s;" onmouseenter="this.style.borderColor=\'rgba(26,58,92,.2)\'" onmouseleave="this.style.borderColor=\'rgba(0,0,0,.08)\'" onclick="loadProject('+i+')">'+'<div style="flex:1;"><div style="font-size:14px;font-weight:500;color:var(--ink);margin-bottom:3px;">'+p.title+'</div><div style="font-size:12px;color:var(--muted);">'+(p.docType||'Doc')+' · '+p.date+'</div></div><span class="badge b-blue">Report ready</span></div>';}).join('');}
function loadProject(i){buildReport(APP.projects[i].report);nav('report-pg');}

// ── LIVE BROADCAST ────────────────────────────────────────────────────────────
function initLive(){APP.liveScene=0;APP.liveAuto=false;APP.liveElapsed=0;clearInterval(APP.liveTimer);clearInterval(APP.liveElTimer);if(!LIVE_SCENES.length){document.getElementById('live-sq').innerHTML='<div style="padding:12px;font-size:12px;color:rgba(255,255,255,.3);">No scenes — generate first.</div>';return;}APP.liveElTimer=setInterval(function(){APP.liveElapsed++;var m=Math.floor(APP.liveElapsed/60),s=APP.liveElapsed%60;document.getElementById('l-rs-el').textContent=m+':'+(s<10?'0':'')+s;},1000);renderLiveSQ();renderLiveTP();}
function renderLiveSQ(){document.getElementById('live-sq').innerHTML=LIVE_SCENES.map(function(s,i){var sc=s.script||s.presenterA||'';return'<div style="padding:9px 10px;border-radius:8px;margin-bottom:3px;cursor:pointer;background:'+(i===APP.liveScene?'rgba(255,255,255,.08)':'transparent')+';" onclick="jumpLive('+i+')">'+'<div style="display:flex;align-items:center;gap:7px;"><div style="width:20px;height:20px;border-radius:5px;background:'+(i<APP.liveScene?'rgba(26,122,74,.2)':i===APP.liveScene?'rgba(255,255,255,.1)':'rgba(255,255,255,.05)')+';display:flex;align-items:center;justify-content:center;font-size:10px;color:'+(i<APP.liveScene?'var(--green)':i===APP.liveScene?'#fff':'rgba(255,255,255,.3)')+'">'+(i+1)+'</div><div><div style="font-size:12px;font-weight:'+(i===APP.liveScene?'500':'400')+';color:'+(i===APP.liveScene?'#fff':'rgba(255,255,255,.35)')+';">Scene '+(i+1)+'</div><div style="font-size:11px;color:rgba(255,255,255,.25);">'+(s.section||'')+'</div></div></div>'+(i===APP.liveScene&&sc?'<div style="font-size:11px;color:rgba(255,255,255,.2);margin-top:5px;">'+sc.slice(0,55)+'...</div>':'')+'</div>';}).join('');document.getElementById('l-rs-scene').textContent=(APP.liveScene+1)+'/'+LIVE_SCENES.length;var ovq=document.getElementById('live-ovq');if(ovq){var cur=LIVE_SCENES[APP.liveScene];ovq.innerHTML=(cur&&cur.evidenceRef&&cur.evidenceRef!=='null')?'<div style="padding:8px 10px;background:rgba(184,148,42,.1);border:0.5px solid rgba(184,148,42,.2);border-radius:8px;font-size:12px;color:var(--gold);margin-bottom:6px;"><div style="font-family:\'DM Mono\',monospace;margin-bottom:3px;">'+cur.evidenceRef+'</div><div style="color:rgba(255,255,255,.3);">'+(cur.overlayText||'')+'</div></div>':'<div style="font-size:12px;color:rgba(255,255,255,.2);padding:8px;">No evidence overlay</div>';}}
function renderLiveTP(){if(!LIVE_SCENES.length)return;var sc=LIVE_SCENES[APP.liveScene],script=sc.script||sc.presenterA||'No script',prev=APP.liveScene>0?(LIVE_SCENES[APP.liveScene-1].script||LIVE_SCENES[APP.liveScene-1].presenterA||''):'',nxt=APP.liveScene<LIVE_SCENES.length-1?(LIVE_SCENES[APP.liveScene+1].script||LIVE_SCENES[APP.liveScene+1].presenterA||''):'';document.getElementById('live-prev').textContent=prev;document.getElementById('live-cur').innerHTML=script.split(' ').map(function(w,i){return'<span id="lw-'+i+'">'+w+' </span>';}).join('');document.getElementById('live-nxt').textContent=nxt;document.getElementById('live-badge').textContent='Scene '+(APP.liveScene+1);document.getElementById('live-section').textContent=sc.section||'';document.getElementById('live-timing').textContent=(sc.secs||sc.duration||8)+'s';document.getElementById('live-prog').style.width='0%';if(APP.liveAuto)startLiveAuto();}
function jumpLive(i){APP.liveScene=i;clearInterval(APP.liveTimer);renderLiveSQ();renderLiveTP();}
function liveNext(){if(APP.liveScene<LIVE_SCENES.length-1){APP.liveScene++;clearInterval(APP.liveTimer);renderLiveSQ();renderLiveTP();}}
function livePrev(){if(APP.liveScene>0){APP.liveScene--;clearInterval(APP.liveTimer);renderLiveSQ();renderLiveTP();}}
function startLiveAuto(){clearInterval(APP.liveTimer);var sc=LIVE_SCENES[APP.liveScene],script=sc.script||sc.presenterA||'',words=script.split(' '),ms=Math.round(60000/APP.liveWpm),total=words.length*ms,start=Date.now();APP.liveTimer=setInterval(function(){var el=Date.now()-start;document.getElementById('live-prog').style.width=Math.min(el/total*100,100)+'%';var wi=Math.floor(el/ms);for(var j=0;j<words.length;j++){var w=document.getElementById('lw-'+j);if(w)w.style.color=j<wi?'rgba(255,255,255,.15)':j===wi?'var(--gold)':'#fff';}document.getElementById('live-timing').textContent=Math.max(0,Math.round((total-el)/1000))+'s';if(el>=total){clearInterval(APP.liveTimer);setTimeout(function(){if(APP.liveAuto&&APP.liveScene<LIVE_SCENES.length-1)liveNext();},600);}},80);}
function toggleLiveAuto(){APP.liveAuto=!APP.liveAuto;var btn=document.getElementById('live-auto-btn');btn.textContent='Auto: '+(APP.liveAuto?'on':'off');btn.style.color=APP.liveAuto?'var(--gold)':'rgba(255,255,255,.5)';btn.style.borderColor=APP.liveAuto?'rgba(184,148,42,.4)':'rgba(255,255,255,.15)';if(APP.liveAuto)startLiveAuto();else clearInterval(APP.liveTimer);}
function setLiveSpd(v){APP.liveWpm=parseInt(v);document.getElementById('live-spd').textContent=v+' wpm';if(APP.liveAuto)startLiveAuto();}

// ── SCENE STUDIO ──────────────────────────────────────────────────────────────
var APP_SCENES={presenterMode:'human',pacing:'normal',data:null};
var PM_DESCS={human:'Human presenter — teleprompter and recording studio.',ai:'Single AI presenter reading the full script.',dual:'Debate mode: Presenter A argues a position, B responds with a counter-perspective.',documentary:'Documentary: Hook → Evidence reveal → Context → Implication → Conclusion.'};
function setPresenterMode(m,el){APP_SCENES.presenterMode=m;document.querySelectorAll('#scenes-pg .pt-btn').forEach(function(b){b.classList.remove('on');});el.classList.add('on');var d=document.getElementById('pm-desc');if(d)d.textContent=PM_DESCS[m]||'';}
function setPacing(el,p){APP_SCENES.pacing=p;var par=el.closest('[style]');if(par)par.querySelectorAll('.o-opt').forEach(function(o){o.classList.remove('on');o.querySelector('.o-dot').style.cssText='';});el.classList.add('on');el.querySelector('.o-dot').style.cssText='border-color:var(--blue);background:var(--blue)';}
function generateScenes(){if(!APP.lastReport){showToast('Run an analysis first.','error');nav('analysis-pg');return;}nav('scene-proc-pg');var steps=[{id:'se0',pct:20},{id:'se1',pct:40},{id:'se2',pct:60},{id:'se3',pct:80},{id:'se4',pct:94}],labels=['Expanding sections into discussion blocks...','Planning scene structure...','Writing presenter scripts...','Generating visual & evidence overlay prompts...','Formatting for '+APP_SCENES.presenterMode+' presenter mode...'],i=0;function next(){if(i>0){document.getElementById(steps[i-1].id).classList.remove('run');document.getElementById(steps[i-1].id).classList.add('done');}if(i>=steps.length){document.getElementById('scene-proc-fill').style.width='100%';document.getElementById('scene-proc-status').textContent='Calling Claude scene engine...';callSceneAPI();return;}document.getElementById(steps[i].id).classList.remove('wait');document.getElementById(steps[i].id).classList.add('run');document.getElementById('scene-proc-fill').style.width=steps[i].pct+'%';document.getElementById('scene-proc-status').textContent=labels[i];i++;setTimeout(next,800);}setTimeout(next,300);}
async function callSceneAPI(){var ep=APP_SCENES.presenterMode==='documentary'?'https://aabstudio-production.up.railway.app/api/documentary':'https://aabstudio-production.up.railway.app/api/scenes';try{var r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport,presenterMode:APP_SCENES.presenterMode,speed:APP_SCENES.pacing})});if(!r.ok)throw new Error('HTTP '+r.status);var data=await r.json();if(data.error)throw new Error(data.error);APP_SCENES.data=data;buildScenesView(data);}catch(e){document.getElementById('scenes-content').innerHTML='<div class="pad"><div style="background:var(--red-bg);border:0.5px solid rgba(192,57,43,.2);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--red);">Failed: '+e.message+'</div></div>';}nav('scenes-pg');}
function buildScenesView(data){var total=0;(data.discussions||[]).forEach(function(d){total+=(d.scenes||[]).length;});var secs=total*8,mins=Math.floor(secs/60),s=secs%60,credits=total*10,html='<div class="scene-stats"><div class="ss-item"><div class="ss-num">'+total+'</div><div class="ss-label">Scenes</div></div><div class="ss-item"><div class="ss-num">'+(data.discussions||[]).length+'</div><div class="ss-label">Sections</div></div><div class="ss-item"><div class="ss-num">'+(mins>0?mins+'m ':'')+s+'s</div><div class="ss-label">Duration</div></div><div class="ss-item"><div class="ss-num">'+credits+'</div><div class="ss-label">Credits to render</div></div></div>';html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;"><div><div class="page-title">'+(data.title||'Scenes')+'</div><div class="page-sub">'+APP_SCENES.presenterMode+' · '+total+' scenes · '+(mins>0?mins+'m ':'')+s+'s · '+credits+' credits to render</div></div><div style="display:flex;gap:8px;"><button class="btn-outline" onclick="exportScriptTxt()">Export script</button><button class="btn-primary" onclick="launchLiveFromScenes()">→ Go live</button></div></div>';(data.discussions||[]).forEach(function(disc,di){html+='<div class="disc-block"><div class="disc-header"><span class="disc-num">0'+(di+1)+'</span><div style="flex:1;"><div class="disc-title">'+disc.sectionTitle+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px;">'+(disc.scenes||[]).length+' scenes</div></div></div>';if(disc.discussionText)html+='<div style="background:linear-gradient(135deg,var(--blue-pale),var(--off-white));border-left:3px solid var(--blue);border-radius:0 14px 14px 0;padding:14px 18px;margin-bottom:16px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--blue);margin-bottom:8px;">Discussion narrative</div><div style="font-size:14px;color:var(--ink-mid);line-height:1.75;">'+disc.discussionText+'</div></div>';(disc.scenes||[]).forEach(function(scene){var ts=(scene.type||'explanation').toLowerCase().replace(/\s+/g,'-'),wc=scene.wordCount||(scene.presenterA?scene.presenterA.split(/\s+/).length:0),wcc=wc<14?'var(--red)':wc>22?'var(--amber)':'var(--green)';html+='<div class="scene-card type-'+ts+'"><div class="scene-card-header"><span class="scene-num">SCENE '+String(scene.sceneNumber).padStart(3,'0')+'</span><span class="scene-type st-'+ts+'">'+(scene.type||'Explanation')+'</span>';if(scene.evidenceRef&&scene.evidenceRef!=='null')html+='<span class="evidence-overlay-tag">📎 '+scene.evidenceRef+'</span>';html+='<span style="font-family:\'DM Mono\',monospace;font-size:10px;color:'+wcc+';margin-left:auto;background:rgba(0,0,0,.04);padding:2px 7px;border-radius:8px;">'+wc+'w</span><span class="scene-duration" style="margin-left:6px;">'+(scene.duration||8)+'s</span></div><div class="scene-card-body">';if(APP_SCENES.presenterMode==='dual'){html+='<div class="scene-presenter-label">Presenter A</div><div class="scene-script">'+scene.presenterA+'</div>';if(scene.presenterB&&scene.presenterB!=='null')html+='<div class="scene-presenter-label">Presenter B</div><div class="scene-script scene-script-b">'+scene.presenterB+'</div>';}else html+='<div class="scene-script">'+scene.presenterA+'</div>';if(scene.overlayText&&scene.overlayText!=='null')html+='<div style="font-size:12px;display:flex;align-items:flex-start;gap:6px;margin-top:6px;padding:7px 10px;background:var(--amber-bg);border-radius:7px;"><span>📝</span><span style="color:var(--amber);">Overlay: '+scene.overlayText+'</span></div>';if(scene.visualPrompt)html+='<div class="scene-visual"><svg width="12" height="12" viewBox="0 0 12 12"><rect x=".5" y=".5" width="11" height="11" rx="1.5" fill="none" stroke="var(--muted-light)" stroke-width="1"/></svg>'+scene.visualPrompt+'</div>';html+='</div></div>';});html+='</div>';});document.getElementById('scenes-content').innerHTML=html;updateStudioSummary();}
function exportScriptTxt(){if(!APP_SCENES.data)return;var txt=(APP_SCENES.data.title||'Script')+'\n\n';(APP_SCENES.data.discussions||[]).forEach(function(d){txt+='=== '+d.sectionTitle+' ===\n\n';if(d.discussionText)txt+=d.discussionText+'\n\n';(d.scenes||[]).forEach(function(s){txt+='[SCENE '+s.sceneNumber+' — '+s.type+']\n'+s.presenterA+'\n\n';if(s.presenterB)txt+='[B]\n'+s.presenterB+'\n\n';});});var blob=new Blob([txt],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='AABStudio-script.txt';a.click();}
function launchLiveFromScenes(){if(APP_SCENES.data&&APP_SCENES.data.discussions){var all=[];APP_SCENES.data.discussions.forEach(function(d){(d.scenes||[]).forEach(function(s){all.push({num:s.sceneNumber,section:d.sectionTitle,script:s.presenterA||'',presenterA:s.presenterA||'',presenterB:s.presenterB||null,secs:s.duration||8,type:s.type,visualPrompt:s.visualPrompt||'',evidenceRef:s.evidenceRef||null,overlayText:s.overlayText||null});});});if(all.length){LIVE_SCENES.length=0;all.forEach(function(s){LIVE_SCENES.push(s);});}}nav('live-pg');}

// ── STUDIO ────────────────────────────────────────────────────────────────────
var STUDIO={mode:'ai',avatarA:'alex',avatarB:'priya',avatarAImage:null,bgId:'news',bgPrompt:'Modern news studio anchor desk blue ambient lighting multiple screens professional broadcast',bgImage:null,voiceId:'EXAVITQu4vr4xnSDxMaL',stability:0.5,similarityBoost:0.75,musicMode:'none',musicAudioBase64:null,musicVol:30,musicDuck:15,sidechain:true,outputFormat:'16:9'};
var AVATARS={alex:{name:'Alex',voice:'pNInz6obpgDQGcFmaJgB'},maya:{name:'Maya',voice:'EXAVITQu4vr4xnSDxMaL'},marcus:{name:'Marcus',voice:'TxGEqnHWrfWFTfGW9XjX'},sophia:{name:'Sophia',voice:'MF3mGyEYCl7XYWbV9V6O'},james:{name:'James',voice:'VR6AewLTigWG4xSOukaG'},priya:{name:'Priya',voice:'AZnzlk1XvdvUeBnXmlld'}};
function setStudioMode(m,el){STUDIO.mode=m;document.querySelectorAll('#studio-pg .pt-btn').forEach(function(b){b.classList.remove('on');});el.classList.add('on');['studio-ai-controls','studio-dual-controls','studio-documentary-controls','studio-human-controls'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});var show=m==='dual'?'studio-dual-controls':m==='documentary'?'studio-documentary-controls':m==='human'?'studio-human-controls':'studio-ai-controls';document.getElementById(show).style.display='block';var bg=document.getElementById('studio-bg-section'),vo=document.getElementById('studio-voice-section');if(bg)bg.style.display=m==='human'?'none':'block';if(vo)vo.style.display=m==='human'?'none':'block';}
function selectAvatar(slot,el,id){var grid=el.parentElement;grid.querySelectorAll('.avatar-card').forEach(function(c){c.classList.remove('on');});el.classList.add('on');if(slot==='a'||slot==='da')STUDIO.avatarA=id;else if(slot==='db')STUDIO.avatarB=id;if((slot==='a'||slot==='da')&&AVATARS[id]){document.getElementById('studio-voice').value=AVATARS[id].voice;STUDIO.voiceId=AVATARS[id].voice;}}
function handleAvatarUpload(slot,inp){if(!inp.files.length)return;var rd=new FileReader();rd.onload=function(e){STUDIO.avatarAImage=e.target.result.split(',')[1];document.getElementById('avatar-upload-label-'+slot).textContent='✓ '+inp.files[0].name;};rd.readAsDataURL(inp.files[0]);}
function handleBgUpload(inp){if(!inp.files.length)return;var rd=new FileReader();rd.onload=function(e){STUDIO.bgImage=e.target.result.split(',')[1];document.getElementById('bg-upload-label').textContent='✓ '+inp.files[0].name;};rd.readAsDataURL(inp.files[0]);}
function selectStudioBg(el,id,name,prompt){el.closest('[style]').querySelectorAll('.o-opt').forEach(function(o){o.classList.remove('on');o.querySelector('.o-dot').style.cssText='';});el.classList.add('on');el.querySelector('.o-dot').style.cssText='border-color:var(--blue);background:var(--blue)';STUDIO.bgId=id;STUDIO.bgPrompt=prompt;}
function setMusicMode(m,el){STUDIO.musicMode=m;['music-none-btn','music-gen-btn','music-up-btn','music-suno-btn'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove('on');});el.classList.add('on');['music-generate-area','music-upload-area','music-suno-area'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});var mc=document.getElementById('music-controls');if(mc)mc.style.display=m!=='none'?'block':'none';if(m==='generate')document.getElementById('music-generate-area').style.display='block';if(m==='upload')document.getElementById('music-upload-area').style.display='block';if(m==='suno')document.getElementById('music-suno-area').style.display='block';}
async function generateMusic(){var p=document.getElementById('music-prompt').value.trim();if(!p){showToast('Describe the music first.','error');return;}var el=document.getElementById('music-gen-result');el.innerHTML='<div class="loading-row"><div class="spin"></div>Generating...</div>';try{var r=await fetch('https://aabstudio-production.up.railway.app/api/music/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p,duration:22})});var d=await r.json();if(d.audio){STUDIO.musicAudioBase64=d.audio;el.innerHTML='<audio controls style="width:100%;margin-top:6px;"><source src="data:audio/mpeg;base64,'+d.audio+'" type="audio/mpeg"></audio>';}else el.innerHTML='<div style="font-size:12px;color:var(--red);">'+(d.error||'Failed')+'</div>';}catch(e){el.innerHTML='<div style="font-size:12px;color:var(--red);">'+e.message+'</div>';}}
function openSuno(){window.open('https://suno.com/create?prompt='+encodeURIComponent(document.getElementById('suno-prompt').value.trim()||'professional background no vocals'),'_blank');}
function handleMusicUpload(inp){if(!inp.files.length)return;document.getElementById('music-file-info').innerHTML='<div style="font-size:12px;color:var(--green);padding:5px 0;">✓ '+inp.files[0].name+'</div>';var rd=new FileReader();rd.onload=function(e){STUDIO.musicAudioBase64=e.target.result.split(',')[1];};rd.readAsDataURL(inp.files[0]);}
function saveMusicToAccount(){if(!STUDIO.musicAudioBase64){showToast('No music loaded.','error');return;}var n=prompt('Name for this track:');if(!n)return;var saved=JSON.parse(localStorage.getItem('aab_music')||'[]');saved.push({name:n,b64:STUDIO.musicAudioBase64,saved:new Date().toLocaleDateString()});localStorage.setItem('aab_music',JSON.stringify(saved));renderSavedMusic();showToast('Saved.','success');}
function renderSavedMusic(){var saved=JSON.parse(localStorage.getItem('aab_music')||'[]'),el=document.getElementById('saved-music-list');if(!el)return;el.innerHTML=saved.length?saved.map(function(m,i){return'<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--off-white);border-radius:10px;margin-bottom:6px;"><div style="flex:1;"><div style="font-size:13px;font-weight:500;">'+m.name+'</div></div><button onclick="STUDIO.musicAudioBase64=\''+m.b64+'\';showToast(\'Loaded\',\'success\')" style="padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;border:0.5px solid var(--bdr2);background:var(--white);color:var(--blue);font-family:\'DM Sans\',sans-serif;">Use</button></div>';}).join(''):'<div style="font-size:13px;color:var(--muted);">No saved music.</div>';}
function pickOutputFormat(el,f){el.closest('[style]').querySelectorAll('.o-opt').forEach(function(o){o.classList.remove('on');o.querySelector('.o-dot').style.cssText='';});el.classList.add('on');el.querySelector('.o-dot').style.cssText='border-color:var(--blue);background:var(--blue)';STUDIO.outputFormat=f;}
async function previewVoice(){var el=document.getElementById('voice-preview');el.innerHTML='<div class="loading-row"><div class="spin"></div>Generating...</div>';try{var r=await fetch('https://aabstudio-production.up.railway.app/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'This is AABStudio — your document intelligence and broadcast platform.',voiceId:document.getElementById('studio-voice').value,stability:document.getElementById('studio-stab').value/100,similarityBoost:document.getElementById('studio-sim').value/100})});var d=await r.json();el.innerHTML=d.audio?'<audio controls style="width:100%;margin-top:6px;"><source src="data:audio/mpeg;base64,'+d.audio+'" type="audio/mpeg"></audio>':'<div style="font-size:12px;color:var(--red);">Failed</div>';}catch(e){el.innerHTML='<div style="font-size:12px;color:var(--red);">'+e.message+'</div>';}}
function updateStudioSummary(){var sum=document.getElementById('studio-summary'),ed=document.getElementById('studio-scene-editor');if(!APP_SCENES.data){if(sum)sum.innerHTML='<div style="font-size:13px;color:var(--muted);">Generate scenes first.</div>';return;}var total=0;(APP_SCENES.data.discussions||[]).forEach(function(d){total+=(d.scenes||[]).length;});var dur=total*8,mins=Math.floor(dur/60),s=dur%60;if(sum)sum.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"><div class="usage-item"><div class="ui-label">Scenes</div><div class="ui-nums"><span class="ui-used">'+total+'</span></div></div><div class="usage-item"><div class="ui-label">Duration</div><div class="ui-nums"><span class="ui-used" style="font-size:15px;">'+(mins>0?mins+'m ':'')+s+'s</span></div></div><div class="usage-item"><div class="ui-label">Credits</div><div class="ui-nums"><span class="ui-used">'+(total*10)+'</span></div></div></div>';if(ed){var html='';var sceneIdx=0;(APP_SCENES.data.discussions||[]).forEach(function(d,di){html+='<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:500;color:var(--blue);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px;">'+d.sectionTitle+'</div>';(d.scenes||[]).forEach(function(s,si){var idx=sceneIdx++;html+='<div style="margin-bottom:8px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span class="scene-num" style="font-size:10px;">SCENE '+String(s.sceneNumber).padStart(3,'0')+'</span></div><textarea id="scene-edit-'+idx+'" style="width:100%;padding:8px 10px;border-radius:7px;font-size:13px;font-family:\'DM Mono\',monospace;border:0.5px solid var(--bdr2);background:var(--white);color:var(--ink);line-height:1.5;resize:vertical;" rows="2" onchange="updateSceneScript('+di+','+si+',this.value)">'+s.presenterA+'</textarea></div>';});html+='</div>';});ed.innerHTML=html;}}
function updateSceneScript(di,si,val){if(APP_SCENES.data&&APP_SCENES.data.discussions[di]&&APP_SCENES.data.discussions[di].scenes[si])APP_SCENES.data.discussions[di].scenes[si].presenterA=val;}

// ── RENDER ────────────────────────────────────────────────────────────────────
var RENDER={scenes:[],voiceData:{},videoData:{},stitchUrl:null,lastRenderId:null};
function startRender(){if(!APP_SCENES.data){showToast('Generate scenes first.','error');nav('scenes-pg');return;}STUDIO.voiceId=document.getElementById('studio-voice').value;STUDIO.stability=document.getElementById('studio-stab').value/100;STUDIO.similarityBoost=document.getElementById('studio-sim').value/100;STUDIO.musicVol=parseInt(document.getElementById('music-vol').value||30);STUDIO.musicDuck=parseInt(document.getElementById('music-duck').value||15);STUDIO.sidechain=document.getElementById('music-sidechain').checked;var totalScenes=0;(APP_SCENES.data.discussions||[]).forEach(function(d){totalScenes+=(d.scenes||[]).length;});var credits=totalScenes*10;CREDITS.remaining=Math.max(0,(CREDITS.remaining||0)-credits);CREDITS.used=(CREDITS.used||0)+credits;saveCredits();loadCreditsDisplay();RENDER.scenes=[];RENDER.stitchUrl=null;RENDER.lastRenderId=null;window._runwayLimitHit=false;(APP_SCENES.data.discussions||[]).forEach(function(d){(d.scenes||[]).forEach(function(s){RENDER.scenes.push({sceneNumber:s.sceneNumber,section:d.sectionTitle,script:s.presenterA||'',type:s.type||'Explanation',visualPrompt:(STUDIO.avatarAImage?'The person in the reference photo, ':'')+(AVATARS[STUDIO.avatarA]?AVATARS[STUDIO.avatarA].name+' professional presenter, ':'')+s.visualPrompt+', '+STUDIO.bgPrompt,overlayText:s.overlayText||null,duration:s.duration||8,voiceDone:false,videoDone:false,error:null,audioBase64:null,videoUrl:null});});});nav('render-pg');buildRenderQueue();runRender();}
function buildRenderQueue(){var total=RENDER.scenes.length;['rq-total','rq-voice','rq-video','rq-stitch','rq-failed'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=id==='rq-total'?total:id==='rq-stitch'?'—':'0';});document.getElementById('render-status-text').textContent='Rendering '+total+' scenes...';document.getElementById('render-export-btn').style.display='none';document.getElementById('render-scene-grid').innerHTML=RENDER.scenes.map(function(s,i){return'<div class="render-scene-item" id="rsi-'+i+'"><div class="rsi-header"><span class="rsi-num">SCENE '+String(s.sceneNumber).padStart(3,'0')+'</span><span class="badge b-gold" style="font-size:10px;">'+s.type+'</span><span class="rsi-status rsi-pending" id="rsi-status-'+i+'">Pending</span></div><div class="rsi-script">'+s.script.slice(0,70)+(s.script.length>70?'...':'')+'</div><div class="rsi-progress"><div class="rsi-fill" id="rsi-fill-'+i+'" style="width:0%;"></div></div></div>';}).join('');}
async function runRender(){var voiceDone=0,videoDone=0,failed=0,total=RENDER.scenes.length;for(var i=0;i<total;i+=3){var batch=RENDER.scenes.slice(i,Math.min(i+3,total)),bIdx=i;await Promise.all(batch.map(function(scene,bi){var idx=bIdx+bi;return renderScene(scene,idx).catch(function(e){scene.error=e.message;updateRSI(idx,'Error','rsi-error',0);}).then(function(){if(scene.error)failed++;else{if(scene.voiceDone)voiceDone++;if(scene.videoDone)videoDone++;}var el=document.getElementById('rq-voice');if(el)el.textContent=voiceDone;var ev=document.getElementById('rq-video');if(ev)ev.textContent=videoDone;var ef=document.getElementById('rq-failed');if(ef)ef.textContent=failed;var pct=Math.round(((voiceDone+videoDone)/(total*2))*100);var pr=document.getElementById('render-pct');if(pr)pr.textContent=pct+'%';var fill=document.getElementById('render-total-fill');if(fill)fill.style.width=pct+'%';});}));}var vc=RENDER.scenes.filter(function(s){return s.voiceDone;}).length;if(vc===0){document.getElementById('render-status-text').textContent='All scenes failed.';document.getElementById('render-export-btn').style.display='';return;}document.getElementById('render-status-text').textContent=vc+'/'+total+' voice scenes ready. Stitching...';document.getElementById('stitch-status').style.display='block';var rs=document.getElementById('rq-stitch');if(rs)rs.textContent='Working';await stitchWithCreatomate();}
async function renderScene(scene,idx){updateRSI(idx,'Voice...','rsi-voice',20);try{var vr=await fetch('https://aabstudio-production.up.railway.app/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:scene.script,voiceId:STUDIO.voiceId,stability:STUDIO.stability,similarityBoost:STUDIO.similarityBoost})});if(!vr.ok)throw new Error('Voice HTTP '+vr.status);var vd=await vr.json();if(!vd.audio)throw new Error('No audio returned');scene.audioBase64=vd.audio;scene.voiceDone=true;if(!window._runwayLimitHit){updateRSI(idx,'Video...','rsi-video',50);try{var ratioMap={'16:9':'1280:768','9:16':'768:1280','1:1':'1024:1024'};var videoR=await fetch('https://aabstudio-production.up.railway.app/api/video/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:scene.visualPrompt,duration:8,ratio:ratioMap[STUDIO.outputFormat]||'1280:768',referenceImageBase64:STUDIO.avatarAImage||null})});if(videoR.status===429){window._runwayLimitHit=true;showToast('Video generation limit reached. Remaining scenes will be voice-only.','warning');}else if(videoR.ok){var vdata=await videoR.json();if(vdata.taskId){var done=false,att=0;while(!done&&att<40){await new Promise(function(r){setTimeout(r,3000);});try{var sr=await fetch('https://aabstudio-production.up.railway.app/api/video/status/'+vdata.taskId);if(sr.ok){var sd=await sr.json();updateRSI(idx,'Video '+Math.round((sd.progress||0)*100)+'%','rsi-video',50+Math.round((sd.progress||0)*40));if(sd.status==='SUCCEEDED'&&sd.videoUrl){scene.videoUrl=sd.videoUrl;scene.videoDone=true;done=true;}else if(sd.status==='FAILED')done=true;}}catch(pe){}att++;}}}}catch(ve){}}updateRSI(idx,'Done','rsi-done',100);}catch(e){scene.error=e.message;updateRSI(idx,'Error','rsi-error',0);throw e;}}
function updateRSI(idx,label,cls,pct){var s=document.getElementById('rsi-status-'+idx),f=document.getElementById('rsi-fill-'+idx);if(s){s.className='rsi-status '+cls;s.textContent=label.slice(0,22);}if(f){f.style.width=pct+'%';f.style.background=cls==='rsi-done'?'var(--green)':cls==='rsi-error'?'var(--red)':'var(--blue)';}}
async function stitchWithCreatomate(){try{var scenes=RENDER.scenes.filter(function(s){return s.voiceDone;}).map(function(s){return{videoUrl:s.videoUrl||null,audioBase64:s.audioBase64,duration:s.duration||8,overlayText:s.overlayText||null,type:s.type};});var mc=STUDIO.musicAudioBase64?{audioBase64:STUDIO.musicAudioBase64,volume:STUDIO.musicVol,duckLevel:STUDIO.musicDuck,sidechain:STUDIO.sidechain}:null;document.getElementById('stitch-status-text').textContent='Sending '+scenes.length+' scenes to Creatomate...';var r=await fetch('https://aabstudio-production.up.railway.app/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenes:scenes,studioConfig:{bgColor:'#1a3a5c'},musicConfig:mc,outputFormat:STUDIO.outputFormat||'16:9'})});var d=await r.json();if(d.renderId){RENDER.lastRenderId=d.renderId;localStorage.setItem('aab_last_render_id',d.renderId);var rs=document.getElementById('rq-stitch');if(rs)rs.textContent='Rendering';document.getElementById('stitch-status-text').textContent='Creatomate processing...';await pollCreatomate(d.renderId);}else{document.getElementById('stitch-status-text').textContent='Stitch failed: '+(d.error||'Unknown error');var rs2=document.getElementById('rq-stitch');if(rs2)rs2.textContent='Failed';document.getElementById('render-export-btn').style.display='';}}catch(e){document.getElementById('stitch-status-text').textContent='Error: '+e.message;document.getElementById('render-export-btn').style.display='';}}
async function pollCreatomate(id){var att=0;while(att<90){await new Promise(function(r){setTimeout(r,4000);});try{var r=await fetch('https://aabstudio-production.up.railway.app/api/render/status/'+id);var d=await r.json();var pct=Math.round((d.progress||0)*100);var sf=document.getElementById('stitch-fill');if(sf)sf.style.width=pct+'%';var st=document.getElementById('stitch-status-text');if(st)st.textContent='Stitching... '+pct+'%';if(d.status==='succeeded'&&d.url){RENDER.stitchUrl=d.url;var rs=document.getElementById('rq-stitch');if(rs)rs.textContent='Done';var rtxt=document.getElementById('render-status-text');if(rtxt)rtxt.textContent='Render complete ✓';if(st)st.textContent='Final video ready!';document.getElementById('render-export-btn').style.display='';showFinalVideo(d.url);showToast('Video ready! Go to Export Centre.','success');return;}if(d.status==='failed'){if(st)st.textContent='Failed: '+(d.error||'unknown');var rs2=document.getElementById('rq-stitch');if(rs2)rs2.textContent='Failed';document.getElementById('render-export-btn').style.display='';return;}}catch(e){}att++;}document.getElementById('stitch-status-text').textContent='Timed out.';document.getElementById('render-export-btn').style.display='';}
function showFinalVideo(url){var w=document.getElementById('final-video-wrap'),v=document.getElementById('final-video'),b=document.getElementById('final-download-btn');if(w)w.style.display='block';if(v)v.src=url;if(b)b.href=url;}
async function checkPreviousRender(){if(RENDER.stitchUrl){showFinalVideo(RENDER.stitchUrl);return;}var lastId=RENDER.lastRenderId||localStorage.getItem('aab_last_render_id');if(!lastId)return;try{var r=await fetch('https://aabstudio-production.up.railway.app/api/render/check/'+lastId);if(!r.ok)return;var d=await r.json();if(d.status==='succeeded'&&d.url){RENDER.stitchUrl=d.url;showFinalVideo(d.url);showToast('Previous render loaded.','success');}else if(d.status==='rendering'||d.status==='planned'){showToast('Previous render still processing...','warning');pollCreatomate(lastId);}}catch(e){}}

// ── EXPORT ────────────────────────────────────────────────────────────────────
async function generatePlatformMeta(platform){if(!APP.lastReport){showToast('No report.','error');return;}var panel=document.getElementById('export-meta-panel');panel.style.display='block';document.getElementById('meta-platform-title').textContent=platform.charAt(0).toUpperCase()+platform.slice(1)+' metadata';document.getElementById('meta-loading').style.display='block';document.getElementById('meta-content').innerHTML='';try{var r=await fetch('https://aabstudio-production.up.railway.app/api/export/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport,platform:platform})});var data=await r.json();document.getElementById('meta-loading').style.display='none';var html='';if(data.title)html+='<div class="meta-field"><label>Title</label><div class="meta-value" id="meta-title">'+data.title+'</div><button class="meta-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById(\'meta-title\').textContent).then(function(){showToast(\'Copied\',\'success\')})">Copy</button></div>';if(data.description)html+='<div class="meta-field"><label>Description</label><div class="meta-value" id="meta-desc">'+data.description+'</div><button class="meta-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById(\'meta-desc\').textContent).then(function(){showToast(\'Copied\',\'success\')})">Copy</button></div>';if(data.hashtags&&data.hashtags.length){var ht=data.hashtags.map(function(h){return'#'+h;}).join(' ');html+='<div class="meta-field"><label>Hashtags</label><div class="meta-value" id="meta-tags">'+ht+'</div><button class="meta-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById(\'meta-tags\').textContent).then(function(){showToast(\'Copied\',\'success\')})">Copy</button></div>';}document.getElementById('meta-content').innerHTML=html||'<div style="font-size:13px;color:var(--muted);">No metadata generated.</div>';}catch(e){document.getElementById('meta-loading').style.display='none';document.getElementById('meta-content').innerHTML='<div style="font-size:13px;color:var(--red);">Error: '+e.message+'</div>';}}
function downloadExport(platform){if(RENDER.stitchUrl){showFinalVideo(RENDER.stitchUrl);showToast('Video ready for '+platform+'!','success');}else showToast('Complete the render first.','error');}
function rerenderDifferentFormat(){nav('studio-pg');showToast('Choose a format and click Estimate cost & render.','warning');}

// ── HUMAN RECORDING ───────────────────────────────────────────────────────────
var REC={stream:null,recorder:null,recording:false,currentScene:0,clips:{},timer:null,elapsed:0,allScenes:[]};
function initRecordingPage(){if(!APP_SCENES.data)return;var scenes=[];(APP_SCENES.data.discussions||[]).forEach(function(d){(d.scenes||[]).forEach(function(s){scenes.push({script:s.presenterA||'',section:d.sectionTitle,num:s.sceneNumber});});});REC.allScenes=scenes;REC.currentScene=0;var rt=document.getElementById('rec-total'),rd=document.getElementById('rec-done');if(rt)rt.textContent=scenes.length;if(rd)rd.textContent='0';renderRecordingList();updateTeleprompter();}
function renderRecordingList(){var el=document.getElementById('record-scene-list');if(!el)return;el.innerHTML=(REC.allScenes||[]).map(function(s,i){var done=!!REC.clips[i];return'<div style="padding:8px 10px;border-radius:8px;margin-bottom:3px;cursor:pointer;background:'+(i===REC.currentScene?'rgba(26,58,92,.06)':'transparent')+';" onclick="jumpRecScene('+i+')">'+'<div style="display:flex;align-items:center;gap:7px;"><div style="width:20px;height:20px;border-radius:5px;background:'+(done?'var(--green-bg)':'var(--warm)')+';display:flex;align-items:center;justify-content:center;font-size:10px;color:'+(done?'var(--green)':'var(--muted)')+'">'+(done?'✓':(i+1))+'</div><div style="font-size:12px;color:var(--muted);">Scene '+(i+1)+'</div></div></div>';}).join('');}
function updateTeleprompter(){var s=(REC.allScenes||[])[REC.currentScene],tp=document.getElementById('rec-teleprompter'),lbl=document.getElementById('rec-scene-label');if(tp)tp.textContent=s?s.script:'Select a scene to begin';if(lbl)lbl.textContent='Scene '+(REC.currentScene+1)+' of '+(REC.allScenes||[]).length;}
function jumpRecScene(i){REC.currentScene=i;renderRecordingList();updateTeleprompter();}
function recNext(){if(REC.allScenes&&REC.currentScene<REC.allScenes.length-1){REC.currentScene++;renderRecordingList();updateTeleprompter();}}
function recPrev(){if(REC.currentScene>0){REC.currentScene--;renderRecordingList();updateTeleprompter();}}
async function toggleCamera(){var btn=document.getElementById('cam-btn'),rb=document.getElementById('rec-btn');if(REC.stream){REC.stream.getTracks().forEach(function(t){t.stop();});REC.stream=null;document.getElementById('camera-preview').srcObject=null;btn.textContent='📷 Camera';if(rb)rb.disabled=true;}else{try{REC.stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});document.getElementById('camera-preview').srcObject=REC.stream;btn.textContent='📷 Stop camera';if(rb)rb.disabled=false;}catch(e){showToast('Camera access denied: '+e.message,'error');}}}
function toggleRecording(){var btn=document.getElementById('rec-btn'),ind=document.getElementById('rec-indicator');if(!REC.recording){if(!REC.stream){showToast('Start camera first','error');return;}REC.recorder=new MediaRecorder(REC.stream);var chunks=[];REC.recorder.ondataavailable=function(e){chunks.push(e.data);};REC.recorder.onstop=function(){var blob=new Blob(chunks,{type:'video/webm'});REC.clips[REC.currentScene]=URL.createObjectURL(blob);var rd=document.getElementById('rec-done');if(rd)rd.textContent=Object.keys(REC.clips).length;renderRecordingList();showToast('Scene '+(REC.currentScene+1)+' recorded.','success');if(REC.currentScene<(REC.allScenes||[]).length-1)recNext();};REC.recorder.start();REC.recording=true;REC.elapsed=0;if(btn){btn.textContent='⏹ Stop';btn.style.background='rgba(192,57,43,.4)';}if(ind)ind.style.display='flex';REC.timer=setInterval(function(){REC.elapsed++;var m=Math.floor(REC.elapsed/60),s=REC.elapsed%60,rt=document.getElementById('rec-timer');if(rt)rt.textContent=m+':'+(s<10?'0':'')+s;},1000);}else{REC.recorder.stop();REC.recording=false;clearInterval(REC.timer);if(btn){btn.textContent='⏺ Record';btn.style.background='rgba(192,57,43,.2)';}if(ind)ind.style.display='none';var rt=document.getElementById('rec-timer');if(rt)rt.textContent='0:00';}}
function exportRecordedScenes(){if(!Object.keys(REC.clips).length){showToast('Record at least one scene.','error');return;}showToast(Object.keys(REC.clips).length+' scenes recorded.','success');nav('export-pg');}

// ── SPECIALIST MODES ──────────────────────────────────────────────────────────

// Shared specialist state
var SPECIALIST={
  earningsFile:null,earningsBase64:null,earningsMime:null,
  redlineFileA:null,redlineBase64A:null,redlineMimeA:null,
  redlineFileB:null,redlineBase64B:null,redlineMimeB:null,
  synthFiles:[null,null,null,null,null,null],
  synthBase64:[null,null,null,null,null,null],
  synthMime:[null,null,null,null,null,null],
  podDuration:5,
  audienceLevel:'public',
  charStyle:'realistic',
  cinePreset:'news'
};

var CINE_PREVIEWS={
  news:'Three-point lighting, slow push-in, neutral grade, broadcast studio.',
  documentary:'Single dramatic key light, handheld movement, cinematic grade, warm atmosphere.',
  cinematic:'Rembrandt lighting, anamorphic crop, teal-orange grade, filmic grain.',
  corporate:'Soft diffused lighting, static shot, clean white studio, bright grade.',
  investigative:'Hard side lighting, low-key exposure, cold tones, noir atmosphere.',
  academic:'Warm tungsten, stable medium shot, library background, scholarly feel.'
};

function pickCharStyle(el,style){
  document.querySelectorAll('#char-style-grid .d-opt').forEach(function(o){o.classList.remove('on');});
  el.classList.add('on');SPECIALIST.charStyle=style;
}
function pickCinePreset(el,preset){
  document.querySelectorAll('#cine-preset-grid .d-opt').forEach(function(o){o.classList.remove('on');});
  el.classList.add('on');SPECIALIST.cinePreset=preset;
  var prev=document.getElementById('cine-preview');
  if(prev)prev.textContent=CINE_PREVIEWS[preset]||'';
}
function pickPodDuration(el,mins){
  document.querySelectorAll('#podcast-pg .d-opt').forEach(function(o){o.classList.remove('on');});
  el.classList.add('on');SPECIALIST.podDuration=mins;
}
function pickAudienceLevel(el,level){
  document.querySelectorAll('#lecture-pg .d-opt').forEach(function(o){o.classList.remove('on');});
  el.classList.add('on');SPECIALIST.audienceLevel=level;
}

// File handlers
function handleEarningsFile(inp){if(!inp.files.length)return;var f=inp.files[0];SPECIALIST.earningsFile=f;SPECIALIST.earningsMime=f.type;document.getElementById('uz-earn').classList.add('has-file');document.getElementById('uz-earn-title').textContent='✓ '+f.name;document.getElementById('earn-pill').innerHTML='<div style="font-size:13px;color:var(--green);margin-bottom:12px;"><strong>'+f.name+'</strong> ready</div>';var rd=new FileReader();rd.onload=function(e){var d=e.target.result;SPECIALIST.earningsBase64=d.split(',')[1]||d;};rd.readAsDataURL(f);}
function handleRedlineFile(slot,inp){if(!inp.files.length)return;var f=inp.files[0];var rd=new FileReader();rd.onload=function(e){var b64=(e.target.result).split(',')[1]||(e.target.result);if(slot==='a'){SPECIALIST.redlineFileA=f;SPECIALIST.redlineBase64A=b64;SPECIALIST.redlineMimeA=f.type;document.getElementById('uz-rl-a').classList.add('has-file');document.getElementById('uz-rl-a-title').textContent='✓ '+f.name;}else{SPECIALIST.redlineFileB=f;SPECIALIST.redlineBase64B=b64;SPECIALIST.redlineMimeB=f.type;document.getElementById('uz-rl-b').classList.add('has-file');document.getElementById('uz-rl-b-title').textContent='✓ '+f.name;}};rd.readAsDataURL(f);}
function handleSynthFile(idx,inp){if(!inp.files.length)return;var f=inp.files[0];SPECIALIST.synthFiles[idx]=f;SPECIALIST.synthMime[idx]=f.type;document.getElementById('sz-'+idx).textContent='✓ '+f.name;document.getElementById('uz-s'+idx).classList.add('has-file');var rd=new FileReader();rd.onload=function(e){SPECIALIST.synthBase64[idx]=(e.target.result).split(',')[1]||(e.target.result);};rd.readAsDataURL(f);}

// Runner functions
async function runEarnings(){
  if(!SPECIALIST.earningsBase64){showToast('Upload an earnings document first.','error');return;}
  var btn=document.querySelector('#earnings-pg .full-btn');btn.textContent='Analysing...';btn.disabled=true;
  try{
    var r=await fetch('https://aabstudio-production.up.railway.app/api/earnings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileBase64:SPECIALIST.earningsBase64,mimeType:SPECIALIST.earningsMime,fileName:SPECIALIST.earningsFile?.name,ticker:document.getElementById('earn-ticker').value.trim()})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json();if(d.error)throw new Error(d.error);
    renderEarningsResults(d);
  }catch(e){showToast('Earnings analysis failed: '+e.message,'error');}
  btn.textContent='Analyse earnings →';btn.disabled=false;
}
function renderEarningsResults(d){
  var el=document.getElementById('earn-results');el.style.display='block';
  var html='<div class="rpt-title">'+d.headline+'</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0;">';
  var metrics=[['Revenue',d.keyMetrics?.revenue],['EPS',d.keyMetrics?.eps],['Gross Margin',{reported:d.keyMetrics?.grossMargin}],['Guidance',{reported:d.keyMetrics?.guidance}]];
  metrics.forEach(function(m){if(!m[1])return;var beat=m[1].beat;html+='<div style="background:'+(beat===true?'var(--green-bg)':beat===false?'var(--red-bg)':'var(--off-white)')+';border-radius:var(--radius);padding:12px;text-align:center;border:0.5px solid var(--bdr);"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:4px;">'+m[0]+'</div><div style="font-size:18px;font-weight:600;color:var(--blue);">'+m[1].reported+'</div>'+(m[1].estimate?'<div style="font-size:11px;color:var(--muted);">Est: '+m[1].estimate+'</div>':'')+(beat!==undefined?'<div style="font-size:11px;font-weight:600;color:'+(beat?'var(--green)':'var(--red)')+'">'+(beat?'BEAT':'MISS')+'</div>':'')+'</div>';});
  html+='</div>';
  if(d.sentimentScore!==undefined){var sc=d.sentimentScore;html+='<div style="background:var(--off-white);border-radius:var(--radius);padding:14px;margin-bottom:14px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:8px;">Management sentiment</div><div style="display:flex;align-items:center;gap:12px;"><div style="flex:1;height:8px;background:var(--bdr2);border-radius:4px;overflow:hidden;"><div style="height:100%;width:'+(50+sc/2)+'%;background:'+(sc>20?'var(--green)':sc<-20?'var(--red)':'var(--amber)')+';border-radius:4px;"></div></div><span style="font-size:13px;font-weight:500;color:'+(sc>20?'var(--green)':sc<-20?'var(--red)':'var(--amber)')+'">'+d.managementTone+'</span></div></div>';}
  if(d.sixtySecondSummary)html+='<div class="ev-quote" style="margin-bottom:14px;">'+d.sixtySecondSummary+'</div>';
  if(d.socialCaption)html+='<div style="background:var(--teal-light);border:0.5px solid rgba(13,115,119,.2);border-radius:var(--radius);padding:12px 14px;margin-bottom:14px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--teal);margin-bottom:4px;">Social caption</div><div style="font-size:13px;color:var(--ink-mid);">'+d.socialCaption+'</div></div>';
  el.innerHTML=html;
}

async function runRedline(){
  if(!SPECIALIST.redlineBase64A||!SPECIALIST.redlineBase64B){showToast('Upload both contract versions first.','error');return;}
  var btn=document.querySelector('#redline-pg .full-btn');btn.textContent='Analysing...';btn.disabled=true;
  try{
    var r=await fetch('https://aabstudio-production.up.railway.app/api/redline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({docABase64:SPECIALIST.redlineBase64A,docAMime:SPECIALIST.redlineMimeA,docAName:SPECIALIST.redlineFileA?.name,docBBase64:SPECIALIST.redlineBase64B,docBMime:SPECIALIST.redlineMimeB,docBName:SPECIALIST.redlineFileB?.name})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json();if(d.error)throw new Error(d.error);
    renderRedlineResults(d);
  }catch(e){showToast('Redline failed: '+e.message,'error');}
  btn.textContent='Run legal redline →';btn.disabled=false;
}
function renderRedlineResults(d){
  var el=document.getElementById('redline-results');el.style.display='block';
  var colMap={RISK_INCREASED:'var(--red)',RISK_REDUCED:'var(--green)',NEW_OBLIGATION:'var(--amber)',REMOVED_PROTECTION:'var(--red)',NEUTRAL:'var(--muted)'};
  var bgMap={RISK_INCREASED:'var(--red-bg)',RISK_REDUCED:'var(--green-bg)',NEW_OBLIGATION:'var(--amber-bg)',REMOVED_PROTECTION:'var(--red-bg)',NEUTRAL:'var(--off-white)'};
  var html='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"><span class="badge '+(d.riskDelta==='increased'?'b-red':d.riskDelta==='decreased'?'b-green':'b-amber')+'">Risk '+(d.riskDelta||'assessed')+'</span>';
  if(d.overallRiskScore)html+='<span class="badge b-blue">Before: '+d.overallRiskScore.before+'/100</span><span class="badge '+(d.overallRiskScore.after>d.overallRiskScore.before?'b-red':'b-green')+'">After: '+d.overallRiskScore.after+'/100</span>';
  html+='</div>';
  if(d.summary)html+='<div class="rpt-body" style="margin-bottom:16px;">'+d.summary+'</div>';
  (d.changes||[]).forEach(function(c){html+='<div style="background:'+bgMap[c.type]+';border-left:3px solid '+colMap[c.type]+';border-radius:0 var(--radius) var(--radius) 0;padding:12px 14px;margin-bottom:8px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:10px;font-weight:700;color:'+colMap[c.type]+';">'+c.type.replace(/_/g,' ')+'</span><span class="badge '+(c.severity==='High'?'b-red':c.severity==='Medium'?'b-amber':'b-green')+'">'+c.severity+'</span></div><div style="font-size:12px;color:var(--muted);margin-bottom:4px;">'+c.clause+' — '+c.location+'</div>'+(c.before?'<div style="font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div style="padding:6px 8px;background:rgba(192,57,43,.08);border-radius:5px;font-family:\'DM Mono\',monospace;"><span style="color:var(--red);">Before: </span>'+c.before+'</div><div style="padding:6px 8px;background:rgba(26,122,74,.08);border-radius:5px;font-family:\'DM Mono\',monospace;"><span style="color:var(--green);">After: </span>'+c.after+'</div></div>':'')+'<div style="font-size:12px;color:var(--ink-mid);margin-top:6px;">'+c.impact+'</div></div>';});
  if(d.recommendation)html+='<div style="background:var(--teal-light);border:0.5px solid rgba(13,115,119,.2);border-radius:var(--radius);padding:12px 14px;margin-top:14px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--teal);margin-bottom:4px;">Recommendation</div><div style="font-size:13px;color:var(--ink-mid);">'+d.recommendation+'</div></div>';
  el.innerHTML=html;
}

async function runPodcast(){
  if(!APP.lastReport){document.getElementById('podcast-no-report').style.display='block';return;}
  var btn=document.querySelector('#podcast-pg .full-btn');btn.textContent='Generating...';btn.disabled=true;
  try{
    var r=await fetch('https://aabstudio-production.up.railway.app/api/podcast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport,hostAName:document.getElementById('pod-host-a').value||'Alex',hostBName:document.getElementById('pod-host-b').value||'Priya',duration:SPECIALIST.podDuration})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json();if(d.error)throw new Error(d.error);
    renderPodcastResults(d);
  }catch(e){showToast('Podcast generation failed: '+e.message,'error');}
  btn.textContent='Generate podcast →';btn.disabled=false;
}
function renderPodcastResults(d){
  var el=document.getElementById('podcast-results');el.style.display='block';
  var html='<div class="rpt-title">'+d.title+'</div><div class="rpt-sub">'+d.duration+' · '+d.chapterMarkers?.length+' chapters</div>';
  if(d.showNotes)html+='<div style="background:var(--off-white);border-radius:var(--radius);padding:14px;margin-bottom:16px;font-size:13px;color:var(--ink-mid);line-height:1.7;">'+d.showNotes+'</div>';
  (d.segments||[]).forEach(function(seg){
    html+='<div style="margin-bottom:20px;"><div style="font-size:13px;font-weight:600;color:var(--blue);margin-bottom:10px;text-transform:uppercase;letter-spacing:.4px;">'+seg.segmentTitle+'</div>';
    (seg.exchanges||[]).forEach(function(ex){
      var isA=ex.host===d.hostA||ex.host==='Alex';
      html+='<div style="display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;"><div style="width:52px;flex-shrink:0;font-size:11px;font-weight:600;color:'+(isA?'var(--blue)':'var(--teal)')+';padding-top:3px;">'+ex.host+'</div><div style="flex:1;background:'+(isA?'var(--blue-pale)':'var(--teal-light)')+';border-radius:0 var(--radius) var(--radius) 0;padding:10px 14px;font-size:13px;color:var(--ink-mid);line-height:1.6;">'+ex.line+'</div></div>';
    });
    html+='</div>';
  });
  if(d.chapterMarkers&&d.chapterMarkers.length){html+='<div class="divider"></div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:8px;">Chapter markers</div>';d.chapterMarkers.forEach(function(c){html+='<div style="font-size:13px;padding:4px 0;border-bottom:0.5px solid var(--bdr);"><span style="font-family:\'DM Mono\',monospace;color:var(--gold);margin-right:12px;">'+c.time+'</span>'+c.title+'</div>';});}
  el.innerHTML=html;
}

async function runSynthesis(){
  var docs=SPECIALIST.synthFiles.map(function(f,i){return f?{name:f.name,base64:SPECIALIST.synthBase64[i],mimeType:SPECIALIST.synthMime[i]}:null;}).filter(Boolean);
  if(docs.length<2){showToast('Upload at least 2 documents.','error');return;}
  var req=document.getElementById('synth-req').value.trim()||'Synthesise all documents and find cross-document patterns and contradictions';
  var btn=document.querySelector('#synthesis-pg .full-btn');btn.textContent='Synthesising...';btn.disabled=true;
  try{
    var r=await fetch('https://aabstudio-production.up.railway.app/api/synthesise',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documents:docs,request:req,depth:'deep'})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json();if(d.error)throw new Error(d.error);
    APP.lastReport=d;buildReport(d);nav('report-pg');
  }catch(e){showToast('Synthesis failed: '+e.message,'error');}
  btn.textContent='Run synthesis →';btn.disabled=false;
}

async function runContradictions(){
  if(!APP.lastReport){document.getElementById('contradict-no-report').style.display='block';return;}
  var btn=document.querySelector('#contradict-pg .full-btn');btn.textContent='Scanning...';btn.disabled=true;
  try{
    var r=await fetch('https://aabstudio-production.up.railway.app/api/contradictions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json();if(d.error)throw new Error(d.error);
    renderContradictResults(d);
  }catch(e){showToast('Contradiction scan failed: '+e.message,'error');}
  btn.textContent='Scan for contradictions →';btn.disabled=false;
}
function renderContradictResults(d){
  var el=document.getElementById('contradict-results');el.style.display='block';
  var score=d.consistencyScore||100;
  var scoreCol=score>80?'var(--green)':score>60?'var(--amber)':'var(--red)';
  var html='<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;"><div style="text-align:center;"><div style="font-family:\'Cormorant Garamond\',serif;font-size:52px;font-weight:600;color:'+scoreCol+';">'+score+'</div><div style="font-size:11px;text-transform:uppercase;color:var(--muted);">Consistency score</div></div><div style="flex:1;font-size:14px;color:var(--ink-mid);line-height:1.7;">'+d.summary+'</div></div>';
  if(!d.contradictions||!d.contradictions.length){html+='<div style="background:var(--green-bg);border:0.5px solid rgba(26,122,74,.2);border-radius:var(--radius);padding:16px;font-size:14px;color:var(--green);">No internal contradictions detected.</div>';}
  else{(d.contradictions||[]).forEach(function(c,i){var sc=c.severity==='High'?'var(--red-bg)':c.severity==='Medium'?'var(--amber-bg)':'var(--off-white)';html+='<div style="background:'+sc+';border-radius:var(--radius);padding:14px;margin-bottom:10px;border:0.5px solid var(--bdr);"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--gold);">CONTRADICTION '+(i+1)+'</span><span class="badge '+(c.severity==='High'?'b-red':c.severity==='Medium'?'b-amber':'b-green')+'">'+c.severity+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;"><div style="padding:8px;background:rgba(255,255,255,.7);border-radius:6px;font-size:12px;"><div style="font-weight:600;color:var(--muted);margin-bottom:3px;">'+c.locationA+'</div><div style="color:var(--ink-mid);">'+c.clauseA+'</div></div><div style="padding:8px;background:rgba(255,255,255,.7);border-radius:6px;font-size:12px;"><div style="font-weight:600;color:var(--muted);margin-bottom:3px;">'+c.locationB+'</div><div style="color:var(--ink-mid);">'+c.clauseB+'</div></div></div><div style="font-size:12px;color:var(--ink-mid);">'+c.explanation+'</div></div>';});}
  el.innerHTML=html;
}

async function runLecture(){
  if(!APP.lastReport){showToast('Run an analysis first.','error');nav('analysis-pg');return;}
  var btn=document.querySelector('#lecture-pg .full-btn');btn.textContent='Generating...';btn.disabled=true;
  try{
    var r=await fetch('https://aabstudio-production.up.railway.app/api/lecture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report:APP.lastReport,audienceLevel:SPECIALIST.audienceLevel,includeQA:document.getElementById('lec-qa').checked})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json();if(d.error)throw new Error(d.error);
    renderLectureResults(d);
  }catch(e){showToast('Lecture generation failed: '+e.message,'error');}
  btn.textContent='Generate lecture →';btn.disabled=false;
}
function renderLectureResults(d){
  var el=document.getElementById('lecture-results');el.style.display='block';
  var html='<div class="rpt-title">'+d.lectureTitle+'</div><div class="rpt-sub">'+d.audienceLevel+' · '+d.estimatedDuration+'</div>';
  if(d.learningObjectives&&d.learningObjectives.length){html+='<div style="background:var(--blue-pale);border-radius:var(--radius);padding:14px;margin-bottom:16px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--blue);margin-bottom:8px;">Learning objectives</div>'+d.learningObjectives.map(function(o){return'<div style="font-size:13px;color:var(--ink-mid);padding:3px 0;display:flex;gap:7px;"><span style="color:var(--blue);">→</span>'+o+'</div>';}).join('')+'</div>';}
  (d.sections||[]).forEach(function(s,i){html+='<div style="margin-bottom:20px;"><div class="rpt-sec-hd"><span class="rpt-sec-num">0'+(i+1)+'</span><span class="rpt-sec-title">'+s.title+'</span></div><div style="background:var(--off-white);border-left:3px solid var(--blue);padding:12px 14px;margin-bottom:8px;font-size:13px;color:var(--ink-mid);font-family:\'DM Mono\',monospace;line-height:1.7;">'+s.presenterScript+'</div>'+(s.keyPoints&&s.keyPoints.length?'<div style="font-size:12px;color:var(--muted);">Key points: '+s.keyPoints.join(' · ')+'</div>':'')+'</div>';});
  if(d.qaSection&&d.qaSection.length){html+='<div class="divider"></div><div style="font-size:15px;font-weight:500;color:var(--blue);margin-bottom:14px;">Student Q&amp;A</div>';d.qaSection.forEach(function(qa){html+='<div style="margin-bottom:14px;"><div style="font-size:13px;font-weight:600;color:var(--blue);margin-bottom:5px;">Q: '+qa.question+'</div><div style="font-size:13px;color:var(--ink-mid);line-height:1.7;padding-left:14px;border-left:2px solid var(--gold);">'+qa.answer+'</div></div>';});}
  el.innerHTML=html;
}

// ── SUPABASE SESSION INIT ─────────────────────────────────────────────────────
window.addEventListener('load',function(){var supa=getSupa();if(!supa)return;supa.auth.getSession().then(function(result){if(result.data&&result.data.session){var u=result.data.session.user;APP.user={id:u.id,name:u.user_metadata&&u.user_metadata.name?u.user_metadata.name:u.email.split('@')[0],email:u.email};updateNav();loadCreditsDisplay();var params=new URLSearchParams(window.location.search);if(params.get('checkout')==='success'){history.replaceState(null,'','/');nav('dashboard-pg');setTimeout(function(){showToast('Payment successful!','success');},600);}else if(params.get('checkout')==='cancelled'){history.replaceState(null,'','/');nav('pricing-pg');}else nav('dashboard-pg');}else{loadCreditsDisplay();}});supa.auth.onAuthStateChange(function(event,session){if(event==='SIGNED_IN'&&session){var u=session.user;APP.user={id:u.id,name:u.user_metadata&&u.user_metadata.name?u.user_metadata.name:u.email.split('@')[0],email:u.email};updateNav();loadCreditsDisplay();}if(event==='SIGNED_OUT'){APP.user=null;APP.projects=[];updateNav();}});});
</script>
</body>
</html>
