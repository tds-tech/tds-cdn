/* TDS — inject "Free AI Scan" nav link -> /ai-visibility-checker.
   Clones an existing .angled-line-button nav link for pixel-identical styling.
   Idempotent; coexists with TDSNavResources (re-inserts during the 15s nav-build window). */
(function () {
  var HREF = '/ai-visibility-checker', LABEL = 'Free AI Scan', ID = 'tds-aivc-navlink';
  function insert() {
    if (document.getElementById(ID)) return;
    var ref = document.querySelector('.nav-menu a[href="/resources"]')
           || document.querySelector('.nav-menu a[href="/services"]')
           || document.querySelector('a.angled-line-button[href="/resources"]')
           || document.querySelector('a.angled-line-button[href="/services"]');
    if (!ref || !ref.parentNode) return;
    var link = ref.cloneNode(true);
    link.id = ID;
    link.setAttribute('href', HREF);
    link.removeAttribute('data-w-id');
    (link.querySelector('.text-size-regular') || link).textContent = LABEL;
    ref.parentNode.insertBefore(link, ref.nextSibling);
  }
  insert();
  var obs = new MutationObserver(insert);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { obs.disconnect(); }, 15000);
})();
