/**
 * TDS AI Visibility Scanner — Webflow Embed v1.6.1
 * Self-contained, brand-coherent (light / blue-white) embeddable component.
 * Drop <div id="tds-ai-scanner"></div> anywhere; auto-mounts to body if absent.
 *
 * v1.6.1 — Alignment fix (Ramiro, ClickUp 86e1j4d5u): the landing hero sets
 *   text-align:center and the widget inherited it — check labels, narrative
 *   paragraphs, competitor rows and the section label rendered centered over
 *   their own text block (looked misaligned). .tds-card now pins text-align:left;
 *   center-by-design blocks (gate box, CTA, scan header) are unaffected.
 * v1.6.0 — Gabriel feedback round 4 (2026-07-06, ClickUp 86e1j4d5u):
 *   • Summary-FIRST: the plain-English narrative (now generated engine-side at
 *     scan time) renders as the first, biggest thing on the initial report,
 *     BEFORE the email gate. Paragraph-split, larger type.
 *   • Competitors block: names of practices AI recommends instead (pre-gate hook).
 *   • Gate form asks first name, last name, email AND phone (was email only).
 *   • Zero dashes anywhere (reads like ChatGPT): commas instead. "FOR FREE".
 *   • CTA copy: "We got you." own line; "Book a call with our team, and we'll
 *     go over your report with you and explain it in plain, simple English."
 *   • BOOK A CALL now goes straight to the booking page (/booking), no
 *     qualification form first. utm_medium=report for attribution.
 * v1.5.3 — Shared report (?r=slug) now shows the plain-English narrative — the
 *   engine persists it (diagnostics.narrative) and /public/result returns it.
 *   Was hardcoded null, so the emailed "View your full report" link lost the summary.
 * v1.5.2 — Gate: "You're getting access to one of our most exclusive tools — free"
 *   eyebrow above the unlock box (Gabriel's copy).
 * v1.5.1 — BOOK A CALL HERE now points to the ads-style pre-booking qualification
 *   form (thedigitalsmile-seo.com/pre-booking) per Gabriel — qualified dentists route
 *   to the booking page. (Superseded the interim /book-a-call target from 1.5.0.)
 * v1.5.0 — Report CTA rewritten per Gabriel (CEO): "Feeling overwhelmed?" →
 *   BOOK A CALL HERE, instead of "See how it works". Dentist-only report header.
 * v1.4.3 — Report CTA ("See how it works") now points to the AI Visibility Checker
 *   landing (/ai-visibility-checker) per Ramiro — the canonical AI-SEO tool page.
 * v1.4.2 — Fix dead report CTA: AI_SEO_URL pointed at a non-resolving domain
 *   (thedigitalsmile.co/ai-seo → 000/404).
 * v1.4.1 — Taste polish (light brand kept): inherit host brand font; blue
 *   value pills with inline SVG icons (were emoji); trust bar anchored inside
 *   the card with a hairline; radial score dial wrapping the grade badge
 *   (replaces the flat score bar); deeper card shadow + inner highlight;
 *   staggered checklist reveal; strong ease-out curves; killed two
 *   `transition:all`. No layout/flow or copy changes.
 * v1.4.0 — Senior UI/UX pass:
 *   • LIGHT theme, on-brand with thedigitalsmile.co (no dark hijack of <body>).
 *   • Self-contained component: max-width centered column, lives in page flow
 *     (no full-viewport takeover, no fixed page-level orbs). Plays nice with the
 *     Webflow hero above and pillar/FAQ content below.
 *   • Category-coherent gating: teaser reveals the first category fully and
 *     teases the rest by header — fixes the duplicate "AI Readiness" header that
 *     came from slicing checks 0–4 / 4–10 across a category boundary.
 *   • Bulletproof email gate: clear required affordance, visible inline
 *     validation (red border + shake), robust error/loading states, autofocus.
 *   • a11y: labels, aria, focus-visible, prefers-reduced-motion, per-stage
 *     focus management, headings, progressbar role + SR status announcements.
 *   • Honest tally: shows passed / to-fix / unverified (could_not_verify checks
 *     are neither pass nor fail — never silently dropped from the count).
 *   • Edge-case safe: empty-checks and single-category responses never render a
 *     "0 remaining checks" gate. Responsive grade-hero + 44px touch targets.
 * v1.3.0 — full-page dark gradient (reverted: off-brand).
 * v1.2.0 — grade map + category labels.
 */
