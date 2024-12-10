'use strict';

const balanceSpan = document.getElementById('balance');
const betInput = document.getElementById('bet');
const gameResultDiv = document.getElementById('game-result');
const gameContainers = document.querySelectorAll('.game-container');

// Fetch initial balance from the backend
async function getBalance() {
    await fetch('http://localhost:4000/casino/menu', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.balance !== undefined) {
            balanceSpan.textContent = data.balance;
        } else {
            gameResultDiv.textContent = data.message || 'Error fetching games.';
        }
    })
    .catch(error => {
        console.error('Error fetching balance:', error);
        balanceSpan.textContent = 'Error';
    });
}

// Show a specific game and hide others
function showGame(gameId) {
    gameContainers.forEach(container => {
        if (container.id === gameId) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
    });
}

// Function to handle bets
function placeBet(gameId, extraData = {}) {
    const betAmount = parseFloat(betInput.value);

    if (isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount.');
        return;
    }

    const requestBody = { bet: betAmount, ...extraData };

    fetch(`http://localhost:4000/casino/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            balanceSpan.textContent = data.balance || data.player_balance;
            gameResultDiv.textContent = data.message || 'Game completed.';
            if (data.race_results) {
                console.log('Race Results:', data.race_results);
            }
        }
    })
    .catch(error => {
        console.error(`Error playing ${gameId}:`, error);
        alert('An error occurred while playing the game.');
    });
}

// Initialize Snake Eyes logic
function initSnakeEyes() {
    document.getElementById('snake-eyes-container').innerHTML = `
        <button id="snake-eyes-play">Roll Dice</button>
        <div id="snake-eyes-result"></div>
    `;

    document.getElementById('snake-eyes-play').onclick = () => {
        const betAmount = parseFloat(document.getElementById('bet').value);
        const resultDiv = document.getElementById('snake-eyes-result');
        const balanceSpan = document.getElementById('balance'); // Ensure this ID exists

        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }

        fetch('http://localhost:4000/casino/snake-eyes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bet: betAmount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                resultDiv.innerHTML = `
                    <p>${data.message}</p>
                    <p>Dice Rolls: ${data.dice_rolls.join(', ')}</p>
                    <p>Your Balance: ${data.balance} euros</p>
                `;

                // Update balance on the page
                balanceSpan.textContent = data.balance;
            }
        })
        .catch(error => {
            console.error('Error in Snake Eyes:', error);
            alert('An error occurred while playing Snake Eyes.');
        });
    };
}

// Initialize Hi-Lo logic
function initHiLo() {
    document.getElementById('hilo-container').innerHTML = `
        <button id="hilo-start">Start Game</button>
        <div id="hilo-first-card" style="display: none;"></div>
        <div id="hilo-guess" style="display: none;">
            <button id="hilo-hi">Guess Hi</button>
            <button id="hilo-lo">Guess Lo</button>
        </div>
        <div id="hilo-result"></div>
    `;

    const firstCardDiv = document.getElementById('hilo-first-card');
    const guessDiv = document.getElementById('hilo-guess');
    const resultDiv = document.getElementById('hilo-result');
    const balanceSpan = document.getElementById('balance'); // Ensure this ID exists

    document.getElementById('hilo-start').onclick = () => {
        const betAmount = parseFloat(document.getElementById('bet').value);

        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }

        fetch('http://localhost:4000/casino/hilo/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bet: betAmount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                firstCardDiv.style.display = 'block';
                firstCardDiv.innerHTML = `<p>${data.message}</p>`;
                guessDiv.style.display = 'block';
                resultDiv.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error starting Hi-Lo:', error);
            alert('An error occurred while starting the game.');
        });
    };

    document.getElementById('hilo-hi').onclick = () => makeHiLoGuess('HI');
    document.getElementById('hilo-lo').onclick = () => makeHiLoGuess('LO');

    function makeHiLoGuess(guess) {
        fetch('http://localhost:4000/casino/hilo/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess: guess })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                resultDiv.innerHTML = `
                    <p>${data.message}</p>
                    <p>Your Balance: ${data.balance} euros</p>
                `;
                firstCardDiv.style.display = 'none';
                guessDiv.style.display = 'none';
                balanceSpan.textContent = data.balance;
            }
        })
        .catch(error => {
            console.error('Error making Hi-Lo guess:', error);
            alert('An error occurred while making your guess.');
        });
    }
}


// Initialize Horse Race logic
function initHorseRace() {
    document.getElementById('horse-race-container').innerHTML = `
        <select id="horse-select">
            <option value="Diddy">Diddy</option>
            <option value="Kolovastaava">Kolovastaava</option>
            <option value="Sakke">Sakke</option>
            <option value="Rinne">Rinne</option>
            <option value="Uusitalo">Uusitalo</option>
        </select>
        <button id="horse-race-play">Start Race</button>
        <div id="horse-race-result"></div>
    `;

    document.getElementById('horse-race-play').onclick = () => {
        const selectedHorse = document.getElementById('horse-select').value;
        const betAmount = parseFloat(document.getElementById('bet').value);

        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }

        fetch('http://localhost:4000/casino/horse_race', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ horse: selectedHorse, bet: betAmount })
        })
        .then(response => response.json())
        .then(data => {
            const horseRaceResultDiv = document.getElementById('horse-race-result');
            const balanceSpan = document.getElementById('balance'); // Ensure this ID exists

            if (data.error) {
                horseRaceResultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                let raceDetails = '<h4>Race Results:</h4>';
                for (const [horse, speed] of Object.entries(data.race_results)) {
                    raceDetails += `<p>${horse}: ${speed} speed</p>`;
                }

                horseRaceResultDiv.innerHTML = `
                    <p>${data.message}</p>
                    ${raceDetails}
                    <p>Your Balance: ${data.player_balance} euros</p>
                `;

                // Update balance on the page
                balanceSpan.textContent = data.player_balance;
            }
        })
        .catch(error => {
            console.error('Error in Horse Race:', error);
            alert('An error occurred while starting the race.');
        });
    };
}

// Initialize Blackjack logic
function initBlackjack() {
    document.getElementById('blackjack-container').innerHTML = `
        <button id="blackjack-start">Start Blackjack</button>
        <div id="blackjack-result"></div>
        <div id="blackjack-actions" style="display: none;">
            <button id="blackjack-hit">Hit</button>
            <button id="blackjack-stand">Stand</button>
        </div>
    `;

    const blackjackResult = document.getElementById('blackjack-result');
    const blackjackActions = document.getElementById('blackjack-actions');

    document.getElementById('blackjack-start').onclick = () => {
        const betAmount = parseFloat(document.getElementById('bet').value);

        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }

        fetch('http://localhost:4000/casino/blackjack/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bet: betAmount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                blackjackResult.innerHTML = `
                    <p>Your hand: ${data.player_hand.join(', ')}</p>
                    <p>Dealer's hand: ${data.dealer_hand.join(', ')}</p>
                `;
                blackjackActions.style.display = 'block';
                blackjackActions.dataset.gameId = data.game_id;
            }
        })
        .catch(error => console.error('Error starting Blackjack:', error));
    };

    document.getElementById('blackjack-hit').onclick = () => {
        const gameId = blackjackActions.dataset.gameId;

        fetch('http://localhost:4000/casino/blackjack/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: gameId, action: 'hit' })
        })
        .then(response => response.json())
        .then(data => {
            blackjackResult.innerHTML = `
                <p>Your hand: ${data.player_hand.join(', ')}</p>
                <p>Dealer's hand: ${data.dealer_hand.join(', ')}</p>
                <p>${data.result || data.message}</p>
            `;
            if (data.finished) blackjackActions.style.display = 'none';
        })
        .catch(error => console.error('Error hitting in Blackjack:', error));
    };

    document.getElementById('blackjack-stand').onclick = () => {
        const gameId = blackjackActions.dataset.gameId;

        fetch('http://localhost:4000/casino/blackjack/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: gameId, action: 'stand' })
        })
        .then(response => response.json())
        .then(data => {
            blackjackResult.innerHTML = `
                <p>Your hand: ${data.player_hand.join(', ')}</p>
                <p>Dealer's hand: ${data.dealer_hand.join(', ')}</p>
                <p>${data.result}</p>
            `;
            blackjackActions.style.display = 'none';
        })
        .catch(error => console.error('Error standing in Blackjack:', error));
    };
}


// Initialize balance on page load
getBalance();

// Initialize games based on selected game
document.querySelector('button[onclick*="snake-eyes"]').onclick = () => {
    showGame('snake-eyes');
    initSnakeEyes();
};

document.querySelector('button[onclick*="hilo"]').onclick = () => {
    showGame('hilo');
    initHiLo();
};

document.querySelector('button[onclick*="horse-race"]').onclick = () => {
    showGame('horse-race');
    initHorseRace();
};

document.querySelector('button[onclick*="blackjack"]').onclick = () => {
    showGame('blackjack');
    initBlackjack();
};
