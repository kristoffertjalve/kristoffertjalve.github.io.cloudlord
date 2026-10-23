document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const estateLinks = [...document.querySelectorAll('li[data-estate]')];
  if (!main || !estateLinks.length) return;
  const homeHTML = '<p align="left"><iframe id="ChiaHouse" title="Chia House" src="https://las-pinas.com/h.html?i=kristoffer" style="width:50vw;min-height:600px;border:none;overflow:scroll" houseid="kristoffer"></iframe></p>';
  const estateMap = new Map(estateLinks.map(item => [item.dataset.estate, item]));
  const homeTitle = 'Cloudlord.management';
  const mobile = () => matchMedia('(max-width: 768px)').matches;
  function render(slug) {
    const item = estateMap.get(slug);
    if (!item) {
      main.innerHTML = homeHTML;
      document.body.removeAttribute('data-estate-page');
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
      main.innerHTML = '<article class="main-text estate-page"><div>' + description + '</div></article>';
      main.querySelector('article').prepend(heading);
      document.body.dataset.estatePage = slug;
      document.title = heading.textContent + ' — Cloudlord.management';
    }
    estateLinks.forEach(link => {
      if (link.dataset.estate === slug) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  estateLinks.forEach(item => {
    const go = () => {
      const slug = item.dataset.estate;
      const path = '/estates/' + slug + '/';
      if (location.pathname !== path) history.pushState({estate:slug}, '', path);
      render(slug);
      if (mobile()) main.scrollIntoView({behavior:'auto',block:'start'});
    };
    item.addEventListener('click', event => {
      event.stopImmediatePropagation();
      go();
    }, true);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopImmediatePropagation();
        go();
      }
    }, true);
  });
  window.addEventListener('popstate', () => {
    const match = location.pathname.match(/^\/estates\/([^/]+)\/?$/);
    render(match ? match[1] : null);
  });
  const match = location.pathname.match(/^\/estates\/([^/]+)\/?$/);
  if (match && estateMap.has(match[1])) render(match[1]);
});