export const CLIENT_ID = '188096920008-3tdp73fvcu3f9p5sosgkgs8e3vcjge83.apps.googleusercontent.com';

export const appState = {
    accessToken: null,
    tokenClient: null,
    allPlaylistsData: [],
    allVideoIds: [],
    selectedPlaylistId: "",
    currentBatchIndex: 0
};

export function clearStoredAuth() {
    localStorage.removeItem('yt_access_token');
    localStorage.removeItem('yt_token_expires');
    appState.accessToken = null;
}