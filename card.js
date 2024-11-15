import { auth, db } from "./firebaseConfig.js";
import { setDoc, updateDoc, arrayUnion, doc, collection, addDoc, deleteDoc, query, orderBy, onSnapshot, Timestamp, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const apiKey = '7e56dabe-1394-4d6e-aa3b-f7250070b899';
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('id');

// Fetch and display card details
// Modify this part in fetchCardDetails
async function fetchCardDetails() {
    const cardContainer = document.getElementById('cardImage'); // Move this to the top
    if (!cardContainer) {
        console.error("Element with id 'card' not found.");
        return;
    }

    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
            headers: {
                'X-Api-Key': apiKey,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        const card = data.data;
        

        // Populate HTML elements
        document.getElementById('cardName').textContent = card.name;
        document.getElementById('cardImage').src = card.images.large;
        document.getElementById('cardSet').textContent = `Set: ${card.set.name}`;
        document.getElementById('cardRarity').textContent = card.rarity;
        document.getElementById('cardNumber').textContent = card.number;
        document.getElementById('cardType').textContent = card.supertype;
        document.getElementById('cardElement').textContent = card.types ? card.types.join(', ') : 'N/A';
        document.getElementById('cardClass').textContent = card.subtypes ? card.subtypes.join(', ') : 'N/A';
        document.getElementById('cardPrice').textContent = card.cardmarket
            ? `Price: $${card.cardmarket.prices.averageSellPrice.toFixed(2)}`
            : 'Price: N/A';

        // Set the data-rarity attribute for the shader
        const rarityClass = getRarityClass(card.rarity);
        cardContainer.setAttribute('data-rarity', rarityClass);

        // Log the card name, rarity, and data-rarity attribute using getAttribute
        console.log(`Card Name: ${card.name}`);
        console.log(`Card Rarity: ${card.rarity}`);
        console.log(`Data-Rarity Attribute: ${cardContainer.getAttribute('data-rarity')}`);

        // Apply title and meta updates
        document.title = `${card.name} (${card.number}/${card.set.total}) - ${card.set.name} | Payday`;
        updateMetaTags(card);
        renderPriceChart(card);

        // Define addButton and attach click event
        const addButton = document.getElementById('addButton');
        addButton.onclick = () => addToPortfolio(card);

    } catch (error) {
        console.error('Error fetching card details:', error);
    }
}


// Function to determine rarity class
function getRarityClass(rarity) {
    switch (rarity.toLowerCase()) {
        case 'rare holo':
            return 'rare holo';
        case 'rare holo galaxy':
            return 'rare holo galaxy';
        case 'rare holo v':
            return 'rare holo v';
        case 'rare holo vmax':
            return 'rare holo vmax';
        case 'rare holo vstar':
            return 'rare holo vstar';
        case 'rare ultra':
            return 'rare ultra';
        case 'rare rainbow':
            return 'rare rainbow';
        case 'radiant':
            return 'radiant';
        default:
            return 'normal';
    }
}


// Update Meta Tags
function updateMetaTags(card) {
    document.querySelector('meta[property="og:title"]').setAttribute("content", `Check ${card.name} out on Payday!`);
    document.querySelector('meta[property="og:image"]').setAttribute("content", card.images.large);
    document.title = `${card.name} | Payday`;
}

// Render Price Chart with Price Difference Indicator
// Render Price Chart with Price Difference Indicator
function renderPriceChart(card) {
    const prices = card.cardmarket ? card.cardmarket.prices : {};
    const todayPrice = prices.averageSellPrice || 0;
    const oneMonthAgoPrice = prices.avg30 || todayPrice;

    // Calculate the price difference and percentage change
    const priceDifference = todayPrice - oneMonthAgoPrice;
    const percentageChange = ((priceDifference / oneMonthAgoPrice) * 100).toFixed(2);

    // Format the price difference display
    const priceIndicator = document.createElement("span");
    priceIndicator.innerHTML = `${priceDifference >= 0 ? '▲' : '▼'} $${Math.abs(priceDifference).toFixed(2)} (${Math.abs(percentageChange)}%)`;
    priceIndicator.style.color = priceDifference >= 0 ? 'green' : 'red';

    // Insert the indicator below the "Last 30 Days" title
    const priceChartContainer = document.querySelector('.price-chart-container');
    const priceIndicatorContainer = document.createElement('div');
    priceIndicatorContainer.style.textAlign = 'center';
    priceIndicatorContainer.style.marginTop = '5px';
    priceIndicatorContainer.appendChild(priceIndicator);

    // Append the price indicator container to the chart container
    priceChartContainer.appendChild(priceIndicatorContainer);

    // Render the chart with conditional line color
    const ctx = document.getElementById('priceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1 Month Ago', '1 Week Ago', 'Yesterday', 'Today'],
            datasets: [{
                label: 'Price in USD',
                data: [prices.avg30, prices.avg7, prices.avg1, todayPrice],
                borderColor: priceDifference >= 0 ? 'green' : 'red',
                backgroundColor: priceDifference >= 0 ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price in USD'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}



// Add full card details to portfolio
async function addToPortfolio(card) {
    try {
        await addCardToPortfolio(card);
        alert(`${card.name} has been added to your portfolio!`);
    } catch (error) {
        console.error("Error adding card to portfolio:", error);
        alert("Failed to add card to portfolio.");
    }
}

async function addCardToPortfolio(card) {
    const user = auth.currentUser;
    if (!user) {
        console.error("Error adding card to portfolio: Can't find user!");
        return;
    }

    const portfolioRef = doc(db, "portfolios", user.uid);

    // Check if the portfolio document exists, create if it doesn’t
    const portfolioDoc = await getDoc(portfolioRef);
    if (!portfolioDoc.exists()) {
        await setDoc(portfolioRef, { cards: [] });
        console.log("Created new portfolio document for user:", user.uid);
    }

    // Now proceed with adding the card to the portfolio
    await updateDoc(portfolioRef, {
        cards: arrayUnion(card)
    });
    console.log("Card added to portfolio in Firestore:", card);
}

// Go back to the main search page
function goToIndex() {
    window.history.back();
}

function goToPortfolio() {
    window.location.href = 'portfolio.html';
}

// Add 3D tilt effect on mouse move
const cardImageContainer = document.querySelector('.card-image-single');
const cardImage = document.getElementById('cardImage');

cardImageContainer.addEventListener('mousemove', (event) => {
    // Get the position of the mouse relative to the card image
    const rect = cardImageContainer.getBoundingClientRect();
    const x = event.clientX - rect.left; // X position within the card image
    const y = event.clientY - rect.top;  // Y position within the card image

    // Calculate rotation values based on mouse position
    const rotateY = ((x / rect.width) - 0.5) * 30; // Adjust for sensitivity
    const rotateX = ((y / rect.height) - 0.5) * -30; // Adjust for sensitivity

    // Apply the rotation
    cardImage.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
});

// Reset rotation when the mouse leaves the image area
cardImageContainer.addEventListener('mouseleave', () => {
    cardImage.style.transform = 'rotateY(0deg) rotateX(0deg)';
});


// Fetch the card details when the page loads
fetchCardDetails();

async function logCardView(cardId) {
    try {
        console.log(`Attempting to log view for cardId: ${cardId}`); // Log the card ID being processed
        const cardRef = doc(db, "cardViews", cardId);
        await updateDoc(cardRef, {
            views: arrayUnion(Timestamp.now()) // Add a new timestamp to the 'views' array
        });
        console.log(`Successfully logged view for cardId: ${cardId}`); // Log success
    } catch (error) {
        console.error("Error logging card view:", error);

        // If the document doesn't exist, create it
        if (error.code === 'not-found') {
            console.log(`Card document not found for cardId: ${cardId}, creating a new document...`);
            await setDoc(doc(db, "cardViews", cardId), { views: [Timestamp.now()] });
            console.log(`Created new document and logged view for cardId: ${cardId}`);
        }
    }
}


// Call this function after fetching card details
fetchCardDetails().then(() => {
    if (cardId) {
        logCardView(cardId);
    }
});


const commentsList = document.getElementById('comments-list');
const postCommentButton = document.getElementById('postCommentButton');
const commentText = document.getElementById('commentText');

// Fetch and display comments in real-time
function fetchComments() {
    const commentsRef = collection(db, "cards", cardId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        commentsList.innerHTML = ""; // Clear comments list
        snapshot.forEach((doc) => {
            const comment = doc.data();
            const isCurrentUser = auth.currentUser && auth.currentUser.uid === comment.userId;

            const commentElement = document.createElement("div");
            commentElement.className = "comment";
            commentElement.innerHTML = `
                <img src="${comment.profilePicture}" class="profile-picture" alt="Profile Picture">
                <div class="comment-content">
                    <p><strong>${comment.username}</strong> - ${comment.timestamp.toDate().toLocaleString()}</p>
                    <p>${comment.text}</p>
                </div>
            `;

            if (isCurrentUser) {
                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.textContent = "Delete";
                deleteButton.onclick = () => deleteComment(doc.id);
                commentElement.appendChild(deleteButton);
            }

            commentsList.appendChild(commentElement);
        });
    });
}


// Add new comment with profile picture and username
postCommentButton.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("Please log in to post a comment.");
        return;
    }

    const commentContent = commentText.value.trim();
    if (commentContent === "") {
        alert("Comment cannot be empty.");
        return;
    }

    // Fetch the user's username and profile picture from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    const commentData = {
        userId: user.uid,
        username: userData.username || user.email.split("@")[0],
        profilePicture: userData.profilePic, // Fetch profile pic or use default
        text: commentContent,
        timestamp: Timestamp.now()
    };

    try {
        const commentsRef = collection(db, "cards", cardId, "comments");
        await addDoc(commentsRef, commentData);
        commentText.value = ""; // Clear the comment box
    } catch (error) {
        console.error("Error posting comment:", error);
        alert("Failed to post comment.");
    }
});


// Delete comment function
async function deleteComment(commentId) {
    if (confirm("Are you sure you want to delete this comment?")) {
        try {
            const commentRef = doc(db, "cards", cardId, "comments", commentId);
            await deleteDoc(commentRef);
            console.log("Comment deleted:", commentId);
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment.");
        }
    }
}

// Initialize comments fetching
fetchComments();