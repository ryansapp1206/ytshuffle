import { appState } from './state.js';
import { fetchEntirePlaylist, abortActiveFetches } from './api.js';

function getStorageKey() {
    return 'yt_shuffle_favorites';
}

function getFavorites() {
    try {
        const stored = localStorage.getItem(getStorageKey());
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

export function renderDropdown(filterText = '') {
    const list = document.getElementById('dropdown-list');
    list.innerHTML = '';
    
    let favorites = getFavorites();
    appState.favoritePlaylistIds = favorites;

    appState.allPlaylistsData
        .filter(p => p.snippet.title.toLowerCase().includes(filterText))
        .sort((a, b) => {
            const aFav = favorites.includes(a.id);
            const bFav = favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        })
        .forEach(p => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';

            const textSpan = document.createElement('span');
            textSpan.innerText = `${p.snippet.title} (${p.contentDetails.itemCount})`;
            
            const starIcon = document.createElement('span');
            const isFavorite = favorites.includes(p.id);
            starIcon.innerHTML = isFavorite ? '★' : '☆';
            starIcon.style.cursor = 'pointer';
            starIcon.style.color = isFavorite ? '#FFD700' : '#888';
            starIcon.style.fontSize = '1.2rem';
            starIcon.style.paddingLeft = '10px';

            starIcon.onclick = (e) => {
                e.stopPropagation();
                
                let currentFavs = getFavorites();
                if (currentFavs.includes(p.id)) {
                    currentFavs = currentFavs.filter(id => id !== p.id);
                } else {
                    currentFavs.push(p.id);
                }
                
                try {
                    localStorage.setItem(getStorageKey(), JSON.stringify(currentFavs));
                } catch (error) {
                    console.warn("Storage access blocked. Unable to save favorite.", error);
                }
                
                renderDropdown(filterText);
            };

            li.onclick = () => { 
                if (appState.selectedPlaylistId === p.id) return;

                document.getElementById('playlist-search').value = p.snippet.title; 
                appState.selectedPlaylistId = p.id; 
                list.style.display = 'none'; 

                const refreshBtn = document.getElementById('refresh-playlist-btn');
                if (refreshBtn) refreshBtn.style.display = 'block';
                
                const nextBtn = document.getElementById('next-batch-btn');
                if (nextBtn) nextBtn.style.display = 'none';
                
                const mainBtn = document.getElementById('shuffle-main-btn');
                if (mainBtn) {
                    mainBtn.disabled = true;
                    mainBtn.innerText = "Downloading Playlist...";
                    mainBtn.className = "btn btn-primary";
                }
                
                appState.allVideoIds = []; 
                fetchEntirePlaylist(appState.selectedPlaylistId);
            };

            li.appendChild(textSpan);
            li.appendChild(starIcon);
            list.appendChild(li);
        });
}

export function setupUIEventListeners() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeBtn.innerText = currentTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';

        themeBtn.onclick = () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            
            if (isLight) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('yt_theme', 'dark');
                themeBtn.innerText = 'Toggle Light Mode';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('yt_theme', 'light');
                themeBtn.innerText = 'Toggle Dark Mode';
            }
        };
    }

    const search = document.getElementById('playlist-search');
    if (search) {
        search.onfocus = () => { 
            document.getElementById('dropdown-list').style.display = 'block'; 
            renderDropdown(search.value.toLowerCase()); 
        };

        search.oninput = (e) => { 
            const typedText = e.target.value.toLowerCase();
            const exactMatch = appState.allPlaylistsData.find(p => p.snippet.title.toLowerCase() === typedText);

            if (exactMatch) {
                if (appState.selectedPlaylistId !== exactMatch.id) {
                    appState.selectedPlaylistId = exactMatch.id; 
                    document.getElementById('dropdown-list').style.display = 'none'; 
                    
                    const nextBtn = document.getElementById('next-batch-btn');
                    if (nextBtn) nextBtn.style.display = 'none';
                    
                    const mainBtn = document.getElementById('shuffle-main-btn');
                    if (mainBtn) {
                        mainBtn.disabled = true;
                        mainBtn.innerText = "Downloading Playlist...";
                        mainBtn.className = "btn btn-primary";
                    }
                    
                    appState.allVideoIds = []; 
                    fetchEntirePlaylist(appState.selectedPlaylistId);
                }
            } else {
                const dropdownList = document.getElementById('dropdown-list');
                if (dropdownList) dropdownList.style.display = 'block';
                abortActiveFetches();
                
                appState.selectedPlaylistId = ""; 
                
                const mainBtn = document.getElementById('shuffle-main-btn');
                if (mainBtn) {
                    mainBtn.innerHTML = `<svg class="g-icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> Shuffle & Play`;
                    mainBtn.disabled = true;
                }
                
                const statusMsg = document.getElementById('status-msg');
                if (statusMsg) {
                    statusMsg.innerText = "Search for a playlist to begin.";
                }
                
                const nextBtn = document.getElementById('next-batch-btn');
                if (nextBtn) {
                    nextBtn.style.display = 'none';
                }
            }

            renderDropdown(typedText); 
        };
    }

    const modal = document.getElementById('info-modal');
    const openBtn = document.getElementById('open-modal');
    const closeBtn = document.getElementById('close-modal');

    if (openBtn && modal && closeBtn) {
        openBtn.onclick = () => {
            modal.classList.add('active');
            alignModalToAppContainer(modal);
        };
        closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };
    }

    const contactModal = document.getElementById('contact-modal');
    const openContactBtn = document.getElementById('open-contact-modal');
    const closeContactBtn = document.getElementById('close-contact-modal');
    const feedbackForm = document.getElementById('feedback-form');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');

    if (openContactBtn && contactModal && closeContactBtn) {
        openContactBtn.onclick = (e) => {
            e.preventDefault();
            contactModal.classList.add('active');
            alignModalToAppContainer(contactModal);
        };
        closeContactBtn.onclick = () => contactModal.classList.remove('active');
        contactModal.onclick = (e) => {
            if (e.target === contactModal) contactModal.classList.remove('active');
        };
    }

    const settingsModal = document.getElementById('settings-modal');
    const openSettingsBtn = document.getElementById('open-settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');

    if (openSettingsBtn && settingsModal && closeSettingsBtn) {
        openSettingsBtn.onclick = () => {
            settingsModal.classList.add('active');
            alignModalToAppContainer(settingsModal);
        };
        closeSettingsBtn.onclick = () => settingsModal.classList.remove('active');
        settingsModal.onclick = (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('active');
        };
    }

    const ttlSlider = document.getElementById('ttl-slider');
    const ttlDisplay = document.getElementById('ttl-display');
    if (ttlSlider && ttlDisplay) {
        ttlSlider.addEventListener('input', (e) => {
            const hours = parseInt(e.target.value, 10);
            if (hours >= 24) {
                const days = hours / 24;
                ttlDisplay.innerText = days === 1 ? '1 Day' : `${days} Days`;
            } else {
                ttlDisplay.innerText = `${hours} Hours`;
            }
        });
    }

    const maxFavSlider = document.getElementById('max-fav-slider');
    const maxFavDisplay = document.getElementById('max-fav-display');
    if (maxFavSlider && maxFavDisplay) {
        maxFavSlider.addEventListener('input', (e) => {
            maxFavDisplay.innerText = e.target.value;
        });
    }

    if (feedbackForm) {
        feedbackForm.onsubmit = async (e) => {
            e.preventDefault(); 
            submitFeedbackBtn.innerText = "Sending...";
            submitFeedbackBtn.disabled = true;

            try {
                const response = await fetch(feedbackForm.action, {
                    method: 'POST',
                    body: new FormData(feedbackForm),
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    feedbackForm.reset();
                    submitFeedbackBtn.innerText = "Feedback Sent!";
                    setTimeout(() => {
                        contactModal.classList.remove('active');
                        submitFeedbackBtn.innerText = "Send Feedback";
                        submitFeedbackBtn.disabled = false;
                    }, 2000);
                } else {
                    submitFeedbackBtn.innerText = "Error. Try Again.";
                    submitFeedbackBtn.disabled = false;
                }
            } catch (error) {
                submitFeedbackBtn.innerText = "Error. Try Again.";
                submitFeedbackBtn.disabled = false;
            }
        };
    }

    document.addEventListener('click', (event) => {
        const dropdownContainer = document.querySelector('.custom-dropdown');
        const dropdownList = document.getElementById('dropdown-list');

        if (dropdownContainer && dropdownList && !dropdownContainer.contains(event.target)) {
            dropdownList.style.display = 'none';
        }
    });

    const searchInput = document.getElementById('playlist-search');
    if (searchInput) {
        searchInput.addEventListener('click', () => {
            const dropdownList = document.getElementById('dropdown-list');
            if (dropdownList.innerHTML.trim() !== '') {
                dropdownList.style.display = 'block';
            }
        });
    }

    window.addEventListener('resize', () => {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) alignModalToAppContainer(activeModal);
    });
}

function alignModalToAppContainer(modalOverlay) {
    const appContainer = document.querySelector('.app-container');
    const modalContent = modalOverlay.querySelector('.modal-content');

    if (!appContainer || !modalContent) return;

    const rect = appContainer.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);

    modalContent.style.position = 'absolute';
    modalContent.style.left = `${centerX}px`;
    modalContent.style.top = `${centerY}px`;
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.margin = '0';
}