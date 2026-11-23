# Practice tools

- Training offers a 15-minute warm-up, a 20-minute utility routine and a 30-minute team rehearsal. Pick a map, start a drill timer and mark each drill when you finish it. Selections, completion and notes are saved per account on the current browser.
- Team tactics include linked professional round reviews from NAVI, Vitality and The MongolZ. The interface separates the round observation from the practice roles and steps. Map and side filters limit the catalog, and the lineup button opens the same map.

- Tactical board: five players and smoke/flash/molotov paths on ten radar maps. Draw routes and play an eight-second rehearsal. Paths are stored on this device per account, plan, map and floor. They are user drawings, not grenade physics or extracted professional routes.
- Demo review: teammate blind person-seconds (overlaps merged), deaths traded within five seconds in the same round, and flashes with no enemy blind event. Uses 64 ticks/second. These are review signals, not proof of mistakes. Other utility waste is not inferred. Old saved analyses are not automatically reparsed.
- PWA: install entry in Settings, manifest and root-scoped service worker. Only the offline page and icons are cached; account and match API data are never cached. Offline mode shows a reconnect page, not full offline functionality.

Worker deployment must rebuild Dockerfile.worker to include mistake_analysis.py. Web deployment alone cannot produce the new metrics. Real-device installation still needs a supported browser over HTTPS.
