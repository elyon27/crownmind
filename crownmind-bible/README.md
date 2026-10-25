# v024 — CrownMind home link

The upper-left logo and title link to https://crownmind.net in the same tab. Deployment remains as documented in DEPLOYMENT.md.

# v023 — Internet deployment package

Start with DEPLOYMENT.md. This release uses Flask + Waitress and a read-only database. Previous release history follows.

## v022 — Topics layout

Topics hides the Study Space sidebar, including Translation Comparison and Personal Chapter Notes. The topic grid fills the freed space. Switching to another view restores the sidebar.

## v021 — Topic colors

Each of the 50 topic buttons has its own soft color and matching accent border, with dark readable text in light and dark themes. Alphabetical column order and topic behavior are unchanged.

## v020 — Alphabetical topics

Topics run alphabetically down each column, then continue at the top of the next column. Desktop: 10 rows × 5 columns. Small screens: 25 rows × 2 columns.

## v019 — Topics

50 curated topics in a five-column, ten-row desktop grid (two columns on small screens). Each topic opens a modal with three related passage selections in all nine translations and a Return button. Escape closes the modal. Reference selections are curated, not an exhaustive claim about every related verse. Cross-edition wording and verse divisions may differ.

## v018 — Offline commentary collections

Two complete electronic collections are bundled and imported into SQLite:

- Matthew Henry’s Concise Commentary: 66 books, 1,189 chapters, 3,684 entries. Linked by standard book/chapter/verse references to WEB, KJV, ASV, BSB, YLT, DBY, RV and ADB1905. This is the complete concise edition, not the six-volume unabridged work.
- Haydock’s Catholic Bible Commentary (1859): 73 books, 1,334 chapters. Linked to DRA using its own chapter numbering. Whole-chapter notes preserve original verse labels and footnotes.

The reader’s speech-bubble icons expand notes immediately below the verse. Range notes and whole-chapter notes are explicitly labeled. The Database view lists the collections and sources. All commentary is English, including with Tagalog scripture; these are historical authors’ interpretations, not official notes written for each translation. Matthew Henry does not cover the additional apocryphal books. Edition wording and occasionally verse divisions can differ; consult the displayed range and quoted text in context.

Source files, provenance and checksums: data/commentary-sources/. Original introductions are retained in commentary_introductions and in the complete source downloads. Commentary text is normalized to plain text with paragraphs; no doctrinal rewriting or machine translation was performed. Two MHCC chapter-one sections embedded in book headers and a Haydock file containing Isaiah 11–12 were handled explicitly.

Start START-CROWNMIND.cmd and open http://localhost:3000/index.html?v=018.

## v017 — Verse commentary support

The reader shows a speech-bubble icon only for verses with commentary. Click to expand or collapse the note directly below the verse. Notes retain title, author, source and verse range. All nine editions are supported through edition-specific references; do not copy reference numbers across editions without verifying their alignment.

No commentary collection is bundled yet. Import authorized notes with `python scripts/import_commentaries.py your-notes.json`. The JSON is an array of objects with translation, book_slug, chapter, verse_start, verse_end, title, author, source, and body. Import is transactional and appends records.

## v016 — Prophecy navigation

Prophecy and Fulfillment is now a separate main view opened from the header tab beside Database. The Read view no longer includes this section below its verses.

## v015 — Prophecy and Fulfillment

Includes 50 curated passage connections, full WEB verse text on expansion, topic/text filtering, and contextual reading links. This is not an exhaustive list of every Christian interpretation. WEB numbering and text are fixed in this section to avoid mismatches between editions, notably Douay–Rheims Psalms. Categories describe the nature of the NT use; typology and narrative connections are not presented as direct predictions.

## v014 — Complete search counts

Search displays shown / total matching verse entries for the selected translation. Show more results loads the next 50 until all matches are visible. Clear search restores the chapter.

Open http://localhost:3000/index.html?v=014 after starting this release.

## v013 — Clear search

The X inside the search field clears the query and search results, restores the selected chapter, and returns focus to the field. Pending search responses cannot restore cleared results.

Stop the previous server, extract this package, and run START-CROWNMIND.cmd. Open http://localhost:3000/index.html?v=013.

## v012 — Translation Info repair

This release uses uniquely named CSS and JavaScript and no-store response headers to prevent mixed cached frontend versions. Info is joined directly to the Translation selector and opens the selected translation introduction. All nine Bible datasets are unchanged.

Stop the previous server with Ctrl+C, extract this ZIP to a new folder, then run START-CROWNMIND.cmd. Open http://localhost:3000/index.html?v=012. The footer and server window identify v012.

# CrownMind Bible — Complete nine-translation Bible package v011 — Translation Info button

