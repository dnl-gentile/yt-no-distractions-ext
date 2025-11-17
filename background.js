/*
    YouTube No Distractions - A Chrome extension that removes distractions from YouTube.

    Copyright (C) 2025  Daniel Guedes

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Set the default state on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ noDistractionsEnabled: true });
  console.log('YouTube No Distractions installed. No distractions enabled by default.');
});

// Listen for navigation events to 'youtube.com'
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    // Only act on top-level navigation, not iframes
    if (details.frameId !== 0) {
      return;
    }

    const url = new URL(details.url);
    // Check if it's the homepage (path is '/' or empty, or just /feed)
    const isHomepage = url.pathname === '/' || 
                       url.pathname === '/index.html' || 
                       url.pathname === '' ||
                       url.pathname === '/feed' ||
                       (url.pathname === '/feed/' && url.search === '');
    
    if (isHomepage) {
      chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
        if (noDistractionsEnabled) {
          // Redirect to the quiet app
          chrome.tabs.update(details.tabId, { url: 'https://yt-search-bar.web.app' });
        }
      });
    }
  },
  {
    url: [{ hostEquals: 'www.youtube.com' }]
  }
);

// Also listen for completed navigation to catch SPA navigation
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (details.frameId !== 0) {
      return;
    }

    const url = new URL(details.url);
    const isHomepage = url.pathname === '/' || 
                       url.pathname === '/index.html' || 
                       url.pathname === '' ||
                       url.pathname === '/feed' ||
                       (url.pathname === '/feed/' && url.search === '');
    
    if (isHomepage) {
      chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
        if (noDistractionsEnabled) {
          // Redirect to the quiet app
          chrome.tabs.update(details.tabId, { url: 'https://yt-search-bar.web.app' });
        }
      });
    }
  },
  {
    url: [{ hostEquals: 'www.youtube.com' }]
  }
);

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleNoDistractions') {
    // Get current state
    chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
      const newState = !noDistractionsEnabled;

      // Save the new state
      chrome.storage.sync.set({ noDistractionsEnabled: newState }, () => {
        
        // Check if we're on a video page
        chrome.tabs.get(sender.tab.id, (tab) => {
          const isVideoPage = tab.url && tab.url.includes('/watch');
          
          if (isVideoPage) {
            // If on video page, don't reload - let content script handle show/hide dynamically
            // Just notify the content script to update
            chrome.tabs.sendMessage(sender.tab.id, { action: 'updateNoDistractions', noDistractionsEnabled: newState });
          } else {
            // Otherwise navigate normally
            const targetUrl = newState ? 'https://yt-search-bar.web.app' : 'https://www.youtube.com';
            chrome.tabs.update(sender.tab.id, { url: targetUrl });
          }
        });

        // Notify other tabs to update their icons
        notifyAllTabs(newState);
      });
    });
    return true; // Indicates an async response
  }
  
  if (message.action === 'navigateToQuietMode') {
    // Handle logo click redirect
    chrome.tabs.update(sender.tab.id, { url: 'https://yt-search-bar.web.app' });
    return true;
  }
});

// Listen for state changes (e.g., from other tabs) and update all tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.noDistractionsEnabled) {
    const newState = changes.noDistractionsEnabled.newValue;
    notifyAllTabs(newState);
  }
});

function notifyAllTabs(newState) {
  chrome.tabs.query({ url: ["https://www.youtube.com/*", "https://yt-search-bar.web.app/*"] }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateIcon', noDistractionsEnabled: newState });
    }
  });
}