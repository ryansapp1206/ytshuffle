// Fake YouTube Data API. Serves canned playlists and paged playlist items.
const PLAYLISTS = [
    { id: 'PL_BIG', title: 'Big Mix', count: 120 },
    { id: 'PL_SMALL', title: 'Small Mix', count: 10 }
];

function videoIdsFor(playlistId, count) {
    return Array.from({ length: count }, (_, i) => `${playlistId}_v${i}`);
}

function pageOf(items, pageToken, pageSize = 50) {
    const start = pageToken ? parseInt(pageToken, 10) : 0;
    const end = start + pageSize;
    return { slice: items.slice(start, end), next: end < items.length ? String(end) : undefined };
}

async function mockYouTubeApi(page, { onRequest } = {}) {
    await page.route('https://www.googleapis.com/youtube/v3/playlists?**', route => {
        if (onRequest) onRequest('playlists');
        const items = PLAYLISTS.map(p => ({
            id: p.id,
            snippet: { title: p.title },
            contentDetails: { itemCount: p.count }
        }));
        route.fulfill({ json: { items } });
    });

    await page.route('https://www.googleapis.com/youtube/v3/playlistItems?**', route => {
        const url = new URL(route.request().url());
        const playlistId = url.searchParams.get('playlistId');
        const pageToken = url.searchParams.get('pageToken');
        const playlist = PLAYLISTS.find(p => p.id === playlistId);
        if (onRequest) onRequest('playlistItems', playlistId);
        if (!playlist) return route.fulfill({ status: 404, json: {} });

        const { slice, next } = pageOf(videoIdsFor(playlistId, playlist.count), pageToken);
        route.fulfill({
            json: {
                items: slice.map(videoId => ({ contentDetails: { videoId } })),
                nextPageToken: next
            }
        });
    });
}

module.exports = { PLAYLISTS, videoIdsFor, mockYouTubeApi };
