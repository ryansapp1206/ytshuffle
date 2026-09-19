import { appState, CLIENT_ID } from './state.js';
import { fetchPlaylists } from './api.js';

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

    // Check storage on page load
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

function applyLogin(token) {
    appState.accessToken = token;
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('playlist-container').style.display = 'block';
    fetchPlaylists();
}

export function clearStoredAuth() {
    localStorage.removeItem('yt_access_token');
    localStorage.removeItem('yt_token_expires');
    appState.accessToken = null;
}

export function handleLoginClick() {
    appState.tokenClient.requestAccessToken();
}