The complete World English Bible Classic, King James Version (1769, with Apocrypha), American Standard Version (1901), Berean Standard Bible, Douay–Rheims American Edition 1899, Young’s Literal Translation (1898), the Darby Bible, Revised Version (1895), and Ang Dating Biblia (1905) are already imported into `data/bible.db` and connected to the frontend. No import, database setup, API key, internet connection, or dependency installation is needed to read it after extraction (Python must be installed).

## Start on Windows

1. Extract this ZIP to a NEW folder. Keep the complete `crownmind-bible` directory together.
2. Double-click `START-CROWNMIND.cmd`, or open PowerShell in that folder and run `py server.py`.
3. Open http://localhost:3000. Leave the server window open. Ctrl+C stops the server.

For your previous folder structure, if you choose to place this new version there:

```powershell
cd "C:\WorkDir\Repositories\bible_software\bible\crownmind-bible"
py server.py
```

Stop the old server before starting this version. Use a fresh extraction so an old `data/bible.db` cannot overwrite the bundled full database. Keep a backup of your old folder if it contains other imports. Bookmarks and notes remain in the same browser at the same localhost address; the original 66 book slugs are unchanged. Ctrl+F5 refreshes old frontend files.

## Included editions

- World English Bible Classic, American English, publisher dataset `eng-web`, 2020 stable text edition.
- 81 books: 39 Old Testament, 27 New Testament, and 15 Deuterocanonical/Apocryphal books, grouped separately.
- 1,402 chapters and 38,058 source verse entries.
- This is the complete verse-text export, including every source record, not a sample. It does not include publisher footnotes, introductions, paragraph layout or section headings: the official VPL export omits those.
- Six records use verse ranges; their labels are preserved. Twenty-nine records contain no text in the source and display an explanatory placeholder. Source versification is preserved without inserting invented text. Entry totals should not be compared directly to verse totals for other canons or editions.

The text comes from https://ebible.org/Scriptures/eng-web_vpl.zip, retrieved October 25, 2026. Publisher details: https://ebible.org/find/show.php?id=eng-web . Text is public domain. “World English Bible” is an eBible.org trademark; altered translation text should not be represented as WEB. The original publisher notice is included in `data/WEB-source-notice.html`.

## Added in v003: complete KJV

- King James Version, standardized 1769 text, including Apocrypha from eBible.org/CrossWire (`eng-kjv`).
- 80 books, 1,362 chapters, 36,822 verse entries; every entry matches the original source XML after trimming leading/trailing whitespace.
- Source: https://ebible.org/Scriptures/eng-kjv_vpl.zip ; details: https://ebible.org/bible/details.php?id=eng-kjv . Retrieved October 25, 2026.
- The complete verse-text export is included; publisher notes, introductions and paragraph formatting are outside this export.
- Public domain outside the UK; UK Crown rights apply. The publisher notice is retained in `data/KJV-source-notice.html`.
- WEB retains its original 38,058 records without changes. Total after v003: 74,880 entries. Different book counts are intentional, reflecting the editions. KJV has separate Song of the Three Holy Children, Susanna, and Bel and the Dragon entries; WEB includes these within its Greek Daniel. No artificial cross-book comparison is applied.

## Added in v004: complete ASV 1901

- American Standard Version (1901), publisher dataset `eng-asv`: 66 books, 1,189 chapters, 31,102 source verse entries.
- Source: https://ebible.org/Scriptures/eng-asv_vpl.zip ; publisher details: https://ebible.org/find/show.php?id=eng-asv . Retrieved October 25, 2026.
- Public domain. Publisher notice: `data/ASV-source-notice.html`.
- All source entries are preserved, including 16 empty text entries. The UI identifies these explicitly. No missing verse text is invented.
- This is the full verse-text export; notes, introductions, paragraph formatting and headings are not included in the publisher's VPL export.
- WEB and KJV text remain unchanged. All three editions total 105,982 database verse entries.
- To use it: stop the existing server, extract this ZIP into a NEW folder, run START-CROWNMIND.cmd and open http://localhost:3000 . Press Ctrl+F5 if the browser shows old content. Choose ASV in the Translation selector. No import or download is needed after extraction.

## Added in v005: complete Berean Standard Bible

- BSB: 66 books, 1,189 chapters, 31,086 source verse entries; all source entries imported.
- Source: https://ebible.org/Scriptures/engbsb_vpl.zip ; catalog: https://ebible.org/details.php?id=engbsb . Retrieved October 25, 2026. This package uses the eBible.org BSB export, not a claim of identity with every printing available elsewhere.
- Public domain; contributor BSB Publishing, LLC. The original notice is in `data/BSB-source-notice.html`. Publisher licensing: https://berean.bible/licensing.htm .
- Full verse text is included. The VPL export does not contain publisher footnotes, introductions, headings or paragraph formatting.
- Source numbering is preserved. BSB has fewer entries than ASV; no text or numbered entries have been invented to fill source gaps. Comparison shows available records at the selected reference.
- WEB, KJV and ASV remain unchanged. Combined database total: 137,068 verse entries.
- Stop the old server, extract v005 to a NEW folder, run START-CROWNMIND.cmd, and visit http://localhost:3000 . Select BSB. No import is required.

