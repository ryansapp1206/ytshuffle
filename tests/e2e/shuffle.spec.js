const { test, expect } = require('@playwright/test');
const { mockGoogleSignIn, captureOpenedTabs } = require('../mocks/google');
const { mockYouTubeApi, videoIdsFor } = require('../mocks/youtube');

test.beforeEach(async ({ page }) => {
    await mockGoogleSignIn(page);
    await captureOpenedTabs(page);
});

test('sign in, pick a playlist, shuffle opens a batch of 50 unique IDs from it', async ({ page }) => {
    await mockYouTubeApi(page);
    await page.goto('/');

    await page.locator('#login-btn').click();
    await expect(page.locator('#status-msg')).toContainText('Loaded 2 Playlists');

    await page.locator('#playlist-search').click();
    await page.locator('#dropdown-list li', { hasText: 'Big Mix' }).click();
    await expect(page.locator('#status-msg')).toContainText('Playlist Ready! (120 videos loaded)');

    await page.locator('#shuffle-main-btn').click();

    const opened = await page.evaluate(() => window.__opened);
    expect(opened).toHaveLength(1);

    const url = new URL(opened[0]);
    expect(url.origin + url.pathname).toBe('https://www.youtube.com/watch_videos');

    const ids = url.searchParams.get('video_ids').split(',');
    expect(ids).toHaveLength(50);
    expect(new Set(ids).size).toBe(50);

    const playlistIds = new Set(videoIdsFor('PL_BIG', 120));
    for (const id of ids) expect(playlistIds.has(id)).toBe(true);

    await expect(page.locator('#next-batch-btn')).toContainText('Remaining: 70');
});
