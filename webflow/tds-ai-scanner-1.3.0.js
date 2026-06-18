/**
 * TDS AI Visibility Scanner — Webflow Embed v1.3.0
 * Mobile-first responsive design. Drop <div id="tds-ai-scanner"></div> anywhere.
 * Auto-mounts to body if div is not present on the page.
 *
 * v1.3.0 — full-page dark gradient background, glow orbs, AI trust bar,
 *           vertically-centered layout. Widget now owns the full viewport.
 * v1.2.0 — fix grade map (Partially/Fully/Mostly/Not Ready), fix category
 *           labels (ai_readiness → "AI Readiness", informational support),
 *           grade band label under badge, DaisyUI-inspired CSS refresh.
 */
(function () {
  'use strict';

  var N8N_TEASER = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-teaser';
  var N8N_POLL   = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-poll';
  var N8N_GATE   = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-gate';
  var N8N_RESULT = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-public-result';

  var POLL_INTERVAL = 3000;
  var POLL_MAX = 40;

  // Full grade map — includes engine text grades + letter grades
  var GRADES = {
    'AI-Ready':        { color: '#0d9488', glow: 'rgba(13,148,136,.28)', label: 'A★', band: 'AI-Ready' },
    'Fully Ready':     { color: '#0d9488', glow: 'rgba(13,148,136,.28)', label: 'A',  band: 'Fully Ready' },
    'Mostly Ready':    { color: '#2563eb', glow: 'rgba(37,99,235,.28)',  label: 'B',  band: 'Mostly Ready' },
    'Partially Ready': { color: '#d97706', glow: 'rgba(217,119,6,.28)',  label: 'C',  band: 'Partially Ready' },
    'Not Ready':       { color: '#dc2626', glow: 'rgba(220,38,38,.28)',  label: 'D',  band: 'Not Ready' },
    'A':               { color: '#0d9488', glow: 'rgba(13,148,136,.28)', label: 'A',  band: 'Excellent' },
    'B':               { color: '#2563eb', glow: 'rgba(37,99,235,.28)',  label: 'B',  band: 'Good' },
    'C':               { color: '#d97706', glow: 'rgba(217,119,6,.28)',  label: 'C',  band: 'Fair' },
    'D':               { color: '#dc2626', glow: 'rgba(220,38,38,.28)',  label: 'D',  band: 'Poor' },
    'F':               { color: '#991b1b', glow: 'rgba(153,27,27,.28)',  label: 'F',  band: 'Critical' },
    'Not Found':       { color: '#6b7280', glow: 'rgba(107,114,128,.2)', label: '?',  band: 'Not Found' }
  };

  // Matches actual engine category keys
  var CATEGORY_LABELS = {
    ai_readiness:    'AI Readiness',
    ai_presence:     'AI Presence',
    local_seo:       'Local SEO',
    structured_data: 'Structured Data',
    content_signals: 'Content & Authority',
    technical:       'Technical',
    informational:   'Informational'
  };

  var CATEGORY_ORDER = ['ai_readiness', 'ai_presence', 'local_seo', 'structured_data', 'content_signals', 'technical', 'informational'];

  var SCAN_STEPS = [
    'Querying ChatGPT & Perplexity for your practice…',
    'Checking Schema.org structured data…',
    'Scanning Google Business Profile signals…',
    'Analyzing content authority & reviews…',
    'Running technical checks (HTTPS, speed)…',
    'Compiling your AI visibility report…'
  ];

  // ─── CSS — DaisyUI-inspired design system ────────────────────────────────────

  var CSS = [
    /* ── Page-level: full-page background + centered layout ── */
    'html body{background:linear-gradient(155deg,#0c1445 0%,#0f1f5c 40%,#0b3d35 100%);min-height:100vh;margin:0;}',
    '#tds-ai-scanner{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;position:relative;overflow:hidden;}',
    /* Decorative glow orbs */
    '#tds-ai-scanner::before{content:"";position:fixed;top:-25%;left:-15%;width:70vw;height:70vw;background:radial-gradient(circle,rgba(37,99,235,.18) 0%,transparent 70%);pointer-events:none;z-index:0;border-radius:50%;}',
    '#tds-ai-scanner::after{content:"";position:fixed;bottom:-20%;right:-10%;width:55vw;height:55vw;background:radial-gradient(circle,rgba(13,148,136,.14) 0%,transparent 70%);pointer-events:none;z-index:0;border-radius:50%;}',
    /* Trust bar */
    '.tds-trust-bar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:18px;position:relative;z-index:1;}',
    '.tds-trust-label{font-size:11px;color:rgba(255,255,255,.38);font-weight:500;letter-spacing:.05em;text-transform:uppercase;width:100%;text-align:center;margin-bottom:6px;}',
    '.tds-trust-badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,.6);font-weight:500;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:99px;padding:5px 13px;}',
    /* Scoped reset */
    '#tds-ai-scanner *,#tds-ai-scanner *::before,#tds-ai-scanner *::after{',
    '  box-sizing:border-box;',
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;',
    '}',

    /* Card — DaisyUI card-inspired */
    '.tds-card{',
    '  background:#fff;border-radius:20px;',
    '  box-shadow:0 4px 6px -1px rgba(0,0,0,.07),0 2px 4px -1px rgba(0,0,0,.04),0 0 0 1px rgba(0,0,0,.04);',
    '  padding:28px 22px;margin-bottom:16px;',
    '  animation:tds-fade-up .35s ease both;',
    '  position:relative;z-index:1;width:100%;',
    '}',
    '@media(min-width:640px){.tds-card{padding:40px;}}',
    '@keyframes tds-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',

    /* Hero icon */
    '.tds-hero-icon{',
    '  width:52px;height:52px;border-radius:14px;',
    '  background:linear-gradient(135deg,#2563eb,#0d9488);',
    '  display:flex;align-items:center;justify-content:center;',
    '  font-size:26px;margin:0 0 18px;',
    '}',
    '.tds-headline{font-size:21px;font-weight:800;color:#0f172a;margin:0 0 10px;line-height:1.25;}',
    '@media(min-width:640px){.tds-headline{font-size:27px;}}',
    '.tds-sub{font-size:15px;color:#64748b;margin:0 0 22px;line-height:1.65;}',

    /* Pills — DaisyUI badge-inspired */
    '.tds-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;}',
    '.tds-pill{',
    '  display:inline-flex;align-items:center;gap:5px;',
    '  background:#f1f5f9;color:#475569;',
    '  font-size:12px;font-weight:600;padding:4px 10px;border-radius:99px;',
    '  border:1px solid #e2e8f0;',
    '}',

    /* Input */
    '.tds-input-wrap{position:relative;margin-bottom:12px;}',
    '.tds-input-icon{',
    '  position:absolute;left:14px;top:50%;transform:translateY(-50%);',
    '  color:#94a3b8;font-size:15px;pointer-events:none;line-height:1;',
    '}',
    '.tds-input{',
    '  width:100%;padding:14px 14px 14px 42px;',
    '  border:1.5px solid #e2e8f0;border-radius:12px;',
    '  font-size:15px;color:#0f172a;background:#f8fafc;',
    '  outline:none;transition:border-color .2s,box-shadow .2s,background .2s;',
    '}',
    '.tds-input:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,.12);}',
    '.tds-input::placeholder{color:#94a3b8;}',

    /* Button — DaisyUI btn-primary inspired */
    '.tds-btn{',
    '  display:flex;align-items:center;justify-content:center;gap:8px;',
    '  width:100%;padding:14px 24px;',
    '  background:#2563eb;',
    '  color:#fff;font-size:15px;font-weight:700;',
    '  border:none;border-radius:12px;cursor:pointer;',
    '  box-shadow:0 4px 14px rgba(37,99,235,.30);',
    '  transition:background .15s,transform .15s,box-shadow .15s;',
    '  letter-spacing:.01em;',
    '}',
    '.tds-btn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.40);}',
    '.tds-btn:active:not(:disabled){transform:translateY(0);box-shadow:0 2px 8px rgba(37,99,235,.25);}',
    '.tds-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}',
    '.tds-error{color:#dc2626;font-size:13px;margin-top:8px;display:flex;align-items:center;gap:5px;}',

    /* Spinner */
    '.tds-spinner{',
    '  width:17px;height:17px;',
    '  border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;',
    '  border-radius:50%;animation:tds-spin .65s linear infinite;flex-shrink:0;',
    '}',
    '@keyframes tds-spin{to{transform:rotate(360deg)}}',

    /* Scan stage */
    '.tds-scan-hd{text-align:center;margin-bottom:28px;}',
    '.tds-scan-pulse{',
    '  width:68px;height:68px;border-radius:50%;',
    '  background:linear-gradient(135deg,#eff6ff,#dbeafe);',
    '  display:flex;align-items:center;justify-content:center;',
    '  margin:0 auto 14px;font-size:30px;position:relative;',
    '}',
    '.tds-scan-pulse::after{',
    '  content:"";position:absolute;inset:-7px;',
    '  border-radius:50%;border:2px solid #2563eb;opacity:.35;',
    '  animation:tds-ripple 1.6s ease-in-out infinite;',
    '}',
    '@keyframes tds-ripple{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.1);opacity:.1}}',
    '.tds-scan-domain{font-size:16px;font-weight:700;color:#0f172a;margin:0 0 3px;}',
    '.tds-scan-tag{font-size:13px;color:#64748b;margin:0;}',
    '.tds-steps{list-style:none;padding:0;margin:0 0 22px;}',
    '.tds-step{',
    '  display:flex;align-items:center;gap:11px;',
    '  padding:7px 0;font-size:13px;color:#cbd5e1;',
    '  transition:color .3s;',
    '}',
    '.tds-step-dot{',
    '  width:20px;height:20px;border-radius:50%;',
    '  border:2px solid #e2e8f0;flex-shrink:0;',
    '  display:flex;align-items:center;justify-content:center;',
    '  font-size:10px;transition:all .3s;',
    '}',
    '.tds-step--active{color:#2563eb;}',
    '.tds-step--active .tds-step-dot{border-color:#2563eb;background:#eff6ff;animation:tds-spin .9s linear infinite;}',
    '.tds-step--done{color:#0d9488;}',
    '.tds-step--done .tds-step-dot{border-color:#0d9488;background:#f0fdfa;color:#0d9488;}',
    '.tds-prog-track{height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin-bottom:6px;}',
    '.tds-prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#0d9488);transition:width .5s ease;}',
    '.tds-prog-label{font-size:11px;color:#94a3b8;text-align:right;}',

    /* Grade badge — DaisyUI stat-inspired */
    '.tds-grade-hero{display:flex;align-items:center;gap:20px;margin-bottom:22px;}',
    '.tds-grade-col{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;}',
    '.tds-grade-badge{',
    '  width:84px;height:84px;border-radius:50%;',
    '  display:flex;align-items:center;justify-content:center;',
    '  font-size:30px;font-weight:900;color:#fff;',
    '  box-shadow:0 8px 24px var(--tds-glow,rgba(0,0,0,.2));',
    '  letter-spacing:-1px;',
    '}',
    '@media(min-width:640px){.tds-grade-badge{width:100px;height:100px;font-size:36px;}}',
    '.tds-grade-sm{font-size:17px;letter-spacing:0;}',
    '@media(min-width:640px){.tds-grade-sm{font-size:21px;}}',
    /* Grade band label below badge */
    '.tds-grade-band{',
    '  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;',
    '  color:#fff;padding:2px 8px;border-radius:99px;white-space:nowrap;',
    '}',
    '.tds-practice{font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px;line-height:1.3;}',
    '@media(min-width:640px){.tds-practice{font-size:19px;}}',
    '.tds-score-num{font-size:24px;font-weight:800;margin:0 0 6px;color:var(--tds-color,#0f172a);}',
    '.tds-score-bar{height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin-bottom:8px;}',
    '.tds-score-fill{height:100%;border-radius:99px;transition:width .9s ease;}',
    '.tds-pf-row{display:flex;gap:14px;font-size:12px;font-weight:600;}',
    '.tds-pass-c{color:#0d9488;}.tds-fail-c{color:#dc2626;}',

    /* Narrative — DaisyUI alert-info inspired */
    '.tds-narrative{',
    '  background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;',
    '  padding:14px 18px;font-size:14px;color:#1e40af;',
    '  line-height:1.7;margin-bottom:22px;font-style:italic;',
    '}',

    /* Section label */
    '.tds-sec-label{',
    '  font-size:11px;font-weight:700;color:#94a3b8;',
    '  text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px;',
    '}',

    /* Category groups — DaisyUI card compact */
    '.tds-cat-group{',
    '  background:#fafafa;border:1px solid #f1f5f9;border-radius:12px;',
    '  padding:14px 16px;margin-bottom:10px;',
    '}',
    '.tds-cat-header{',
    '  display:flex;align-items:center;justify-content:space-between;',
    '  margin-bottom:10px;',
    '}',
    '.tds-cat-title{font-size:12px;font-weight:700;color:#475569;letter-spacing:.02em;margin:0;}',
    '.tds-cat-score{',
    '  font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;',
    '  background:#e2e8f0;color:#475569;',
    '}',
    '.tds-cat-score--good{background:#d1fae5;color:#065f46;}',
    '.tds-cat-score--warn{background:#fef3c7;color:#92400e;}',
    '.tds-cat-score--bad{background:#fee2e2;color:#991b1b;}',
    '.tds-cat-score--info{background:#e0e7ff;color:#3730a3;}',

    /* Check items */
    '.tds-checks{list-style:none;padding:0;margin:0;}',
    '.tds-check-item{',
    '  display:flex;align-items:flex-start;gap:10px;',
    '  padding:7px 0;border-bottom:1px solid #f1f5f9;',
    '}',
    '.tds-check-item:last-child{border-bottom:none;}',
    '.tds-ci{flex-shrink:0;width:20px;height:20px;margin-top:1px;}',
    '.tds-cl{font-size:13px;font-weight:600;color:#0f172a;margin:0 0 2px;}',
    '.tds-cd{font-size:12px;color:#64748b;margin:0;line-height:1.5;}',
    '.tds-blur{filter:blur(5px);user-select:none;pointer-events:none;opacity:.45;}',

    /* Informational items — neutral styling */
    '.tds-check-item--info .tds-cl{color:#4338ca;}',

    /* Gate overlay */
    '.tds-gate-overlay{',
    '  background:linear-gradient(to bottom,transparent 0%,rgba(255,255,255,.98) 32%);',
    '  margin-top:-56px;padding-top:56px;',
    '}',
    '.tds-gate-box{',
    '  background:linear-gradient(135deg,#eff6ff,#f0fdfa);',
    '  border:1.5px solid #bfdbfe;border-radius:16px;',
    '  padding:22px 20px;text-align:center;',
    '}',
    '@media(min-width:640px){.tds-gate-box{padding:28px 28px;}}',
    '.tds-gate-box h3{font-size:18px;font-weight:800;color:#0f172a;margin:0 0 6px;}',
    '@media(min-width:640px){.tds-gate-box h3{font-size:21px;}}',
    '.tds-gate-box p{font-size:14px;color:#475569;margin:0 0 18px;line-height:1.55;}',

    /* Share button — DaisyUI btn-ghost inspired */
    '.tds-share-btn{',
    '  display:flex;align-items:center;justify-content:center;gap:7px;',
    '  width:100%;padding:11px 16px;',
    '  background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;',
    '  font-size:13px;font-weight:600;color:#475569;',
    '  cursor:pointer;transition:all .15s;margin-bottom:22px;',
    '}',
    '.tds-share-btn:hover{background:#f1f5f9;border-color:#cbd5e1;color:#0f172a;}',
    '.tds-share-btn.copied{background:#f0fdfa;border-color:#a7f3d0;color:#0d9488;}',

    /* Divider */
    '.tds-divider{border:none;border-top:1px solid #f1f5f9;margin:22px 0;}',

    /* CTA block — DaisyUI hero-like */
    '.tds-cta-block{',
    '  background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#0f766e 100%);',
    '  border-radius:16px;padding:28px 22px;text-align:center;',
    '}',
    '.tds-cta-block h3{font-size:18px;font-weight:800;color:#fff;margin:0 0 8px;}',
    '@media(min-width:640px){.tds-cta-block h3{font-size:21px;}}',
    '.tds-cta-block p{font-size:14px;color:rgba(255,255,255,.82);margin:0 0 20px;line-height:1.6;}',
    '.tds-cta-btn{',
    '  display:inline-flex;align-items:center;gap:6px;',
    '  padding:13px 28px;background:#fff;color:#1d4ed8;',
    '  font-size:14px;font-weight:700;border-radius:10px;',
    '  text-decoration:none;',
    '  box-shadow:0 4px 18px rgba(0,0,0,.22);',
    '  transition:transform .15s,box-shadow .15s;',
    '}',
    '.tds-cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(0,0,0,.3);}'
  ].join('');

  // ─── SVG Icons ───────────────────────────────────────────────────────────────

  function svgPass() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#d1fae5"/><path d="M6 10l3 3 5-5" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function svgFail() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fee2e2"/><path d="M7 7l6 6M13 7l-6 6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function svgPartial() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fef3c7"/><path d="M10 6v5M10 13v1" stroke="#d97706" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function svgInfo() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#e0e7ff"/><path d="M10 9v5M10 7v1" stroke="#4338ca" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function svgShare() { return '&#128279;'; }

  function statusSvg(s, isInfo) {
    if (isInfo) return svgInfo();
    return s === 'pass' ? svgPass() : s === 'fail' ? svgFail() : svgPartial();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function gradeInfo(grade) {
    return GRADES[grade] || GRADES['Not Found'];
  }

  function normalizeDomain(raw) {
    raw = raw.trim();
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    try { return new URL(raw).hostname.replace(/^www\./, '').toLowerCase(); }
    catch (e) { return raw.replace(/^https?:\/\//i, '').replace(/^www\./, '').split('/')[0].toLowerCase(); }
  }

  function groupByCategory(checks) {
    var out = {};
    (checks || []).forEach(function (c) {
      var cat = c.category || 'other';
      if (!out[cat]) out[cat] = [];
      out[cat].push(c);
    });
    return out;
  }

  function catScoreClass(pass, total) {
    if (total === 0) return 'tds-cat-score--info';
    var pct = pass / total;
    if (pct >= 0.8) return 'tds-cat-score--good';
    if (pct >= 0.5) return 'tds-cat-score--warn';
    return 'tds-cat-score--bad';
  }

  function renderChecklist(checks, blurred) {
    var groups = groupByCategory(checks);
    var keys = CATEGORY_ORDER.filter(function (k) { return groups[k]; });
    Object.keys(groups).forEach(function (k) { if (keys.indexOf(k) === -1) keys.push(k); });

    return keys.map(function (cat) {
      var isInfoCat = cat === 'informational';
      var label = CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ');
      var catChecks = groups[cat];
      var scoreable = catChecks.filter(function (c) { return c.scoreable !== false && !isInfoCat; });
      var passed = scoreable.filter(function (c) { return c.status === 'pass'; }).length;
      var total = scoreable.length;
      var scoreLabel = isInfoCat ? 'Info' : (passed + '/' + total);
      var scoreClass = isInfoCat ? 'tds-cat-score--info' : catScoreClass(passed, total);

      var items = catChecks.map(function (c) {
        var cls = blurred ? 'tds-check-item tds-blur' : (isInfoCat ? 'tds-check-item tds-check-item--info' : 'tds-check-item');
        return [
          '<li class="' + cls + '">',
          statusSvg(c.status, isInfoCat),
          '<div>',
          '<p class="tds-cl">' + esc(c.label) + '</p>',
          c.detail ? '<p class="tds-cd">' + esc(c.detail) + '</p>' : '',
          '</div></li>'
        ].join('');
      }).join('');

      return [
        '<div class="tds-cat-group">',
        '<div class="tds-cat-header">',
        '<p class="tds-cat-title">' + esc(label) + '</p>',
        '<span class="tds-cat-score ' + scoreClass + '">' + scoreLabel + '</span>',
        '</div>',
        '<ul class="tds-checks">' + items + '</ul>',
        '</div>'
      ].join('');
    }).join('');
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function post(url, body, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb('Invalid response'); }
      } else { cb('Server error (' + xhr.status + ')'); }
    };
    xhr.onerror = function () { cb('Network error — please try again'); };
    xhr.send(JSON.stringify(body));
  }

  // ─── Stage 1 — Domain Form ───────────────────────────────────────────────────

  function renderStage1(root) {
    root.innerHTML = [
      '<div class="tds-card">',
      '<div class="tds-hero-icon">&#129302;</div>',
      '<h2 class="tds-headline">Is Your Dental Practice Invisible to AI?</h2>',
      '<p class="tds-sub">ChatGPT and Gemini are the new search engines for patients.',
      ' Run a free scan to see if your practice shows up — and exactly what to fix if it doesn\'t.</p>',
      '<div class="tds-pills">',
      '<span class="tds-pill">&#9989; Free</span>',
      '<span class="tds-pill">&#128202; 16 Checks</span>',
      '<span class="tds-pill">&#9201; Results in ~90s</span>',
      '</div>',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon">&#127760;</span>',
      '<input id="tds-d" class="tds-input" type="text" placeholder="yourpractice.com"',
      ' autocomplete="off" autocorrect="off" spellcheck="false">',
      '</div>',
      '<div id="tds-e1" class="tds-error"></div>',
      '<button id="tds-sb" class="tds-btn">Check My AI Visibility &#8594;</button>',
      '</div>',
      '<div class="tds-trust-bar">',
      '<span class="tds-trust-label">Checks visibility across</span>',
      '<span class="tds-trust-badge">&#129302; ChatGPT</span>',
      '<span class="tds-trust-badge">&#10024; Gemini</span>',
      '<span class="tds-trust-badge">&#128269; Perplexity</span>',
      '<span class="tds-trust-badge">&#129302; Copilot</span>',
      '</div>'
    ].join('');

    var input = root.querySelector('#tds-d');
    var btn   = root.querySelector('#tds-sb');
    var err   = root.querySelector('#tds-e1');

    function submit() {
      err.textContent = '';
      var raw = input.value.trim();
      if (!raw) { err.textContent = 'Please enter your practice website.'; return; }
      var domain = normalizeDomain(raw);
      btn.disabled = true;
      btn.innerHTML = '<span class="tds-spinner"></span>Starting scan…';
      post(N8N_TEASER, { domain: domain }, function (e, data) {
        if (e) { err.textContent = e; btn.disabled = false; btn.textContent = 'Check My AI Visibility →'; return; }
        renderStage2Polling(root, domain, data.scan_id);
      });
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  // ─── Stage 2a — Scanning Animation ──────────────────────────────────────────

  function renderStage2Polling(root, domain, scanId) {
    var stepDots = SCAN_STEPS.map(function (s, i) {
      return '<li class="tds-step' + (i === 0 ? ' tds-step--active' : '') + '">' +
        '<span class="tds-step-dot"></span>' + esc(s) +
        '</li>';
    }).join('');

    root.innerHTML = [
      '<div class="tds-card">',
      '<div class="tds-scan-hd">',
      '<div class="tds-scan-pulse">&#129302;</div>',
      '<p class="tds-scan-domain">' + esc(domain) + '</p>',
      '<p class="tds-scan-tag">Checking 16 AI visibility signals…</p>',
      '</div>',
      '<ul class="tds-steps" id="tds-steps">' + stepDots + '</ul>',
      '<div class="tds-prog-track"><div class="tds-prog-fill" id="tds-pf" style="width:4%"></div></div>',
      '<p class="tds-prog-label" id="tds-pl">0%</p>',
      '</div>'
    ].join('');

    var progFill  = root.querySelector('#tds-pf');
    var progLabel = root.querySelector('#tds-pl');
    var stepEls   = root.querySelectorAll('.tds-step');
    var attempt   = 0;
    var stepIdx   = 0;

    function tick() {
      attempt++;
      var pct = Math.min(94, 4 + Math.floor(attempt / POLL_MAX * 90));
      progFill.style.width = pct + '%';
      progLabel.textContent = pct + '%';

      var newStepIdx = Math.min(SCAN_STEPS.length - 1, Math.floor(attempt / (POLL_MAX / SCAN_STEPS.length)));
      if (newStepIdx > stepIdx) {
        stepEls[stepIdx].className = 'tds-step tds-step--done';
        stepEls[stepIdx].querySelector('.tds-step-dot').textContent = '✓';
        stepIdx = newStepIdx;
        if (stepEls[stepIdx]) stepEls[stepIdx].className = 'tds-step tds-step--active';
      }

      if (attempt > POLL_MAX) {
        root.innerHTML = '<div class="tds-card"><p style="color:#dc2626;font-size:14px;text-align:center">' +
          '&#9888;&#65039; Scan is taking longer than expected. Please <a href="">try again</a>.</p></div>';
        return;
      }

      post(N8N_POLL, { scan_id: scanId }, function (e, data) {
        if (e) { setTimeout(tick, POLL_INTERVAL); return; }
        if (data.status === 'complete') {
          progFill.style.width = '100%';
          progLabel.textContent = '100%';
          for (var i = 0; i < stepEls.length; i++) {
            stepEls[i].className = 'tds-step tds-step--done';
            stepEls[i].querySelector('.tds-step-dot').textContent = '✓';
          }
          setTimeout(function () { renderStage2Teaser(root, domain, scanId, data); }, 400);
        } else {
          setTimeout(tick, POLL_INTERVAL);
        }
      });
    }

    setTimeout(tick, POLL_INTERVAL);
  }

  // ─── Stage 2b — Teaser + Email Gate ─────────────────────────────────────────

  function renderStage2Teaser(root, domain, scanId, teaserData) {
    var grade  = teaserData.grade || 'Not Found';
    var score  = teaserData.score != null ? teaserData.score : 0;
    var info   = gradeInfo(grade);
    var checks = (teaserData.diagnostics && teaserData.diagnostics.checks) || [];
    var visible = checks.slice(0, 4);
    var blurred = checks.slice(4, 10);

    root.innerHTML = [
      '<div class="tds-card" style="--tds-color:' + info.color + ';--tds-glow:' + info.glow + '">',

      '<div class="tds-grade-hero">',
      '<div class="tds-grade-col">',
      '<div class="tds-grade-badge' + (info.label.length > 2 ? ' tds-grade-sm' : '') + '"',
      ' style="background:' + info.color + ';box-shadow:0 8px 24px ' + info.glow + '">',
      esc(info.label) + '</div>',
      '<span class="tds-grade-band" style="background:' + info.color + '">' + esc(info.band) + '</span>',
      '</div>',
      '<div style="flex:1;min-width:0">',
      '<p class="tds-practice">' + esc(teaserData.practice_name || domain) + '</p>',
      '<p class="tds-score-num" style="color:' + info.color + '">' + score + '<span style="font-size:14px;font-weight:400;color:#94a3b8"> / 100</span></p>',
      '<div class="tds-score-bar"><div class="tds-score-fill" style="width:' + score + '%;background:' + info.color + '"></div></div>',
      '</div></div>',

      renderChecklist(visible, false),
      '<div id="tds-blur-wrap">' + renderChecklist(blurred, true) + '</div>',

      '<div class="tds-gate-overlay">',
      '<div class="tds-gate-box">',
      '<h3>&#128274; Unlock Your Full 16-Point Report</h3>',
      '<p>See every check, get an AI-written action plan, and a shareable results link.</p>',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon">&#9993;</span>',
      '<input id="tds-em" class="tds-input" type="email" placeholder="doctor@yourpractice.com">',
      '</div>',
      '<div id="tds-e2" class="tds-error"></div>',
      '<button id="tds-gb" class="tds-btn">Unlock Full Report &#8594;</button>',
      '</div></div>',

      '</div>'
    ].join('');

    var emailInput = root.querySelector('#tds-em');
    var gateBtn    = root.querySelector('#tds-gb');
    var err        = root.querySelector('#tds-e2');

    function unlock() {
      err.textContent = '';
      var email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = 'Please enter a valid email address.';
        return;
      }
      gateBtn.disabled = true;
      gateBtn.innerHTML = '<span class="tds-spinner"></span>Generating your report…';
      post(N8N_GATE, { scan_id: scanId, email: email }, function (e, data) {
        if (e) { err.textContent = e; gateBtn.disabled = false; gateBtn.textContent = 'Unlock Full Report →'; return; }
        renderStage3Report(root, data);
      });
    }

    gateBtn.addEventListener('click', unlock);
    emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') unlock(); });
  }

  // ─── Stage 3 — Full Report ───────────────────────────────────────────────────

  function renderStage3Report(root, data) {
    var grade     = data.grade || 'Not Found';
    var score     = data.score != null ? data.score : 0;
    var info      = gradeInfo(grade);
    var checks    = (data.diagnostics && data.diagnostics.checks) || [];
    var name      = data.practice_name || data.domain || 'Your Practice';
    var narrative = data.narrative || '';
    var shareUrl  = data.report_url || window.location.href;

    var scoreable = checks.filter(function (c) { return c.scoreable !== false; });
    var passN = scoreable.filter(function (c) { return c.status === 'pass'; }).length;
    var failN = scoreable.filter(function (c) { return c.status === 'fail'; }).length;

    root.innerHTML = [
      '<div class="tds-card" style="--tds-color:' + info.color + ';--tds-glow:' + info.glow + '">',

      '<div class="tds-grade-hero">',
      '<div class="tds-grade-col">',
      '<div class="tds-grade-badge' + (info.label.length > 2 ? ' tds-grade-sm' : '') + '"',
      ' style="background:' + info.color + ';box-shadow:0 8px 28px ' + info.glow + '">',
      esc(info.label) + '</div>',
      '<span class="tds-grade-band" style="background:' + info.color + '">' + esc(info.band) + '</span>',
      '</div>',
      '<div style="flex:1;min-width:0">',
      '<p class="tds-practice">' + esc(name) + '</p>',
      '<p class="tds-score-num" style="color:' + info.color + '">' + score + '<span style="font-size:14px;font-weight:400;color:#94a3b8"> / 100</span></p>',
      '<div class="tds-score-bar"><div class="tds-score-fill" style="width:' + score + '%;background:' + info.color + '"></div></div>',
      '<div class="tds-pf-row"><span class="tds-pass-c">&#9989; ' + passN + ' passed</span><span class="tds-fail-c">&#10060; ' + failN + ' failed</span></div>',
      '</div></div>',

      narrative ? '<div class="tds-narrative">' + esc(narrative) + '</div>' : '',

      '<button class="tds-share-btn" id="tds-share-btn">' +
        svgShare() + ' Copy shareable link' +
      '</button>',

      '<p class="tds-sec-label">Full 16-Point Breakdown</p>',
      renderChecklist(checks, false),

      '<hr class="tds-divider">',

      '<div class="tds-cta-block">',
      '<h3>Ready to rank in AI search?</h3>',
      '<p>Our AI SEO service gets dental practices appearing in ChatGPT, Gemini & Perplexity — where high-intent patients are searching now.</p>',
      '<a class="tds-cta-btn" href="https://thedigitalsmile.co/ai-seo" target="_blank" rel="noopener">',
      'See How It Works &#8594;</a>',
      '</div>',

      '</div>'
    ].join('');

    var shareBtn = root.querySelector('#tds-share-btn');
    shareBtn.addEventListener('click', function () {
      var copied = false;
      try {
        navigator.clipboard.writeText(shareUrl).then(function () {
          shareBtn.textContent = '✓ Link copied!';
          shareBtn.className = 'tds-share-btn copied';
          setTimeout(function () {
            shareBtn.innerHTML = svgShare() + ' Copy shareable link';
            shareBtn.className = 'tds-share-btn';
          }, 2500);
        });
        copied = true;
      } catch (e) {}
      if (!copied) {
        var ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        shareBtn.textContent = '✓ Link copied!';
        shareBtn.className = 'tds-share-btn copied';
        setTimeout(function () {
          shareBtn.innerHTML = svgShare() + ' Copy shareable link';
          shareBtn.className = 'tds-share-btn';
        }, 2500);
      }
    });
  }

  // ─── Public result (shareable ?r=SLUG) ───────────────────────────────────────

  function renderPublicResult(root, slug) {
    root.innerHTML = [
      '<div class="tds-card">',
      '<div style="text-align:center;padding:32px 0">',
      '<div class="tds-scan-pulse" style="margin:0 auto 14px">&#129302;</div>',
      '<p style="color:#64748b;font-size:14px">Loading report…</p>',
      '</div></div>'
    ].join('');

    post(N8N_RESULT, { slug: slug }, function (e, data) {
      if (e || data.detail) {
        root.innerHTML = '<div class="tds-card"><p style="color:#dc2626;text-align:center;font-size:14px">Report not found or expired.<br><a href="/ai-visibility-checker" style="color:#2563eb">Run a new scan →</a></p></div>';
        return;
      }
      renderStage3Report(root, {
        grade: data.grade,
        score: data.score,
        practice_name: data.practice_name,
        domain: data.domain,
        narrative: null,
        diagnostics: { checks: data.checks || [] },
        report_url: window.location.href
      });
    });
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────

  function boot() {
    var root = document.getElementById('tds-ai-scanner');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tds-ai-scanner';
      document.body.appendChild(root);
    }

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var params = new URLSearchParams(window.location.search);
    var slug   = params.get('r');
    if (slug) { renderPublicResult(root, slug); }
    else      { renderStage1(root); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
