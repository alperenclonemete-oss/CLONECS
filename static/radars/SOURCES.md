# Radar and lineup provenance

The eight *radar.png images and 19 records in ../lineup-seed.json come from
https://github.com/shimupan/lineupx (MIT; see LINEUPX-LICENSE.txt).
Original radar files carry a .webp extension but have PNG signatures; bytes are unchanged.
Coordinates were divided by the source image size (2048) and multiplied by 100.
The source stores start and destination separately. Both Dust2 Mid-to-B destination
markers were corrected to the approximate CT passage (51%,25%) after inspecting
their landing screenshots; original markers incorrectly pointed to mid doors.
Displayed radars now all use the ees-q source below. Original LineupX radars are
retained for coordinate comparison. Markers indicate regions, not precise aiming points.
These community records date from 2024 and have not been retested in the current game.
The route line shows start and destination, not a simulated grenade trajectory.

The *_radar_psd.png assets are game radar images from
https://github.com/ees-q/cs2_radar_map_files .
Game imagery remains the property of its respective owners.
Cache is not supplied by these sources and is not substituted with a schematic.

CS2-Util was examined but its media were not imported: no explicit reuse license was found.

The 57 standing/aiming/landing screenshots in ../lineup-images are resolved from
LineupX CS2.json public_id fields, using the public Cloudinary cloud ddwqqjmyo
documented in its CONTRIBUTING.md. Images are delivered as 1600px JPEGs with
original visible watermarks intact. Each record preserves its contributor credit.
Screenshots can contain third-party creator material; the repository license does
not independently establish ownership of every contributed screenshot.
