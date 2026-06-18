/**
 * TDS AI Visibility Scanner — Webflow Embed
 * Drop a <div id="tds-ai-scanner"></div> anywhere on the page and load this script.
 * Three stages: Domain Form → Teaser+Email Gate → Full Report
 */
(function () {
  'use strict';

  var N8N_TEASER = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-teaser';
  var N8N_POLL   = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-poll';
  var N8N_GATE   = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-gate';

  var POLL_INTERVAL = 3000;
  var POLL_MAX = 40; // 2 min timeout

  var GRADE_COLORS = {
    'A+': '#0d9488', A: '#0d9488', 'A-': '#0d9488',
    'B+': '#2563eb', B: '#2563eb', 'B-': '#2563eb',
    'C+': '#d97706', C: '#d97706', 'C-': '#d97706',
    'D+': '#dc2626', D: '#dc2626', 'D-': '#dc2626',
    F: '#7f1d1d',
    'Not Found': '#6b7280'
  };

  var CATEGORY_LABELS = {
    ai_presence: 'AI Presence',
    local_seo: 'Local SEO',
    structured_data: 'Structured Data',
    content_signals: 'Content & Authority',
    technical: 'Technical'
  };

  // ─── CSS ────────────────────────────────────────────────────────────────────

  var CSS = [
    '#tds-ai-scanner *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '#tds-ai-scanner{max-width:640px;margin:0 auto;padding:24px 16px;}',
    '.tds-card{background:#fff;border-radius:16px;box-shadow:0 2px 24px rgba(0,0,0,.10);padding:36px 32px;margin-bottom:24px;}',
    '.tds-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;}',
    '.tds-input{width:100%;padding:14px 16px;border:1.5px solid #d1d5db;border-radius:10px;font-size:15px;color:#111827;outline:none;transition:border .2s;}',
    '.tds-input:focus{border-color:#2563eb;}',
    '.tds-btn{display:block;width:100%;padding:15px;background:#2563eb;color:#fff;font-size:15px;font-weight:700;border:none;border-radius:10px;cursor:pointer;transition:background .2s;margin-top:16px;}',
    '.tds-btn:hover{background:#1d4ed8;}',
    '.tds-btn:disabled{background:#93c5fd;cursor:not-allowed;}',
    '.tds-headline{font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;}',
    '.tds-sub{font-size:14px;color:#6b7280;margin:0 0 24px;}',
    '.tds-error{color:#dc2626;font-size:13px;margin-top:8px;}',
    '.tds-spinner{display:inline-block;width:20px;height:20px;border:3px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:tds-spin .7s linear infinite;vertical-align:middle;margin-right:8px;}',
    '@keyframes tds-spin{to{transform:rotate(360deg)}}',
    '.tds-status-bar{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 16px;font-size:14px;color:#0369a1;margin-bottom:20px;}',
    '.tds-grade-badge{display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:50%;font-size:28px;font-weight:900;color:#fff;margin-bottom:16px;}',
    '.tds-score-row{display:flex;align-items:center;gap:12px;margin-bottom:24px;}',
    '.tds-score-info h2{margin:0 0 2px;font-size:18px;font-weight:700;color:#111827;}',
    '.tds-score-info p{margin:0;font-size:14px;color:#6b7280;}',
    '.tds-narrative{background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 10px 10px 0;padding:14px 16px;font-size:14px;color:#374151;line-height:1.6;margin-bottom:24px;}',
    '.tds-section-title{font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;}',
    '.tds-checks{list-style:none;margin:0 0 24px;padding:0;}',
    '.tds-check-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f6;}',
    '.tds-check-item:last-child{border-bottom:none;}',
    '.tds-check-icon{flex-shrink:0;width:20px;height:20px;margin-top:1px;}',
    '.tds-check-label{font-size:14px;font-weight:600;color:#111827;margin:0 0 2px;}',
    '.tds-check-detail{font-size:13px;color:#6b7280;margin:0;}',
    '.tds-teaser-blur{filter:blur(4px);user-select:none;pointer-events:none;opacity:.6;}',
    '.tds-gate-overlay{background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,.97) 40%);padding-top:40px;}',
    '.tds-gate-cta{text-align:center;padding:0 8px;}',
    '.tds-gate-cta h3{font-size:19px;font-weight:800;color:#111827;margin:0 0 8px;}',
    '.tds-gate-cta p{font-size:14px;color:#6b7280;margin:0 0 20px;}',
    '.tds-divider{border:none;border-top:1px solid #e5e7eb;margin:24px 0;}',
    '.tds-cta-block{background:#eff6ff;border-radius:12px;padding:24px;text-align:center;}',
    '.tds-cta-block h3{font-size:18px;font-weight:700;color:#1e40af;margin:0 0 8px;}',
    '.tds-cta-block p{font-size:14px;color:#3b82f6;margin:0 0 16px;}',
    '.tds-cta-btn{display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;}',
    '.tds-progress-bar{height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:8px;}',
    '.tds-progress-fill{height:100%;background:#2563eb;border-radius:99px;transition:width .4s;}',
    '.tds-progress-label{font-size:12px;color:#6b7280;}',
    '.tds-category-group{margin-bottom:20px;}',
    '.tds-category-title{font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em;margin:0 0 8px;}'
  ].join('\n');

  // ─── Icons ───────────────────────────────────────────────────────────────────

  function iconPass() {
    return '<svg class="tds-check-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#d1fae5"/><path d="M6 10l3 3 5-5" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function iconFail() {
    return '<svg class="tds-check-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fee2e2"/><path d="M7 7l6 6M13 7l-6 6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function iconPartial() {
    return '<svg class="tds-check-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fef3c7"/><path d="M10 6v5M10 13v1" stroke="#d97706" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function statusIcon(status) {
    if (status === 'pass') return iconPass();
    if (status === 'fail') return iconFail();
    return iconPartial();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function gradeColor(grade) {
    return GRADE_COLORS[grade] || '#6b7280';
  }

  function normalizeDomain(raw) {
    raw = raw.trim();
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
    } catch (e) {
      return raw;
    }
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

  function renderChecklist(checks, blurred) {
    var groups = groupByCategory(checks);
    var html = '';
    Object.keys(groups).forEach(function (cat) {
      var label = CATEGORY_LABELS[cat] || cat;
      html += '<div class="tds-category-group">';
      html += '<p class="tds-category-title">' + label + '</p>';
      html += '<ul class="tds-checks">';
      groups[cat].forEach(function (c) {
        var itemCls = blurred ? 'tds-check-item tds-teaser-blur' : 'tds-check-item';
        html += '<li class="' + itemCls + '">';
        html += statusIcon(c.status);
        html += '<div>';
        html += '<p class="tds-check-label">' + escHtml(c.label) + '</p>';
        if (c.detail) html += '<p class="tds-check-detail">' + escHtml(c.detail) + '</p>';
        html += '</div></li>';
      });
      html += '</ul></div>';
    });
    return html;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function post(url, body, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb('Invalid response from server'); }
      } else {
        cb('Server error (' + xhr.status + ')');
      }
    };
    xhr.onerror = function () { cb('Network error — please try again'); };
    xhr.send(JSON.stringify(body));
  }

  // ─── Stage renderers ─────────────────────────────────────────────────────────

  function renderStage1(root) {
    root.innerHTML = [
      '<div class="tds-card">',
      '<h2 class="tds-headline">Is Your Practice Visible to AI?</h2>',
      '<p class="tds-sub">ChatGPT, Gemini, and Perplexity are the new search engines for patients. See how your practice ranks — free in under 2 minutes.</p>',
      '<label class="tds-label" for="tds-domain-input">Your practice website</label>',
      '<input id="tds-domain-input" class="tds-input" type="text" placeholder="e.g. smiledentalmiami.com" autocomplete="off" autocorrect="off" spellcheck="false">',
      '<div id="tds-s1-error" class="tds-error"></div>',
      '<button id="tds-scan-btn" class="tds-btn">Check My AI Visibility</button>',
      '</div>'
    ].join('');

    var input = root.querySelector('#tds-domain-input');
    var btn = root.querySelector('#tds-scan-btn');
    var errEl = root.querySelector('#tds-s1-error');

    btn.addEventListener('click', function () {
      errEl.textContent = '';
      var raw = input.value.trim();
      if (!raw) { errEl.textContent = 'Please enter your website.'; return; }
      var domain = normalizeDomain(raw);
      btn.disabled = true;
      btn.innerHTML = '<span class="tds-spinner"></span>Starting scan…';
      post(N8N_TEASER, { url: domain }, function (err, data) {
        if (err) {
          errEl.textContent = err;
          btn.disabled = false;
          btn.textContent = 'Check My AI Visibility';
          return;
        }
        renderStage2Polling(root, domain, data.scan_id);
      });
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') btn.click();
    });
  }

  function renderStage2Polling(root, domain, scanId) {
    root.innerHTML = [
      '<div class="tds-card">',
      '<div class="tds-status-bar" id="tds-poll-status">🔍 Scanning <strong>' + escHtml(domain) + '</strong> across 16 AI visibility checks…</div>',
      '<div class="tds-progress-bar"><div class="tds-progress-fill" id="tds-progress" style="width:5%"></div></div>',
      '<p class="tds-progress-label" id="tds-progress-label">Checking AI presence signals…</p>',
      '</div>'
    ].join('');

    var progress = root.querySelector('#tds-progress');
    var label = root.querySelector('#tds-progress-label');
    var statusBar = root.querySelector('#tds-poll-status');

    var MESSAGES = [
      'Checking AI presence signals…',
      'Verifying structured data (Schema.org)…',
      'Scanning local SEO signals…',
      'Analyzing content authority…',
      'Checking technical signals…',
      'Compiling your report…'
    ];
    var attempt = 0;
    var msgIdx = 0;

    function tick() {
      attempt++;
      var pct = Math.min(90, 5 + Math.floor(attempt / POLL_MAX * 85));
      progress.style.width = pct + '%';
      msgIdx = Math.min(MESSAGES.length - 1, Math.floor(attempt / (POLL_MAX / MESSAGES.length)));
      label.textContent = MESSAGES[msgIdx];

      if (attempt > POLL_MAX) {
        statusBar.textContent = '⚠️ Scan is taking longer than expected. Please try again.';
        return;
      }

      post(N8N_POLL, { scan_id: scanId }, function (err, data) {
        if (err) {
          statusBar.textContent = '⚠️ ' + err;
          return;
        }
        if (data.status === 'complete') {
          progress.style.width = '100%';
          renderStage2Teaser(root, domain, scanId, data);
        } else {
          setTimeout(tick, POLL_INTERVAL);
        }
      });
    }

    setTimeout(tick, POLL_INTERVAL);
  }

  function renderStage2Teaser(root, domain, scanId, teaserData) {
    var grade = teaserData.grade || 'N/A';
    var score = teaserData.score != null ? teaserData.score : '—';
    var checks = (teaserData.diagnostics && teaserData.diagnostics.checks) || [];
    var color = gradeColor(grade);

    // Show first 4 checks clearly, rest blurred
    var visibleChecks = checks.slice(0, 4);
    var blurredChecks = checks.slice(4, 9);

    root.innerHTML = [
      '<div class="tds-card">',
      '<div class="tds-score-row">',
      '<div class="tds-grade-badge" style="background:' + color + '">' + escHtml(grade) + '</div>',
      '<div class="tds-score-info">',
      '<h2>' + escHtml(teaserData.practice_name || domain) + '</h2>',
      '<p>AI Visibility Score: <strong>' + escHtml(String(score)) + '/100</strong></p>',
      '</div>',
      '</div>',

      '<div id="tds-teaser-checks">',
      renderChecklist(visibleChecks, false),
      renderChecklist(blurredChecks, true),
      '</div>',

      '<div class="tds-gate-overlay">',
      '<div class="tds-gate-cta">',
      '<h3>Get Your Full 16-Point Report</h3>',
      '<p>Enter your email to unlock all checks, an expert summary, and your personalized action plan.</p>',
      '<label class="tds-label" for="tds-email-input">Your work email</label>',
      '<input id="tds-email-input" class="tds-input" type="email" placeholder="doctor@yourpractice.com">',
      '<div id="tds-s2-error" class="tds-error"></div>',
      '<button id="tds-gate-btn" class="tds-btn">Unlock Full Report →</button>',
      '</div>',
      '</div>',
      '</div>'
    ].join('');

    var emailInput = root.querySelector('#tds-email-input');
    var gateBtn = root.querySelector('#tds-gate-btn');
    var errEl = root.querySelector('#tds-s2-error');

    gateBtn.addEventListener('click', function () {
      errEl.textContent = '';
      var email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = 'Please enter a valid email address.';
        return;
      }
      gateBtn.disabled = true;
      gateBtn.innerHTML = '<span class="tds-spinner"></span>Generating your report…';
      post(N8N_GATE, { scan_id: scanId, email: email }, function (err, data) {
        if (err) {
          errEl.textContent = err;
          gateBtn.disabled = false;
          gateBtn.textContent = 'Unlock Full Report →';
          return;
        }
        renderStage3Report(root, data);
      });
    });

    emailInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') gateBtn.click();
    });
  }

  function renderStage3Report(root, data) {
    var grade = data.grade || 'N/A';
    var score = data.score != null ? data.score : '—';
    var color = gradeColor(grade);
    var checks = (data.diagnostics && data.diagnostics.checks) || [];
    var practiceName = data.practice_name || data.domain || 'Your Practice';
    var narrative = data.narrative || '';

    var passCount = checks.filter(function (c) { return c.status === 'pass'; }).length;
    var failCount = checks.filter(function (c) { return c.status === 'fail'; }).length;

    root.innerHTML = [
      '<div class="tds-card">',

      '<div class="tds-score-row">',
      '<div class="tds-grade-badge" style="background:' + color + '">' + escHtml(grade) + '</div>',
      '<div class="tds-score-info">',
      '<h2>' + escHtml(practiceName) + '</h2>',
      '<p>AI Visibility Score: <strong>' + escHtml(String(score)) + '/100</strong> &nbsp;·&nbsp; ✅ ' + passCount + ' passed &nbsp;·&nbsp; ❌ ' + failCount + ' failed</p>',
      '</div>',
      '</div>',

      narrative ? '<div class="tds-narrative">' + escHtml(narrative) + '</div>' : '',

      '<p class="tds-section-title">Full 16-Point Breakdown</p>',
      renderChecklist(checks, false),

      '<hr class="tds-divider">',

      '<div class="tds-cta-block">',
      '<h3>Ready to rank in AI search?</h3>',
      '<p>Our AI SEO service gets dental practices appearing in ChatGPT, Gemini & Perplexity — where 40% of new patients now search.</p>',
      '<a class="tds-cta-btn" href="https://thedigitalsmile.co/ai-seo" target="_blank" rel="noopener">See How It Works →</a>',
      '</div>',

      '</div>'
    ].join('');
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────

  function boot() {
    var root = document.getElementById('tds-ai-scanner');
    if (!root) return;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    renderStage1(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
