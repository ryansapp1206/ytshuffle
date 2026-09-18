import { appState, CLIENT_ID } from './state.js';
import { fetchPlaylists } from './api.js';

export function setupAuth() {
    appState.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        prompt: 'consent',
        callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
                appState.accessToken = tokenResponse.access_token;
                document.getElementById('login-btn').style.display = 'none';                
                document.getElementById('playlist-container').style.display = 'block';
                fetchPlaylists();
            }
        },
    });
    document.getElementById('login-btn').disabled = false;
    document.getElementById('status-msg').innerText = "Waiting for login...";
}

export function handleLoginClick() {
    appState.tokenClient.requestAccessToken();
}