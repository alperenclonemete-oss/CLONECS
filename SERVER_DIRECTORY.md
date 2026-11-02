# Community server directory

The Sunucular tab uses `/api/servers`. WarmupServer and CYBERSHOKE supply the addresses; CLONE LAB does not probe arbitrary game servers. CYBERSHOKE game ID 2 is CS2, while ID 1 is excluded as legacy CS:GO.

Sources:
- https://warmupserver.net/servers.php — `/api/servercards/query.php`
- https://cybershoke.net/cs2 — `/api/api/v2/main/data`
- https://xplay.gg/servers — directory link only (public listing requests rejected)
- https://pracc.com/play — directory link only (no verified public server feed integrated)

Provider requests run concurrently with ten-second timeouts and a shared 90-second cache. A failed refresh preserves the last list, explicitly marked stale. Data older than 24 hours is excluded. The bundled snapshot contains only normalized public server fields; it is a fallback, never a live occupancy source. Provider blocks can therefore leave a provider unavailable after the snapshot expires. No cookies, player profiles or API credentials are included.

Search, provider, city, mode, available-slot and saved-server filters run locally. Results are paginated (30 cards). Steam links and console commands contain validated IPv4 addresses and ports. Favorites are account-namespaced in this browser's local storage, not synchronized across devices. Joining may still require a provider subscription or Prime.

Checks: `python -m unittest discover -s tests -p test_server_directory.py` and `node tests/pro-config-navigation.test.cjs`. UI checks cover search, populated mode options, favorites, pagination and generated Steam links. Tests do not launch Steam or join a server.
