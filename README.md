# ytShuffle | The YouTube Playlist Shuffler

**ytShuffle** is a lightweight, purely client-side web app built to fix a frustrating problem: YouTube's native algorithm looping your most-played tracks instead of actually shuffling your massive playlists. By combining the **YouTube Data API v3** with the **Fisher-Yates algorithm**, ytShuffle guarantees a mathematically unbiased playback queue.

## Features
* **True Randomization:** Uses the Fisher-Yates (Knuth) algorithm to eliminate algorithmic playback bias.
* **Persistent Local Caching (v2.0.0):** Caches compiled video ID arrays in the browser's Local Storage. Once a playlist is downloaded for the first time, all subsequent loads bypass the YouTube API entirely for instant playback.
* **API Quota Optimization (v2.0.0):** Uses strict API field masking to extract only essential video IDs, drastically reducing payload size and conserving Google Cloud limits.
* **Serverless Architecture:** Hosted entirely on AWS S3 & CloudFront, executing 100% in the browser with zero backend database dependencies.
* **Continuous Play:** Bypasses standard platform batch limits by launching shuffled tracks in batches of 50.

## Technical Implementation

### The Shuffle Algorithm
The core of the application relies on the **Fisher-Yates Shuffle**. Unlike basic "sort-by-random" methods which can have $O(n \log n)$ complexity and introduce placement bias, Fisher-Yates operates in perfect linear time complexity $O(n)$. 

The algorithm iterates through the array in reverse, picking a random element from the remaining unshuffled portion and swapping it with the current element:

$$j = \lfloor \text{random}() \times (i + 1) \rfloor$$
$$\text{Swap } array[i] \text{ and } array[j]$$

### Tech Stack
* **Languages:** JavaScript (ES6+), HTML5, CSS3
* **API:** YouTube Data API v3
* **Security:** Google Identity Services (OAuth 2.0)
* **Infrastructure:** AWS S3 & CloudFront

## Privacy & Security
1.  **Local Processing:** All data processing and caching occurs strictly within your browser. ytShuffle does not possess a backend server.
2.  **No Client Secret:** Employs the Google Identity Services Implicit Flow to completely eliminate developer credential exposure.
3.  **Scoped Access:** Read-only (`youtube.readonly`) permissions ensure user account data cannot be altered or deleted.

## License & Copyright
**© 2026 Ryan Landon Sapp. All Rights Reserved.**
This code is provided for educational review and portfolio demonstration only. Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. See the `LICENSE` file for details.

## Contact
For bugs or feature requests, please open an **Issue** on this repository or utilize the in-app support widget powered by Formspree.

---
*ytShuffle is an independent project and is not affiliated with, or endorsed by, YouTube or Google.*
