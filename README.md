# ytShuffle | The YouTube Playlist Shuffler

**ytShuffle** is a lightweight, purely client-side web app built to fix a frustrating problem: YouTube's native shuffle favors your most-played tracks and only handles the first chunk of a large playlist. ytShuffle links your YouTube account with Google OAuth, pulls all of your playlists automatically, fetches every video in the one you pick, and shuffles it with the **Fisher-Yates algorithm** for a mathematically unbiased playback queue.

## Features
* **True Randomization:** Uses the Fisher-Yates (Knuth) algorithm to eliminate algorithmic playback bias.
* **Automatic Playlist Sync:** Signs in with Google and loads all of your playlists, including private ones, into a searchable dropdown.
* **Batch Playback:** Shuffled videos launch in batches of 50, the maximum the YouTube `watch_videos` endpoint accepts. A "Play Next 50" button keeps the queue going until the playlist is finished, and "Reshuffle & Start Over" reshuffles at any point.
* **Local Playlist Caching:** Video IDs for each playlist are cached in your browser (IndexedDB). Reloading a cached playlist skips the YouTube API entirely until the cache expires.
* **API Quota Optimization:** Uses strict API field masking to request only video IDs, which keeps payloads small and conserves Google Cloud quota.
* **Favorites:** Star playlists to pin them to the top of the dropdown. A configurable cap keeps favorites from burying everything else.
* **Settings:**
  * **Theme:** Dark and light mode.
  * **Cache Expiration (TTL):** Choose how long cached playlists stay valid, from 12 hours up to 30 days.
  * **Max Favorites:** Set the favorite limit from 1 to 10.
  * **Clear & Resync Cache:** Wipes cached playlists and re-syncs your playlist list. It has a 5-minute cooldown to protect API quota.
  * Changes to TTL and Max Favorites are only applied when you press **Save & Close**.
* **Serverless Architecture:** Hosted on AWS S3 and CloudFront, executing 100% in the browser with no backend or database.

## How It Works
1. **Sign in:** Google Identity Services issues a short-lived, read-only access token.
2. **Sync:** Your playlists are fetched 50 at a time and shown in the dropdown. This list is re-fetched each time you open the app.
3. **Select:** Choosing a playlist loads its video IDs from the local cache, or from the YouTube API on a first load or after the cache expires.
4. **Shuffle & Play:** The full list is shuffled and opened in batches of 50. Desktop opens each batch in a new tab. Mobile opens it in the current tab.

## Technical Implementation

### The Shuffle Algorithm
The core of the application relies on the **Fisher-Yates Shuffle**. Unlike basic "sort-by-random" methods, which are biased and cost $O(n \log n)$, Fisher-Yates runs in linear time, $O(n)$, and gives every permutation an equal chance.

The algorithm iterates through the array in reverse, picking a random element from the remaining unshuffled portion and swapping it with the current element:

$$j = \lfloor \text{random}() \times (i + 1) \rfloor$$
$$\text{Swap } array[i] \text{ and } array[j]$$

### Tech Stack
* **Languages:** JavaScript (ES6+ modules), HTML5, CSS3
* **API:** YouTube Data API v3
* **Auth:** Google Identity Services (OAuth 2.0)
* **Storage:** IndexedDB (playlist cache), localStorage (session token and settings)
* **Infrastructure:** AWS S3 & CloudFront

## Privacy & Security
1. **Local Processing:** All data processing and caching occurs strictly within your browser. ytShuffle has no backend server.
2. **No Client Secret:** Uses the Google Identity Services token flow, so no developer credentials are exposed.
3. **Scoped Access:** Read-only (`youtube.readonly`) permission means your account data cannot be altered or deleted.
4. **Short-Lived Sessions:** Your access token is kept in your browser's local storage, expires after about an hour, and is deleted when you sign out.
5. **You Control Your Data:** Clearing the cache or signing out removes locally stored data, and you can revoke access any time from your [Google Security Settings](https://myaccount.google.com/permissions).

## License & Copyright
**© 2026 Ryan Landon Sapp. All Rights Reserved.**
This code is provided for educational review and portfolio demonstration only. Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. See the `LICENSE` file for details.

## Contact
For bugs or feature requests, please open an **Issue** on this repository or use the in-app support widget powered by Formspree.

---
*ytShuffle is an independent project and is not affiliated with, or endorsed by, YouTube or Google.*
