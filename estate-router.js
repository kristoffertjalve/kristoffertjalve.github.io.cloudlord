document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const estateLinks = [...document.querySelectorAll('li[data-estate]')];
  const aboutLinks = [...document.querySelectorAll('li[data-about]')];
  const aboutMap = new Map(aboutLinks.map(item => [item.dataset.about, item]));
  if (!main || !estateLinks.length) return;
  const homeHTML = main.innerHTML;
  const estateMap = new Map(estateLinks.map(item => [item.dataset.estate, item]));
  const homeTitle = 'Cloudlord.management';
  const homeMetadata = {title: homeTitle, description: 'An internet surreal estate holding company.', canonical: 'https://cloudlord.management/'};
  function updateMetadata(item) {
    const meta = item ? JSON.parse(item.getAttribute('data-meta') || '{}') : homeMetadata;
    const setMeta = (selector, value) => {
      const element = document.querySelector(selector);
      if (element && value) element.setAttribute('content', value);
    };
    document.title = meta.title || homeTitle;
    setMeta('meta[name="description"]', meta.description);
    setMeta('meta[property="og:title"]', meta.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[property="og:url"]', meta.canonical);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && meta.canonical) canonical.href = meta.canonical;
    const schema = document.querySelector('script[type="application/ld+json"]');
    if (schema) {
      const structured = { '@context': 'https://schema.org', '@type': item ? 'WebPage' : 'WebSite', name: item ? meta.title.replace(' — Cloudlord.management', '') : homeTitle, url: meta.canonical, description: meta.description };
      if (item) structured.isPartOf = { '@type': 'WebSite', name: homeTitle, url: homeMetadata.canonical };
      schema.textContent = JSON.stringify(structured).replace(/</g, '\\u003c');
    }
  }
  const toggle = document.getElementById('mobile-estates-toggle');
  const close = document.getElementById('mobile-estates-close');
  const menu = document.getElementById('estate-navigation');
  function setMenu(open) {
    document.body.classList.toggle('mobile-menu-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) close?.focus();
    else if (menu?.contains(document.activeElement)) toggle?.focus();
  }
  toggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('mobile-menu-open')));
  close?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  const panelButtons = [...document.querySelectorAll('.mobile-panel-toggle')];
  const panelWindows = [...document.querySelectorAll('.sidebar-window')];
  let previousFocus = null;
  function setPanel(name) {
    const open = name === 'messages' || name === 'calendar' || name === 'photos';
    if (open && !document.body.dataset.mobilePanel) previousFocus = document.activeElement;
    if (open) setMenu(false);
    document.body.classList.toggle('mobile-panel-open', open);
    if (open) document.body.dataset.mobilePanel = name;
    else delete document.body.dataset.mobilePanel;
    panelButtons.forEach(button => button.setAttribute('aria-expanded', String(open && button.dataset.panel === name)));
    panelWindows.forEach(panel => {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-hidden', String(!open || panel.id !== name + '-window'));
    });
    if (open) {
      document.querySelector('.mobile-panel-close[data-panel="' + name + '"]')?.focus();
      document.dispatchEvent(new CustomEvent('cloudlord:panel-open', {detail:{panel:name}}));
    }
    else if (previousFocus?.isConnected) previousFocus.focus();
  }
  panelButtons.forEach(button => button.addEventListener('click', () => {
    setPanel(document.body.dataset.mobilePanel === button.dataset.panel ? null : button.dataset.panel);
  }));
  document.querySelectorAll('.mobile-panel-close').forEach(button => button.addEventListener('click', () => setPanel(null)));
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('mobile-panel-open')) return;
    if (e.key === 'Escape') setPanel(null);
    if (e.key !== 'Tab') return;
    const panel = document.getElementById(document.body.dataset.mobilePanel + '-window');
    const focusable = [...panel.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')].filter(el => el.getClientRects().length);
    if (!focusable.length) return;
    if (e.shiftKey && document.activeElement === focusable[0]) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === focusable[focusable.length - 1]) { e.preventDefault(); focusable[0].focus(); }
  });
  document.addEventListener('click', e => {
    if (e.target.closest('.right-panel a[href]')) setPanel(null);
  });
  const mobile = () => matchMedia('(max-width: 768px)').matches;
  if (mobile() && location.hash === '#estates') {
    setMenu(true);
    history.replaceState(history.state, '', location.pathname + location.search);
  }
  if (mobile() && document.body.hasAttribute('data-estate-page')) {
    const fromMenu = sessionStorage.getItem('cloudlord-estates-return') === '1';
    sessionStorage.removeItem('cloudlord-estates-return');
    if (fromMenu) main.querySelector('.mobile-back-link')?.setAttribute('href', '/#estates');
  }
  function render(slug) {
    const item = estateMap.get(slug) || aboutMap.get(slug);
    if (!item) {
      main.innerHTML = homeHTML;
      document.body.removeAttribute('data-estate-page');
      document.body.removeAttribute('data-about-page');
      document.title = homeTitle;
    } else {
      // Pre-rendered HTML is generated from Markdown by the Python build script.
      const description = item.getAttribute('data-html') || '';
      const heading = document.createElement('h1');
      heading.textContent = item.textContent.trim().replace(' 🆕', '');
      main.innerHTML = '<article class="main-text estate-page"><a class="mobile-back-link" href="/">Close ×</a><div>' + description + '</div></article>';
      main.querySelector('article').prepend(heading);
      if (aboutMap.has(slug)) {document.body.dataset.aboutPage = slug;document.body.removeAttribute('data-estate-page');} else {document.body.dataset.estatePage = slug;document.body.removeAttribute('data-about-page');}
      document.title = heading.textContent + ' — Cloudlord.management';
    }
    updateMetadata(item);
    [...estateLinks,...aboutLinks].forEach(link => {
      if ((link.dataset.estate || link.dataset.about) === slug) link.querySelector('a')?.setAttribute('aria-current', 'page');
      else link.querySelector('a')?.removeAttribute('aria-current');
    });
  }
  [...estateLinks, ...aboutLinks].forEach(item => {
    const anchor = item.querySelector('a[href]');
    if (!anchor) return;
    anchor.addEventListener('click', event => {
      // Preserve normal link behavior for modifier clicks, new tabs and downloads.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download')) return;
      if (mobile()) {
        if (item.dataset.estate && document.body.classList.contains('mobile-menu-open')) {
          sessionStorage.setItem('cloudlord-estates-return', '1');
        } else {
          sessionStorage.removeItem('cloudlord-estates-return');
        }
        return; // Native navigation preserves the page's pre-rendered JSON-LD.
      }
      event.preventDefault();
      const slug = item.dataset.estate || item.dataset.about;
      const path = anchor.getAttribute('href');
      if (location.pathname !== path) history.pushState({estate: slug}, '', path);
      render(slug);
      if (mobile()) main.scrollIntoView({behavior: 'auto', block: 'start'});
    });
  });
  window.addEventListener('popstate', () => {
    const match = location.pathname.match(/^\/estates\/([^/]+)\/?$/);
    render(match ? match[1] : (aboutMap.has(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null));
  });
  const match = location.pathname.match(/^\/estates\/([^/]+)\/?$/);
  if (match && estateMap.has(match[1])) render(match[1]);
  else if (aboutMap.has(location.pathname.split('/')[1])) render(location.pathname.split('/')[1]);
  // Direct mobile permalinks appear as closable overlays; preserve their real URLs.
  if (mobile() && (document.body.hasAttribute('data-estate-page') || document.body.hasAttribute('data-about-page'))) {
    requestAnimationFrame(() => main.scrollIntoView({behavior: 'auto', block: 'start'}));
  }
});