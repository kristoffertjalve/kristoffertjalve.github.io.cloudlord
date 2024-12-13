document.addEventListener('DOMContentLoaded', () => {
    // Existing sidebar functionality
    const listItems = document.querySelectorAll('aside.left-panel ul li');
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

    // Fetch data for the right panel (message board)
    const messageBoard = document.getElementById('message-board');
    const ARENA_CHANNEL = 'telegrams-bhyik8dsunw';
    const ARENA_API_URL = `https://api.are.na/v2/channels/${ARENA_CHANNEL}/contents`;

    fetch(ARENA_API_URL)
        .then(response => response.json())
        .then(data => {
            // Reverse chronological order
            data.contents.forEach(block => {
                // Create the container for the message and timestamp
                const container = document.createElement('div');
                container.classList.add('message-container');

                // Add message box
                const message = document.createElement('div');
                message.classList.add('message');

                // Add title inside the box
                const title = document.createElement('h3');
                title.textContent = block.title || 'Untitled';
                message.appendChild(title);

                // Add content inside the box
                const content = document.createElement('p');
                try {
                    const contentText = block.content || 'No content';
                    const isMarkdown = /\[(.*?)\]\((.*?)\)/.test(contentText); // Detect basic markdown
                    content.innerHTML = isMarkdown ? marked.parse(contentText) : contentText;
                } catch (err) {
                    console.warn('Error parsing markdown for block:', block, err);
                    content.innerHTML = block.content || '<em>No content</em>';
                }
                message.appendChild(content);

                container.appendChild(message);

                // Format creation date
                const createdDate = new Date(block.created_at);
                const formattedDate = `Posted on ${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${createdDate.getFullYear()}`;

                // Add timestamp as a link
                const timestamp = document.createElement('a');
                timestamp.href = block.generated_url || '#';
                timestamp.target = '_blank';
                timestamp.classList.add('timestamp');
                timestamp.textContent = formattedDate;

                container.appendChild(timestamp);

                // Prepend the container to show the newest messages on top
                messageBoard.prepend(container);
            });
        })
        .catch(error => {
            console.error('Error fetching Are.na data:', error);
            messageBoard.innerHTML = '<p>Failed to load messages.</p>';
        });
});
