const CLIENT_ID = '188096920008-3tdp73fvcu3f9p5sosgkgs8e3vcjge83.apps.googleusercontent.com';
let accessToken, tokenClient;
let allPlaylistsData = [], allVideoIds = [], selectedPlaylistId = "";
let currentBatchIndex = 0;

window.onload = () => {
    const checkGSI = setInterval(() => {
        if (typeof google !== 'undefined') {
            clearInterval(checkGSI);
            setupAuth();
        }
    }, 100);
};

function setupAuth() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        prompt: 'consent',
        callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
                accessToken = tokenResponse.access_token;
                document.getElementById('login-btn').style.display = 'none';                
                document.getElementById('playlist-container').style.display = 'block';
                fetchPlaylists();
            }
        },
    });
    document.getElementById('login-btn').disabled = false;
    document.getElementById('status-msg').innerText = "Waiting for login...";
}

document.getElementById('login-btn').onclick = () => tokenClient.requestAccessToken();

async function fetchPlaylists(pageToken = '') {
    document.getElementById('status-msg').innerText = `Syncing Playlists: ${allPlaylistsData.length}`;
    let url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50${pageToken ? '&pageToken=' + pageToken : ''}`;
    
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();
    
    if (data.items) allPlaylistsData.push(...data.items);
    if (data.nextPageToken) {
        await fetchPlaylists(data.nextPageToken);
    } else { 
        document.getElementById('status-msg').innerText = `Loaded ${allPlaylistsData.length} Playlists.`;
        renderDropdown(); 
    }
}

document.getElementById('shuffle-main-btn').onclick = () => {
    if (!selectedPlaylistId) return alert("Select a playlist first.");
    if (allVideoIds.length === 0) return alert("Playlist is still loading or is empty.");
    
    shuffleArray(allVideoIds); 
    currentBatchIndex = 0; 
    document.getElementById('status-msg').innerText = `Shuffled ${allVideoIds.length} songs.`;
    launchBatch();
};

async function fetchEntirePlaylist(playlistId, pageToken = '') {
    document.getElementById('status-msg').innerText = `Pre-loading Songs... (${allVideoIds.length})`;
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&fields=items/contentDetails/videoId,nextPageToken${pageToken ? '&pageToken=' + pageToken : ''}`;
    
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();
    
    data.items.forEach(item => { 
        if(item.contentDetails && item.contentDetails.videoId) allVideoIds.push(item.contentDetails.videoId); 
    });
    
    if (data.nextPageToken) {
        await fetchEntirePlaylist(playlistId, data.nextPageToken);
    } else { 
        document.getElementById('status-msg').innerText = `Playlist Ready! (${allVideoIds.length} songs loaded)`;
        
        const mainBtn = document.getElementById('shuffle-main-btn');
        mainBtn.disabled = false;
        mainBtn.innerHTML = `<svg class="g-icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> Shuffle & Play`;
    }
}

function launchBatch() {
    const batch = allVideoIds.slice(currentBatchIndex, currentBatchIndex + 50);
    if (batch.length === 0) return alert("No more songs in this playlist.");

    window.open(`https://www.youtube.com/watch_videos?video_ids=${batch.join(',')}`, '_blank');
    
    currentBatchIndex += 50;
    const nextBtn = document.getElementById('next-batch-btn');
    
    if (currentBatchIndex < allVideoIds.length) {
        const remaining = allVideoIds.length - currentBatchIndex;
        nextBtn.innerText = `Play Next 50 (Remaining: ${remaining})`;
        nextBtn.style.display = 'flex';
        
        const shuffleBtn = document.getElementById('shuffle-main-btn');
        shuffleBtn.innerText = "Reshuffle & Start Over";

        nextBtn.className = "btn btn-primary";
        shuffleBtn.className = "btn btn-secondary";
        
        if (shuffleBtn.parentNode) {
            shuffleBtn.parentNode.insertBefore(nextBtn, shuffleBtn);
        }
    } else {
        nextBtn.style.display = 'none';
        document.getElementById('status-msg').innerText = "Playlist Finished!";
    }
}

document.getElementById('next-batch-btn').onclick = launchBatch;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderDropdown(filterText = '') {
    const list = document.getElementById('dropdown-list');
    list.innerHTML = '';
    allPlaylistsData.filter(p => p.snippet.title.toLowerCase().includes(filterText)).forEach(p => {
        const li = document.createElement('li');
        li.innerText = `${p.snippet.title} (${p.contentDetails.itemCount})`;
        li.onclick = () => { 
            document.getElementById('playlist-search').value = p.snippet.title; 
            selectedPlaylistId = p.id; 
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
            
            allVideoIds = []; 
            fetchEntirePlaylist(selectedPlaylistId);
        };
        list.appendChild(li);
    });
}

const search = document.getElementById('playlist-search');
search.onfocus = () => { document.getElementById('dropdown-list').style.display = 'block'; renderDropdown(search.value.toLowerCase()); };
search.oninput = (e) => { selectedPlaylistId = ""; renderDropdown(e.target.value.toLowerCase()); };

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