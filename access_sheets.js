// js/sheet-shared.js
(() => {
  'use strict';

  // 1) configuration: URL can be provided in three ways (priority order)
  //    a) window.sheetCsvUrl (set before this script runs)
  //    b) data-url attribute on the <script> tag that loaded this file
  //    c) hard-coded fallback (empty = will warn)
  const scriptEl = document.currentScript;
  const configuredUrl = window.sheetCsvUrl || (scriptEl && scriptEl.dataset && scriptEl.dataset.url) || '';
  const url = configuredUrl;

  if (!url) {
    console.warn('sheet-shared: no sheet CSV URL configured (set window.sheetCsvUrl or data-url on the script tag).');
  }

  /* ----- helper: convert A1-style ref to 0-based indices ----- */
  function cellRefToIndices(ref) {
    const m = String(ref).match(/^([A-Za-z]+)(\d+)$/);
    if (!m) return null;
    const letters = m[1].toUpperCase();
    const row = parseInt(m[2], 10) - 1;
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
      col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    return { r: row, c: col - 1 };
  }

  /* ----- public getter: getCell("B2") returns number or null/undefined ----- */
  function getCell(ref) {
    if (!window.sheetRows) return undefined; // not loaded yet
    const idx = cellRefToIndices(ref);
    if (!idx) return undefined;
    const row = window.sheetRows[idx.r];
    if (!row) return undefined;
    return row[idx.c]; // number or null (if empty)
  }
  window.getCell = getCell; // expose globally

  /* ----- fetch + parse (simple numeric-only parse) ----- */
  window.sheetReady = (async () => {
    if (!url) {
      // create a rejected promise so callers know it failed
      throw new Error('No sheet URL configured');
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    let text = await res.text();

    // remove BOM and surrounding whitespace/newlines
    text = text.replace(/^\uFEFF/, '').trim();
    if (!text) {
      window.sheetRows = [];
      return window.sheetRows;
    }

    // split rows and columns; convert to Number; empty -> null
    const rows = text.split('\n').map(line =>
      line.split(',').map(cell => {
        const t = cell.trim();
        if (t === '') return null;
        const n = Number(t);
        return Number.isFinite(n) ? n : null;
      })
    );

    window.sheetRows = rows; // expose raw 2D array

    // auto-fill any DOM elements with data-cell attributes
    document.querySelectorAll('[data-cell]').forEach(el => {
      const ref = el.dataset.cell;
      const val = getCell(ref);
      el.textContent = (val === null || val === undefined) ? '' : String(val);
    });

    return rows;
  })().catch(err => {
    console.error('sheet-shared: error loading sheet:', err);
    // optional error UI
    document.querySelectorAll('[data-cell-error]').forEach(el => {
      el.textContent = 'Error loading sheet';
    });
    throw err;
  });

})();
