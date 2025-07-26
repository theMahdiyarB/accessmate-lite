# Changelog

## v0.5.3 – 2025-07-26
- **Maintenance:** Updated the "release.ps1" file for windows PowerShell users.
- **Maintenance:** Added comprehensive in-line comments and documentations to the files.

## v0.5.2 – 2025-07-24
- **Minor Fix:** Corrected a version parsing issue in the release script to ensure proper semantic versioning (no more `0.0.NaN` errors).
- **Maintenance:** Small cleanup in release and version bump scripts to improve stability for flat directory structure.

## v0.5.0 – 2025-07-24
- **Feature:** Voices and models are now dynamically fetched from the Gemini API; always up to date with Google (no more hardcoded voice lists).
- **Improvement:** Modern Material/Chrome-style UI with automatic light/dark mode and accessibility improvements.
- **Enhancement:** More user-friendly error handling and status feedback in the popup.
- **Automation:** Release script now bumps version, zips the package, publishes GitHub Releases, and switches back to development branch automatically.
- **Docs:** README and setup instructions updated; troubleshooting and future roadmap sections added.

## v0.3.0 – 2025-07-23
- **Feature:** Four action modes: Summarise & Read Selection, Read Selection, Summarise & Read Page, Read Page.
- **Feature:** Settings page allows user to add their own API key, select text/TTS models, and pick a TTS voice.
- **Improvement:** All UI refactored for a clean, Material-like look with pure HTML+CSS, supporting responsive and accessible design.
- **Improvement:** Settings and model/voice selections are now persistent (saved and restored automatically).
- **Bugfix:** Fixed various issues with API key storage, selector population, and voice playback reliability.

## v0.0.1 – 2025-07-22
- **Initial public release:** 
    - Popup summarizer and TTS for highlighted text (using Gemini Flash & Flash-Preview-TTS).
    - Material-like UI, no build tools, privacy-respecting (all requests sent only to Google).
    - Settings persisted in extension storage.
    - README, MIT license, and automation setup.