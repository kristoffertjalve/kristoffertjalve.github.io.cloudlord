document.addEventListener('DOMContentLoaded', () => {
    const listItems = document.querySelectorAll('aside.left-panel ul li');
    const mainSection = document.querySelector('main');
    const messageBoard = document.getElementById('message-board');
    const ARENA_CHANNEL = 'telegrams-bhyik8dsunw';
    const ARENA_API_URL = `https://api.are.na/v2/channels/${ARENA_CHANNEL}/contents`;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Function to determine if the screen is mobile-sized
    const isMobile = () => window.innerWidth <= 768;

    // ✅ Fix: Ensure dark mode is applied when clicking a list item
    listItems.forEach(item => {
        item.addEventListener('click', () => {
            const isDarkMode = body.classList.contains('dark-mode'); // Check if dark mode is active
            let color = item.getAttribute('data-color');

            // If dark mode is active, override color
            if (isDarkMode) {
                color = 'var(--bg-color)'; // Ensure it stays in dark mode
            }

            let text = item.getAttribute('data-text');

            // Convert [text](URL) into clickable links
            const formattedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // Update main section
            mainSection.style.backgroundColor = color;
            mainSection.style.color = 'var(--text-color)'; // Ensure text is visible in dark mode
            mainSection.innerHTML = `<p class="main-text">${formattedText}</p>`;
        });
    });

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
    fetch(ARENA_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Are.na API Response:', data);

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

    // Debug: Recheck screen size dynamically
    window.addEventListener('resize', () => {
        console.log('Screen resized. Current mode:', isMobile() ? 'Mobile' : 'Desktop');
    });
});
