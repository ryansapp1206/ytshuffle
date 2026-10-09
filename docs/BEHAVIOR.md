# ytShuffle Behavior Spec

The source of truth for what ytShuffle should do. Tests are written from this file, not from the code.

**How to use**
- Each requirement has an ID. Test titles start with that ID (for example `S3: batch URL contains 50 unique IDs`).
- **Status** values:
  - `Draft`: drafted from the current app, not yet approved by Ryan.
  - `Approved`: Ryan confirmed this is the intended behavior.
  - `CONFIRM`: the app currently does this, but it may not be what is wanted. Needs a decision (see the question in the row).
- **Test** shows the spec file that covers it. `-` means no test yet.
- Where the code and this spec disagree, the spec wins and the code gets fixed. Known bugs get a `test.fixme` until fixed.

---

## A. Authentication

| ID | Behavior | Status | Test |
|---|---|---|---|
| A1 | Until Google's sign-in script has loaded, the Sign in button is disabled and the status reads "Initializing API...". Once loaded and no session exists, the button is enabled and the status reads "Waiting for login...". | Draft | - |
| A2 | Clicking Sign in requests a token. On success the token and its expiry are saved locally, the Sign in button hides, and the playlist area and Sign out link appear. | Draft | shuffle.spec.js (partial) |
| A3 | On page load, a saved token that has not expired restores the session without asking the user to sign in. | Draft | - |
| A4 | On page load, a saved token that has expired is deleted and the Sign in button is shown. | Draft | - |
| A5 | If any YouTube API call returns 401, the saved token and all app state are cleared, the status reads "Session expired. Please sign in again.", the playlist area hides, and the Sign in button returns. | Draft | - |
| A6 | Sign out cancels in-flight requests, clears the token and all app state, empties the search box and dropdown, hides the playlist area, shows the Sign in button, and the status reads "Signed out successfully." | Draft | - |
| A7 | Sign out does NOT clear cached playlist video IDs or favorites. | CONFIRM | - |
| A8 | If Google's sign-in script has not loaded after about 10 seconds (adblock or tracker protection), the status tells the user to disable their blocker. | Draft | - |

**A7 question:** should Sign out also wipe the cached video IDs? Currently they stay, so someone else using the same browser still has them on disk (IDs only, no titles or account info).

## B. Playlist sync and search

| ID | Behavior | Status | Test |
|---|---|---|---|
| B1 | After sign-in, all of the user's playlists are loaded, 50 per request, until there are no more pages. The status shows a live count, then "Loaded N Playlists." | Draft | shuffle.spec.js (partial) |
| B2 | The playlist list is fetched again on every page load and sign-in. It is not cached. | Draft | - |
| B3 | The dropdown shows each playlist as "Title (video count)". Favorited playlists come first, then the rest in the order YouTube returned them. | Draft | - |
| B4 | Typing in the search box filters the dropdown to titles containing the text, ignoring case. | Draft | - |
| B5 | Typing a title that exactly matches a playlist (ignoring case) selects it, as if it had been clicked. | Draft | - |
| B6 | Typing text that matches no playlist exactly clears the selection, cancels any in-progress load, disables Shuffle, hides "Play Next", and the status reads "Search for a playlist to begin." | Draft | - |
| B7 | If the playlist sync fails partway (network error), the playlists loaded so far are kept and shown, and the status reads "Network error. Partial playlists loaded." | CONFIRM | - |

**B7 question:** is showing a partial list acceptable, or should a failed sync show nothing and prompt a retry?

## C. Loading a playlist and caching

| ID | Behavior | Status | Test |
|---|---|---|---|
| C1 | Selecting a playlist hides "Play Next", disables the main button with the text "Downloading Playlist...", and starts loading its video IDs. | Draft | - |
| C2 | Clicking the playlist that is already selected does nothing. | Draft | - |
| C3 | If the playlist's video IDs are in the cache and not older than the TTL, no YouTube request is made. The status reads "Playlist Ready! (N videos loaded)". | Draft | - |
| C4 | If there is no cache entry, all pages of the playlist are fetched (50 per request), the IDs are saved to the cache with the current time, and the status reads "Playlist Ready! (N videos loaded)". | Draft | shuffle.spec.js (partial) |
| C5 | If the cache entry is older than the TTL, it is deleted and the playlist is fetched fresh. | Draft | - |
| C6 | The TTL is read at lookup time, so changing the TTL setting affects existing cache entries the next time they are used. | Draft | - |
| C7 | The cache stores the original playlist order. Shuffling never changes what is stored. | Draft | - |
| C8 | An empty playlist shows "Select a different playlist." and keeps Shuffle disabled. | Draft | - |
| C9 | A network error while loading a playlist shows "Network error connecting to YouTube. Please try again.", clears the selection, and keeps Shuffle disabled. | Draft | - |
| C10 | If the user picks another playlist (or edits the search) while one is loading, results from the earlier load are ignored and never shown or cached. | Draft | - |
| C11 | Private, deleted or otherwise unavailable videos that YouTube still lists are included in the list as returned. | CONFIRM | - |
| C12 | If the same video appears twice in a playlist, both entries are kept. | CONFIRM | - |

**C11 question:** should unavailable videos be filtered out? That needs an extra API call per video batch, which costs quota. The `watch_videos` page skips them on its own, so the only visible effect is that batches may have fewer playable videos than 50.
**C12 question:** keep duplicates (matches the playlist) or remove them?

## D. Shuffle and batches

