# ytshuffle | The YouTube Playlist Shuffler

**ytshuffle** is a high-performance, privacy-focused web utility designed to solve the "biased shuffle" problem common in modern streaming platforms. By utilizing the **YouTube Data API v3** and the **Fisher-Yates shuffle algorithm**, it provides users with a mathematically 100% unbiased randomization of their playlists.

## Features
* **True Randomization:** Implements the Fisher-Yates (Knuth) shuffle algorithm.
* **Serverless Architecture:** 100% client-side; no user data is ever stored on a server.
* **Dynamic Batching:** Real-time visual progress counters during API fetches.
* **Continuous Play:** Launches shuffled tracks in optimized batches of 50.
* **Privacy-First:** Utilizes the least-privilege `youtube.readonly` scope.

## Technical Implementation

### The Shuffle Algorithm
The core of the application is the **Fisher-Yates Shuffle**. Unlike basic "sort-by-random" methods which can have $O(n \log n)$ complexity and potential bias, Fisher-Yates operates in linear time complexity $O(n)$. 



The algorithm works by iterating through the array in reverse, picking a random element from the remaining unshuffled portion and swapping it with the current element:

$$j = \lfloor \text{random}() \times (i + 1) \rfloor$$
$$\text{Swap } array[i] \text{ and } array[j]$$

### Tech Stack
* **Language:** JavaScript (Vanilla ES6+)
* **API:** YouTube Data API v3
* **Security:** Google Identity Services (OAuth 2.0)
* **Infrastructure:** AWS S3 & CloudFront (SSL/TLS Optimized)

## Privacy & Security
1.  **Zero Persistence:** Tokens and playlist data exist only in volatile memory and are cleared upon closing the session.
2.  **No Client Secret:** Employs the OAuth 2.0 Implicit Flow to prevent developer credential exposure.
3.  **Scoped Access:** Read-only permissions ensure user account integrity.

## License & Copyright
**© 2026 Ryan Sapp. All Rights Reserved.**
This code is provided for educational review and portfolio demonstration only. Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. See the `LICENSE` file for details.

## Contact
For bugs or feature requests, please open an **Issue** on this repository.

---
*ytshuffle is an independent project and is not affiliated with, or endorsed by, YouTube or Google.*