## Added in v006: Douay–Rheims American Edition 1899

- DRA: 73 books, 1,334 chapters, 35,811 source verse entries, including the Deuterocanonical books.
- Complete eBible.org verse-text export: https://ebible.org/Scriptures/engDRA_vpl.zip . Catalog: https://ebible.org/bible/details.php?id=engDRA . Retrieved October 26, 2026.
- Public domain. Original notice: `data/DRA-source-notice.html`. All verse entries match the source after trimming outer whitespace. Publisher notes, introductions, headings and paragraph formatting are not included in this VPL export.
- Original numbering is retained, including Daniel through chapter 14 and Esther through chapter 16. The existing English book labels are used in the console.
- IMPORTANT: Douay–Rheims uses different Psalm numbering and some different verse divisions. The comparison panel retrieves identical reference numbers; it is NOT a passage-alignment concordance. Identical numbers can refer to different passages. A visible reminder is included in the panel.
- Previous WEB/KJV/ASV/BSB records remain unchanged. Combined total: 172,879 verse entries.
- Stop the old server, extract into a NEW folder, run START-CROWNMIND.cmd and open http://localhost:3000 . Select DRA. No import is required.

## Added in v007: Young’s Literal Translation (1898)

- YLT: 66 books, 1,189 chapters, 31,102 verse entries; complete Old and New Testaments.
- Public-domain text from eBible.org: https://ebible.org/Scriptures/engylt_vpl.zip . Catalog: https://ebible.org/details.php?id=engylt (the same catalog identifies its SWORD edition as engylt1898eb). Retrieved October 26, 2026.
- Original source notice is retained in `data/YLT-source-notice.html`; source XML and per-book coverage/hash manifest are included.
- Every source verse entry was imported, preserving wording and numbering, with outer whitespace trimmed. Publisher footnotes, headings, introductions and paragraph layout are outside the VPL text export.
- Previous five translations remain unchanged. Combined database total: 203,981 verse entries.
- Stop the old server, extract this ZIP to a NEW folder, run START-CROWNMIND.cmd and open http://localhost:3000 . Select YLT. No import is required.

## Added in v008: Darby Bible (DBY)

- Complete English Darby Translation: 66 books, 1,189 chapters, 31,099 source verse entries.
- Source: https://ebible.org/Scriptures/engDBY_vpl.zip . Catalog: https://ebible.org/find/show.php?id=engDBY . Retrieved October 26, 2026.
- Public-domain translation by J. N. Darby. The original notice is in `data/DBY-source-notice.html`; full source XML and per-book coverage/hash manifest are retained.
- Every source entry is imported with its original wording and numbering (outer whitespace trimmed). Entry counts vary by edition; no text is invented to fill gaps. Publisher notes, headings, introductions and paragraph layout are outside the VPL export.
- Earlier six translations remain unchanged. Combined total: 235,080 verse entries.
- Stop the old server, extract this ZIP to a NEW folder, run START-CROWNMIND.cmd and open http://localhost:3000 . Select DBY. No import required.

## Added in v009: Revised Version (1895), including Apocrypha

- RV: 80 books, 1,362 chapters, 36,878 source verse entries.
- Source: https://ebible.org/Scriptures/eng-rv_vpl.zip . Catalog: https://ebible.org/bible/details.php?id=eng-rv . Retrieved October 26, 2026.
- Public domain. Original notice: `data/RV-source-notice.html`; original source XML and per-book coverage/hash manifest are included.
- All source records are preserved, including five range labels and 42 entries with no text. Empty entries show the existing source-text placeholder; no scripture is invented. Full verse text is included; publisher notes, headings, introductions and paragraph layout are outside the VPL export.
- Earlier seven translations are unchanged. Combined database total: 271,958 verse entries.
- Stop the old server, extract into a NEW folder, run START-CROWNMIND.cmd and open http://localhost:3000 . Select RV. No import is needed.

## Added in v010: Ang Dating Biblia / Ang Biblia (1905)

