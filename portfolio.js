// Go back to the main search page
function goToIndex() {
    window.location.href = 'index.html';
}

// Load and display the portfolio
function loadPortfolio() {
    const portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    const cardList = document.getElementById('cardList');
    const totalValueElement = document.getElementById('totalValue');

    let totalValue = 0;
    cardList.innerHTML = ''; // Clear existing content

    portfolio.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-entry';

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

        // Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeFromPortfolio(index);

        // Append details and remove button to card entry
        cardDetails.appendChild(cardName);
        cardDetails.appendChild(cardPrice);
        cardElement.appendChild(cardImage);
        cardElement.appendChild(cardDetails);
        cardElement.appendChild(removeButton);
        cardList.appendChild(cardElement);
    });

    // Display the total collection value
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
}

// Function to remove a card from the portfolio
function removeFromPortfolio(index) {
    let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    portfolio.splice(index, 1); // Remove the card at the specified index
    localStorage.setItem('portfolio', JSON.stringify(portfolio)); // Update local storage
    loadPortfolio(); // Refresh the portfolio display
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

            // Validate imported data
            if (!Array.isArray(importedData) || !importedData.every(item => item.name && item.price && item.id)) {
                alert("Invalid portfolio file format.");
                return;
            }

            // Ask the user if they want to replace or merge
            const replacePortfolio = confirm("Do you want to replace your current portfolio with this imported file? Click 'OK' to replace or 'Cancel' to merge.");

            let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];

            if (replacePortfolio) {
                // Replace existing portfolio
                portfolio = importedData;
            } else {
                // Merge imported data with existing portfolio
                portfolio = portfolio.concat(importedData);
            }

            // Save the updated portfolio to local storage
            localStorage.setItem('portfolio', JSON.stringify(portfolio));

            loadPortfolio(); // Refresh the portfolio display
            alert("Portfolio imported successfully!");
        } catch (error) {
            console.error("Error importing portfolio:", error);
            alert("Failed to import portfolio. Please check the file format.");
        }
    };
    reader.readAsText(file);
}

// Load the portfolio when the page loads
window.addEventListener('load', loadPortfolio);
