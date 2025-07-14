document.addEventListener('DOMContentLoaded', () => {
    const languageSelectionView = document.getElementById('language-selection-view');
    const languageListView = document.getElementById('language-list');
    const genreListView = document.getElementById('genre-list');
    const playerView = document.getElementById('player-view');
    const genreSelectionView = document.getElementById('genre-selection-view');
    const albumArtImg = document.querySelector('#song-artwork img');
    const playButton = document.getElementById('play-button');
    const guessInput = document.getElementById('guess-input');
    const submitGuessBtn = document.getElementById('submit-guess');
    const feedbackText = document.getElementById('feedback');
    const nextSongBtn = document.getElementById('next-song');
    const skipButton = document.getElementById('skip-button');
    const backButton = document.getElementById('back-button');
    const scoreDisplay = document.getElementById('score-display');


    const API_URL = 'https://api.deezer.com/';

    let currentSong = null;
    let currentAudio = null;
    let guessAttempts = 0;
    let score = 0;
    let selectedGenre = '';
    const snippetDurations = [1000, 3000, 5000, 8000, 10000]; // 1s, 3s, 5s, 8s

    const PROXY_URL = 'https://api.codetabs.com/v1/proxy?quest=';

    async function fetchFromAPI(endpoint) {
        try {
            const response = await fetch(`${PROXY_URL}${API_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching from API:', error);
            feedbackText.textContent = 'Failed to load data. Please try again later.';
        }
    }



    // Modify loadGenres to show genres immediately
    async function loadGenres() {
        const curatedGenres = [
            { name: 'Pop' }, { name: 'Rap' }, { name: 'Hip-Hop' },
            { name: 'Dance' }, { name: 'R&B' }, { name: 'Alternative' },
            { name: 'Jazz' }, { name: 'Country' }, { name: 'Classical' },
            { name: 'Reggae' }, { name: 'Metal' }, { name: 'Indie' },
              { name: 'Rock' }, { name: 'Electronic' },
        ];

        genreListView.innerHTML = '';
        curatedGenres.forEach(genre => {
            const button = document.createElement('button');
            button.className = 'genre-button';
            button.textContent = genre.name;
            button.addEventListener('click', () => selectGenre(genre.name));
            genreListView.appendChild(button);
        });

        // Show genre selection immediately
        document.getElementById('language-selection-view').classList.add('hidden');
        genreSelectionView.classList.remove('hidden');
    }

    // Modify selectGenre to use just the genre name
    async function selectGenre(genreName) {
        selectedGenre = genreName;
        genreSelectionView.classList.add('hidden');
        playerView.classList.remove('hidden');
        backButton.classList.remove('hidden');
        feedbackText.textContent = 'Loading song...';
        loadNewSong(genreName);
    }

    // Modify loadNewSong to remove language from query
    async function loadNewSong(genreName) {
        const searchData = await fetchFromAPI(`search/playlist?q=${encodeURIComponent(genreName)}`);
        if (searchData && searchData.data && searchData.data.length > 0) {
            // Pick a random playlist from the search results
            const playlist = searchData.data[Math.floor(Math.random() * searchData.data.length)];
            const tracksData = await fetchFromAPI(`playlist/${playlist.id}/tracks`);

            if (tracksData && tracksData.data && tracksData.data.length > 0) {
                // Filter for tracks that have a preview URL
                const tracksWithPreview = tracksData.data.filter(track => track.preview && track.preview.length > 0);
                
                if (tracksWithPreview.length > 0) {
                    currentSong = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
                    albumArtImg.src = currentSong.album.cover_xl;
                    albumArtImg.alt = `Album art for ${currentSong.album.title}`;
                    resetGameState();
                } else {
                    feedbackText.textContent = 'Found playlists, but no songs with previews. Try another genre.';
                    console.error('No tracks with previews found in playlist ' + playlist.id);
                }
            } else {
                feedbackText.textContent = 'Could not load tracks from the playlist. Please try another genre.';
                console.error('No tracks found in playlist ' + playlist.id, tracksData);
            }
        } else {
            feedbackText.textContent = 'Could not find any playlists for this genre. Please try another one.';
            console.error('No playlists found for genre ' + genreName, searchData);
        }
    }

    function loadLanguages() {
        const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Hindi', 'Japanese'];
        languageListView.innerHTML = '';
        languages.forEach(lang => {
            const button = document.createElement('button');
            button.className = 'language-button';
            button.textContent = lang;
            button.addEventListener('click', () => selectLanguage(lang));
            languageListView.appendChild(button);
        });
    }

    function selectLanguage(language) {
        selectedLanguage = language;
        languageSelectionView.classList.add('hidden');
        genreSelectionView.classList.remove('hidden');
        backButton.classList.remove('hidden'); // Show back button to return to language selection
    }

    function resetGameState() {
        guessAttempts = 0;
        guessInput.value = '';
        guessInput.disabled = false;
        submitGuessBtn.disabled = false;
        skipButton.classList.remove('hidden');
        nextSongBtn.classList.add('hidden');
        feedbackText.textContent = 'Press play to hear the first snippet.';
        playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px"><path d="M8 5v14l11-7z"/></svg>'; // Play icon

        if (currentAudio) {
            currentAudio.pause();
        }
        currentAudio = new Audio(currentSong.preview);
    }

    function playSnippet() {
        if (!currentAudio) return;

        if (currentAudio.paused) {
            const duration = snippetDurations[guessAttempts];
            currentAudio.currentTime = 0;
            currentAudio.play();
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'; // Pause icon

            setTimeout(() => {
                if (currentAudio) { // Check if audio still exists
                    currentAudio.pause();
                    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px"><path d="M8 5v14l11-7z"/></svg>'; // Play icon
                }
            }, duration);
            feedbackText.textContent = `Listen carefully... (${duration / 1000}s)`;
        } else {
            currentAudio.pause();
            playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px"><path d="M8 5v14l11-7z"/></svg>'; // Play icon
        }
    }

    function handleGuess() {
        const userGuess = guessInput.value.trim().toLowerCase();
        const songTitle = currentSong.title.toLowerCase();

        if (userGuess === songTitle) {
            const points = 100 - (guessAttempts * 10);
            score += points;
            feedbackText.textContent = `Correct! +${points} points. The song was ${currentSong.title} by ${currentSong.artist.name}.`;
            endRound(true);
        } else {
            guessAttempts++;
            if (guessAttempts >= snippetDurations.length) {
                score -= 10;
                feedbackText.textContent = `No more attempts! The song was ${currentSong.title} by ${currentSong.artist.name}.`;
                endRound(false);
            } else {
                feedbackText.textContent = `Not quite! Try again. Attempt ${guessAttempts + 1}.`;
            }
        }
        scoreDisplay.textContent = `Score: ${score}`;
        guessInput.value = '';
    }

    function endRound(isCorrect) {
        if (currentAudio) {
            currentAudio.pause();
        }
        guessInput.disabled = true;
        submitGuessBtn.disabled = true;
        skipButton.classList.add('hidden');
        nextSongBtn.classList.remove('hidden');
    }

    function skipSong() {
        score -= 5; // Penalty for skipping
        scoreDisplay.textContent = `Score: ${score}`;
        feedbackText.textContent = `Skipped! The song was ${currentSong.title} by ${currentSong.artist.name}.`;
        loadNewSong(selectedGenre);
    }

    playButton.addEventListener('click', playSnippet);
    submitGuessBtn.addEventListener('click', handleGuess);
    skipButton.addEventListener('click', skipSong);
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });
    nextSongBtn.addEventListener('click', () => {
        if (selectedGenre) {
            loadNewSong(selectedGenre);
        }
    });

    backButton.addEventListener('click', () => {
        if (!playerView.classList.contains('hidden')) {
            // From player back to genres
            playerView.classList.add('hidden');
            genreSelectionView.classList.remove('hidden');
            if (currentAudio) {
                currentAudio.pause();
            }
        } else if (!genreSelectionView.classList.contains('hidden')) {
            // From genres back to languages
            genreSelectionView.classList.add('hidden');
            languageSelectionView.classList.remove('hidden');
            backButton.classList.add('hidden');
        }
    });

    // Initialize the game
    loadLanguages();
    // Initialize by loading genres directly
    loadGenres();
});