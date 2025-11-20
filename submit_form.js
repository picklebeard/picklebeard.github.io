// js/gform-shared.js
(() => {
  'use strict';

  // default form ID (can be overridden per-page with window.myGFormDefaultFormId)
  const DEFAULT_FORM_ID = window.myGFormDefaultFormId || '';

  function attachTo(el) {
    el.addEventListener('click', function (event) {
      event.preventDefault(); // stop the instant navigation

      const formID  = el.dataset.formId || DEFAULT_FORM_ID;
      const entryID = el.dataset.entry;         // required: e.g. "entry.123456"
      const value   = el.dataset.value || el.id || 'button';
      const delayMs = parseInt(el.dataset.delay, 10) || 400;

      if (!formID || !entryID) {
        // missing config — fail loudly in dev (open console to see)
        console.warn('gform-shared: missing formID or entryID on', el);
        // still continue to navigate
        setTimeout(() => window.location.href = (el.href || el.dataset.href || '#'), delayMs);
        return;
      }

      const url = `https://docs.google.com/forms/d/1Ir1v299hXOnCtmI24FXH5G0P5htitOFzcD1Jl0wdMA8/formResponse`;
      const formData = new FormData();
      formData.append(entryID, value);

      // optional status element id can be set per-element with data-status-id
      const statusEl = document.getElementById(el.dataset.statusId || 'status');
      if (statusEl) statusEl.textContent = 'Sending…';

      // fire-and-forget (mode: 'no-cors' means you cannot read the response)
      fetch(url, { method: 'POST', mode: 'no-cors', body: formData }).catch(()=>{ /* ignore network error */ });

      // delay navigation slightly to give the request a chance to send
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
        const dest = el.href || el.dataset.href;
        if (dest) window.location.href = dest;
      }, delayMs);
    });
  }

  function init() {
    // find all elements that opt-in by having data-gform attribute
    document.querySelectorAll('[data-gform]').forEach(attachTo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // optional exposure for debugging / manual init
  window.gformShared = { init, attachTo };
})();
