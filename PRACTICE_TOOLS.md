# Practice tools — first release

- Tactical board: five players and smoke/flash/molotov paths on ten radar maps. Draw routes and play an eight-second rehearsal. Paths are stored on this device per account, plan, map and floor. They are user drawings, not grenade physics or extracted professional routes.
- Economy: five individual balances, T/CT, MR12 round, loss income and force-buy choice. Assumes empty inventories; no weapon drops, overtime, kill or plant rewards.
- Demo review: teammate blind person-seconds (overlaps merged), deaths traded within five seconds in the same round, and flashes with no enemy blind event. Uses 64 ticks/second. These are review signals, not proof of mistakes. Other utility waste is not inferred. Old saved analyses are not automatically reparsed.
- PWA: install entry in Settings, manifest and root-scoped service worker. Only the offline page and icons are cached; account and match API data are never cached. Offline mode shows a reconnect page, not full offline functionality.

Worker deployment must rebuild Dockerfile.worker to include mistake_analysis.py. Web deployment alone cannot produce the new metrics. Real-device installation still needs a supported browser over HTTPS.
