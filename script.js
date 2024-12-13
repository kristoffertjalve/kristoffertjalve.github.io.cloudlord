document.addEventListener('DOMContentLoaded', () => {
    const listItems = document.querySelectorAll('aside.left-panel ul li');
    const mainSection = document.querySelector('main');
    const messageBoard = document.getElementById('message-board');
    const ARENA_CHANNEL = 'telegrams-bhyik8dsunw';
    const ARENA_API_URL = `https://api.are.na/v2/channels/${ARENA_CHANNEL}/contents`;

    // Function to determine if the screen is mobile-sized
    const isMobile = () => window.innerWidth <= 768;

    // Add click event listeners for list items
    listItems.forEach(item => {
        item.addEventListener('click', (event) => {
            if (isMobile()) {
                console.log('Mobile mode: Opening external link');
                const link = item.getAttribute('data-link');
                if (link) {
                    window.open(link, '_blank'); // Open the link in a new tab
                    return; // Exit function after opening the link
                }
            }

            // Desktop functionality
            console.log('Desktop mode: Displaying content in main section');
            const color = item.getAttribute('data-color');
            const text = item.getAttribute('data-text');
            const link = item.getAttribute('data-link');
            const linkText = item.getAttribute('data-link-text');

            mainSection.style.backgroundColor = color;
            mainSection.innerHTML = `<p class="main-text">${text}<a href="${link}" target="_blank">${linkText}</a></p>`;
        });
    });

    // Load Are.na messages for the right panel
    fetch(ARENA_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Are.na API Response:', data); // Debug API response

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

                // Add title
                const title = document.createElement('h3');
                title.textContent = block.title || 'Untitled';
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

                const createdDate = new Date(block.created_at);
                const formattedDate = `Posted on ${String(createdDate.getDate()).padStart(2, '0')}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${createdDate.getFullYear()}`;

                // Fallback to construct block URL if generated_url is missing
                const ARENA_BLOCK_BASE_URL = 'https://www.are.na/block/';
                const blockUrl = block.generated_url || `${ARENA_BLOCK_BASE_URL}${block.id}`;

                const timestamp = document.createElement('a');
                if (blockUrl) {
                   timestamp.href = blockUrl; // Set the Are.na block link
                   timestamp.target = '_blank'; // Open in a new tab
                   timestamp.textContent = formattedDate;
                   timestamp.classList.add('timestamp');
                } else {
               console.warn('No link available for block:', block); // Debug missing links
                  timestamp.textContent = `${formattedDate} (No link available)`; // Fallback text
                  timestamp.style.color = '#888'; // Optional: Dim the text to indicate no link
                }
                container.appendChild(timestamp);


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
