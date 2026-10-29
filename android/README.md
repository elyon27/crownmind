# CrownMind Bible Library Android

Application ID: net.crownmind.biblelibrary. Version 1.0.7, code 8.

The GitHub Actions workflow builds the offline app from the same Bible source as the website and publishes an unsigned AAB build artifact. It does not release the app to Google Play.

To build locally, install JDK 17, Android SDK 36 and Gradle 8.11.1. Run `python scripts/prepare_bible_android.py` from the repository root after installing Flask, then `gradle -p android bundleRelease`.

For Google Play, sign with this app's existing upload key. Do not create a replacement key for this update. Keep keystores and passwords outside git. Verify version code 8 has not already been used in Play Console.


Version 1.0.6 adds bookmarked verse links, 72 Old/New Testament connections and 72 topics with seven passages each. The bundled cross-reference index is derived from OpenBible.info under CC BY 4.0. Attribution and numbering limitations appear in the Verse links panel and source notices.

Version 1.0.7 adds the Maps tab after Topics with four offline maps of Paul’s journeys, numbered city keys, route arrows, itinerary labels and Scripture references.
