# CrownMind Bible Library Android

Application ID: net.crownmind.biblelibrary. Version 1.0.5, code 6.

The GitHub Actions workflow builds the offline app from the same Bible source as the website and publishes an unsigned AAB build artifact. It does not release the app to Google Play.

To build locally, install JDK 17, Android SDK 36 and Gradle 8.11.1. Run `python scripts/prepare_bible_android.py` from the repository root after installing Flask, then `gradle -p android bundleRelease`.

For Google Play, sign with this app's existing upload key. Do not create a replacement key for this update. Keep keystores and passwords outside git. Verify version code 6 has not already been used in Play Console.
