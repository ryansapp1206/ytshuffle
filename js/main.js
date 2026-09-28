import { setupAuth, handleLoginClick, handleLogoutClick } from './auth.js';
import { handleShuffleMainClick, launchBatch } from './playlist.js';
import { setupUIEventListeners } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    setupUIEventListeners();

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = handleLoginClick;
    
    const shuffleBtn = document.getElementById('shuffle-main-btn');
    if (shuffleBtn) shuffleBtn.onclick = handleShuffleMainClick;
    
    const nextBtn = document.getElementById('next-batch-btn');
    if (nextBtn) nextBtn.onclick = launchBatch;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = handleLogoutClick;

    let attempts = 0;
    const maxAttempts = 100; // 100 attempts at 100ms = 10 seconds

    const checkGSI = setInterval(() => {
        if (typeof google !== 'undefined') {
            clearInterval(checkGSI);
            setupAuth();
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(checkGSI);
                const statusMsg = document.getElementById('status-msg');
                if (statusMsg) {
                    statusMsg.innerText = "Login service blocked. Please disable your adblocker or tracker protection to sign in.";
                    statusMsg.style.color = "var(--yt-red)"; 
                }
            }
        }
    }, 100);
});