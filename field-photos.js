/* Field Photos: public Are.na channel, with a ten-second rotation. */
document.addEventListener('DOMContentLoaded', () => {
  const frame = document.querySelector('.field-photo-link');
  const caption = document.getElementById('field-photo-caption');
  if (!frame || !caption) return;

  const channel = 'https://www.are.na/kristoffer-tjalve/field-photos';
  const api = 'https://api.are.na/v2/channels/field-photos/contents?per=100';
  let photos = [];
  let index = 0;
  let started = false;

  function visible() {
    return matchMedia('(min-width:769px)').matches ||
      document.body.dataset.mobilePanel === 'photos';
  }

  function display() {
    if (!photos.length) return;
    const photo = photos[index];
    let img = frame.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      frame.prepend(img);
    }
    img.src = photo.url;
    caption.textContent = photo.title;
    frame.setAttribute('aria-label', photo.title + ' — view Field Photos on Are.na');
  }

  async function refresh() {
    try {
      const response = await fetch(api);
      if (!response.ok) throw new Error('Are.na returned ' + response.status);
      const data = await response.json();
      const next = (data.contents || [])
        .filter(block => block.class === 'Image' && block.image)
        .map(block => ({
          id: block.id,
          title: block.title || block.generated_title || 'Field Photo',
          url: block.image.display?.url || block.image.large?.url || block.image.original?.url
        }))
        .filter(photo => photo.url && /^https:\/\//.test(photo.url));
      if (!next.length) {
        if (!photos.length) caption.textContent = 'View Field Photos on Are.na';
        return;
      }
      const currentId = photos[index]?.id;
      photos = next;
      index = Math.max(0, photos.findIndex(photo => photo.id === currentId));
      display();
    } catch (error) {
      console.warn('Could not load Field Photos:', error);
      if (!photos.length) caption.textContent = 'View Field Photos on Are.na';
    }
  }

  function start() {
    if (started || !visible()) return;
    started = true;
    refresh();
    setInterval(() => {
      if (!visible() || document.hidden || photos.length < 2) return;
      index = (index + 1) % photos.length;
      display();
    }, 10000);
    // Refresh the channel occasionally so newly added photos appear without a reload.
    setInterval(() => { if (visible() && !document.hidden) refresh(); }, 300000);
  }

  frame.href = channel;
  start();
  matchMedia('(min-width:769px)').addEventListener('change', start);
  document.addEventListener('cloudlord:panel-open', event => {
    if (event.detail.panel === 'photos') start();
  });
});
