import { appState } from './state.js';
import { renderDropdown } from './ui.js';
import { getCachedVideos, setCachedVideos } from './cache.js';

let activeAbortController = null;

export async function fetchPlaylists(pageToken = '') {
    if (!pageToken) appState.allPlaylistsData = []; 
    document.getElementById('status-msg').innerText = `Syncing Playlists: ${appState.allPlaylistsData.length}`;
    
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50${pageToken ? '&pageToken=' + pageToken : ''}`;
    
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${appState.accessToken}` } });
        
        if (response.status === 401) throw new Error("Token Expired");
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        
        if (data.items) appState.allPlaylistsData.push(...data.items);
        if (data.nextPageToken) {
            await fetchPlaylists(data.nextPageToken);
        } else { 
            document.getElementById('status-msg').innerText = `Loaded ${appState.allPlaylistsData.length} Playlists.`;
            renderDropdown(); 
        }
    } catch (error) {
        if (error.message === "Token Expired") {
            handleAuthError();
        } else {
            console.error("fetchPlaylists error:", error);
            document.getElementById('status-msg').innerText = "Network error connecting to YouTube. Please try again.";
            
            const mainBtn = document.getElementById('shuffle-main-btn');
            if (mainBtn) mainBtn.disabled = false;
        }
    }
}

export async function fetchEntirePlaylist(playlistId) {
    if (activeAbortController) {
        activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const { signal } = activeAbortController;

    appState.allVideoIds = [];
    document.getElementById('status-msg').innerText = "Checking cache...";

    const cachedVideos = await getCachedVideos(playlistId);
    if (signal.aborted || playlistId !== appState.selectedPlaylistId) return;

    if (cachedVideos && cachedVideos.length > 0) {
        appState.allVideoIds = cachedVideos;
        setReadyUI(cachedVideos.length);
        return;
    }

    const collectedVideos = [];
    let pageToken = '';

    try {
        do {
            if (signal.aborted || playlistId !== appState.selectedPlaylistId) return;

            document.getElementById('status-msg').innerText = `Pre-loading Videos... (${collectedVideos.length})`;

            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&fields=items/contentDetails/videoId,nextPageToken${pageToken ? '&pageToken=' + pageToken : ''}`;
            
            const response = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${appState.accessToken}` },
                signal 
            });
            
            if (response.status === 401) throw new Error("Token Expired");
            if (!response.ok) throw new Error("API Error");
            
            const data = await response.json();
            
            if (signal.aborted || playlistId !== appState.selectedPlaylistId) return;

            if (data.items) {
                for (const item of data.items) {
                    if (item.contentDetails && item.contentDetails.videoId) {
                        collectedVideos.push(item.contentDetails.videoId);
                    }
                }
            }

            pageToken = data.nextPageToken || '';
        } while (pageToken);

        if (signal.aborted || playlistId !== appState.selectedPlaylistId) return;

        if (collectedVideos.length === 0) {
            setEmptyUI();
            return;
        }

        appState.allVideoIds = collectedVideos;
        await setCachedVideos(playlistId, collectedVideos);

        setReadyUI(collectedVideos.length);

    } catch (error) {
        if (error.name === 'AbortError') {
            return;
        }

        if (error.message === "Token Expired") {
            handleAuthError();
        } else {
            console.error("fetchEntirePlaylist error:", error);
            document.getElementById('status-msg').innerText = "Network error connecting to YouTube. Please try again.";
            
            const mainBtn = document.getElementById('shuffle-main-btn');
            if (mainBtn) mainBtn.disabled = false;
        }
    }
}

function setReadyUI(videoCount) {
    document.getElementById('status-msg').innerText = `Playlist Ready! (${videoCount} videos loaded)`;
    const mainBtn = document.getElementById('shuffle-main-btn');
    if (mainBtn) {
        mainBtn.disabled = false;
        mainBtn.innerHTML = `<svg class="g-icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> Shuffle & Play`;
    }
}

function setEmptyUI() {
    document.getElementById('status-msg').innerText = "Select a different playlist.";
    const mainBtn = document.getElementById('shuffle-main-btn');
    if (mainBtn) {
        mainBtn.disabled = true;
        mainBtn.innerHTML = `<svg class="g-icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> Shuffle & Play`;
    }
}

function handleAuthError() {
    appState.accessToken = null;
    localStorage.removeItem('yt_access_token');
    localStorage.removeItem('yt_token_expires');
    document.getElementById('status-msg').innerText = "Session expired. Please sign in again.";
    document.getElementById('playlist-container').style.display = 'none';
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'flex';
        loginBtn.disabled = false;
    }
}