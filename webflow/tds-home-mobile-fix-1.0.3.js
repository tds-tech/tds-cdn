/* TDS homepage — mobile layout + nav-parity + founder-copy fix v1.0.3
   Loaded from tds-cdn in the Webflow footer. Three jobs, all idempotent:
   (A) inject responsive CSS that reflows sections Webflow left at hardcoded desktop
       widths (testimonials grids/slider, founder quote, services cards, nav pill);
   (B) mirror the desktop nav menu into the phone menu (adds missing links, fixes typo);
   (C) founder copy 3rd->1st person on / and /about-us (incl. 'himto' typo).
   Desktop layout (>=992px) is never touched: every CSS rule is under max-width<=991. */
(function(){'use strict';
  /* (A) CSS */
  if(!document.getElementById('tds-home-mobile-fix-css')){
    var st=document.createElement('style');st.id='tds-home-mobile-fix-css';
    st.textContent="/* ===== TDS homepage \u2014 mobile layout fixes (loaded after Webflow CSS) ===== */\n\n/* (1) TESTIMONIALS \u2014 built with hardcoded desktop px widths never reset for mobile:\n   grids 1410/1400px, .video-6 420px, Wistia <iframe width=\"940\">. They force the\n   section to ~1445px, so the centered heading/content is clipped to the middle slice.\n   Cascade-cap the subtree to its container, and stack the two video rows. */\n@media screen and (max-width:991px){\n  .testimonial-section, .testimonial-section *{max-width:100%!important}\n  .grid_testimonials-2,.grid-video,.grid-video-copy{width:auto!important;height:auto!important}\n}\n@media screen and (max-width:767px){\n  .grid_testimonials-2,.grid-video,.grid-video-copy{\n    display:flex!important;flex-direction:column!important;\n    grid-template-columns:none!important;grid-template-areas:none!important;\n    grid-template:none!important;gap:2rem!important;align-items:stretch!important}\n  .video-testimonials,.video-testimonials.more,.wrapper-only,.video-6{width:100%!important}\n}\n\n/* (2) SERVICES CARDS \u2014 .grid_services keeps a 2-column grid-template-areas (\". Area\"/\n   \". .\") that is never cleared, so the <=479 single-column rule (grid-template-columns:\n   1.5fr) is overridden -> two cramped columns with the right card clipped off-screen.\n   Stack to one column on phones (matches Webflow's intended <=479 layout). */\n@media screen and (max-width:479px){\n  .grid_services,.grid_services.align-right{\n    display:flex!important;flex-direction:column!important;\n    grid-template:none!important;gap:2rem!important}\n  .feature-item,.feature-item.left-item,.feature-item.left-item.change{\n    width:100%!important;left:0!important;min-height:auto!important}\n}\n\n/* (3) NAVBAR \u2014 mobile nav pill .container-large.navbar is width:115% -> ~50px overflow. */\n@media screen and (max-width:991px){\n  .container-large.navbar{width:100%!important}\n}\n\n/* (3) FOUNDER \u2014 base .right_component{margin-top:-105px} drags the mobile quote up\n   over \"Gabriel Segall\". Neutralize on the mobile-only copy. */\n@media screen and (max-width:991px){\n  .right_component.hide-desktop{margin-top:1.5rem!important;top:0!important}\n}\n\n/* (4) NAVBAR bar height (mobile) \u2014 the phone logo .img_brand carries padding-top:44px and\n   renders ~89px tall, so the white nav pill is ~113px with a big empty gap above the logo.\n   Drop the top padding, size the logo to the button height, tighten the pill to a thin bar. */\n@media screen and (max-width:991px){\n  .navbar.hide-desktop .img_brand{padding-top:0!important;height:44px!important;width:auto!important}\n  .navbar.hide-desktop .container-large.navbar{margin-top:0!important;padding-top:12px!important;padding-bottom:12px!important}\n}\n\n/* (5) RESULTS / STATS section (phones) \u2014 the h2 is 64px (wraps to ~5 one-word lines and\n   swallows the screen) and the \"Tap into the goldmine...\" subtitle has margin-top:-31px so\n   it collides with the heading. Right-size + center the heading, restore breathing room under\n   it, and tighten the 48px row gap between the stat blocks. */\n@media screen and (max-width:767px){\n  .section_results .heading-style-h2{font-size:2.25rem!important;line-height:1.15!important;text-align:center!important}\n  .section_results .text-block-12{margin-top:1rem!important}\n  .section_results .grid-results{row-gap:1.75rem!important}\n}\n\n/* (6) FOUNDER photo (phones) \u2014 .img_founder is position:relative;top:-81px (a desktop\n   upward-overlap effect) so on phones the photo pokes up out of the purple founder section\n   into the white services section above. Drop it back into its box so it sits inside purple. */\n@media screen and (max-width:767px){\n  .section_founder .img_founder{top:0!important}\n}\n\n/* (7) OTHER PAGES: /referral /about-us /resources \u2014 QA 2026-07-02 (ClickUp 86e21npux).\n   Decorative absolutely-positioned bg <img>s carry desktop left offsets never reset for\n   mobile, pushing the document to 420-527px wide -> whole page pans and content renders\n   cut off on the left. Re-anchor the two wide backdrops to their container; hide the two\n   small founder decorations (the founder squiggle and the floating smile badge \u2014 the\n   smile's containing block resolves wider than its offsetParent, so right-pinning cannot\n   converge; they're ornamental on phones). Left-only overflow (.bg-svg_steps.about) is\n   clipped by the browser and creates no scroll, so it stays. */\n@media screen and (max-width:991px){\n  .bg-svg_steps.header,.bg-svg_steps.fb{left:0!important;right:auto!important}\n  .bg-svg_steps.founder,.img_dental-smile{display:none!important}\n}\n";
    document.head.appendChild(st);
  }
  /* (B) nav parity */
  /* TDS — keep the mobile nav menu in parity with desktop.
   The phone menu is a separate Webflow symbol that drifted: it is missing
   Get Hispanic Patients / Blog / Referral and has a typo ("Our Philosphy").
   Mirror the desktop .nav-menu link list into the mobile one (identical markup,
   so styling is inherited). Idempotent; coexists with the Free-AI-Scan injector. */
(function () {
  var DESK = '.navbar.hide-tablet .nav-menu';
  var MOB  = '.navbar.hide-desktop .nav-menu';
  var obs;
  function label(a){ var t=a.querySelector('.text-size-regular'); return t ? t.textContent.trim() : ''; }
  function sync() {
    var dn = document.querySelector(DESK), mn = document.querySelector(MOB);
    if (!dn || !mn) return;
    var desk = [].slice.call(dn.querySelectorAll('a.angled-line-button'));
    if (!desk.length) return;
    var want = desk.map(function(a){ return a.getAttribute('href'); });
    var deskLabel = {}; desk.forEach(function(a){ deskLabel[a.getAttribute('href')] = label(a); });

    var have = [].slice.call(mn.querySelectorAll('a.angled-line-button'));
    var haveHref = have.map(function(a){ return a.getAttribute('href'); });

    // typo / label drift fix on existing mobile links
    var changed = false;
    have.forEach(function(a){
      var h = a.getAttribute('href'), t = a.querySelector('.text-size-regular');
      if (t && deskLabel[h] && t.textContent.trim() !== deskLabel[h]) { t.textContent = deskLabel[h]; changed = true; }
    });

    // already complete and in desktop order, and no label drift -> nothing to do
    var ok = haveHref.length === want.length && haveHref.every(function(h,i){ return h === want[i]; });
    if (ok && !changed) return;

    if (obs) obs.disconnect();
    desk.forEach(function(a){
      var h = a.getAttribute('href');
      var ex = mn.querySelector('a.angled-line-button[href="' + h + '"]');
      if (!ex) {
        ex = a.cloneNode(true);
        ex.removeAttribute('data-w-id');
        ex.classList.remove('w--current');
        ex.removeAttribute('aria-current');
      }
      mn.appendChild(ex); // move existing / append clone -> final order matches desktop
    });
    if (obs) obs.observe(document.documentElement, { childList: true, subtree: true });
  }
  sync();
  obs = new MutationObserver(sync);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function(){ obs.disconnect(); }, 15000);
})();
  /* (C) founder copy */
  /* Founder copy: 3rd person -> 1st person (ClickUp 2264 + about-us "himto" typo).
   The desktop founder block on / and the founder block on /about-us were written in
   3rd person ("his father… helped him… positioned him(to)"); the voice is Gabriel's,
   so it must be 1st person — the mobile homepage block already is. Static-page text,
   so it needs a Designer edit or this runtime replace; each phrase below only exists
   in the broken blocks (the client testimonial "Gabriel and his team" never matches),
   which makes a whole-document text-node pass safe and idempotent. */
(function(){
  var SWAPS = [
    ['since his father is', 'since my father is'],
    ['helped him to understand', 'helped me to understand'],
    ['positioned him to be able', 'positioned me to be able'],
    ['positioned himto be able', 'positioned me to be able']
  ];
  var it = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT), n;
  while ((n = it.nextNode())) {
    var v = n.nodeValue;
    if (v.indexOf('him') === -1 && v.indexOf('his') === -1) continue;
    for (var i = 0; i < SWAPS.length; i++) v = v.split(SWAPS[i][0]).join(SWAPS[i][1]);
    if (v !== n.nodeValue) n.nodeValue = v;
  }
})();
})();
