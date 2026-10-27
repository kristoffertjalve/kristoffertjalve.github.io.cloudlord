document.addEventListener('DOMContentLoaded', () => {

    // Fruitfly cursor
    const fruitfly = document.createElement('div');
    fruitfly.id = 'fruitfly-cursor';

    const fruitflyImage = document.createElement('img');
    fruitflyImage.src = '/cursors/flying.gif';
    fruitflyImage.alt = '';

    fruitfly.appendChild(fruitflyImage);
    document.body.appendChild(fruitfly);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let flyX = mouseX;
    let flyY = mouseY;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    let flyFrame = null;
    function animateFruitfly() {
        flyFrame = null;
        if (document.hidden) return;
        flyX += (mouseX - flyX) * 0.18;
        flyY += (mouseY - flyY) * 0.18;

        fruitfly.style.transform =
            `translate(${flyX - 16}px, ${flyY - 16}px)`;

        if (!document.hidden) flyFrame = requestAnimationFrame(animateFruitfly);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        flyFrame = requestAnimationFrame(animateFruitfly);
    } else {
        fruitfly.hidden = true;
    }
    
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !fruitfly.hidden && flyFrame === null) flyFrame = requestAnimationFrame(animateFruitfly);
    });

    // Navigation and mobile page rendering are handled exclusively by estate-router.js.
    const mainSection = document.querySelector('main');
    const messageBoard = document.getElementById('message-board');
    const ARENA_CHANNEL = 'telegrams-bhyik8dsunw';
    const ARENA_API_URL = `https://api.are.na/v2/channels/${ARENA_CHANNEL}/contents?per=100`;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // ✅ Dark Mode Toggle Fix
    if (darkModeToggle) {
        if (localStorage.getItem('dark-mode') === 'enabled') {
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ ';
        }

        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');

            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('dark-mode', 'enabled');
                darkModeToggle.textContent = '☀️ ';
                mainSection.style.backgroundColor = 'var(--bg-color)'; // Fix background on toggle
                mainSection.style.color = 'var(--text-color)';
            } else {
                localStorage.setItem('dark-mode', 'disabled');
                darkModeToggle.textContent = '🟢 ';
                mainSection.style.backgroundColor = 'var(--bg-color)';
                mainSection.style.color = 'var(--text-color)';
            }
        });
    } else {
        console.warn('Dark mode toggle button not found in the HTML.');
    }

    // Load Are.na messages for the right panel
    let messagesStarted = false;
    function loadMessagesIfVisible() {
        if (messagesStarted || !messageBoard || !window.matchMedia("(min-width: 769px)").matches) return;
        messagesStarted = true;
        fetch(ARENA_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.contents || data.contents.length === 0) {
                messageBoard.innerHTML = '<p>No messages available.</p>';
                return;
            }

            // Display messages in reverse chronological order
            data.contents.forEach(block => {
                const container = document.createElement('div');
                container.classList.add('message-container');

                // Message box
                const message = document.createElement('div');
                message.classList.add('message');

                // Add title as an active hyperlink
                const title = document.createElement('h3');
                const ARENA_BLOCK_BASE_URL = 'https://www.are.na/block/';
                const blockUrl = block.generated_url || `${ARENA_BLOCK_BASE_URL}${block.id}`;
                title.textContent = block.title || 'Untitled';
                title.classList.add('message-title');
                message.appendChild(title);

                // Add content with markdown support
                const content = document.createElement('p');
                try {
                    const contentText = block.content || 'No content';
                    content.innerHTML = marked.parse(contentText);
                } catch (err) {
                    console.warn('Error parsing markdown:', block, err);
                    content.textContent = block.content || 'No content';
                }
                message.appendChild(content);

                container.appendChild(message);

                // Add creation date and comment count as a clickable link
                const createdDate = new Date(block.created_at);
                const formattedDate = `Posted on ${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${createdDate.getFullYear()}`;
                const commentCount = block.comment_count || 0;

                const timestampLink = document.createElement('a');
                timestampLink.href = blockUrl;
                timestampLink.target = '_blank';
                timestampLink.rel = 'noopener noreferrer';
                timestampLink.classList.add('timestamp');
                timestampLink.textContent = commentCount > 0 
                    ? `${formattedDate} (${commentCount})` 
                    : formattedDate;

                container.appendChild(timestampLink);

                // Prepend container to show newest messages on top
                messageBoard.prepend(container);
            });
        })
        .catch(error => {
            console.error('Error fetching Are.na messages:', error);
            messageBoard.innerHTML = '<p>Failed to load messages.</p>';
        });
    }
    loadMessagesIfVisible();
    window.matchMedia('(min-width: 769px)').addEventListener('change', loadMessagesIfVisible);


});
