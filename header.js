document.addEventListener('DOMContentLoaded', () => {
    const globalSearchInput = document.getElementById('globalSearchInput');

    globalSearchInput.addEventListener('input', () => {
        const query = globalSearchInput.value.trim();

        if (query.length >= 3) {
            // Redirect to index.html with the search query as a parameter
            window.location.href = `index.html?query=${encodeURIComponent(query)}`;
        }
    });
});