| ID | Behavior | Status | Test |
|---|---|---|---|
| D1 | Shuffle & Play randomly reorders the whole loaded playlist with Fisher-Yates, restarts at the first batch, and the status reads "Shuffled N videos." | Draft | shuffle.spec.js (partial) |
| D2 | Each batch opens `https://www.youtube.com/watch_videos?video_ids=` followed by up to 50 comma-separated IDs from the shuffled order. | Draft | shuffle.spec.js |
| D3 | On desktop, a batch opens in a new tab. On phones and tablets (iPhone, iPad, iPod, Android), it opens in the current tab. | Draft | - |
| D4 | After a batch, if videos remain, the "Play Next 50 (Remaining: N)" button appears with the correct count, and the main button reads "Reshuffle & Start Over". | Draft | shuffle.spec.js (partial) |
| D5 | "Play Next" opens the next 50 in the same shuffled order. Across all batches, every video appears exactly once. | Draft | - |
| D6 | After the last batch, "Play Next" hides and the status reads "Playlist Finished!" | Draft | - |
| D7 | "Reshuffle & Start Over" reshuffles the whole playlist and starts again from the first batch. | Draft | - |
| D8 | A playlist of 50 or fewer opens a single batch and immediately finishes, with the status "Playlist Finished!" and the main button left as "Shuffle & Play". | CONFIRM | - |
| D9 | Shuffle is disabled until a playlist has finished loading. If it is somehow triggered with nothing loaded, the user gets an alert. | Draft | - |
| D10 | The shuffle is unbiased: every ordering is equally likely. | Draft | - |

**D8 question:** for small playlists, should the status say something like "Shuffled N videos." instead of "Playlist Finished!", and should the button change to "Reshuffle"?

## E. Favorites

| ID | Behavior | Status | Test |
|---|---|---|---|
| E1 | Clicking a playlist's star toggles it as a favorite, without selecting the playlist. Favorites persist across page reloads. | Draft | - |
| E2 | Favorites are listed first in the dropdown. | Draft | - |
| E3 | Adding a favorite when the user already has the maximum shows an alert and does not add it. Unfavoriting always works. | Draft | - |
| E4 | The maximum defaults to 3 and can be set from 1 to 10 in Settings. | Draft | - |
| E5 | If the maximum is lowered below the current number of favorites, existing favorites are kept and only new ones are blocked. | CONFIRM | - |
| E6 | Favorites are stored per browser, not per Google account. Two accounts signed in on the same browser share one favorites list. | CONFIRM | - |
| E7 | Favorites for playlists that no longer exist still count toward the maximum. | CONFIRM | - |

**E5 question:** keep the extras (current) or trim to the new limit?
**E6 question:** should favorites be keyed per account?
**E7 question:** should deleted playlists' favorites be removed automatically after a sync, so they stop using up slots?

## F. Settings

| ID | Behavior | Status | Test |
|---|---|---|---|
| F1 | The Settings gear opens a modal showing the currently saved TTL and maximum favorites. | Draft | - |
| F2 | Theme toggle switches dark and light immediately and remembers the choice. Pressing Cancel does not undo a theme change. | Draft | - |
| F3 | The saved theme is applied before the page first paints, so there is no flash of the wrong theme. | Draft | - |
| F4 | The TTL slider goes from 12 hours to 30 days in 12-hour steps. Values under 24 hours show as "N Hours". Multiples of 24 hours show as "1 Day" or "N Days". | Draft | - |
| F5 | TTL and maximum favorites are only saved when Save & Close is pressed. Cancel, and clicking outside the modal, discard any changes. | Draft | - |
| F6 | Clear & Resync deletes all cached playlist video IDs, clears the selection and state, closes Settings, and re-fetches the playlist list. | Draft | - |
| F7 | After Clear & Resync, the button is disabled for 5 minutes and shows "Available in m:ss". The cooldown survives a page reload. | Draft | - |
| F8 | The cooldown starts when the button is pressed, even if the re-sync then fails. | CONFIRM | - |
| F9 | The Settings gear is only visible while signed in, so the theme cannot be changed from the sign-in screen. | CONFIRM | - |

**F8 question:** should a failed resync release the cooldown so the user can retry?
**F9 question:** should theme be available before sign-in?

## G. Other

| ID | Behavior | Status | Test |
|---|---|---|---|
| G1 | The "Why ytShuffle?" info modal opens from the info icon and closes with its button or by clicking outside it. | Draft | - |
| G2 | The feedback form posts to Formspree. On success it shows "Feedback Sent!" and closes after 2 seconds. On failure it shows "Error. Try Again." and can be resubmitted. | Draft | - |
| G3 | Modals are centered over the app container and re-centered when the window is resized. | Draft | - |
| G4 | Clicking outside the dropdown closes it. | Draft | - |
| G5 | The app never changes the user's YouTube account. It uses only the read-only scope. | Draft | - |

---

## Decisions needed
Answer these by editing the Status column, or tell me and I will update the file.

1. **A7:** Should Sign out wipe cached video IDs?
2. **B7:** Show a partial playlist list after a sync error?
3. **C11:** Filter out unavailable videos?
4. **C12:** Keep duplicate videos?
5. **D8:** Wording and button state for playlists of 50 or fewer.
6. **E5:** Keep or trim favorites when the limit is lowered?
7. **E6:** Key favorites per Google account?
8. **E7:** Drop favorites of deleted playlists automatically?
9. **F8:** Release the resync cooldown after a failure?
10. **F9:** Make Settings (theme) available before sign-in?

## Not covered by automated tests
These depend on the real Google and YouTube services and stay on the manual smoke checklist in [PLAN.md](PLAN.md):
- Real Google sign-in, the consent screen and token expiry.
- Real YouTube responses and quota behavior.
- That `watch_videos` actually plays and autoplays on real devices.
