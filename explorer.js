// explorer.js
document.addEventListener('DOMContentLoaded', function() {
    // API endpoint
    const API_URL = 'https://api.steemit.com';
    
    // DOM elements
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const globalProperties = document.getElementById('globalProperties');
    const witnessSchedule = document.getElementById('witnessSchedule');
    const refreshTimer = document.getElementById('refreshTimer');
    
    // Fetch dynamic global properties
    async function fetchGlobalProperties() {
      try {
        const response = await fetch(API_URL, {
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
          // Display important properties
          const properties = data.result;
          const displayProps = {
            'Head Block': properties.head_block_number,
            'Time': properties.time,
            'Current Witness': properties.current_witness,
            'Total Supply': properties.current_supply,
            'SBD Supply': properties.current_sbd_supply,
            'Last Irreversible Block': properties.last_irreversible_block_num
          };
          
          globalProperties.innerHTML = formatJSON(displayProps);
        } else {
          globalProperties.textContent = 'Error fetching global properties';
        }
      } catch (error) {
        globalProperties.textContent = `Error: ${error.message}`;
      }
    }
    
    // Fetch witness schedule
    async function fetchWitnessSchedule() {
      try {
        const response = await fetch(API_URL, {
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
    
    // Search for block, transaction, or account
    async function performSearch() {
      const query = searchInput.value.trim();
      const type = searchType.value;
      
      if (!query) {
        searchResults.textContent = 'Please enter a search query';
        return;
      }
      
      searchResults.textContent = 'Loading...';
      
      try {
        let response, data;
        
        switch (type) {
          case 'block':
            const blockNum = parseInt(query);
            if (isNaN(blockNum)) {
              searchResults.textContent = 'Invalid block number';
              return;
            }
            
            response = await fetch(API_URL, {
              method: 'POST',
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_block',
                params: [blockNum],
                id: 1
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            data = await response.json();
            if (data.result) {
              searchResults.innerHTML = formatJSON(data.result);
            } else {
              searchResults.textContent = 'Block not found';
            }
            break;
            
          case 'transaction':
            response = await fetch(API_URL, {
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
            } else {
              searchResults.textContent = 'Transaction not found';
            }
            break;
            
          case 'account':
            response = await fetch(API_URL, {
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
            } else {
              searchResults.textContent = 'Account not found';
            }
            break;
        }
      } catch (error) {
        searchResults.textContent = `Error: ${error.message}`;
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
          result += `${indentStr}  <span class="key">"${key}"</span>: ${formatJSONValue(value[key], indent + 1)}`;
          
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
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    // Refresh data every 3 seconds
    setInterval(updateRefreshTimer, 1000);
  });