import { appState } from './state.js';

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function launchBatch() {
    const batch = appState.allVideoIds.slice(appState.currentBatchIndex, appState.currentBatchIndex + 50);
    if (batch.length === 0) return alert("No more videos in this playlist.");

    const ytUrl = `https://www.youtube.com/watch_videos?video_ids=${batch.join(',')}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        window.location.href = ytUrl;
    } else {
        window.open(ytUrl, '_blank');
    }
    
    appState.currentBatchIndex += 50;
    const nextBtn = document.getElementById('next-batch-btn');
    
    if (appState.currentBatchIndex < appState.allVideoIds.length) {
        const remaining = appState.allVideoIds.length - appState.currentBatchIndex;
        nextBtn.innerText = `Play Next 50 (Remaining: ${remaining})`;
        nextBtn.style.display = 'flex';
        
        const shuffleBtn = document.getElementById('shuffle-main-btn');
        shuffleBtn.innerHTML = `<svg class="g-icon" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.45 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> Reshuffle & Start Over`;

        nextBtn.className = "btn btn-primary";
        shuffleBtn.className = "btn btn-secondary";
    } else {
        if (nextBtn) nextBtn.style.display = 'none';
        document.getElementById('status-msg').innerText = "Playlist Finished!";
    }
}

export function handleShuffleMainClick() {
    if (!appState.selectedPlaylistId) return alert("Select a playlist first.");
    if (appState.allVideoIds.length === 0) return alert("Playlist is still loading or is empty.");
    
    shuffleArray(appState.allVideoIds); 
    appState.currentBatchIndex = 0; 
    document.getElementById('status-msg').innerText = `Shuffled ${appState.allVideoIds.length} videos.`;
    launchBatch();
}