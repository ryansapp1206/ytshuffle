import { setupAuth, handleLoginClick, handleLogoutClick } from './auth.js';
import { handleShuffleMainClick, launchBatch } from './playlist.js';
import { setupUIEventListeners } from './ui.js';

window.onload = () => {
    setupUIEventListeners();

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = handleLoginClick;
    
    const shuffleBtn = document.getElementById('shuffle-main-btn');
    if (shuffleBtn) shuffleBtn.onclick = handleShuffleMainClick;
    
    const nextBtn = document.getElementById('next-batch-btn');
    if (nextBtn) nextBtn.onclick = launchBatch;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = handleLogoutClick;

    const checkGSI = setInterval(() => {
        if (typeof google !== 'undefined') {
            clearInterval(checkGSI);
            setupAuth();
        }
    }, 100);
};