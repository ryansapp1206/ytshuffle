import { appState, CLIENT_ID } from './state.js';
import { fetchPlaylists, abortActiveFetches } from './api.js';
import { renderDropdown } from './ui.js';

export function setupAuth() {
    appState.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
                const expiresInMs = (tokenResponse.expires_in || 3600) * 1000;
                const expirationTime = Date.now() + expiresInMs;

                localStorage.setItem('yt_access_token', tokenResponse.access_token);
                localStorage.setItem('yt_token_expires', expirationTime.toString());

                applyLogin(tokenResponse.access_token);
            }
        },
    });

    const savedToken = localStorage.getItem('yt_access_token');
    const savedExpiry = localStorage.getItem('yt_token_expires');

    if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry, 10)) {
        applyLogin(savedToken);
    } else {
        clearStoredAuth();
        document.getElementById('login-btn').disabled = false;
        document.getElementById('status-msg').innerText = "Waiting for login...";
    }
}

export function handleLogoutClick() {
    abortActiveFetches();
    clearStoredAuth();
    
    appState.allPlaylistsData = [];
    appState.allVideoIds = [];
    appState.selectedPlaylistId = "";
    appState.currentBatchIndex = 0;
    
    const searchInput = document.getElementById('playlist-search');
    if (searchInput) searchInput.value = "";
    
    const dropdownList = document.getElementById('dropdown-list');
    if (dropdownList) dropdownList.innerHTML = "";

    const nextBtn = document.getElementById('next-batch-btn');
    if (nextBtn) nextBtn.style.display = 'none';

    const mainBtn = document.getElementById('shuffle-main-btn');
    if (mainBtn) {
        mainBtn.innerHTML = `<svg class="g-icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> Shuffle & Play`;
        mainBtn.className = "btn btn-primary";
        mainBtn.disabled = true;
    }
    
    document.getElementById('playlist-container').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'flex';
        loginBtn.disabled = false;
    }
    
    document.getElementById('status-msg').innerText = "Signed out successfully.";
}

async function applyLogin(token) {
    appState.accessToken = token;
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('playlist-container').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'block';

    document.getElementById('logout-btn').style.display = 'block';

    await fetchPlaylists();
    
    if (appState.allPlaylistsData.length > 0) {
        renderDropdown();
    }
}

export function clearStoredAuth() {
    localStorage.removeItem('yt_access_token');
    localStorage.removeItem('yt_token_expires');
    appState.accessToken = null;
}

export function handleLoginClick() {
    appState.tokenClient.requestAccessToken();
}