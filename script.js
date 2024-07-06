document.addEventListener('DOMContentLoaded', () => {
    const listItems = document.querySelectorAll('aside ul li');
    const mainSection = document.querySelector('main');

    listItems.forEach(item => {
        item.addEventListener('click', () => {
            const color = item.getAttribute('data-color');
            const text = item.getAttribute('data-text');
            const link = item.getAttribute('data-link');
            const linkText = item.getAttribute('data-link-text');

            mainSection.style.backgroundColor = color;
            mainSection.innerHTML = `<p class="main-text">${text}<a href="${link}" target="_blank">${linkText}</a></p>`;
        });
    });
});