- ADB1905: complete Tagalog Old and New Testaments; 66 books, 1,189 chapters, 31,102 verse entries.
- Source: https://api.getbible.net/v2/tagalog.json ; retrieved October 26, 2026. Metadata identifies Philippine Bible Society (1905), CrossWire TagAngBiblia version 1.2, transcription by Richard & Dolores Long, and public-domain distribution. CrossWire catalog: https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=TagAngBiblia .
- This is the 1905 edition, not Ang Biblia 2001 or Magandang Balita Biblia. Original Tagalog spelling and wording are retained (outer whitespace trimmed).
- Full original JSON: `data/tagalog-1905-source.json`; source metadata: `data/ADB1905-source-notice.json`; per-book coverage/hash: `data/adb1905-manifest.json`.
- All source verse entries are included; no publisher footnotes, commentary or page formatting are added. The console continues using its existing English book labels and navigation; the displayed scripture is Tagalog. Source Tagalog book names are retained in the JSON and coverage report.
- Existing eight translations remain unchanged. Combined database total: 303,060 entries. Comparison matches reference numbers; it is not an alignment concordance.
- Stop the old server, extract into a NEW folder, run START-CROWNMIND.cmd, open http://localhost:3000 and select ADB1905. No additional import is required.

## Added in v011: Translation Info

The Info button sits immediately beside the Translation dropdown. Click it to open a summary introduction, edition notes, language, live database coverage, rights notice and source link. Changing translations updates the open panel. Click Info again, Close, or press Escape while focused inside the panel to close it. All nine introductions are included locally and work offline; external source links require internet. These are CrownMind summaries, not publisher prefaces. The database is byte-for-byte unchanged from v010.

## Frontend console

Choose any book on the left and any chapter in its selector. All chapters are loaded from the bundled database. Previous/next navigates chapters within a book. Search queries the entire selected translation; the UI displays up to 50 results and each opens its chapter. Select a verse number to compare imported translations or save a bookmark. Personal notes save as you type and stay in this browser. Database shows live book/chapter/entry counts. Responsive layouts and light/dark themes are included.

WEB, KJV, ASV, BSB, DRA, YLT, DBY, RV and ADB1905 are bundled. Select ADB1905 to read Ang Dating Biblia (1905) in Tagalog. Switching translations preserves the current chapter when available. The book list shows only books present in the selected translation; if the current book is absent, the reader opens Genesis. Click a verse number to compare all nine translations. Comparison matches reference numbers, not a scholarly versification crosswalk; numbering and the division of additional books can differ between editions. Clearing browser storage removes notes and bookmarks; they are not cloud accounts.

## Backend

Python 3.10+ and SQLite, no third-party runtime dependencies. Local server binds to 127.0.0.1. `PORT` optionally changes the port; `BIBLE_DB` optionally points to a compatible database. Do not point it to the old five-verse database: v002 through v010 use `verse_label` and `verse_end` fields.

| GET route | Parameters | Result |
|---|---|---|
| /api/books | translation (optional) | Books in that edition; without a filter, combined 84-book catalog |
| /api/translations | none | Available translations |
| /api/chapters | book_slug, translation | Available chapter numbers |
| /api/chapter | book_slug, chapter, translation | Chapter text |
| /api/verse | book_slug, chapter, verse, translation | Verse or containing source range |
| /api/compare | book_slug, chapter, verse | Verse across imported translations |
| /api/search | q, translation, offset | Literal search, 50 entries per page |
| /api/status | none | Database totals |

Defaults: WEB, genesis, chapter 1, verse 1. Success uses `{ "success": true, "data": [...] }`. Empty references return an empty array. Search accepts 2–150 characters; SQL queries are parameterized. Status is read-only; no remote admin write route is exposed.

## Add another translation

Back up `data/bible.db`. Use `data/import-example.json` as a format reference, assign the correct distinct translation code, provide authorized text and accurate source/license information, then run:

```powershell
py scripts/import_translation.py data/translation.json
```

The importer validates references and performs a transaction; matching entries are updated and unrelated entries remain. Do not use the tiny example to replace full WEB metadata. It is only a format example. The generic importer supports individually numbered verses; the bundled WEB database preserves its publisher's ranges separately.

## Verification and source files

`data/web-manifest.json`, `data/kjv-manifest.json`, `data/asv-manifest.json`, `data/bsb-manifest.json`, `data/dra-manifest.json`, `data/ylt-manifest.json`, `data/dby-manifest.json`, and `data/rv-manifest.json` record source hashes, retrieval date, totals, and per-book coverage. `data/eng-web_vpl.xml`, `data/eng-kjv_vpl.xml`, `data/eng-asv_vpl.xml`, `data/engbsb_vpl.xml`, `data/engDRA_vpl.xml`, `data/engylt_vpl.xml`, `data/engDBY_vpl.xml`, and `data/eng-rv_vpl.xml` retain the eight full original XML exports. `tests.py` checks source/database equality, integrity, all 11,405 chapter routes across all nine translations, search, verse ranges and Revelation 22:21. Run `py tests.py` to repeat these checks.

The packaged database is local SQLite, not a connection to any earlier Supabase/PostgreSQL project. This remains a local development server. Public hosting requires a production server/TLS and operational configuration.
