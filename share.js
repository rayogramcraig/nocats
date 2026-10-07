/* nocats.org shareable views: uses the existing form and setting controls. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const urlField = $('url');
  const mode = $('mode');
  const replacement = $('replacement');
  const images = $('images');
  const form = $('form');
  const share = $('share');
  if (!urlField || !mode || !replacement || !images || !form || !share) return;

  function validPage(value) {
    try {
      const url = new URL(value.trim());
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch { return null; }
  }

  function shareUrl() {
    const target = validPage(urlField.value);
    if (!target) return null;
    const link = new URL(window.location.pathname, window.location.origin);
    link.searchParams.set('url', target);
    link.searchParams.set('mode', mode.getAttribute('aria-checked') === 'true' ? 'replace' : 'redact');
    link.searchParams.set('term', replacement.value.trim() || 'demon');
    link.searchParams.set('images', images.getAttribute('aria-pressed') === 'true' ? 'hide' : 'show');
    return link.href;
  }

  share.addEventListener('click', async () => {
    const link = shareUrl();
    if (!link) { window.alert('No valid webpage URL to share.'); return; }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(link);
    } catch {
      // Works on browsers where clipboard permissions are unavailable.
      const field = document.createElement('textarea');
      field.value = link;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) { window.prompt('Copy this link:', link); return; }
    }
    share.textContent = 'Copied ✓';
    window.setTimeout(() => { share.textContent = 'Share ↗'; }, 1800);
  });

  // app.js already restores ?url, ?mode, ?term and ?images on startup.
})();
