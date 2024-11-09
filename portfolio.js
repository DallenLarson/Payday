// Import necessary Firebase methods
import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Go back to the main search page
function goToIndex() {
    window.location.href = 'index.html';
}

// Load and display the portfolio
function loadPortfolio(sortBy = 'alphabet') {
    const portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    const cardList = document.getElementById('cardList');
    const totalValueElement = document.getElementById('totalValue');

    // Clear existing content
    cardList.innerHTML = '';

    // Hide portfolio if empty
    if (portfolio.length === 0) {
        cardList.innerHTML = "<p>No Cards Added.</p>";
        totalValueElement.textContent = "$0.00";
        return;
    }

    // Sort portfolio based on selected option
    switch (sortBy) {
        case 'alphabet':
            portfolio.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'releaseDate':
            portfolio.sort((a, b) => {
                const dateA = new Date(a.releaseDate || '1970-01-01');
                const dateB = new Date(b.releaseDate || '1970-01-01');
                return dateA - dateB;
            });
            break;
        case 'price':
            portfolio.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
    }

    // Display sorted cards
    let totalValue = 0;
    portfolio.forEach((card, index) => {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-entry';

        // Create clickable area with link
        const cardLink = document.createElement('a');
        cardLink.href = `card.html?id=${card.id}`;
        cardLink.className = 'card-link';

        const cardImage = document.createElement('img');
        cardImage.src = `https://images.pokemontcg.io/${card.id.split('-')[0]}/${card.id.split('-')[1]}.png`;
        cardImage.alt = card.name;
        cardImage.className = 'portfolio-card-image';

        const cardDetails = document.createElement('div');
        cardDetails.className = 'card-details';

        const cardName = document.createElement('p');
        cardName.className = 'card-name';
        cardName.textContent = card.name;

        const cardPrice = document.createElement('p');
        cardPrice.className = 'card-price';
        cardPrice.textContent = `Price: $${card.price.toFixed(2)}`;

        totalValue += card.price;

        // Remove button (outside the link)
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = (event) => {
            event.preventDefault();
            removeFromPortfolio(index);
        };

        // Append elements to create a clean layout
        cardDetails.appendChild(cardName);
        cardDetails.appendChild(cardPrice);
        cardLink.appendChild(cardImage);
        cardLink.appendChild(cardDetails);
        cardContainer.appendChild(cardLink);
        cardContainer.appendChild(removeButton);
        cardList.appendChild(cardContainer);
    });

    // Display the total collection value
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
}

// Check if the user has an active subscription and display appropriate messages
function checkSubscriptionStatus() {
    fetch('/check-subscription', { method: 'GET' }) // replace with your backend endpoint
        .then(response => response.json())
        .then(data => {
            if (data.subscribed) {
                displayThankYouMessage();
            } else {
                displaySubscriptionPrompt();
            }
        })
        .catch(error => console.error('Subscription check error:', error));
}

// Display a thank-you message for premium subscribers
function displayThankYouMessage() {
    const portfolioContainer = document.getElementById('portfolioContainer');
    const thankYouMessage = document.createElement('p');
    thankYouMessage.textContent = "Thank you for being a premium subscriber!";
    thankYouMessage.className = 'thank-you-message';
    portfolioContainer.prepend(thankYouMessage);
}

// Display a prompt for users to subscribe
function displaySubscriptionPrompt() {
    const portfolioContainer = document.getElementById('portfolioContainer');
    const promptMessage = document.createElement('p');
    promptMessage.textContent = "Unlock premium features with a subscription!";
    promptMessage.className = 'prompt-message';
    portfolioContainer.prepend(promptMessage);

    const subscribeButton = document.createElement('button');
    subscribeButton.textContent = "Subscribe Now";
    subscribeButton.className = 'subscribe-button';
    subscribeButton.onclick = () => window.location.href = '/subscribe.html';
    portfolioContainer.prepend(subscribeButton);
}

// Function to handle sorting changes
function sortPortfolio(event) {
    const sortBy = event.target.value;
    loadPortfolio(sortBy);
}

// Function to remove a card from the portfolio
function removeFromPortfolio(index) {
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    portfolio.splice(index, 1);
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    loadPortfolio();
}

// Function to export portfolio as a JSON file
function exportPortfolio() {
    const portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolio, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "pokemon_portfolio.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Function to import portfolio from a JSON file
function importPortfolio(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData) || !importedData.every(item => item.name && item.price && item.id)) {
                alert("Invalid portfolio file format.");
                return;
            }

            const replacePortfolio = confirm("Do you want to replace your current portfolio with this imported file? Click 'OK' to replace or 'Cancel' to merge.");
            let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

            portfolio = replacePortfolio ? importedData : portfolio.concat(importedData);
            localStorage.setItem('portfolio', JSON.stringify(portfolio));
            loadPortfolio();
            alert("Portfolio imported successfully!");
        } catch (error) {
            console.error("Error importing portfolio:", error);
            alert("Failed to import portfolio. Please check the file format.");
        }
    };
    reader.readAsText(file);
}

// Check authentication and subscription status
window.addEventListener('load', () => {
    loadPortfolio();
    checkSubscriptionStatus();
});
