# Radar and lineup provenance

## Current catalog (2026-11-02)
The generated catalog contains 447 records across ten maps:
294 smoke, 74 flash, 70 molotov/incendiary and 9 HE records.
Run `node tools/build-lineup-catalog.cjs` to reproduce it from the checked-in
files under `data/lineup-sources`. The import report records excluded entries.

424 complete records come from https://github.com/ReneRebsdorf/CS2-annotations
at commit f6b2b17dac00f8167e7226b7029f1f4c0f4ceabe (MIT).
See ../../data/lineup-sources/ANNOTATIONS-LICENSE.txt and
ANNOTATIONS-CONTRIBUTING.md. The source explicitly defines yellow as T
and blue as CT; side filters use these labels, not target names.
Missing aim/destination nodes and unresolved localization keys are excluded.
Source descriptions, movement instructions, world coordinates and angles are
preserved. They are not a claim that we have independently tested each throw.

Seven Cache records come from Valve's shipped game annotations, mirrored at
https://github.com/SteamDatabase/GameTracking-CS2/tree/master/game/csgo/pak01_dir/annotations/official/de_cache .
Cache A Main and B Main denial throws are labeled CT; the five execute throws T.
No third-party screenshot is attached to an annotation unless it actually belongs
to that throw. The UI explicitly identifies records with no photographs and links
the source's workshop guide where available.

## Coordinate registration
For world-coordinate records, x = (worldX - pos_x) / (scale * 1024) * 100;
y = (pos_y - worldY) / (scale * 1024) * 100.
Overview metadata is snapshotted from the same GameTracking-CS2 resource/overviews
directory. Nuke, Train and Vertigo use the overview's altitude thresholds to
select upper/lower radar separately for the start and destination.
Cross-floor throws never draw their target on the wrong floor.
The route line is an endpoint connection, not a simulated flight path.

The old two Vertigo and one Overpass LineupX records are archived in
lineupx-legacy.json but excluded from the current catalog: their percentage
coordinates did not register correctly with the displayed radar. World-coordinate
records replace them. One legacy Vertigo record also said A despite showing B.
Sixteen photo-backed Dust2/Mirage records are retained from LineupX and visibly
labeled approximate/2024. The two Dust2 Mid-to-B destinations use the approximate
CT passage (51%,25%), corrected against landing screenshots.

## Radar and image assets
The *_radar_psd.png game assets are from
https://github.com/ees-q/cs2_radar_map_files except Cache, from
https://github.com/MurkyYT/cs2-map-icons/blob/main/images/radars/de_cache_radar_psd.png .
Game imagery remains the property of its respective owners.
Original LineupX *radar.png assets are retained for comparison.

57 archived standing/aiming/landing photos originated in
https://github.com/shimupan/lineupx (MIT; LINEUPX-LICENSE.txt).
The public Cloudinary name ddwqqjmyo is documented in its CONTRIBUTING.md;
each CS2.json record supplies the public_id. Images are 1600px JPEGs with
watermarks intact. 48 photos are used by the 16 retained records.
Repository licensing does not independently establish ownership of every
contributed image; original contributor credits are retained.
CS2-Util media were not imported because no explicit reuse license was found.
