const video = document.getElementById('cameraStream');
const scanButton = document.getElementById('scanButton');
const scanStatus = document.getElementById('scanStatus');

// Google Cloud Vision API key for authentication
const googleVisionApiKey = 'AIzaSyC3Y9ursyrmj6IrLsAfv6nYV_uzCu-v53Y'; // Replace with your actual Vision API key

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error('Error accessing the camera:', error);
        scanStatus.textContent = 'Error: Unable to access camera.';
    }
}

async function scanForCard() {
    scanStatus.textContent = 'Scanning for card...';
    // Capture a frame from the video feed
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // Send `imageDataUrl` to Google Vision API
    const foundCard = await analyzeImageWithVisionAPI(imageDataUrl);

    if (foundCard) {
        addToPortfolio(foundCard);
        scanStatus.textContent = `Added ${foundCard.name} to portfolio!`;
    } else {
        scanStatus.textContent = 'No matching card found. Try again.';
    }
}

// Function to call Google Vision API
async function analyzeImageWithVisionAPI(imageDataUrl) {
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`;

    const response = await fetch(visionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [
                {
                    image: {
                        content: imageDataUrl.split(',')[1] // Remove data:image/png;base64, prefix
                    },
                    features: [{ type: 'LABEL_DETECTION', maxResults: 5 }]
                }
            ]
        })
    });

    const result = await response.json();

    // Check for labels that match card names
    const labels = result.responses[0]?.labelAnnotations || [];
    for (let label of labels) {
        if (label.description) {
            // Simulate finding a matching card based on label description
            return { name: label.description, id: 'pgo-56' }; // Replace 'pgo-56' with real ID matching logic if possible
        }
    }
    return null; // No match found
}

async function addToPortfolio(card) {
    // Fetch the card details using its ID to get the price
    const cardDetails = await fetchCardDetails(card.id);

    // If the card details are fetched successfully, add them to the portfolio
    if (cardDetails) {
        const cardToAdd = {
            ...card,
            price: cardDetails.cardmarket?.prices.averageSellPrice || 0 // Use the fetched price or default to 0 if unavailable
        };

        // Retrieve existing portfolio from localStorage and add the new card
        let portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
        portfolio.push(cardToAdd);
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
    } else {
        console.error('Failed to fetch card details.');
    }
}

// Function to fetch card details, including price, from the Pokémon TCG API
async function fetchCardDetails(cardId) {
    const tcgApiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
            headers: {
                'X-Api-Key': tcgApiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching card details:', error);
        return null;
    }
}

// Initialize camera on page load
window.onload = startCamera;
scanButton.onclick = scanForCard;

function goToIndex() {
    window.location.href = 'index.html';
}
