# Bible Library — Netlify integration v025

The Institute homepage and Resources page link to `/bible/`. The Bible brand links back to `https://crownmind.net`.

Netlify reads `netlify.toml`: the build runs `scripts/build_bible.py`, then publishes `dist`. Python and Flask are used only during the build to export the existing SQLite database. Visitors load static HTML, JavaScript, and JSON; no Python server, functions, Supabase, or new account is required.

The build preserves the existing website's public directories and pages. It excludes `crownmind-bible` application sources and the SQLite file from the published directory. Source data and original archives remain in the repository. Do not set the Netlify publish directory to the repository root: use `dist`.

Bible data is fetched per book. The first full-text search downloads the selected translation's books; search displays progress text, returns total counts, and pages by 50. Notes/bookmarks remain local to each browser. No account synchronization is introduced. All edition numbering and historical commentary qualifications remain applicable.

Local build: `pip install 'Flask>=3.1,<4'`, then `python3 scripts/build_bible.py`. Preview with `python3 -m http.server 8000 --directory dist` and visit `/bible/`.

Validation: all 303,060 exported verse records matched SQLite exactly; nine translation reader and commentary controls passed DOM tests, as did comparison, Topics/Return, prophecy and full search pagination. WEB search for 'love' returned 683 results. These are programmatic checks, not a visual mobile/browser or high-traffic load test.

Deployment is triggered when this integration reaches the branch linked to Netlify. Confirm the Netlify build succeeds before announcing availability. To roll back, revert the integration commit and redeploy.

## v031 — Paul’s journey maps

Maps follows Topics. Four locally bundled SVG study maps cover the first, second and third missionary journeys and the voyage to Rome. Color-coded routes, arrows, numbered city keys, labeled itineraries and Scripture references work offline in the Android app. Routes, dates and simplified coastlines are marked approximate. Android version 1.0.7 uses version code 8.
