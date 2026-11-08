## [1.2.4] - 2026-11-09
### Added
- Added an optional Google-style search widget on the homepage when the feed is hidden, replacing the previous motivational quotes.

## [1.2.3] - 2026-11-06
### Added
- Added an optional Settings Lock Timer with waits from 5 seconds to 5 minutes before settings can be changed. Each popup opening starts a fresh wait, and settings unlock automatically when it ends.
- Added a Hide Countdown option and a minimal lock screen with a circular countdown that decreases once per second.
- Added keyboard focus handling, storage loading safeguards, and regression tests for timer startup, expiry, and popup reopening.

### Credits
- Thanks to [@joana-lima-melo](https://github.com/joana-lima-melo) for the original Settings Lock Timer contribution in [#38](https://github.com/KartikRashmin/LockedIn-YT/pull/38). This release incorporates and refines that contribution with redesigned UI, popup lifecycle fixes, and additional validation. The original author commits are preserved.

## [1.2.2] - 2026-10-01
### Fixed
- Fixed hiding of "Get more from memberships" brand video shelves on the homepage
- Fixed "Hide recommended videos" now, hides the recommended videos that appear after video ends(#34) 

## [1.2.1] - 2026-09-03
### Added
- Split the Disable Autoplay functionality into separate options for regular videos and playlists (#29)

### Fixed
- Fixed an issue where videos inside a playlist would not start playing when clicked (#30)

## [1.2.0] - 2026-08-18
### Added
- Added a new "Hide Live Streams" toggle to the Subscriptions page to hide live streams from the subscriptions feed

## [1.1.9] - 2026-08-02
### Fixed
- Block playlist auto-advance when Disable Autoplay is enabled (#27)

## [1.1.8] - 2026-06-03
### Added
- Added language support for Simplified Chinese and Traditional Chinese (thanks @Hendrix4858).

## [1.1.7] - 2026-05-23
### Added
- Added a new Homepage toggle to hide the "Explore more topics" shelf

### Changed
- Added collapsible sections in the popup for easier navigation

## [1.1.6] - 2026-05-23
### Changed
- Removed the Show Stats feature for now; improving the stats logic and fixing issues, will add it back with a corrected implementation

## [1.1.5] - 2026-04-21
### Fixed
- Fixed the end screen cards toggle restore behavior so YouTube’s native endscreen inline styles are preserved correctly
- Fixed the right-click target regression on watch pages where an endscreen layer could remain over the video area after toggling end screen cards

## [1.1.4] - 2026-04-17
### Changed
- Enhanced the Hide Members Only Content feature to detect and hide Members only videos across YouTube surfaces with newer badge markup

### Fixed
- Fixed bugs in Search Results where the Hide Recommended Videos toggle did not consistently hide recommendation shelves/cards
- Fixed Disable Autoplay toggle behavior for more reliable autoplay-off enforcement across navigation and dynamic page updates

## [1.1.3] - 2026-04-04
### Added
- Added a new thumbnail control dropdown with disable, blur, hidden, reveal-on-hover, and solid-color modes

### Changed
- Improved the redirect-to-subscriptions logic for a faster and more robust homepage redirect flow

## [1.1.2] - 2026-03-24
### Added
- Added an announcement section for Firefox users to promote LockedIn on Chrome Web Store

## [1.1.1] - 2026-03-12
### Added
- Added "Clean Sidebar" toggle group with sub-toggles (Hide Subscriptions, Hide Explore & Trending, Hide More From YouTube)
- Added "Hide 'Most Relevant'" toggle for Subscriptions page to remove algorithmic sorting

### Changed
- Enhanced autoplay handling for more reliable control across different YouTube layouts
- Made extension fully Chrome/Edge compatible for official Chrome Web Store release

### Fixed
- Fixed white border artifacts appearing in Chrome/Edge popup corners and edges


## [1.1.0] - 2026-03-07
### Added
- Added PayPal as a new payment platform on the Sponsor page

### Changed
- Implemented a more robust method for the Disable Autoplay toggle to keep autoplay consistently off
- Redesigned the Menu page for a cleaner and more informative settings experience
- Redesigned the Sponsor page with improved platform layout and actions

### Fixed
- Made the Hide Recommended Videos toggle more robust by improving compatibility with most YouTube watch layouts

## [1.0.99] - 2026-02-22
### Added
- Added toggle to hide Boss Baby placeholder image from the homepage feed
- Added Buy Me a Coffee (BMC) as a donation option on the Sponsors page
- Enhanced Sponsors page with redesigned buttons using official brand assets (BMC, UPI, GitHub Sponsors)
- Replaced Google Forms feedback with a direct GitHub Issues link for bug reports and feature requests

## [1.0.98] - 2026-01-26
### Added
- Added new toggles for better content control

### Fixed
- Minor bug fixes and stability improvements

## [1.0.97] - 2026-01-18
### Fixed
- Fixed flickering issue around the like button area when "Hide Video Side Bar" toggle is enabled
- Removed CSS variable manipulation that was causing layout recalculation loops

## [1.0.96] - 2026-01-10
### Fixed
- Fixed search results page breaking when Hide Recommended Videos or Hide Sidebar toggle is enabled
- Fixed video player persisting on homepage/search pages when Hide Recommended is toggled
- Added page-specific CSS scoping to prevent layout issues during navigation

## [1.0.95] - 2026-01-02
### Fixed
- Fixed video thumbnail hover previews showing black screen when "Hide End Screen Cards" toggle is enabled

## [1.0.94] - 2025-12-27
### Fixed
- Minor bug fixes in Sponsor and Feedback popup pages (removed duplicate and raw HTML issues for a cleaner user experience)

# Changelog

All notable changes to the LockedIn extension will be documented in this file.

## [1.0.93] - 2025-12-25
### Added
- Popup footer version display now uses a bundled Santa hat SVG with accessible markup for a holiday refresh

### Changed
- Updated build scripts to package the new assets directory for Firefox/Chrome and Edge distributions

## [1.0.92] - 2025-12-11
### Fixed
- Popup sponsor and feedback texts now render HTML translations properly (no more raw markup shown)
- Carried forward localization robustness for Explore/More from YouTube/Subscriptions and transcript auto-unhide observer improvements

## [1.0.91] - 2025-12-11
### Added
- Expanded localization coverage and URL-based detection for Explore/Trending/More from YouTube/Subscriptions so toggles work across all YouTube languages

### Fixed
- Transcript and engagement panels now auto-unhide in any language via a global observer, keeping the sidebar visible when transcripts load
- Prevented the “You” section from being hidden by the More from YouTube toggle and hardened sidebar section matching

## [1.0.90] - 2025-12-10
### Added
- **Hide Subscriptions Toggle**: New toggle in YouTube Sidebar section to hide subscription recommendations
- **Instant CSS Hiding**: Implemented CSS-based instant hiding for recommendations to eliminate 0.5-1s delay
- **Live Chat Support**: Extended recommendations hiding to work properly in live chat layout (#below container)
- **Engagement Panel Protection**: Transcripts and other engagement panels now properly excluded from sidebar hiding
- **Menu Page UI Enhancements**: Improved spacing, backgrounds, shadows, and overall visual polish
- **Compact Power Dropdown**: Redesigned power dropdown with rounded corners, better positioning, and refined colors
- **Break Timer Update**: Changed timer text from "Back in" to "See you in"
- **Disabled State Icon**: Changed from power icon to ":( " emoticon in red
- **Show Stats Toggle Resize**: Made Show Stats toggle match main page toggle size for consistency
- **Translation Updates**: Added full translations for all new features across 6 languages (English, Spanish, Hindi, Portuguese, French, German)

### Changed
- **Power Dropdown Styling**: More compact design with 96px min-width, repositioned to top-right, rounded corners
- **Menu Header Behavior**: Header now stays visible behind menu with z-index instead of hiding completely
- **Menu Title Styling**: Updated to match feedback page font style (17.5px Segoe UI Semibold)
- **Footer Sizing**: Optimized footer padding and text sizes for better visual balance
- **Hover Colors**: Updated power dropdown hover to lighter grey (rgba 255,255,255,0.85)

### Fixed
- **Transcript Visibility**: Transcripts now always visible regardless of sidebar/recommendations toggles
- **Live Chat Recommendations**: Fixed recommendations not hiding in live chat layout
- **Element Hiding Delay**: Eliminated 0.5-1 second delay when hiding recommendations
- **Stats Accuracy**: Verified and confirmed stats tracking logic is accurate and properly gated by page activity

### Technical
- Added `isEngagementPanel()` helper function to exclude engagement panels from hiding
- Implemented `setInstantRecsHiding()` with dynamic CSS injection for instant hiding
- Extended `hideRecommendedVideos()` to handle #below container for live chat
- Updated all translation dictionaries with new keys

## [1.0.85] - 2025-12-03
### Added
- **Granular Video Sidebar Controls**: New sub-toggles under Video Sidebar for Hide Recommended Videos, Hide Shorts, and Hide Playlists
- **hideAll() Function**: When Video Sidebar toggle is ON, hides everything including playlists; sub-toggles work independently when parent is OFF
- **Feedback Page**: New feedback overlay accessible from popup footer
- **Sponsor Page**: New sponsor overlay with GitHub Sponsors, UPI, Firefox Add-ons, and MS Edge links
- **UPI Payment Page**: Dedicated payment page at docs/upi.html with modern glassmorphism design

### Changed
- **Sidebar Shorts Detection**: Enhanced detection using URL patterns, overlay badges, and metadata badges
- **Search Shorts CSS Scoping**: Fixed CSS to only affect search pages, preventing sidebar Shorts from being hidden unintentionally
- **Playlist Preservation**: Sub-toggles now properly preserve playlist content when hiding recommendations or shorts
- **Stats Tracking**: Improved counting for hidden recommendations and shorts

### Fixed
- **Sidebar Restore Bug**: Fixed issue where sidebar wouldn't reappear after turning off Video Sidebar toggle
- **collapseSidebarIfEmpty Typo**: Fixed attribute check from 'sidebar-recommendation' to 'sidebar-recommended'
- **hideAll Restore Logic**: Properly restores all hidden elements when toggle is turned off

## [1.0.75] - 2025-11-15
### Fixed
- Fixed sidebar recommendations not hiding on YouTube livestream pages
- Improved meme overlay z-index to prevent covering search suggestions and menus
- Fixed Shorts toggle cross-interference between homepage and search pages
- Enhanced livestream video renderer detection (ytd-compact-autoplay-renderer)
- Added comprehensive container hiding for all livestream recommendation types

### Changed
- Strengthened sidebar hiding logic for better livestream compatibility
- Improved page-type detection for more reliable toggle behavior

## [1.0.7] - 2025-11-05
### Added
- New playlist toggle in Video Page section for granular sidebar control
- Smart sidebar detection that preserves playlist panels

### Fixed
- Sidebar recommendations now properly hidden on all video types
- Improved detection of dynamically loaded content

## [1.0.6] - 2025-10-20
### Added
- Break timer with customizable duration
- Custom meme uploader for homepage placeholder
- Stats tracking for blocked content

### Fixed
- Various UI improvements and bug fixes
