# ytShuffle

Static, client-side web app that shuffles YouTube playlists. YouTube's own shuffle favors most-played tracks and only handles the first chunk of a large playlist. ytShuffle fetches every video (song) ID in a playlist, shuffles with Fisher-Yates, and opens them in batches of 50. No backend. Hosted on AWS S3 + CloudFront. Plain ES modules, HTML, CSS, no build step.

## Constraints
- All HTML files stay in the site root. The app is pending Google OAuth review and paths must match the submitted demo video. Do not move or rename them.
- A minimalist redesign is planned for after verification. It is not part of the current app. Do not implement it unless asked.
- OAuth scope is read-only `youtube.readonly`. Implicit token flow via Google Identity Services, no client secret.

## File layout
| File | Role |
|---|---|
| `index.html` | Main page: login, playlist search, settings gear, shuffle/next-batch buttons, info/feedback/settings modals. Sets saved theme before first paint. |
| `privacy.html`, `tos.html` | Legal pages required for OAuth verification. |
| `js/main.js` | Entry point. Wires buttons, polls up to 10s for Google sign-in script, shows an adblocker message if it never loads. |
| `js/state.js` | OAuth client ID, shared `appState`, `clearStoredAuth()`. |
| `js/auth.js` | GIS token flow, session restore, login/logout. |
| `js/api.js` | YouTube Data API calls, with an AbortController so stale fetches never overwrite a newer selection. |
| `js/cache.js` | IndexedDB cache of per-playlist video IDs with configurable TTL. |
| `js/playlist.js` | Fisher-Yates shuffle and batch launching. |
| `js/ui.js` | Dropdown, favorites, settings modal, theme toggle, resync cooldown, feedback form, modal positioning. |
| `css/` | Styles for main, privacy and terms pages. |

## How it works

**Auth**
- Token and expiry are stored in localStorage. A valid token is reused on load. An expired token is cleared, and any API 401 forces re-login.
- No refresh token, so sessions last about an hour.
- Logout aborts in-flight requests, clears the token and resets the UI.

**Playlist sync**
- `fetchPlaylists()` pages `playlists?mine=true` 50 at a time with a live count.
- The playlist list is re-fetched on every login or page load. It is NOT cached.
- Typing an exact playlist title also selects it.

**Loading and caching**
- The cache holds each playlist's video (song) IDs, keyed by playlist ID. It does not hold the playlist list.
- On a miss, `playlistItems` is paged with a `fields` mask returning only `videoId` and `nextPageToken`, then written to IndexedDB with a timestamp.
- Later loads skip the API until the TTL expires. Expired entries are deleted when read.
- Handled cases: network errors, empty playlists, selection changing mid-load.

**Shuffle and batching**
- Shuffle & Play runs Fisher-Yates on the full ID array and resets the batch index to 0.
- Each batch opens `youtube.com/watch_videos?video_ids=<50 ids>`. The 50 limit comes from that URL endpoint. It is not a quota or token optimization. Quota savings come from the cache and the `fields` mask.
- Desktop opens a new tab. Mobile navigates the same tab.
- A "Play Next 50 (Remaining: N)" button follows each batch. The main button becomes "Reshuffle & Start Over". The app shows "Playlist Finished!" at the end.
- The mobile `/embed/` fallback was removed so autoplay works for later videos. Do not reintroduce it.

## Settings (gear icon)
- **Theme toggle:** dark/light, saved as `yt_theme`.
- **Clear & Resync Cache:** wipes the IndexedDB video-ID cache, resets state, re-pulls the playlist list. 5-minute cooldown with live countdown, persisted in localStorage so reload doesn't bypass it.
- **Cache TTL slider:** 12 hours to 30 days in 12-hour steps. `getCacheTTL()` reads it on every lookup.
- **Max favorites slider:** 1 to 10, default 3. Favorites are starred, pinned to the top of the dropdown, and capped so they don't get buried among other playlists.
- **Save & Close / Cancel:** TTL and max favorites are only written to localStorage on Save & Close. Cancel or clicking outside discards changes.

## Other features
- Feedback form posts to Formspree.
- "Why ytShuffle?" info modal.
- Modals centered on the app container and re-centered on resize.
- Cache-busting `?v=` query strings on CSS and JS imports. Bump them when changing those files, or browsers may serve stale code.
- Footer links to privacy, terms and YouTube's terms.

## Storage
| Store | Keys |
|---|---|
| localStorage | `yt_access_token`, `yt_token_expires`, `yt_theme`, `yt_cache_ttl`, `yt_max_favs`, `yt_shuffle_favorites`, `yt_last_sync_time` |
| IndexedDB (`yt_shuffle_db` / `playlist_cache`) | `{playlistId, videos[], timestamp}` |

## Known issues and cleanup ideas
1. Lowering max favorites does not trim existing favorites. Someone with 8 favorites who sets the limit to 3 keeps all 8 and just can't add more.
2. The shuffle icon SVG is duplicated in about six places across `api.js`, `auth.js`, `playlist.js` and `ui.js`. A shared helper would trim this.
3. `appState.favoritePlaylistIds` is set in `ui.js` but not declared in `state.js`.
4. `auth.js` sets the logout button's display twice in `applyLogin`.
5. The access token sits in localStorage. This is normal for a client-only implicit flow, but it is readable by any script on the origin.
6. The README's "Bypasses standard platform batch limits" line implies batching is a feature. It is really a constraint of the `watch_videos` URL.
