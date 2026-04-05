# Changelog

All notable changes to this project will be documented in this file.

## [1.3] - 2026-04-05

### Added
- Post search functionality using `@author/permlink` format
  - Search for specific posts by entering `@username/post-permlink` in the search bar
  - Uses `condenser_api.get_content` to fetch post data

## [1.2] - 2026-04-05

### Added
- API Endpoint Selector with add/remove functionality
  - Dropdown to select from available Steem API endpoints
  - Add button (+) to add custom endpoints via prompt
  - Remove button (−) to remove custom endpoints
  - Default endpoints are protected from removal
  - Custom endpoints are permanently saved in localStorage
  - Automatic data refresh when switching endpoints
- "Search" buttons next to searchable values in Global Properties
  - Quickly search for Head Block, Current Witness, or Last Irreversible Block
- "Show All" button next to Global Properties label
  - Displays the complete raw JSON data from the API response
  - Automatically hides block navigation arrows when clicked

### Fixed
- Fixed critical bug where search button was passing event object instead of input value
- Fixed escapeHTML function that was replacing characters with themselves
- Fixed copy/paste functionality by adding explicit user-select: text
- Fixed unicode character display issues by adding UTF-8 charset declaration
- Updated API endpoint list (removed defunct api.steem.house, added api.steemitdev.com)

## [1.1] - 2026-04-05

### Added
- Auto-detection of search type based on input format
  - Pure numbers are detected as block numbers
  - 40-character hexadecimal strings (with or without `0x` prefix) are detected as transaction IDs
  - All other inputs are treated as account names
- Block navigation arrows (← Previous Block / Next Block →) for easy browsing between consecutive blocks
- Clear button to reset the search panel and results

### Changed
- Extension now opens in a new browser tab instead of a popup window
- Removed manual search type dropdown - the extension automatically determines the search type

### Removed
- Search type selector dropdown from the UI
