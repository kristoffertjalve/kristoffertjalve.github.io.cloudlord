/* The ring script injects its own UI after loading.
   Keep the water and bucket; hide only its status sentence. */
(function () {
  const statusText = /(?:this page has a harmless leak|how big (?:a|the) leak|(?:tiny|small|medium|large|huge) leak)/i;

  function customizeRing() {
    // The third-party widget can create or replace its DOM at any time.
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('.container, .news-bar, script, style')) return;
      if (el.children.length === 0 && statusText.test(el.textContent || '')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // Locate the actual bucket artwork, not the info text or an unrelated link.
    document.querySelectorAll('img[src*="bucket"], [id*="bucket"], [class*="bucket"]').forEach(el => {
      if (el.closest('.container')) return;
      let widget = el;
      // Move the positioned container (rather than just the image inside it).
      while (widget.parentElement && widget.parentElement !== document.body &&
             getComputedStyle(widget).position !== 'fixed') {
        widget = widget.parentElement;
      }
      if (widget === document.body) return;
      widget.style.setProperty('right', 'auto', 'important');
      widget.style.setProperty('left', '8px', 'important');
    });
  }

  // Wait for the external script, then catch later ring updates.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; customizeRing(); });
  });
  observer.observe(document.body, {childList:true, subtree:true});
  customizeRing();
})();
