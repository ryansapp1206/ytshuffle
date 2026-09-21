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

    window.open(`https://www.youtube.com/watch_videos?video_ids=${batch.join(',')}`, '_blank');
    
    appState.currentBatchIndex += 50;
    const nextBtn = document.getElementById('next-batch-btn');
    
    if (appState.currentBatchIndex < appState.allVideoIds.length) {
        const remaining = appState.allVideoIds.length - appState.currentBatchIndex;
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

export function handleShuffleMainClick() {
    if (!appState.selectedPlaylistId) return alert("Select a playlist first.");
    if (appState.allVideoIds.length === 0) return alert("Playlist is still loading or is empty.");
    
    shuffleArray(appState.allVideoIds); 
    appState.currentBatchIndex = 0; 
    document.getElementById('status-msg').innerText = `Shuffled ${appState.allVideoIds.length} videos.`;
    launchBatch();
}