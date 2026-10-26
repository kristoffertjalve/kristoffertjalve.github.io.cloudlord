document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const estateLinks = [...document.querySelectorAll('li[data-estate]')];
  const aboutLinks = [...document.querySelectorAll('li[data-about]')];
  const aboutMap = new Map(aboutLinks.map(item => [item.dataset.about, item]));
  if (!main || !estateLinks.length) return;
  const homeHTML = '<p align="left"><iframe id="ChiaHouse" title="Chia House" src="https://las-pinas.com/h.html?i=kristoffer" style="width:50vw;min-height:600px;border:none;overflow:scroll" houseid="kristoffer"></iframe></p>';
  const estateMap = new Map(estateLinks.map(item => [item.dataset.estate, item]));
  const homeTitle = 'Cloudlord.management';
  const mobile = () => matchMedia('(max-width: 768px)').matches;
  function render(slug) {
    const item = estateMap.get(slug) || aboutMap.get(slug);
    if (!item) {
      main.innerHTML = homeHTML;
      document.body.removeAttribute('data-estate-page');
      document.body.removeAttribute('data-about-page');
      document.title = homeTitle;
    } else {
      const text = item.getAttribute('data-text') || '';
      const description = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
        const href = /^(https?:|mailto:|\/)/i.test(url) ? url : 'https://' + url;
        const link = document.createElement('a');
        link.href = href;
        const safe = link.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
      });
      const heading = document.createElement('h1');
      heading.textContent = item.textContent.trim().replace(' 🆕', '');
      main.innerHTML = '<article class="main-text estate-page"><a class="mobile-back-link" href="#domains">↑ Back to domains</a><div>' + description + '</div></article>';
      main.querySelector('article').prepend(heading);
      if (aboutMap.has(slug)) {document.body.dataset.aboutPage = slug;document.body.removeAttribute('data-estate-page');} else {document.body.dataset.estatePage = slug;document.body.removeAttribute('data-about-page');}
      document.title = heading.textContent + ' — Cloudlord.management';
    }
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
  // Direct mobile permalinks open at their description; home opens at the domain list.
  if (mobile() && (document.body.hasAttribute('data-estate-page') || document.body.hasAttribute('data-about-page'))) {
    requestAnimationFrame(() => main.scrollIntoView({behavior: 'auto', block: 'start'}));
  }
});