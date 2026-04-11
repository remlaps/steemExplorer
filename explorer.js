// explorer.js
document.addEventListener('DOMContentLoaded', function() {
    // Default API endpoints
    const DEFAULT_ENDPOINTS = [
      'https://api.steemit.com',
      'https://api.moecki.online',
      'https://api.steemitdev.com'
    ];
    
    // Storage key for custom endpoints
    const STORAGE_KEY = 'steemExplorerEndpoints';
    
    // Load endpoints from storage or use defaults
    function loadEndpoints() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error loading endpoints:', e);
      }
      return [...DEFAULT_ENDPOINTS];
    }
    
    // Save endpoints to storage
    function saveEndpoints(endpoints) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
      } catch (e) {
        console.error('Error saving endpoints:', e);
      }
    }
    
    // Get current API URL
    function getCurrentApiUrl() {
      return apiEndpointSelect.value;
    }
    
    // Populate the endpoint selector
    function populateEndpointSelector(endpoints, selectedUrl) {
      apiEndpointSelect.innerHTML = '';
      endpoints.forEach(url => {
        const option = document.createElement('option');
        option.value = url;
        option.textContent = url;
        if (url === selectedUrl) {
          option.selected = true;
        }
        apiEndpointSelect.appendChild(option);
      });
    }
    
    // Load and initialize endpoints
    let endpoints = loadEndpoints();
    let currentApiUrl = endpoints[0] || 'https://api.steemit.com';
    
    // DOM elements
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');
    const searchResults = document.getElementById('searchResults');
    const blockNavigation = document.getElementById('blockNavigation');
    const prevBlockBtn = document.getElementById('prevBlock');
    const nextBlockBtn = document.getElementById('nextBlock');
    const currentBlockInfo = document.getElementById('currentBlockInfo');
    const apiEndpointSelect = document.getElementById('apiEndpoint');
    const addEndpointBtn = document.getElementById('addEndpointBtn');
    const removeEndpointBtn = document.getElementById('removeEndpointBtn');
    
    // Initialize endpoint selector
    populateEndpointSelector(endpoints, currentApiUrl);
    
    // Track current block number for navigation
    let currentBlockNumber = null;
    let fullGlobalProperties = null; // Store full properties for "Show All"
    const globalProperties = document.getElementById('globalProperties');
    const witnessSchedule = document.getElementById('witnessSchedule');
    const refreshTimer = document.getElementById('refreshTimer');
    const showAllPropsBtn = document.getElementById('showAllPropsBtn');
    
    // Fetch dynamic global properties
    async function fetchGlobalProperties() {
      const apiUrl = getCurrentApiUrl();
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_dynamic_global_properties',
            params: [],
            id: 1
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.result) {
          // Store full properties for "Show All" button
          fullGlobalProperties = data.result;
          
          // Display important properties with "Use" buttons
          const properties = data.result;
          const propsToDisplay = [
            { label: 'Head Block', value: properties.head_block_number, searchable: true },
            { label: 'Time', value: properties.time, searchable: false },
            { label: 'Current Witness', value: properties.current_witness, searchable: true },
            { label: 'Total Supply', value: properties.current_supply, searchable: false },
            { label: 'SBD Supply', value: properties.current_sbd_supply, searchable: false },
            { label: 'Last Irreversible Block', value: properties.last_irreversible_block_num, searchable: true }
          ];
          
          let html = '';
          propsToDisplay.forEach(prop => {
            const valueStr = String(prop.value);
            html += `<div class="prop-row"><span class="key">"${prop.label}"</span>: <span class="value">${escapeHTML(valueStr)}</span>`;
            if (prop.searchable) {
              html += ` <button class="use-value-btn" data-value="${escapeHTML(valueStr)}" title="Search for ${prop.label}">search</button>`;
            }
            html += `</div>`;
          });
          globalProperties.innerHTML = html;
        } else {
          globalProperties.textContent = 'Error fetching global properties';
        }
      } catch (error) {
        globalProperties.textContent = `Error: ${error.message}`;
      }
    }
    
    // Fetch witness schedule
    async function fetchWitnessSchedule() {
      const apiUrl = getCurrentApiUrl();
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_witness_schedule',
            params: [],
            id: 1
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.result) {
          // Display important properties
          const schedule = data.result;
          const displaySchedule = {
            'Current Witnesses': schedule.current_shuffled_witnesses,
            'Next Shuffle Block': schedule.next_shuffle_block_num,
            'Majority Version': schedule.majority_version
          };
          
          witnessSchedule.innerHTML = formatJSON(displaySchedule);
        } else {
          witnessSchedule.textContent = 'Error fetching witness schedule';
        }
      } catch (error) {
        witnessSchedule.textContent = `Error: ${error.message}`;
      }
    }
    
    // Show or hide block navigation arrows
    function updateBlockNavigation() {
      if (currentBlockNumber !== null) {
        blockNavigation.style.display = 'flex';
        currentBlockInfo.textContent = `Block ${currentBlockNumber}`;
      } else {
        blockNavigation.style.display = 'none';
      }
    }
    
    // Auto-detect search type based on input value
    function detectSearchType(query) {
      // If it matches @account/perm_link format, it's a post search
      if (/^@[a-zA-Z][a-zA-Z0-9.-]+\/[a-zA-Z0-9-]+(-[a-zA-Z0-9-]+)*$/.test(query) || /^@[a-zA-Z][a-zA-Z0-9.-]+\/.+$/.test(query)) {
        return 'post';
      }

      // If it's a pure number, it's likely a block number
      if (/^\d+$/.test(query)) {
        return 'block';
      }
      
      // If it's a 40-character hexadecimal string (with or without 0x prefix), it's likely a transaction ID
      // Transaction IDs on Steem are typically 40 hex characters (like SHA256 hashes)
      if (/^(0x)?[0-9a-fA-F]{40}$/.test(query)) {
        return 'transaction';
      }
      
      // Otherwise, treat it as an account name
      // Steem account names are 3-16 characters, lowercase letters, numbers, and hyphens
      return 'account';
    }
    
    // Search for block, transaction, or account
    async function performSearch(optionalBlockNum) {
      // Only use optionalBlockNum if it's a number (from block navigation)
      // Otherwise, get the value from the search input
      const query = (typeof optionalBlockNum === 'number') ? optionalBlockNum.toString() : searchInput.value.trim();
      
      if (!query) {
        searchResults.textContent = 'Please enter a search query';
        return;
      }
      
      // Auto-detect the search type
      const type = detectSearchType(query);
      
      // Reset current block number if not a block search
      if (type !== 'block') {
        currentBlockNumber = null;
        updateBlockNavigation();
      }
      
      searchResults.textContent = 'Loading...';
      const apiUrl = getCurrentApiUrl();
      
      try {
        let response, data;
        
        switch (type) {
          case 'block':
            const blockNumber = parseInt(query);
            if (isNaN(blockNumber)) {
              searchResults.textContent = 'Invalid block number';
              return;
            }
            
            // Update current block number for navigation
            currentBlockNumber = blockNumber;
            updateBlockNavigation();
            
            response = await fetch(apiUrl, {
              method: 'POST',
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_block',
                params: [blockNumber],
                id: 1
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            data = await response.json();
            if (data.result) {
              searchResults.innerHTML = formatJSON(data.result);
            } else if (data.error) {
              searchResults.textContent = `Block not found: ${data.error.message || 'Unknown error'}`;
            } else {
              searchResults.textContent = 'Block not found';
            }
            break;
            
          case 'transaction':
            response = await fetch(apiUrl, {
              method: 'POST',
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_transaction',
                params: [query],
                id: 1
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            data = await response.json();
            if (data.result) {
              searchResults.innerHTML = formatJSON(data.result);
            } else if (data.error) {
              searchResults.textContent = `Transaction not found: ${data.error.message || 'Unknown error'}`;
            } else {
              searchResults.textContent = 'Transaction not found';
            }
            break;
            
          case 'post':
            // Parse @author/permlink format
            const postMatch = query.match(/^@([^\/]+)\/(.+)$/);
            if (!postMatch) {
              searchResults.textContent = 'Invalid post format. Use @author/permlink';
              return;
            }
            const author = postMatch[1];
            const permlink = postMatch[2];
            
            response = await fetch(apiUrl, {
              method: 'POST',
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_content',
                params: [author, permlink],
                id: 1
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            data = await response.json();
            if (data.result && data.result.id) {
              // A valid post should have an id
              searchResults.innerHTML = formatJSON(data.result);
            } else if (data.error) {
              searchResults.textContent = `Post not found: ${data.error.message || 'Unknown error'}`;
            } else {
              searchResults.textContent = 'Post not found';
            }
            break;
            
          case 'account':
            response = await fetch(apiUrl, {
              method: 'POST',
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_accounts',
                params: [[query]],
                id: 1
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            data = await response.json();
            if (data.result && data.result.length > 0) {
              searchResults.innerHTML = formatJSON(data.result[0]);
            } else if (data.error) {
              searchResults.textContent = `Account not found: ${data.error.message || 'Unknown error'}`;
            } else {
              searchResults.textContent = 'Account not found';
            }
            break;
        }
      } catch (error) {
        searchResults.textContent = `Error: ${error.message}`;
      }
    }
    
    // Clear search results and navigation
    function clearSearch() {
      searchInput.value = '';
      searchResults.innerHTML = '';
      currentBlockNumber = null;
      updateBlockNavigation();
      searchInput.focus();
    }
    
    // Navigate to previous block
    function goToPreviousBlock() {
      if (currentBlockNumber !== null && currentBlockNumber > 0) {
        performSearch(currentBlockNumber - 1);
      }
    }
    
    // Navigate to next block
    function goToNextBlock() {
      if (currentBlockNumber !== null) {
        performSearch(currentBlockNumber + 1);
      }
    }
    
    // Format JSON with colorization for better display
    function formatJSON(obj) {
      return formatJSONValue(obj, 0);
    }
    
    function formatJSONValue(value, indent) {
      const indentStr = '  '.repeat(indent);
      
      if (value === null) {
        return `<span class="value-null">null</span>`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        let result = '{\n';
        const keys = Object.keys(value);
        
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          result += `${indentStr}  <span class="key">"${escapeHTML(key)}"</span>: ${formatJSONValue(value[key], indent + 1)}`;
          
          if (i < keys.length - 1) {
            result += ',';
          }
          
          result += '\n';
        }
        
        result += `${indentStr}}`;
        return result;
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          return '[]';
        }
        
        let result = '[\n';
        
        for (let i = 0; i < value.length; i++) {
          result += `${indentStr}  ${formatJSONValue(value[i], indent + 1)}`;
          
          if (i < value.length - 1) {
            result += ',';
          }
          
          result += '\n';
        }
        
        result += `${indentStr}]`;
        return result;
      } else if (typeof value === 'string') {
        return `<span class="value-string">"${escapeHTML(value)}"</span>`;
      } else if (typeof value === 'number') {
        return `<span class="value-number">${value}</span>`;
      } else if (typeof value === 'boolean') {
        return `<span class="value-boolean">${value}</span>`;
      } else {
        return String(value);
      }
    }
    
    // Escape HTML special characters
    function escapeHTML(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // Set up refresh timer
    let countdown = 3;
    
    function updateRefreshTimer() {
      refreshTimer.textContent = `(refreshing in ${countdown}s)`;
      
      if (countdown === 0) {
        countdown = 3;
        fetchGlobalProperties();
        fetchWitnessSchedule();
      } else {
        countdown--;
      }
    }
    
    // Initial fetch
    fetchGlobalProperties();
    fetchWitnessSchedule();
    
    // Set up event listeners
    searchButton.addEventListener('click', performSearch);
    clearButton.addEventListener('click', clearSearch);
    prevBlockBtn.addEventListener('click', goToPreviousBlock);
    nextBlockBtn.addEventListener('click', goToNextBlock);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    // Endpoint selector change - refresh data when endpoint changes
    apiEndpointSelect.addEventListener('change', function() {
      currentApiUrl = apiEndpointSelect.value;
      fetchGlobalProperties();
      fetchWitnessSchedule();
    });
    
    // Add custom endpoint
    addEndpointBtn.addEventListener('click', function() {
      const url = prompt('Enter custom API endpoint URL:');
      if (url && url.trim()) {
        const trimmedUrl = url.trim();
        // Validate URL format
        try {
          new URL(trimmedUrl);
          // Check if already exists
          if (endpoints.includes(trimmedUrl)) {
            alert('This endpoint already exists in the list.');
            return;
          }
          // Add to endpoints and save
          endpoints.push(trimmedUrl);
          saveEndpoints(endpoints);
          // Repopulate selector
          populateEndpointSelector(endpoints, trimmedUrl);
          currentApiUrl = trimmedUrl;
          // Refresh data
          fetchGlobalProperties();
          fetchWitnessSchedule();
        } catch (e) {
          alert('Invalid URL format. Please enter a valid URL (e.g., https://api.example.com)');
        }
      }
    });
    
    // Remove selected endpoint
    removeEndpointBtn.addEventListener('click', function() {
      const selectedUrl = apiEndpointSelect.value;
      // Check if it's a default endpoint
      if (DEFAULT_ENDPOINTS.includes(selectedUrl)) {
        alert('Default endpoints cannot be removed.');
        return;
      }
      // Remove from endpoints and save
      endpoints = endpoints.filter(url => url !== selectedUrl);
      saveEndpoints(endpoints);
      // Repopulate selector
      if (endpoints.length > 0) {
        currentApiUrl = endpoints[0];
        populateEndpointSelector(endpoints, currentApiUrl);
        // Refresh data
        fetchGlobalProperties();
        fetchWitnessSchedule();
      } else {
        // If no endpoints left, restore defaults
        endpoints = [...DEFAULT_ENDPOINTS];
        saveEndpoints(endpoints);
        currentApiUrl = endpoints[0];
        populateEndpointSelector(endpoints, currentApiUrl);
        fetchGlobalProperties();
        fetchWitnessSchedule();
      }
    });
    
    // Handle "Use" button clicks in Global Properties
    globalProperties.addEventListener('click', function(e) {
      if (e.target.classList.contains('use-value-btn')) {
        const value = e.target.getAttribute('data-value');
        if (value) {
          searchInput.value = value;
          performSearch();
        }
      }
    });
    
    // Handle "Show All" button click
    showAllPropsBtn.addEventListener('click', function() {
      if (fullGlobalProperties) {
        searchResults.innerHTML = formatJSON(fullGlobalProperties);
        // Reset block navigation since this isn't a block search
        currentBlockNumber = null;
        updateBlockNavigation();
      }
    });
    
    // Refresh data every 3 seconds
    setInterval(updateRefreshTimer, 1000);
  });