(function () {
  'use strict';

  var N8N_TEASER = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-teaser';
  var N8N_POLL   = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-poll';
  var N8N_GATE   = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-gate';
  var N8N_RESULT = 'https://ramsautomation.app.n8n.cloud/webhook/ai-scanner-public-result';

  var POLL_INTERVAL = 3000;
  var POLL_MAX = 40;
  // Report CTA target. Points to the AI Visibility Checker landing (the AI-SEO tool
  // page), so shared/emailed reports route back to the tool's "how it works" + scan.
  var AI_SEO_URL = 'https://www.thedigitalsmile.com/ai-visibility-checker';
  // Primary report CTA (Gabriel 2026-07-06): straight to the booking page, no
  // qualification form first. UTMs identify scanner-sourced bookings.
  var BOOK_A_CALL_URL = 'https://thedigitalsmile-seo.com/booking?utm_source=ai-scanner&utm_medium=report&utm_campaign=aivc-report';

  // Full grade map — engine text grades + letter grades
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
    'Querying ChatGPT &amp; Perplexity for your practice…',
    'Checking Schema.org structured data…',
    'Scanning Google Business Profile signals…',
    'Analyzing content authority &amp; reviews…',
    'Running technical checks (HTTPS, speed)…',
    'Compiling your AI visibility report…'
  ];

  // ─── CSS — light, brand-coherent design system ───────────────────────────────
  var CSS = [
    /* Self-contained component: centered column in normal page flow.
       No <body> override, no full-viewport takeover, no fixed page orbs. */
    '#tds-ai-scanner{max-width:640px;margin:0 auto;padding:8px 16px 24px;position:relative;font-family:inherit;}',
    '#tds-ai-scanner *,#tds-ai-scanner *::before,#tds-ai-scanner *::after{',
    '  box-sizing:border-box;',
    /* Inherit the host Webflow page font so the widget reads as native brand
       (system stack as the ultimate fallback if the host sets none). */
    '  font-family:inherit;',
    '}',

    /* Card */
    '.tds-card{',
    '  background:#fff;border-radius:20px;',
    '  box-shadow:0 1px 2px rgba(15,23,42,.04),0 18px 44px -18px rgba(37,99,235,.22),0 0 0 1px rgba(15,23,42,.05),inset 0 1px 0 rgba(255,255,255,.7);',
    '  padding:28px 22px;margin-bottom:16px;',
    '  animation:tds-fade-up .4s cubic-bezier(0.23,1,0.32,1) both;',
    '  position:relative;width:100%;overflow:hidden;',
    /* The widget mounts inside hosts that center text (the landing hero
       sets text-align:center) — pin the card to left so check labels,
       narrative paragraphs and competitor rows never inherit centering.
       Center-by-design blocks (gate box, CTA, scan header) declare their
       own text-align:center and are unaffected. */
    '  text-align:left;',
    '}',
    '@media(min-width:640px){.tds-card{padding:40px;}}',
    '@keyframes tds-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',

    /* Hero icon (stage 1) */
    '.tds-hero-icon{',
    '  width:52px;height:52px;border-radius:14px;',
    '  background:linear-gradient(135deg,#2563eb,#0d9488);',
    '  display:flex;align-items:center;justify-content:center;',
    '  color:#fff;margin:0 0 18px;',
    '}',
    '.tds-hero-icon svg,.tds-scan-pulse svg{display:block;}',
    '.tds-headline{font-size:22px;font-weight:800;color:#0f172a;margin:0 0 10px;line-height:1.2;letter-spacing:-.022em;text-wrap:balance;}',
    '@media(min-width:640px){.tds-headline{font-size:29px;}}',
    '.tds-sub{font-size:15px;color:#64748b;margin:0 0 22px;line-height:1.65;}',

    /* Pills */
    '.tds-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;}',
    '.tds-pill{',
    '  display:inline-flex;align-items:center;gap:5px;',
    '  background:#eff6ff;color:#1d4ed8;',
    '  font-size:12px;font-weight:600;padding:5px 11px;border-radius:99px;',
    '  border:1px solid #dbeafe;',
    '}',
    '.tds-pill svg{width:13px;height:13px;flex-shrink:0;opacity:.9;}',

    /* Field label */
    '.tds-field-label{display:block;font-size:13px;font-weight:600;color:#334155;margin:0 0 6px;}',

    /* Input */
    '.tds-input-wrap{position:relative;margin-bottom:12px;}',
    '.tds-input-icon{',
    '  position:absolute;left:14px;top:50%;transform:translateY(-50%);',
    '  color:#94a3b8;pointer-events:none;line-height:0;',
    '}',
    '.tds-input-icon svg{display:block;width:16px;height:16px;}',
    '.tds-input{',
    '  width:100%;padding:14px 14px 14px 42px;',
    '  border:1.5px solid #e2e8f0;border-radius:12px;',
    '  font-size:16px;color:#0f172a;background:#f8fafc;',
    '  outline:none;transition:border-color .2s,box-shadow .2s,background .2s;',
    '}',
    '.tds-input:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,.14);}',
    '.tds-input::placeholder{color:#94a3b8;}',
    '.tds-input--err{border-color:#dc2626;background:#fff;box-shadow:0 0 0 3px rgba(220,38,38,.12);}',
    '.tds-input--err.tds-shake{animation:tds-shake .4s;}',
    '@keyframes tds-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}',

    /* Button */
    '.tds-btn{',
    '  display:flex;align-items:center;justify-content:center;gap:8px;',
    '  width:100%;padding:15px 24px;',
    '  background:#2563eb;color:#fff;font-size:15px;font-weight:700;',
    '  border:none;border-radius:12px;cursor:pointer;',
    '  box-shadow:0 4px 14px rgba(37,99,235,.30);',
    '  transition:background .15s,transform .15s,box-shadow .15s;letter-spacing:.01em;',
    '}',
    '.tds-btn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.40);}',
    '.tds-btn:active:not(:disabled){transform:translateY(0);box-shadow:0 2px 8px rgba(37,99,235,.25);}',
    '.tds-btn:disabled{opacity:.6;cursor:wait;transform:none;}',
    '.tds-btn:focus-visible,.tds-input:focus-visible,.tds-share-btn:focus-visible{outline:2px solid #2563eb;outline-offset:2px;}',
    '.tds-error{color:#dc2626;font-size:13px;font-weight:600;margin-top:8px;min-height:18px;display:flex;align-items:center;gap:5px;}',
    '.tds-reassure{font-size:12px;color:#94a3b8;margin:12px 0 0;text-align:center;}',

    /* Spinner */
    '.tds-spinner{',
    '  width:17px;height:17px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;',
    '  border-radius:50%;animation:tds-spin .65s linear infinite;flex-shrink:0;',
    '}',
    '@keyframes tds-spin{to{transform:rotate(360deg)}}',

    /* Trust bar (light) */
    '.tds-trust-bar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:24px;padding-top:18px;border-top:1px solid #f1f5f9;}',
    '.tds-trust-label{font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:.05em;text-transform:uppercase;width:100%;text-align:center;margin-bottom:8px;}',
    '.tds-trust-badge{',
    '  display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#475569;font-weight:600;',
    '  background:#fff;border:1px solid #e2e8f0;border-radius:99px;padding:6px 13px;',
    '  box-shadow:0 1px 2px rgba(15,23,42,.04);',
    '}',

    /* Scan stage */
    '.tds-scan-hd{text-align:center;margin-bottom:28px;}',
    '.tds-scan-pulse{',
    '  width:68px;height:68px;border-radius:50%;',
    '  background:linear-gradient(135deg,#eff6ff,#dbeafe);',
    '  display:flex;align-items:center;justify-content:center;',
    '  margin:0 auto 14px;color:#2563eb;position:relative;',
    '}',
    '.tds-scan-pulse::after{',
    '  content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid #2563eb;opacity:.35;',
    '  animation:tds-ripple 1.6s ease-in-out infinite;',
    '}',
    '@keyframes tds-ripple{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.1);opacity:.1}}',
    '.tds-scan-domain{font-size:16px;font-weight:700;color:#0f172a;margin:0 0 3px;}',
    '.tds-scan-tag{font-size:13px;color:#64748b;margin:0;}',
    '.tds-steps{list-style:none;padding:0;margin:0 0 22px;}',
    '.tds-step{display:flex;align-items:center;gap:11px;padding:7px 0;font-size:13px;color:#cbd5e1;transition:color .3s;}',
    '.tds-step-dot{',
    '  width:20px;height:20px;border-radius:50%;border:2px solid #e2e8f0;flex-shrink:0;',
    '  display:flex;align-items:center;justify-content:center;font-size:10px;transition:border-color .3s,background .3s,color .3s;',
    '}',
    '.tds-step--active{color:#2563eb;}',
    '.tds-step--active .tds-step-dot{border-color:#2563eb;background:#eff6ff;animation:tds-spin .9s linear infinite;}',
    '.tds-step--done{color:#0d9488;}',
    '.tds-step--done .tds-step-dot{border-color:#0d9488;background:#f0fdfa;color:#0d9488;}',
    '.tds-prog-track{height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin-bottom:6px;}',
    '.tds-prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#0d9488);transition:width .5s ease;}',
    '.tds-prog-label{font-size:11px;color:#94a3b8;text-align:right;}',

    /* Grade hero — tinted brand band */
    '.tds-grade-hero{',
    '  display:flex;align-items:center;flex-wrap:wrap;gap:18px;margin:-28px -22px 22px;padding:24px 22px;',
    '  background:linear-gradient(135deg,#f0f7ff 0%,#eefcf9 100%);border-bottom:1px solid #e8eef6;',
    '}',
    '@media(min-width:640px){.tds-grade-hero{margin:-40px -40px 26px;padding:30px 40px;gap:22px;}}',
    '.tds-grade-col{display:flex;flex-direction:column;align-items:center;gap:7px;flex-shrink:0;}',
    '.tds-grade-badge{',
    '  width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    '  font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;',
    '  box-shadow:0 8px 24px var(--tds-glow,rgba(0,0,0,.2));',
    '}',
    '@media(min-width:640px){.tds-grade-badge{width:88px;height:88px;font-size:34px;}}',
    '.tds-grade-sm{font-size:19px;letter-spacing:0;}',
    '@media(min-width:640px){.tds-grade-sm{font-size:23px;}}',
    '.tds-grade-band{',
    '  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff;',
    '  padding:3px 9px;border-radius:99px;white-space:nowrap;',
    '}',
    '.tds-grade-info{flex:1;min-width:180px;}',
    '.tds-practice{font-size:16px;font-weight:800;color:#0f172a;margin:0 0 4px;line-height:1.3;}',
    '@media(min-width:640px){.tds-practice{font-size:19px;}}',
    '.tds-score-num{font-size:26px;font-weight:800;margin:0 0 7px;color:var(--tds-color,#0f172a);line-height:1;}',
    '.tds-score-num small{font-size:14px;font-weight:500;color:#94a3b8;}',
    /* Radial score dial — wraps the grade badge (replaces the flat score bar) */
    '.tds-grade-dial{position:relative;width:92px;height:92px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:2px;}',
    '@media(min-width:640px){.tds-grade-dial{width:112px;height:112px;}}',
    '.tds-dial-svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);}',
    '.tds-dial-track{fill:none;stroke:#e8eef6;stroke-width:6;}',
    '.tds-dial-fill{fill:none;stroke-width:6;stroke-linecap:round;stroke-dasharray:289.03;stroke-dashoffset:289.03;transition:stroke-dashoffset 1.1s cubic-bezier(0.23,1,0.32,1);}',
    '.tds-pf-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px 14px;font-size:12px;font-weight:700;}',
    '.tds-pf-row span{display:inline-flex;align-items:center;gap:4px;}',
    '.tds-pf-ic{width:14px;height:14px;flex-shrink:0;}',
    '.tds-pass-c{color:#0d9488;}.tds-fail-c{color:#dc2626;}.tds-warn-c{color:#d97706;}',

    /* Narrative */
    '.tds-narrative{',
    '  background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;',
    '  padding:14px 18px;font-size:14px;color:#1e40af;line-height:1.7;margin-bottom:22px;',
    '}',
    '.tds-narrative p{margin:0 0 12px;}',
    '.tds-narrative p:last-child{margin-bottom:0;}',
    /* Summary-first: the plain-English summary is the biggest, first thing on the report */
    '.tds-narrative--lead{font-size:16px;line-height:1.75;padding:20px 22px;margin-bottom:20px;}',
    '@media(min-width:640px){.tds-narrative--lead{font-size:17px;}}',

    /* Competitors: who AI recommends instead (familiar names make it real) */
    '.tds-competitors{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:22px;}',
    '.tds-comp-title{font-size:12px;font-weight:800;color:#9a3412;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;}',
    '.tds-comp-sub{font-size:14px;color:#7c2d12;line-height:1.6;margin:0 0 10px;}',
    '.tds-competitors ul{list-style:none;padding:0;margin:0;}',
    '.tds-competitors li{font-size:15px;font-weight:700;color:#0f172a;padding:5px 0;border-bottom:1px solid #ffedd5;}',
    '.tds-competitors li:last-child{border-bottom:none;}',

    /* Gate: 2-col name row on wider screens */
    '.tds-name-row{display:flex;flex-direction:column;gap:0;}',
    '@media(min-width:480px){.tds-name-row{flex-direction:row;gap:10px;}.tds-name-row .tds-input-wrap{flex:1;}}',

    /* Section label */
    '.tds-sec-label{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px;}',
    '.tds-teaser-hint{font-size:13px;color:#64748b;margin:0 0 14px;}',

    /* Category groups */
    '.tds-cat-group{background:#fafbfc;border:1px solid #eef2f7;border-radius:12px;padding:14px 16px;margin-bottom:10px;position:relative;}',
    '.tds-cat-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}',
    '.tds-cat-title{font-size:12px;font-weight:800;color:#475569;letter-spacing:.02em;margin:0;display:flex;align-items:center;gap:6px;}',
    '.tds-lock{font-size:11px;opacity:.6;}',
    '.tds-cat-score{font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px;background:#e2e8f0;color:#475569;}',
    '.tds-cat-score--good{background:#d1fae5;color:#065f46;}',
    '.tds-cat-score--warn{background:#fef3c7;color:#92400e;}',
    '.tds-cat-score--bad{background:#fee2e2;color:#991b1b;}',
    '.tds-cat-score--info{background:#e0e7ff;color:#3730a3;}',

    /* Check items */
    '.tds-checks{list-style:none;padding:0;margin:0;}',
    '.tds-check-item{display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9;animation:tds-fade-up .4s cubic-bezier(0.23,1,0.32,1) both;}',
    '.tds-check-item:nth-child(1){animation-delay:.03s}.tds-check-item:nth-child(2){animation-delay:.07s}.tds-check-item:nth-child(3){animation-delay:.11s}.tds-check-item:nth-child(4){animation-delay:.15s}.tds-check-item:nth-child(5){animation-delay:.19s}.tds-check-item:nth-child(6){animation-delay:.23s}.tds-check-item:nth-child(7){animation-delay:.27s}.tds-check-item:nth-child(n+8){animation-delay:.3s}',
    '.tds-check-item:last-child{border-bottom:none;}',
    '.tds-ci{flex-shrink:0;width:20px;height:20px;margin-top:1px;}',
    '.tds-cl{font-size:13px;font-weight:600;color:#0f172a;margin:0 0 2px;}',
    '.tds-cd{font-size:12px;color:#64748b;margin:0;line-height:1.5;}',
    '.tds-blur{filter:blur(5px);user-select:none;pointer-events:none;opacity:.5;}',
    '.tds-check-item--info .tds-cl{color:#4338ca;}',

    /* Gated region: blurred groups + fade into the gate */
    '.tds-gated{position:relative;}',
    '.tds-gated::after{',
    '  content:"";position:absolute;left:0;right:0;bottom:0;height:70%;pointer-events:none;',
    '  background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,#fff 92%);border-radius:0 0 12px 12px;',
    '}',

    /* Gate box — prominent, the conversion moment */
    '.tds-gate-box{',
    '  background:linear-gradient(135deg,#eff6ff,#f0fdfa);',
    '  border:1.5px solid #bfdbfe;border-radius:16px;padding:22px 20px;text-align:center;margin-top:6px;',
    '}',
    '@media(min-width:640px){.tds-gate-box{padding:28px;}}',
    '.tds-gate-box h3{font-size:18px;font-weight:800;color:#0f172a;margin:0 0 6px;}',
    '@media(min-width:640px){.tds-gate-box h3{font-size:21px;}}',
    '.tds-gate-box p{font-size:14px;color:#475569;margin:0 0 18px;line-height:1.55;}',
    '.tds-gate-box .tds-field-label,.tds-gate-box .tds-error{text-align:left;}',

    /* Share button */
    '.tds-share-btn{',
    '  display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:11px 16px;',
    '  background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;',
    '  font-size:13px;font-weight:700;color:#475569;cursor:pointer;transition:background .15s,border-color .15s,color .15s;margin-bottom:22px;min-height:44px;',
    '}',
    '.tds-share-btn:hover{background:#f1f5f9;border-color:#cbd5e1;color:#0f172a;}',
    '.tds-share-btn.copied{background:#f0fdfa;border-color:#a7f3d0;color:#0d9488;}',

    /* Failure-recovery link styled as a real (tappable) button */
    '.tds-retry{display:inline-block;margin-top:10px;padding:11px 18px;background:#fff;border:1.5px solid #cbd5e1;',
    '  border-radius:10px;color:#2563eb;font-weight:700;font-size:13px;text-decoration:none;min-height:44px;}',
    '.tds-retry:hover{background:#f1f5f9;}',
    /* Visually-hidden, still announced by screen readers */
    '.tds-sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}',

    '.tds-divider{border:none;border-top:1px solid #f1f5f9;margin:22px 0;}',

    /* CTA block */
    '.tds-cta-block{background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#0f766e 100%);border-radius:16px;padding:28px 22px;text-align:center;}',
    '.tds-cta-block h3{font-size:18px;font-weight:800;color:#fff;margin:0 0 8px;}',
    '@media(min-width:640px){.tds-cta-block h3{font-size:21px;}}',
    '.tds-cta-block p{font-size:14px;color:rgba(255,255,255,.85);margin:0 0 20px;line-height:1.6;}',
    '.tds-cta-btn{',
    '  display:inline-flex;align-items:center;gap:6px;padding:13px 28px;background:#fff;color:#1d4ed8;',
    '  font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;',
    '  box-shadow:0 4px 18px rgba(0,0,0,.22);transition:transform .15s,box-shadow .15s;',
    '}',
    '.tds-cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(0,0,0,.3);}',

    /* Respect reduced-motion */
    '@media(prefers-reduced-motion:reduce){',
    '  #tds-ai-scanner *,#tds-ai-scanner *::before,#tds-ai-scanner *::after{',
    '    animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}',
    '}'
  ].join('');

  // ─── SVG Icons ───────────────────────────────────────────────────────────────
  function svgPass() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#d1fae5"/><path d="M6 10l3 3 5-5" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function svgFail() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#fee2e2"/><path d="M7 7l6 6M13 7l-6 6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function svgPartial() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#fef3c7"/><path d="M10 6v5M10 13v1" stroke="#d97706" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function svgInfo() {
    return '<svg class="tds-ci" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#e0e7ff"/><path d="M10 9v5M10 7v1" stroke="#4338ca" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  // Brand mark — magnifier + spark = "AI visibility scan" (inherits currentColor)
  function svgBrand() {
    return '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">' +
      '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M15.8 15.8 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M10.5 6.7l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="currentColor"/>' +
      '</svg>';
  }
  function svgLock() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" style="vertical-align:-3px;margin-right:7px">' +
      '<rect x="5" y="10.5" width="14" height="8.5" rx="2" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="2"/>' +
      '</svg>';
  }
  function svgLink() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true" style="vertical-align:-2px;margin-right:6px">' +
      '<path d="M9 15l6-6M10.5 6.5l1-1a4 4 0 0 1 6 6l-2 2M13.5 17.5l-1 1a4 4 0 0 1-6-6l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }
  function svgGlobe() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" stroke="currentColor" stroke-width="1.8"/></svg>';
  }
  function svgMail() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function svgShare() { return svgLink(); }
  function svgUser() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M4.5 20c1.5-3.5 4.2-5 7.5-5s6 1.5 7.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }
  function svgPhone() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }

  // Narrative → paragraphs (engine writes short paragraphs separated by blank
  // lines — Gabriel: never one massive block).
  function renderNarrative(text, lead) {
    if (!text) return '';
    var paras = String(text).split(/\n{2,}/).map(function (p) {
      return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    return '<div class="tds-narrative' + (lead ? ' tds-narrative--lead' : '') + '">' + paras + '</div>';
  }

  // Competitor practices that DO show up in AI answers (familiar names).
  function renderCompetitors(comps, city) {
    if (!comps || !comps.length) return '';
    var items = comps.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
    return [
      '<div class="tds-competitors">',
      '<p class="tds-comp-title">Who patients see instead of you</p>',
      '<p class="tds-comp-sub">When people ask AI for a dentist' + (city ? ' in ' + esc(city) : ' near you') + ', these names come up:</p>',
      '<ul>' + items + '</ul>',
      '</div>'
    ].join('');
  }

  // Small (14px) crisp marks for the pass / to-fix / unverified tally row
  function pfMark(kind) {
    var p = {
      pass: '<path d="M5 10l3 3 7-7" stroke="#0d9488" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      fail: '<path d="M6 6l8 8M14 6l-8 8" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/>',
      warn: '<path d="M10 5v6M10 13.5v1" stroke="#d97706" stroke-width="2.2" stroke-linecap="round"/>'
    }[kind];
    return '<svg class="tds-pf-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">' + p + '</svg>';
  }

  function statusSvg(s, isInfo) {
    if (isInfo) return svgInfo();
    return s === 'pass' ? svgPass() : s === 'fail' ? svgFail() : svgPartial();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function gradeInfo(grade) { return GRADES[grade] || GRADES['Not Found']; }

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

  // Ordered category keys for a set of groups (known order first, then any extras)
  function orderedKeys(groups) {
    var keys = CATEGORY_ORDER.filter(function (k) { return groups[k]; });
    Object.keys(groups).forEach(function (k) { if (keys.indexOf(k) === -1) keys.push(k); });
    return keys;
  }

  function catScoreClass(pass, total) {
    if (total === 0) return 'tds-cat-score--info';
    var pct = pass / total;
    if (pct >= 0.8) return 'tds-cat-score--good';
    if (pct >= 0.5) return 'tds-cat-score--warn';
    return 'tds-cat-score--bad';
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Render a single category group. `blur` controls which rows are blurred:
  //   true  -> all rows blurred (locked tease)   false -> none blurred
  //   fn(i) -> blur row i (used to split a single-category teaser by row)
  function renderCategoryGroup(cat, catChecks, blur) {
    var blurFn = (typeof blur === 'function') ? blur : function () { return blur === true; };
    var isInfoCat = cat === 'informational';
    var label = CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ');
    var scoreable = catChecks.filter(function (c) { return c.scoreable !== false && !isInfoCat; });
    var passed = scoreable.filter(function (c) { return c.status === 'pass'; }).length;
    var total = scoreable.length;
    var scoreLabel = isInfoCat ? 'Info' : (passed + '/' + total);
    var scoreClass = isInfoCat ? 'tds-cat-score--info' : catScoreClass(passed, total);
    var allBlurred = catChecks.length > 0 && catChecks.every(function (c, i) { return blurFn(i); });

    var items = catChecks.map(function (c, i) {
      var rowBlur = blurFn(i);
      var cls = rowBlur ? 'tds-check-item tds-blur' : (isInfoCat ? 'tds-check-item tds-check-item--info' : 'tds-check-item');
      return [
        '<li class="' + cls + '"' + (rowBlur ? ' aria-hidden="true"' : '') + '>',
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
      '<p class="tds-cat-title">' + (allBlurred ? svgLock() : '') + esc(label) + '</p>',
      '<span class="tds-cat-score ' + scoreClass + '">' + scoreLabel + '</span>',
      '</div>',
      '<ul class="tds-checks">' + items + '</ul>',
      '</div>'
    ].join('');
  }

  // Full checklist (all groups, never blurred) — used in the unlocked report.
  function renderChecklist(checks) {
    var groups = groupByCategory(checks);
    return orderedKeys(groups).map(function (cat) {
      return renderCategoryGroup(cat, groups[cat], false);
    }).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    xhr.onerror = function () { cb('Network error, please try again'); };
    xhr.send(JSON.stringify(body));
  }

  // Move keyboard/SR focus to the freshly-rendered stage so AT users aren't
  // stranded on <body> after an innerHTML swap. Prefers a heading if present.
  function focusStage(root) {
    var target = root.querySelector('h2') || root.querySelector('.tds-card');
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: false }); } catch (e) { try { target.focus(); } catch (e2) {} }
  }

  function setLoading(btn, on, loadingText, idleHtml) {
    if (on) { btn.disabled = true; btn.innerHTML = '<span class="tds-spinner"></span>' + loadingText; }
    else { btn.disabled = false; btn.innerHTML = idleHtml; }
  }

  // ─── Stage 1 — Domain Form ───────────────────────────────────────────────────
  function renderStage1(root) {
    root.innerHTML = [
      '<div class="tds-card">',
      '<div class="tds-hero-icon" aria-hidden="true">' + svgBrand() + '</div>',
      '<h2 class="tds-headline">Is your dental practice invisible to AI?</h2>',
      '<p class="tds-sub">ChatGPT and Gemini are the new search engines for patients.',
      ' Run a free scan to see if your practice shows up, and exactly what to fix if it doesn’t.</p>',
      '<div class="tds-pills">',
      '<span class="tds-pill"><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Free</span>',
      '<span class="tds-pill"><svg viewBox="0 0 16 16" fill="none"><path d="M5 4h8M5 8h8M5 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>16 checks</span>',
      '<span class="tds-pill"><svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Results in ~90s</span>',
      '</div>',
      '<label class="tds-field-label" for="tds-d">Your practice website</label>',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon" aria-hidden="true">' + svgGlobe() + '</span>',
      '<input id="tds-d" class="tds-input" type="text" inputmode="url" placeholder="yourpractice.com"',
      ' autocomplete="off" autocorrect="off" spellcheck="false" aria-describedby="tds-e1">',
      '</div>',
      '<div id="tds-e1" class="tds-error" role="alert"></div>',
      '<button id="tds-sb" class="tds-btn" type="button">Check my AI visibility →</button>',
      '<div class="tds-trust-bar">',
      '<span class="tds-trust-label">Checks visibility across</span>',
      '<span class="tds-trust-badge">ChatGPT</span>',
      '<span class="tds-trust-badge">Gemini</span>',
      '<span class="tds-trust-badge">Perplexity</span>',
      '<span class="tds-trust-badge">Copilot</span>',
      '</div>',
      '</div>'
    ].join('');

    var input = root.querySelector('#tds-d');
    var btn   = root.querySelector('#tds-sb');
    var err   = root.querySelector('#tds-e1');
    var idle  = 'Check my AI visibility →';

    function submit() {
      err.textContent = '';
      var raw = input.value.trim();
      if (!raw) {
        err.textContent = 'Please enter your practice website.';
        flagError(input);
        return;
      }
      var domain = normalizeDomain(raw);
      setLoading(btn, true, 'Starting scan…', idle);
      post(N8N_TEASER, { domain: domain }, function (e, data) {
        if (e || !data || !data.scan_id) {
          err.textContent = e || 'Could not start the scan. Please try again.';
          setLoading(btn, false, '', idle);
          return;
        }
        renderStage2Polling(root, domain, data.scan_id);
      });
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    input.addEventListener('input', function () { input.classList.remove('tds-input--err', 'tds-shake'); err.textContent = ''; });
  }

  function flagError(input) {
    input.classList.add('tds-input--err', 'tds-shake');
    try { input.focus(); } catch (e) {}
    setTimeout(function () { input.classList.remove('tds-shake'); }, 450);
  }

  // ─── Stage 2a — Scanning Animation ──────────────────────────────────────────
  function renderStage2Polling(root, domain, scanId) {
    var stepDots = SCAN_STEPS.map(function (s, i) {
      return '<li class="tds-step' + (i === 0 ? ' tds-step--active' : '') + '">' +
        '<span class="tds-step-dot" aria-hidden="true"></span>' + s + '</li>';
    }).join('');

    root.innerHTML = [
      '<div class="tds-card">',
      '<div class="tds-scan-hd">',
      '<div class="tds-scan-pulse" aria-hidden="true">' + svgBrand() + '</div>',
      '<h2 class="tds-scan-domain"><span class="tds-sr-only">Scanning </span>' + esc(domain) + '</h2>',
      '<p class="tds-scan-tag">Checking 16 AI visibility signals…</p>',
      '</div>',
      '<ul class="tds-steps" id="tds-steps">' + stepDots + '</ul>',
      '<div class="tds-prog-track" id="tds-pt" role="progressbar" aria-label="Scan progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">',
      '<div class="tds-prog-fill" id="tds-pf" style="width:4%"></div></div>',
      '<p class="tds-prog-label" id="tds-pl">0%</p>',
      '<p class="tds-sr-only" id="tds-status" role="status" aria-live="polite"></p>',
      '</div>'
    ].join('');

    focusStage(root);

    var progFill  = root.querySelector('#tds-pf');
    var progLabel = root.querySelector('#tds-pl');
    var progTrack = root.querySelector('#tds-pt');
    var statusEl  = root.querySelector('#tds-status');
    var stepEls   = root.querySelectorAll('.tds-step');
    var attempt   = 0;
    var stepIdx   = 0;

    function tick() {
      attempt++;
      var pct = Math.min(94, 4 + Math.floor(attempt / POLL_MAX * 90));
      progFill.style.width = pct + '%';
      progLabel.textContent = pct + '%';
      progTrack.setAttribute('aria-valuenow', pct);

      var newStepIdx = Math.min(SCAN_STEPS.length - 1, Math.floor(attempt / (POLL_MAX / SCAN_STEPS.length)));
      if (newStepIdx > stepIdx) {
        stepEls[stepIdx].className = 'tds-step tds-step--done';
        stepEls[stepIdx].querySelector('.tds-step-dot').textContent = '✓';
        stepIdx = newStepIdx;
        if (stepEls[stepIdx]) stepEls[stepIdx].className = 'tds-step tds-step--active';
        statusEl.textContent = 'Scanning, step ' + (stepIdx + 1) + ' of ' + SCAN_STEPS.length + '… ' + pct + '%';
      }

      if (attempt > POLL_MAX) {
        root.innerHTML = '<div class="tds-card"><p style="color:#dc2626;font-size:14px;text-align:center;margin:0 0 6px">' +
          'Scan is taking longer than expected.</p><p style="text-align:center;margin:0">' +
          '<a class="tds-retry" href="' + window.location.pathname + '">Try again →</a></p></div>';
        focusStage(root);
        return;
      }

      post(N8N_POLL, { scan_id: scanId }, function (e, data) {
        if (e || !data) { setTimeout(tick, POLL_INTERVAL); return; }
        if (data.status === 'complete') {
          progFill.style.width = '100%';
          progLabel.textContent = '100%';
          progTrack.setAttribute('aria-valuenow', 100);
          statusEl.textContent = 'Scan complete, loading your report.';
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

  // Shared grade-hero markup
  // tally = {pass, fail, unverified} or null. The unverified count keeps the
  // numbers honest (could_not_verify checks are neither pass nor fail).
  function gradeHero(info, name, score, tally) {
    var pfRow = '';
    if (tally) {
      var parts = ['<span class="tds-pass-c">' + pfMark('pass') + tally.pass + ' passed</span>',
                   '<span class="tds-fail-c">' + pfMark('fail') + tally.fail + ' to fix</span>'];
      if (tally.unverified) parts.push('<span class="tds-warn-c">' + pfMark('warn') + tally.unverified + ' unverified</span>');
      pfRow = '<div class="tds-pf-row">' + parts.join('') + '</div>';
    }
    return [
      '<div class="tds-grade-hero">',
      '<div class="tds-grade-col">',
      '<div class="tds-grade-dial">',
      '<svg class="tds-dial-svg" viewBox="0 0 100 100" aria-hidden="true">',
      '<circle class="tds-dial-track" cx="50" cy="50" r="46"></circle>',
      '<circle class="tds-dial-fill" cx="50" cy="50" r="46" data-w="' + score + '" style="stroke:' + info.color + '"></circle>',
      '</svg>',
      '<div class="tds-grade-badge' + (info.label.length > 2 ? ' tds-grade-sm' : '') + '"',
      ' style="background:' + info.color + ';box-shadow:0 8px 24px ' + info.glow + '" aria-hidden="true">',
      esc(info.label) + '</div>',
      '</div>',
      '<span class="tds-grade-band" style="background:' + info.color + '"><span class="tds-sr-only">AI visibility grade: </span>' + esc(info.band) + '</span>',
      '</div>',
      '<div class="tds-grade-info">',
      '<h2 class="tds-practice">' + esc(name) + '</h2>',
      '<p class="tds-score-num" style="color:' + info.color + '">' + Math.round(score) + '<small> / 100</small></p>',
      pfRow,
      '</div></div>'
    ].join('');
  }

  // Animate score bars to their target width after paint
  function animateBars(root) {
    var C = 289.03; // circumference of the r=46 score dial
    var dials = root.querySelectorAll('.tds-dial-fill');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        for (var i = 0; i < dials.length; i++) {
          var w = parseFloat(dials[i].getAttribute('data-w')) || 0;
          if (w < 0) w = 0; if (w > 100) w = 100;
          dials[i].style.strokeDashoffset = (C * (1 - w / 100)).toFixed(2);
        }
      });
    });
  }

  // ─── Stage 2b — Teaser + Email Gate ─────────────────────────────────────────
  function renderStage2Teaser(root, domain, scanId, teaserData) {
    var grade  = teaserData.grade || 'Not Found';
    var score  = teaserData.score != null ? teaserData.score : 0;
    var info   = gradeInfo(grade);
    var checks = (teaserData.diagnostics && teaserData.diagnostics.checks) || [];
    var name   = teaserData.practice_name || domain;

    // Category-coherent gating. Fixes the old duplicated-category-header bug
    // (it sliced checks 0–4 / 4–10 across a category boundary). Handles three
    // shapes so the gate never promises "0 remaining checks":
    //   • no checks      -> simple gate, no counts
    //   • one category   -> reveal first rows, blur the rest (row-level split)
    //   • many categories-> reveal first category fully, lock the rest
    var groups = groupByCategory(checks);
    var keys   = orderedKeys(groups);
    var checksHtml = '', shownCount = 0, lockedCount = 0;

    if (checks.length === 0) {
      checksHtml = '';
    } else if (keys.length <= 1) {
      var only = groups[keys[0]];
      var revealN = Math.min(only.length, Math.max(3, Math.ceil(only.length / 3)));
      if (revealN >= only.length && only.length > 1) revealN = only.length - 1; // always keep at least 1 locked
      shownCount = revealN;
      lockedCount = only.length - revealN;
      checksHtml = '<div class="tds-gated">' +
        renderCategoryGroup(keys[0], only, function (i) { return i >= revealN; }) + '</div>';
    } else {
      var revealKey = keys[0], lockedKeys = keys.slice(1);
      shownCount = groups[revealKey].length;
      lockedCount = lockedKeys.reduce(function (n, k) { return n + groups[k].length; }, 0);
      checksHtml = renderCategoryGroup(revealKey, groups[revealKey], false) +
        '<div class="tds-gated">' + lockedKeys.map(function (k) {
          return renderCategoryGroup(k, groups[k], true);
        }).join('') + '</div>';
    }

    var hint = checks.length
      ? ('<p class="tds-teaser-hint">Showing <strong>' + shownCount + '</strong> of <strong>' + checks.length +
         '</strong> checks. Unlock the full report below for free.</p>')
      : '';
    var gateTitle = checks.length ? ('Unlock your full ' + checks.length + '-point report') : 'Unlock your full report';
    var gateSub = lockedCount > 0
      ? ('See all ' + lockedCount + ' remaining checks and get the full report sent to your inbox as a PDF.')
      : 'Get the full report sent to your inbox as a PDF.';

    // Summary-first (Gabriel): the plain-English summary is the FIRST and
    // biggest thing on the initial report, before the email gate. The
    // competitors block follows it, then the score, then the teaser checks.
    var narrative   = (teaserData.diagnostics && teaserData.diagnostics.narrative) || teaserData.narrative || '';
    var competitors = (teaserData.diagnostics && teaserData.diagnostics.competitors) || teaserData.competitors || [];
    var city        = teaserData.city || (teaserData.diagnostics && teaserData.diagnostics.city) || null;

    root.innerHTML = [
      '<div class="tds-card" style="--tds-color:' + info.color + ';--tds-glow:' + info.glow + '">',
      renderNarrative(narrative, true),
      renderCompetitors(competitors, city),
      gradeHero(info, name, score, null),

      hint,
      checksHtml,

      '<div class="tds-gate-box">',
      '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#0d9488;">You’re getting access to one of our most exclusive tools FOR FREE</p>',
      '<h3>' + svgLock() + gateTitle + '</h3>',
      '<p>' + gateSub + '</p>',
      '<div class="tds-name-row">',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon" aria-hidden="true">' + svgUser() + '</span>',
      '<input id="tds-fn" class="tds-input" type="text" autocomplete="given-name" placeholder="First name" aria-label="First name" aria-required="true" required>',
      '</div>',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon" aria-hidden="true">' + svgUser() + '</span>',
      '<input id="tds-ln" class="tds-input" type="text" autocomplete="family-name" placeholder="Last name" aria-label="Last name" aria-required="true" required>',
      '</div>',
      '</div>',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon" aria-hidden="true">' + svgMail() + '</span>',
      '<input id="tds-em" class="tds-input" type="email" autocomplete="email" inputmode="email"',
      ' placeholder="doctor@yourpractice.com" aria-label="Work email" aria-describedby="tds-e2" aria-required="true" required>',
      '</div>',
      '<div class="tds-input-wrap">',
      '<span class="tds-input-icon" aria-hidden="true">' + svgPhone() + '</span>',
      '<input id="tds-ph" class="tds-input" type="tel" autocomplete="tel" inputmode="tel"',
      ' placeholder="Phone number" aria-label="Phone number" aria-required="true" required>',
      '</div>',
      '<div id="tds-e2" class="tds-error" role="alert"></div>',
      '<button id="tds-gb" class="tds-btn" type="button">Unlock full report →</button>',
      '<p class="tds-reassure">Required to generate your report. No spam, unsubscribe anytime.</p>',
      '</div>',

      '</div>'
    ].join('');

    focusStage(root);
    animateBars(root);

    var firstInput = root.querySelector('#tds-fn');
    var lastInput  = root.querySelector('#tds-ln');
    var emailInput = root.querySelector('#tds-em');
    var phoneInput = root.querySelector('#tds-ph');
    var gateBtn    = root.querySelector('#tds-gb');
    var err        = root.querySelector('#tds-e2');
    var idle       = 'Unlock full report →';
    var fields     = [firstInput, lastInput, emailInput, phoneInput];

    function unlock() {
      err.textContent = '';
      var first = firstInput.value.trim();
      var last  = lastInput.value.trim();
      var email = emailInput.value.trim();
      var phone = phoneInput.value.trim();
      if (!first) { err.textContent = 'Please enter your first name.'; flagError(firstInput); return; }
      if (!last)  { err.textContent = 'Please enter your last name.';  flagError(lastInput);  return; }
      if (!isValidEmail(email)) {
        err.textContent = email ? 'That email doesn’t look right, please check it.' : 'Please enter your work email to unlock.';
        flagError(emailInput);
        return;
      }
      if (phone.replace(/\D/g, '').length < 7) {
        err.textContent = phone ? 'That phone number doesn’t look right, please check it.' : 'Please enter your phone number.';
        flagError(phoneInput);
        return;
      }
      setLoading(gateBtn, true, 'Generating your report…', idle);
      var payload = { scan_id: scanId, email: email, first_name: first, last_name: last, phone: phone };
      if (teaserData.practice_name) payload.name = teaserData.practice_name;
      post(N8N_GATE, payload, function (e, data) {
        if (e || !data || data.ok === false) {
          err.textContent = e || 'Something went wrong unlocking your report. Please try again.';
          setLoading(gateBtn, false, '', idle);
          return;
        }
        renderStage3Report(root, data);
      });
    }

    gateBtn.addEventListener('click', unlock);
    fields.forEach(function (input) {
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') unlock(); });
      input.addEventListener('input', function () { input.classList.remove('tds-input--err', 'tds-shake'); err.textContent = ''; });
    });
  }

  // ─── Stage 3 — Full Report ───────────────────────────────────────────────────
  function renderStage3Report(root, data) {
    var grade     = data.grade || 'Not Found';
    var score     = data.score != null ? data.score : 0;
    var info      = gradeInfo(grade);
    var checks    = (data.diagnostics && data.diagnostics.checks) || [];
    var name      = data.practice_name || data.domain || 'Your practice';
    var narrative = data.narrative || '';
    var competitors = data.competitors || (data.diagnostics && data.diagnostics.competitors) || [];
    var city      = data.city || (data.diagnostics && data.diagnostics.city) || null;
    var shareUrl  = data.report_url || window.location.href;

    var scoreable = checks.filter(function (c) { return c.scoreable !== false; });
    var passN = scoreable.filter(function (c) { return c.status === 'pass'; }).length;
    var failN = scoreable.filter(function (c) { return c.status === 'fail'; }).length;
    var unverN = scoreable.filter(function (c) { return c.status === 'could_not_verify'; }).length;

    root.innerHTML = [
      '<div class="tds-card" style="--tds-color:' + info.color + ';--tds-glow:' + info.glow + '">',
      renderNarrative(narrative, true),
      renderCompetitors(competitors, city),
      gradeHero(info, name, score, { pass: passN, fail: failN, unverified: unverN }),

      '<button class="tds-share-btn" id="tds-share-btn" type="button">' + svgShare() + ' Copy shareable link</button>',

      '<p class="tds-sec-label">Full ' + checks.length + '-point breakdown</p>',
      renderChecklist(checks),

      '<hr class="tds-divider">',

      '<div class="tds-cta-block">',
      '<h3>Feeling overwhelmed by all this?</h3>',
      '<p style="margin:0 0 4px;font-weight:700;">We got you.</p>',
      '<p>Book a call with our team, and we’ll go over your report with you and explain it in plain, simple English.</p>',
      '<a class="tds-cta-btn" href="' + BOOK_A_CALL_URL + '" target="_blank" rel="noopener">BOOK A CALL HERE</a>',
      '</div>',

      '</div>'
    ].join('');

    focusStage(root);
    animateBars(root);

    var shareBtn = root.querySelector('#tds-share-btn');
    shareBtn.addEventListener('click', function () { copyLink(shareBtn, shareUrl); });
  }

  function copyLink(shareBtn, shareUrl) {
    function done() {
      shareBtn.textContent = '✓ Link copied!';
      shareBtn.className = 'tds-share-btn copied';
      setTimeout(function () {
        shareBtn.innerHTML = svgShare() + ' Copy shareable link';
        shareBtn.className = 'tds-share-btn';
      }, 2500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(done, function () { fallbackCopy(shareUrl, done); });
    } else {
      fallbackCopy(shareUrl, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  // ─── Public result (shareable ?r=SLUG) ───────────────────────────────────────
  function renderPublicResult(root, slug) {
    root.innerHTML = [
      '<div class="tds-card">',
      '<div style="text-align:center;padding:32px 0">',
      '<div class="tds-scan-pulse" style="margin:0 auto 14px" aria-hidden="true">' + svgBrand() + '</div>',
      '<p style="color:#64748b;font-size:14px">Loading report…</p>',
      '</div></div>'
    ].join('');

    post(N8N_RESULT, { slug: slug }, function (e, data) {
      if (e || !data || data.detail) {
        root.innerHTML = '<div class="tds-card"><p style="color:#dc2626;text-align:center;font-size:14px;margin:0 0 6px">Report not found or expired.</p>' +
          '<p style="text-align:center;margin:0"><a class="tds-retry" href="' + window.location.pathname + '">Run a new scan →</a></p></div>';
        focusStage(root);
        return;
      }
      renderStage3Report(root, {
        grade: data.grade,
        score: data.score,
        practice_name: data.practice_name,
        domain: data.domain,
        city: data.city || null,
        narrative: data.narrative || null,
        competitors: data.competitors || [],
        diagnostics: { checks: data.checks || (data.diagnostics && data.diagnostics.checks) || [] },
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

    if (!document.getElementById('tds-ai-scanner-css')) {
      var style = document.createElement('style');
      style.id = 'tds-ai-scanner-css';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

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
