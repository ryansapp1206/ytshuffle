# ytShuffle Roadmap

Working plan for refactors, tests and the post-verification redesign. Update the checkboxes as work lands.

## Ground rules
- Google OAuth review is pending. Until it passes, do NOT:
  - move or rename `index.html`, `privacy.html`, `tos.html`
  - change anything a reviewer sees or that differs from the demo video (UI, flows, copy)
  - change the OAuth scope, client ID or consent-screen details
  - change the privacy policy or terms without deciding it deliberately (see "Open decisions")
- One change per commit so any step can be reverted with `git revert`.
- After each step: run the tests (once they exist), do the manual checklist below, bump the `?v=` cache-busting strings on any changed JS/CSS, then push.
- No build step for the app itself. Dev tooling (tests) lives in `package.json` and is kept out of the deployed site.

## Manual smoke checklist (real Google account)
Run before every push that touches JS or CSS.
- [ ] Page loads, status shows "Waiting for login..."
- [ ] Sign in with Google, playlists load and the count is shown
- [ ] Search filters the dropdown
- [ ] Select a playlist, Shuffle & Play opens a batch of 50
- [ ] "Play Next 50" shows the right remaining count and ends with "Playlist Finished!"
- [ ] Reselecting the same playlist loads from cache (no API calls in the Network tab)
- [ ] Star and unstar favorites, cap alert appears at the limit
- [ ] Settings: theme toggle works, Cancel discards slider changes, Save & Close keeps them
- [ ] Clear & Resync works, then shows the 5-minute cooldown
- [ ] Sign out resets the UI
- [ ] Mobile width: layout OK and batches open in the same tab

## Phase 1: Pre-verification (safe, no visible changes)

### 1A. Test harness
- [ ] Confirm Node is installed, add `package.json` and `.gitignore` (`node_modules/`)
- [ ] Playwright end-to-end tests with mocks (see Test plan)
- [ ] Add a local static server script for the tests

### 1B. Small fixes
- [ ] Declare `favoritePlaylistIds` in `state.js` (currently set only in `ui.js`)
- [ ] Remove the duplicate logout-button `display` line in `auth.js` `applyLogin`
- [ ] Decide and implement behavior when max favorites is lowered below the current count (trim vs keep, see Open decisions)

### 1C. Refactor (internal only)
1. [ ] `constants.js`: storage key names, batch size (50), cooldown (5 min), TTL and favorites defaults
2. [ ] `storage.js`: localStorage wrapper with try/catch on every access
3. [ ] `buttons.js`: shared `setShuffleButton(state)` replacing the SVG duplicated in `api.js`, `auth.js`, `playlist.js`, `ui.js`
4. [ ] Split `ui.js` (435 lines) into:
   - `dropdown.js`: render and search
   - `favorites.js`: storage and cap
   - `settings.js`: modal, sliders, theme, resync cooldown
   - `modals.js`: info and contact modals, `alignModalToAppContainer()`
   - `ui.js`: thin wiring file
5. [ ] Watch for circular imports (`api.js`, `auth.js`, `ui.js` already depend on each other)

### 1D. Docs
- [ ] Keep `CLAUDE.md` and `README.md` in sync with each refactor

## Phase 2: Post-verification

### 2A. Redesign
- [ ] New HTML layout (minimalist design), keeping the same URLs for `index.html`, `privacy.html`, `tos.html`
- [ ] Move all inline `style="..."` attributes into CSS classes
- [ ] Split CSS: `variables.css` (theme tokens), `base.css`, `components.css`, `modals.css`
- [ ] Replace native `alert()` calls with inline toasts
- [ ] Smoother states: loading skeletons, transitions, empty states

### 2B. Accessibility
- [ ] Focus styles and keyboard navigation in the dropdown (arrows, Enter, Escape)
- [ ] Focus trap and Escape-to-close in modals
- [ ] `aria-live` on the status message
- [ ] Contrast check in both themes

### 2C. Structure (only once there are more JS files)
```
/index.html, privacy.html, tos.html   (stay in root)
/css/        variables, base, components, modals
/js/
  core/      state, constants, storage
  services/  auth, api, cache
  features/  playlist, favorites, settings
  ui/        dropdown, modals, buttons
/assets/     favicon, icons
```

### 2D. Optional
- [ ] Prettier and ESLint
- [ ] Vite or similar build step (skip unless there is a clear need)
- [ ] CI that runs the tests on push

## Test plan

### Layer 1: unit tests (Vitest or `node:test`, `fake-indexeddb`)
- [ ] `shuffleArray`: same elements, same length, no crash on empty or single item, rough uniformity over many runs
- [ ] `cache.js`: write and read, TTL expiry deletes the entry, delete, clear all, DB errors resolve to null/false
- [ ] Favorites: toggle, cap enforced, trim when limit lowered, corrupt JSON in storage returns `[]`
- [ ] Batching: 50-ID slices, remaining count, final partial batch, end-of-playlist state
- [ ] TTL display: hours vs days formatting

### Layer 2: end-to-end (Playwright, mocked services)
Mocks:
- Inject a fake `window.google.accounts.oauth2.initTokenClient` before page load whose `requestAccessToken()` calls the callback with a fake token
- `page.route()` on `googleapis.com/youtube/v3/*` returns canned playlists and playlist items (including multi-page and 401 responses)
- Intercept `window.open` and navigation to capture the `watch_videos` URL

Flows:
- [ ] Login shows playlists; saved unexpired token restores the session
- [ ] Select playlist, shuffle, batch URL contains 50 unique IDs from that playlist
- [ ] Second selection of the same playlist makes zero playlistItems requests
- [ ] Cache expires after TTL (use Playwright's fake clock)
- [ ] Clear & Resync wipes cache and starts the 5-minute cooldown, which survives a reload
- [ ] 401 from API clears the token and shows the sign-in button
- [ ] Switching playlist mid-load does not show stale results
- [ ] Empty playlist shows "Select a different playlist."
- [ ] Network error shows the retry message and disables shuffle
- [ ] Settings save only on Save & Close; Cancel and outside-click discard
- [ ] Favorites cap alert and pinning order
- [ ] Blocked GSI script shows the adblocker message after about 10 seconds
- [ ] Logout resets all UI state and aborts in-flight fetches

### Limits
Mocks only prove the code handles the responses we define. Real sign-in and a real playlist load stay in the manual checklist.

## Open decisions
- **Favorites when the limit is lowered:** keep existing favorites and block new ones (current behavior), or trim to the new limit?
- **Privacy policy wording:** it says "We do not store, log, or save your YouTube data", but video IDs are cached locally in IndexedDB. Suggested clarification: "Playlist video IDs are cached locally in your browser for a user-configurable period and are never transmitted to us." Decide whether to change it before or after verification.
- **README wording:** done, but recheck after the redesign.
- **Token storage:** access token lives in localStorage for about an hour (standard for this flow). Consider whether sessionStorage is preferable.
