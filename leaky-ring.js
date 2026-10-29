/* Configure the externally hosted Leaky Ring without replacing its script. */
(function () {
  // MelonLand documents disableMessages for hiding the leak-status text.
  window.disableMessages = true;
  if (window.flood) {
    window.flood.disableMessages = true;
  }

  // The bucket is the link to the ring's information page. Move it left
  // even if the upstream script assigns an inline right position.
  function positionBucket() {
    document.querySelectorAll('a[href*="melonking.net/free/software/flood"]').forEach(link => {
      link.style.setProperty('left', '8px', 'important');
      link.style.setProperty('right', 'auto', 'important');
    });
  }
  positionBucket();
  const observer = new MutationObserver(positionBucket);
  observer.observe(document.body, {childList:true, subtree:true});
})();
