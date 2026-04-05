# Simple Steem Block Explorer Browser Extension

A simple Chrome extension that allows you to explore the Steem blockchain directly from your browser. This extension provides real-time information about the blockchain and lets you search for specific blocks, transactions, and accounts.

## Features

- Real-time display of blockchain global properties
- Current witness schedule information
- Automatic refresh every 3 seconds
- Search functionality for:
  - Blocks by number
  - Transactions by ID
  - Accounts by name
  - Posts by `@author/permlink`
- Quick search buttons next to Global Properties values
- "Show All" button to view complete API response
- Block navigation arrows for easy browsing between consecutive blocks
- Configurable API endpoint selector with custom endpoint support
- Formatted JSON output with syntax highlighting

## Installation

### Development Installation

1. Clone this repository:

```https://github.com/remlaps/steemExplorer.git```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top-right corner

4. Click "Load unpacked" and select the extension folder

5. The extension should now appear in your browser toolbar

## Usage

1. Click the extension icon in your browser toolbar to open the Steem Block Explorer in a new tab

2. The top section displays current blockchain information that refreshes automatically every 3 seconds

3. To search for specific information:
- Enter a block number, transaction ID, account name, or post reference in the search box
- The extension will automatically detect the search type:
  - **Block**: Enter a number (e.g., `12345678`)
  - **Transaction**: Enter a 40-character hex string (e.g., `abc123...` or `0xabc123...`)
  - **Account**: Enter an account name (e.g., `username`)
  - **Post**: Enter `@author/permlink` (e.g., `@username/my-post-title`)
- Click "Search" or press Enter

4. Results will be displayed in the bottom section with formatted JSON

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes.

## Files

- **manifest.json**: Extension configuration
- **background.js**: Background script that opens the explorer window
- **explorer.html**: Main HTML interface
- **explorer.js**: JavaScript code for API queries and UI interactions
- **styles.css**: Styling for the explorer interface

## API Endpoints

The extension includes a configurable API endpoint selector with several default endpoints:
- `https://api.steemit.com`
- `https://api.moecki.online`
- `https://api.steemitdev.com`

You can also add custom endpoints using the "+" button in the API selector. Custom endpoints are saved permanently in your browser's localStorage.

The extension uses the following Steem API methods:

- `condenser_api.get_dynamic_global_properties`
- `condenser_api.get_witness_schedule`
- `condenser_api.get_block`
- `condenser_api.get_transaction`
- `condenser_api.get_accounts`
- `condenser_api.get_content` (for post searches)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the Steem blockchain community
- Uses Steem's public API endpoints