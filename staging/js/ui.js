import { appState } from './state.js';
import { fetchEntirePlaylist } from './api.js';

export function renderDropdown(filterText = '') {
    const list = document.getElementById('dropdown-list');
    list.innerHTML = '';
    appState.allPlaylistsData.filter(p => p.snippet.title.toLowerCase().includes(filterText)).forEach(p => {
        const li = document.createElement('li');
        li.innerText = `${p.snippet.title} (${p.contentDetails.itemCount})`;
        li.onclick = () => { 
            if(appState.isFetching) return;
            appState.isFetching = true;

            document.getElementById('playlist-search').value = p.snippet.title; 
            appState.selectedPlaylistId = p.id; 
            list.style.display = 'none'; 
            
            const nextBtn = document.getElementById('next-batch-btn');
            nextBtn.style.display = 'none';
            
            const mainBtn = document.getElementById('shuffle-main-btn');
            mainBtn.disabled = true;
            mainBtn.innerText = "Downloading Playlist...";
            
            mainBtn.className = "btn btn-primary";
            nextBtn.className = "btn btn-secondary";
            
            if (nextBtn.parentNode) {
                nextBtn.parentNode.insertBefore(mainBtn, nextBtn);
            }
            
            appState.allVideoIds = []; 
            fetchEntirePlaylist(appState.selectedPlaylistId);
        };
        list.appendChild(li);
    });
}

export function setupUIEventListeners() {
    const search = document.getElementById('playlist-search');
    if (search) {
        search.onfocus = () => { document.getElementById('dropdown-list').style.display = 'block'; renderDropdown(search.value.toLowerCase()); };
        search.oninput = (e) => { appState.selectedPlaylistId = ""; renderDropdown(e.target.value.toLowerCase()); };
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