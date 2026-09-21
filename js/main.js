/**
 * LUNA Lab — Shared JS
 * Nav hamburger toggle (with keyboard + ARIA support), active link highlighting,
 * copy email, and small accessibility enhancements.
 */
(function () {
  // ── Site-wide links: fill every <a data-link="KEY"> from js/site-config.js ──
  const LINKS = window.LUNA_LINKS || {};
  document.querySelectorAll('a[data-link]').forEach(a => {
    const url = LINKS[a.dataset.link];
    if (url) a.href = url;
  });

  // ── Screen-reader live region (announces "Email copied!") ──
  let status = document.getElementById('a11y-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'a11y-status';
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.body.appendChild(status);
  }
  const announce = (msg) => { status.textContent = ''; setTimeout(() => { status.textContent = msg; }, 50); };

  // ── Hamburger nav ──
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.luna-nav .nav-links');
  if (hamburger && navLinks) {
    const setOpen = (open, { focus = false } = {}) => {
      navLinks.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (focus) {
        if (open) {
          const first = navLinks.querySelector('a');
          if (first) first.focus();
        } else {
          hamburger.focus();
        }
      }
    };

    hamburger.addEventListener('click', () => {
      setOpen(!navLinks.classList.contains('open'), { focus: true });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        if (navLinks.classList.contains('open')) setOpen(false);
      }
    });

    // Escape closes the menu and returns focus to the button
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setOpen(false, { focus: true });
      }
    });

    // Close when focus leaves the menu (keyboard users tabbing past it)
    navLinks.addEventListener('focusout', (e) => {
      if (!navLinks.classList.contains('open')) return;
      const next = e.relatedTarget;
      if (next && !navLinks.contains(next) && next !== hamburger) setOpen(false);
    });
  }

  // ── Active nav link ──
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.luna-nav .nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (
      href === currentPage ||
      (currentPage === '' && href === 'index.html') ||
      (currentPage === 'index.html' && href === 'index.html')
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // ── Copy email ──
  document.querySelectorAll('[data-copy-email]').forEach(el => {
    el.addEventListener('click', () => {
      const email = el.dataset.copyEmail;
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(email).then(() => {
        const orig = el.textContent;
        el.textContent = 'Email copied!';
        announce('Email address copied to clipboard');
        setTimeout(() => { el.textContent = orig; }, 1800);
      }).catch(() => {});
    });
  });

  // ── Links that open a new tab: tell screen-reader users ──
  function annotateExternalLinks(root = document) {
    root.querySelectorAll('a[target="_blank"]').forEach(a => {
      if (a.querySelector('.sr-only-newtab')) return;
      if (!/\bnoopener\b/.test(a.rel)) a.rel = (a.rel + ' noopener').trim();
      const hint = document.createElement('span');
      hint.className = 'sr-only sr-only-newtab';
      hint.textContent = ' (opens in a new tab)';
      a.appendChild(hint);
    });
  }
  annotateExternalLinks();
  // Team page renders its cards later — annotate anything added afterwards too.
  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) annotateExternalLinks(n);
  }).observe(document.body, { childList: true, subtree: true });

  // ── Publication link buttons: "Paper" → "Paper: <title>" for screen readers ──
  document.querySelectorAll('.pub-card').forEach(card => {
    const title = card.querySelector('h3');
    if (!title) return;
    const t = title.textContent.trim();
    card.querySelectorAll('.pub-link').forEach(a => {
      if (!a.hasAttribute('aria-label')) a.setAttribute('aria-label', `${a.textContent.trim()}: ${t} (opens in a new tab)`);
    });
  });
})();
