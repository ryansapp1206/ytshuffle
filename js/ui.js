import { appState } from './state.js';
import { fetchEntirePlaylist } from './api.js';

function getFavorites() {
    try {
        const stored = localStorage.getItem('yt_favorites');
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
                
                localStorage.setItem('yt_favorites', JSON.stringify(currentFavs));
                renderDropdown(filterText);
            };

            li.onclick = () => { 
                if (appState.selectedPlaylistId === p.id) return;

                document.getElementById('playlist-search').value = p.snippet.title; 
                appState.selectedPlaylistId = p.id; 
                list.style.display = 'none'; 
                
                const nextBtn = document.getElementById('next-batch-btn');
                if (nextBtn) nextBtn.style.display = 'none';
                
                const mainBtn = document.getElementById('shuffle-main-btn');
                if (mainBtn) {
                    mainBtn.disabled = true;
                    mainBtn.innerText = "Downloading Playlist...";
                    mainBtn.className = "btn btn-primary";
                    
                    if (nextBtn && nextBtn.parentNode) {
                        nextBtn.parentNode.insertBefore(mainBtn, nextBtn);
                    }
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
    const search = document.getElementById('playlist-search');
    if (search) {
        search.onfocus = () => { 
            document.getElementById('dropdown-list').style.display = 'block'; 
            renderDropdown(search.value.toLowerCase()); 
        };

        search.oninput = (e) => { 
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

            renderDropdown(e.target.value.toLowerCase()); 
        };
    }

    const modal = document.getElementById('info-modal');
    const openBtn = document.getElementById('open-modal');
    const closeBtn = document.getElementById('close-modal');

    if (openBtn && modal && closeBtn) {
        openBtn.onclick = () => modal.classList.add('active');
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
        };
        
        closeContactBtn.onclick = () => contactModal.classList.remove('active');
        
        contactModal.onclick = (e) => {
            if (e.target === contactModal) contactModal.classList.remove('active');
        };
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
}