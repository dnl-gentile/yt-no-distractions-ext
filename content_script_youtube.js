/*
    YouTube No Distractions - A Chrome extension that removes distractions from YouTube.

    Copyright (C) 2025  Daniel Gentile

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

(function() {
  let noDistractionsButton = null;
  // Icon URLs - white icons (for dark theme and video pages in light theme)
  const doNotDisturbOnIconURL = chrome.runtime.getURL('icons/quiet_mode_on.png');
  const doNotDisturbOffIconURL = chrome.runtime.getURL('icons/quiet_mode_off.png');
  // Icon URLs - black icons (for light theme on home/search pages)
  const doNotDisturbOnIconBlackURL = chrome.runtime.getURL('icons/quiet_mode_on_black.png');
  const doNotDisturbOffIconBlackURL = chrome.runtime.getURL('icons/quiet_mode_off_black.png');
  
  // Helper function to detect if YouTube is in light theme
  function isLightTheme() {
    // Check for dark attribute on html or body
    const html = document.documentElement;
    const body = document.body;
    
    // YouTube uses 'dark' attribute or class
    const hasDarkAttribute = html.hasAttribute('dark') || body.hasAttribute('dark');
    const hasDarkClass = html.classList.contains('dark') || body.classList.contains('dark');
    
    // Also check computed style for background color
    const bgColor = window.getComputedStyle(body).backgroundColor;
    const isDarkBg = bgColor && (
      bgColor.includes('rgb(15, 15, 15)') || 
      bgColor.includes('rgb(0, 0, 0)') ||
      bgColor.includes('rgb(18, 18, 18)')
    );
    
    // If dark attribute/class exists or background is dark, it's dark theme
    return !(hasDarkAttribute || hasDarkClass || isDarkBg);
  }
  
  // Helper function to check if we're on a video page
  function isVideoPage() {
    return window.location.pathname.startsWith('/watch');
  }
  
  // Get appropriate icon URL based on theme and page type
  function getIconURL(isEnabled) {
    const lightTheme = isLightTheme();
    const onVideoPage = isVideoPage();
    
    // Light theme: black icons on home/search, white icons on video pages
    // Dark theme: white icons everywhere
    // Note: White icons are reversed in naming (off shows ON, on shows OFF)
    // But black icons are NOT reversed - they match the state correctly
    if (lightTheme && !onVideoPage) {
      // Light theme on home/search - use black icons
      // Black icons: on_black shows ON state, off_black shows OFF state (not reversed)
      return isEnabled ? doNotDisturbOnIconBlackURL : doNotDisturbOffIconBlackURL;
    } else {
      // Dark theme everywhere OR light theme on video pages - use white icons
      // White icons are reversed: off shows ON, on shows OFF
      return isEnabled ? doNotDisturbOffIconURL : doNotDisturbOnIconURL;
    }
  }

  function createToggleButton() {
    // Create the button element
    const button = document.createElement('button');
    button.id = 'quiet-mode-toggle-button';
    button.className = 'yt-quiet-mode-button'; // For CSS styling
    button.type = 'button'; // Prevent form submission
    
    // Create the icon image
    const icon = document.createElement('img');
    icon.id = 'quiet-mode-toggle-icon';
    icon.width = 24;
    icon.height = 24;
    icon.alt = ''; // Decorative icon, no alt text needed
    button.appendChild(icon);

    // Create custom tooltip (YouTube-style, not browser default)
    const tooltip = document.createElement('div');
    tooltip.className = 'yt-quiet-mode-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    // Initial text - will be updated based on state (reversed to match icon visual state)
    chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
      const enabled = noDistractionsEnabled ?? true;
      tooltip.textContent = enabled ? 'No Distractions - Off' : 'No Distractions - On';
    });
    button.appendChild(tooltip);

    // Add click listener
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'toggleNoDistractions' });
    });

    // Add hover listeners for custom tooltip and ensure circular background shows
    let hoverTimeout;
    button.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      // Force show circular background (fallback if CSS doesn't work)
      // Check theme and page type - video pages have dark navbar even in light theme
      const isLight = isLightTheme();
      const onVideoPage = isVideoPage();
      
      // On video pages, navbar is dark even in light theme, so use light hover circle
      // On home/search pages in light theme, use dark hover circle
      // On dark theme everywhere, use light hover circle
      if (onVideoPage || !isLight) {
        // Lighter circle on dark navbar/mode to match YouTube's
        button.style.setProperty('background-color', 'rgba(255, 255, 255, 0.18)', 'important');
      } else {
        // Darker circle on light theme home/search pages
        button.style.setProperty('background-color', 'rgba(0, 0, 0, 0.1)', 'important');
      }
      hoverTimeout = setTimeout(() => {
        tooltip.classList.add('visible');
      }, 200); // Show after 200ms (faster than default browser tooltip)
    });
    
    button.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      // Remove inline style to let CSS handle it
      button.style.removeProperty('background-color');
      tooltip.classList.remove('visible');
    });

    // Add aria-label for accessibility (but don't use title to prevent default tooltip)
    button.setAttribute('aria-label', 'Toggle No Distractions Mode');
    
    return button;
  }

  function updateIcon(noDistractionsEnabled) {
    if (!noDistractionsButton) return;

    const icon = noDistractionsButton.querySelector('#quiet-mode-toggle-icon');
    const tooltip = noDistractionsButton.querySelector('.yt-quiet-mode-tooltip');
    
    // Get appropriate icon based on theme and page type
    icon.src = getIconURL(noDistractionsEnabled);
    
    // Update custom tooltip text - show state (reversed to match icon visual state)
    if (tooltip) {
      tooltip.textContent = noDistractionsEnabled ? 'No Distractions - Off' : 'No Distractions - On';
    }
    
    if (noDistractionsEnabled) {
      // Update aria-label for accessibility (full description)
      noDistractionsButton.setAttribute('aria-label', 'No Distractions Mode: ON - Click to disable');
      noDistractionsButton.setAttribute('aria-pressed', 'true');
    } else {
      // Update aria-label for accessibility (full description)
      noDistractionsButton.setAttribute('aria-label', 'No Distractions Mode: OFF - Click to enable');
      noDistractionsButton.setAttribute('aria-pressed', 'false');
    }
  }

  function addToggleButtonToNavbar() {
    const navbarButtons = document.querySelector('ytd-masthead #end #buttons');
    if (navbarButtons && !document.getElementById('quiet-mode-toggle-button')) {
      // Create the button
      noDistractionsButton = createToggleButton();
      
      // Insert it AFTER the notification button (to the right of the alarm icon)
      const notificationButton = navbarButtons.querySelector('ytd-notification-topbar-button-renderer');
      if (notificationButton) {
        // Insert right after the notification button
        if (notificationButton.nextSibling) {
          navbarButtons.insertBefore(noDistractionsButton, notificationButton.nextSibling);
        } else {
          // If notification is the last child, append after it
          navbarButtons.appendChild(noDistractionsButton);
        }
      } else {
        // Fallback: just add it to the end
        navbarButtons.appendChild(noDistractionsButton);
      }

      // Set its initial state
      chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
        updateIcon(noDistractionsEnabled);
      });
      
      // Watch for theme changes and update icon accordingly
      const themeObserver = new MutationObserver(() => {
        if (noDistractionsButton) {
          chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
            updateIcon(noDistractionsEnabled);
          });
        }
      });
      
      // Observe html and body for theme changes
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['dark', 'class']
      });
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['dark', 'class']
      });
    }
  }

  // Cache no distractions state for synchronous access
  // Start as null until storage loads to avoid hiding anything prematurely
  let cachedNoDistractionsEnabled = null;
  
  // Track if we're currently processing a restore to prevent loops
  let isRestoring = false;
  let restoreTimeout = null;
  let hasRestoredAfterToggle = false; // Track if we've already restored after toggling off
  let lastRestoreTime = 0; // Track when we last restored to prevent rapid restores
  
  // Update cache when state changes
  chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
    // Default to true only after we know storage didn't have a value
    cachedNoDistractionsEnabled = (noDistractionsEnabled === undefined || noDistractionsEnabled === null)
      ? true
      : noDistractionsEnabled;

    // Apply the correct behavior once the real state is known
    setupVideoPageObserver();
    setupRestoreObserverWhenDisabled();
    if (!cachedNoDistractionsEnabled && isVideoPage()) {
      scheduleRestoreAfterDisable();
    }
  });
  
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.noDistractionsEnabled) {
      cachedNoDistractionsEnabled = changes.noDistractionsEnabled.newValue;
    }
  });

  // Setup video page observer - can be enabled/disabled based on mode
  let videoPageObserver = null;
  let restoreObserver = null;
  
  function setupVideoPageObserver() {
    // Disconnect existing observer if any
    if (videoPageObserver) {
      videoPageObserver.disconnect();
      videoPageObserver = null;
    }
    
    // Only create observer when mode is ENABLED
    if (cachedNoDistractionsEnabled) {
      videoPageObserver = new MutationObserver((mutations) => {
        // ONLY act when no distractions is ENABLED
        if (isVideoPage() && cachedNoDistractionsEnabled) {
          // Debounce to avoid too many calls
          clearTimeout(videoPageObserver.timeout);
          videoPageObserver.timeout = setTimeout(() => {
            // Only remove if no distractions is enabled
            removeComments();
            removeSuggestions();
            removeEndScreenRecommendations();
            checkAndApplyNoDistractions();
          }, 500); // Increased debounce to reduce erratic behavior
        }
      });
      
      videoPageObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  function setupRestoreObserverWhenDisabled() {
    // Disconnect existing observer
    if (restoreObserver) {
      restoreObserver.disconnect();
      restoreObserver = null;
    }

    // Only listen when mode is DISABLED on a video page
    if (!cachedNoDistractionsEnabled && isVideoPage()) {
      let restoreTimeoutId = null;
      let lastRestoreTime = 0;
      const MIN_RESTORE_INTERVAL = 500; // Minimum time between restores (ms)
      
      restoreObserver = new MutationObserver(() => {
        // Skip if we just restored recently to avoid interfering with YouTube's loading
        const now = Date.now();
        if (now - lastRestoreTime < MIN_RESTORE_INTERVAL) {
          return;
        }
        
        // Debounce to avoid thrashing while YouTube streams in nodes
        clearTimeout(restoreTimeoutId);
        restoreTimeoutId = setTimeout(() => {
          if (!cachedNoDistractionsEnabled && isVideoPage()) {
            // Only restore if video is not currently loading
            const video = document.querySelector('video');
            const isVideoLoading = video && (video.readyState < 3 || video.networkState === 2);
            
            // Don't restore while video is loading to avoid interfering with loading elements
            if (!isVideoLoading) {
              restoreSuggestions();
              restoreEndScreenRecommendations();
              restoreAllHiddenElements();
              lastRestoreTime = Date.now();
            }
          }
        }, 300); // Increased debounce to reduce interference
      });

      restoreObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Intercept YouTube logo clicks to redirect when no distractions is enabled
  // Use multiple interception methods for maximum reliability
  let logoClickInterceptorAdded = false;
  function interceptLogoClick() {
    if (logoClickInterceptorAdded) return;
    
    // Method 1: Intercept at document level with capture phase
    document.addEventListener('click', function(e) {
      if (!cachedNoDistractionsEnabled) return;
      
      // Check if click is on logo by traversing up the DOM tree
      let element = e.target;
      let isLogoClick = false;
      
      // Check up to 10 levels up
      for (let i = 0; i < 10 && element; i++) {
        // Check various logo identifiers
        if (element.id === 'logo' || 
            element.id === 'logo-container' ||
            element.classList.contains('logo') ||
            element.tagName === 'YTD-TOPBAR-LOGO-RENDERER' ||
            (element.tagName === 'A' && element.closest('ytd-topbar-logo-renderer')) ||
            element.closest('ytd-topbar-logo-renderer')) {
          isLogoClick = true;
          break;
        }
        element = element.parentElement;
      }
      
      if (isLogoClick) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Immediately redirect
        window.location.replace('https://yt-search-bar.web.app');
        return false;
      }
    }, true); // Capture phase - runs first
    
    // Method 2: Monitor for logo element creation and attach handlers
    const logoObserver = new MutationObserver(() => {
      const logoElement = document.querySelector('ytd-topbar-logo-renderer, a#logo');
      if (logoElement) {
        // Add handler without cloning (less disruptive)
        logoElement.addEventListener('click', function(e) {
          if (cachedNoDistractionsEnabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.location.replace('https://yt-search-bar.web.app');
            return false;
          }
        }, true);
      }
    });
    
    logoObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    logoClickInterceptorAdded = true;
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateIcon') {
      updateIcon(message.noDistractionsEnabled);
    }
    if (message.action === 'updateNoDistractions') {
      // Update cached state
      cachedNoDistractionsEnabled = message.noDistractionsEnabled;
      // Update icon
      updateIcon(message.noDistractionsEnabled);
      
      // Setup or teardown observer based on mode
      setupVideoPageObserver();
      setupRestoreObserverWhenDisabled();
      
      // Apply or remove no distractions features
      if (isVideoPage()) {
        // Reset restore flag when toggling
        isRestoring = false;
        hasRestoredAfterToggle = false;
        lastRestoreTime = 0;
        clearTimeout(restoreTimeout);
        
        // Mark that this is NOT initial page load (it's a toggle)
        isInitialPageLoad = false;
        
        if (message.noDistractionsEnabled) {
          applyNoDistractionsToVideoPage();
        } else {
          scheduleRestoreAfterDisable();
        }
      }
      // Update navbar
      applyNoDistractionsToNavbar();
    }
  });

  // YouTube dynamically loads its UI, so we need to check periodically
  const interval = setInterval(() => {
    if (document.querySelector('ytd-masthead #end #buttons')) {
      addToggleButtonToNavbar();
      interceptLogoClick();
      applyNoDistractionsToNavbar(); // Apply navbar changes
      // Once added, we can stop checking, but we'll keep it running
      // in case of single-page-app navigation destroying and recreating it.
      // A MutationObserver would be better, but this is simpler and effective.
    }
  }, 1000);
  
  // Also use MutationObserver to catch Create button when it loads
  const navbarObserver = new MutationObserver(() => {
    if (cachedNoDistractionsEnabled) {
      applyNoDistractionsToNavbar();
    }
  });
  
  // Observe the navbar container for changes
  const navbarContainer = document.querySelector('ytd-masthead #end #buttons');
  if (navbarContainer) {
    navbarObserver.observe(navbarContainer, {
      childList: true,
      subtree: true
    });
  }
  
  // Also observe the entire masthead in case buttons are added elsewhere
  const masthead = document.querySelector('ytd-masthead');
  if (masthead) {
    navbarObserver.observe(masthead, {
      childList: true,
      subtree: true
    });
  }

  // Also use MutationObserver for logo clicks (more reliable)
  const observer = new MutationObserver(() => {
    interceptLogoClick();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Intercept history API changes (YouTube SPA navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    checkAndRedirect();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    checkAndRedirect();
  };
  
  // Also listen to popstate
  window.addEventListener('popstate', checkAndRedirect);
  
  function checkAndRedirect() {
    if (!cachedNoDistractionsEnabled) return;
    
    const path = window.location.pathname;
    const isHomepage = path === '/' || path === '/feed' || (path === '/feed/' && !window.location.search);
    
    if (isHomepage && window.location.hostname === 'www.youtube.com') {
      window.location.replace('https://yt-search-bar.web.app');
    }
  }

  // ===== NO DISTRACTIONS VIDEO PAGE FEATURES =====

  function applyNoDistractionsToVideoPage() {
    if (!cachedNoDistractionsEnabled || !isVideoPage()) {
      return;
    }

    // Enable theater mode
    enableTheaterMode();
    
    // Remove suggestions sidebar completely
    removeSuggestions();
    
    // Remove comments completely
    removeComments();
    
    // Hide action buttons (share, download, etc.)
    hideActionButtons();
    
    // Remove end screen recommendations
    removeEndScreenRecommendations();
  }
  
  function applyNoDistractionsToNavbar() {
    if (!cachedNoDistractionsEnabled) {
      restoreNavbarButtons();
      return;
    }
    
    // Remove Create button - try multiple selectors including the exact structure
    const createButton = document.querySelector(
      'ytd-button-renderer button[aria-label="Create"], ' +
      'ytd-button-renderer button[aria-label*="Create"], ' +
      'ytd-button-renderer button[aria-label*="create"], ' +
      'ytd-button-renderer[aria-label*="Create"], ' +
      'ytd-topbar-menu-button-renderer[aria-label*="Create"], ' +
      'ytd-topbar-menu-button-renderer[aria-label*="create"], ' +
      '#create-icon, ' +
      'ytd-topbar-menu-button-renderer button[aria-label*="Create"], ' +
      'ytd-topbar-menu-button-renderer button[aria-label*="create"], ' +
      'a[aria-label*="Create"], ' +
      'a[aria-label*="create"]'
    );
    
    if (createButton) {
      // Hide the button-renderer element (parent container)
      const buttonRenderer = createButton.closest('ytd-button-renderer') || createButton;
      buttonRenderer.style.display = 'none';
      buttonRenderer.dataset.noDistractionsHidden = 'true';
    } else {
      // Try finding by text content or icon - search for ytd-button-renderer with Create text
      const allButtonRenderers = document.querySelectorAll('ytd-button-renderer, ytd-topbar-menu-button-renderer, a[href*="/create"]');
      allButtonRenderers.forEach(btn => {
        const ariaLabel = btn.getAttribute('aria-label') || '';
        const buttonAriaLabel = btn.querySelector('button')?.getAttribute('aria-label') || '';
        const text = btn.textContent || '';
        const href = btn.getAttribute('href') || '';
        if (ariaLabel.toLowerCase().includes('create') || 
            buttonAriaLabel.toLowerCase().includes('create') ||
            text.toLowerCase().includes('create') ||
            href.includes('/create')) {
          btn.style.display = 'none';
          btn.dataset.noDistractionsHidden = 'true';
        }
      });
    }
    
    // Remove notification button
    const notificationButton = document.querySelector('ytd-notification-topbar-button-renderer, #notification-button, button[aria-label*="Notifications"], button[aria-label*="notifications"]');
    if (notificationButton) {
      notificationButton.style.display = 'none';
      notificationButton.dataset.noDistractionsHidden = 'true';
    }
  }
  
  function restoreNavbarButtons() {
    const navbar = document.querySelector('ytd-masthead #end #buttons') || document.querySelector('ytd-masthead');
    if (!navbar) return;
    
    const hiddenButtons = navbar.querySelectorAll('[data-no-distractions-hidden="true"]');
    hiddenButtons.forEach(btn => {
      btn.style.display = '';
      btn.removeAttribute('data-no-distractions-hidden');
    });
  }
  
  // Enable theater mode
  function enableTheaterMode() {
    // Check if already in theater mode
    const isTheaterMode = document.querySelector('.watch-stage-mode, [theater], .watch-wide-mode') || 
                         document.body.classList.contains('watch-stage-mode') ||
                         document.body.classList.contains('watch-wide-mode');
    
    if (isTheaterMode) return;
    
    // Find theater mode button - try multiple selectors
    const theaterButton = document.querySelector(
      'button[aria-label*="Theater"], ' +
      'button[title*="Theater"], ' +
      'ytd-size-toggle-renderer button, ' +
      '.ytp-size-button, ' +
      'button[aria-label*="theater mode"], ' +
      '.ytp-size-button:not(.ytp-size-button-small)'
    );
    
    if (theaterButton) {
      // Check if it's the theater mode button (not fullscreen)
      const ariaLabel = theaterButton.getAttribute('aria-label') || '';
      if (ariaLabel.toLowerCase().includes('theater') || 
          !ariaLabel.toLowerCase().includes('fullscreen')) {
        theaterButton.click();
      }
    } else {
      // Try to find and click programmatically
      setTimeout(() => {
        const sizeToggle = document.querySelector('ytd-size-toggle-renderer');
        if (sizeToggle) {
          const buttons = sizeToggle.querySelectorAll('button');
          // Usually the first button is theater mode
          if (buttons.length > 0 && buttons[0]) {
            buttons[0].click();
          }
        }
      }, 500);
    }
  }

  function applySecondaryHiddenStyles(element) {
    if (!element || element.dataset.noDistractionsSecondaryCollapse === 'true') return;
    
    element.dataset.noDistractionsHidden = 'true';
    element.dataset.noDistractionsSecondaryCollapse = 'true';
    
    element.style.setProperty('flex', '0 0 0', 'important');
    element.style.setProperty('width', '0px', 'important');
    element.style.setProperty('min-width', '0px', 'important');
    element.style.setProperty('max-width', '0px', 'important');
    element.style.setProperty('margin', '0', 'important');
    element.style.setProperty('padding', '0', 'important');
    element.style.setProperty('opacity', '0', 'important');
    element.style.setProperty('pointer-events', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('position', 'relative', 'important');
  }

  function clearSecondaryHiddenStyles(element) {
    if (!element || element.dataset.noDistractionsSecondaryCollapse !== 'true') return;
    
    element.style.removeProperty('flex');
    element.style.removeProperty('width');
    element.style.removeProperty('min-width');
    element.style.removeProperty('max-width');
    element.style.removeProperty('margin');
    element.style.removeProperty('padding');
    element.style.removeProperty('opacity');
    element.style.removeProperty('pointer-events');
    element.style.removeProperty('visibility');
    element.style.removeProperty('display');
    element.style.removeProperty('position');
    
    element.removeAttribute('data-no-distractions-hidden');
    delete element.dataset.noDistractionsSecondaryCollapse;
  }

  function expandPrimaryColumn() {
    const primary = document.querySelector('ytd-watch-flexy #primary');
    if (!primary) return;
    primary.dataset.noDistractionsPrimaryExpanded = 'true';
    primary.style.setProperty('flex', '1 1 100%', 'important');
    primary.style.setProperty('max-width', '100%', 'important');
  }

  function restorePrimaryColumn() {
    const primaries = document.querySelectorAll('ytd-watch-flexy #primary[data-no-distractions-primary-expanded="true"]');
    primaries.forEach(primary => {
      primary.style.removeProperty('flex');
      primary.style.removeProperty('max-width');
      primary.removeAttribute('data-no-distractions-primary-expanded');
    });
  }

  // Remove suggestions sidebar completely (collapse but keep DOM alive)
  function removeSuggestions() {
    // ONLY hide if mode is enabled
    if (!cachedNoDistractionsEnabled) return;
    
    const selectors = [
      '#secondary',
      'ytd-watch-flexy #secondary',
      'ytd-watch-flexy[role="main"] #secondary',
      '#columns #secondary',
      'ytd-watch-flexy ytd-watch-next-secondary-results-renderer',
      'ytd-watch-next-secondary-results-renderer'
    ];
    
    let collapsedAny = false;
    selectors.forEach(selector => {
      const secondary = document.querySelector(selector);
      if (secondary) {
        applySecondaryHiddenStyles(secondary);
        collapsedAny = true;
      }
    });
    
    if (collapsedAny) {
      expandPrimaryColumn();
    }
  }

  function restoreSuggestions() {
    const selectors = [
      '#secondary',
      'ytd-watch-flexy #secondary',
      'ytd-watch-flexy[role="main"] #secondary',
      '#columns #secondary',
      'ytd-watch-flexy ytd-watch-next-secondary-results-renderer',
      'ytd-watch-next-secondary-results-renderer',
      '#secondary-inner',
      '#related',
      'ytd-watch-flexy #related'
    ];
    
    selectors.forEach(selector => {
      const matches = document.querySelectorAll(selector);
      matches.forEach(secondary => {
        const computedStyle = window.getComputedStyle(secondary);
        const isHidden = secondary.dataset.noDistractionsHidden === 'true' || 
                        secondary.dataset.noDistractionsSecondaryCollapse === 'true' ||
                        secondary.style.display === 'none' ||
                        computedStyle.display === 'none' ||
                        secondary.getAttribute('hidden') === 'true';
        
        if (isHidden) {
          if (secondary.hasAttribute('hidden')) {
            secondary.removeAttribute('hidden');
          }
          
          // Remove collapse styles so layout can expand immediately
          clearSecondaryHiddenStyles(secondary);
          
          secondary.style.display = '';
          secondary.style.visibility = '';
          secondary.removeAttribute('data-no-distractions-hidden');
          secondary.removeAttribute('data-original-display');
          secondary.removeAttribute('data-original-visibility');
          
          // Fallback: if still collapsed, force a sensible default
          if (secondary.getBoundingClientRect().width < 10) {
            secondary.style.display = 'block';
            secondary.style.visibility = 'visible';
          }
        }
      });
    });
    
    restorePrimaryColumn();
    window.dispatchEvent(new Event('resize'));
  }

  // Remove comments completely - be more specific to avoid hiding other elements
  function removeComments() {
    // ONLY hide if mode is enabled
    if (!cachedNoDistractionsEnabled) return;
    
    // Only target specific comment-related selectors, not generic item-section-renderer
    const selectors = [
      '#comments',
      'ytd-comments#comments',
      'ytd-watch-flexy #comments',
      '#primary #comments',
      'ytd-comments',
      'ytd-comments-header-renderer',
      '[id="comments"]',
      'ytd-watch-flexy ytd-item-section-renderer[target-id="watch-discussion"]',
      // Only item-section-renderer that contains comments
      'ytd-item-section-renderer:has(#comments)',
      'ytd-item-section-renderer:has(ytd-comments)'
    ];
    
    selectors.forEach(selector => {
      try {
        const comments = document.querySelector(selector);
        if (comments) {
          // Double-check it's actually comments (has comment-related content)
          const hasCommentContent = comments.id === 'comments' ||
                                    comments.tagName === 'YTD-COMMENTS' ||
                                    comments.querySelector('ytd-comments') ||
                                    comments.querySelector('#comments') ||
                                    comments.getAttribute('target-id') === 'watch-discussion';
          
          if (hasCommentContent) {
            // Store original state if not already stored
            if (!comments.dataset.originalDisplay) {
              const computedStyle = window.getComputedStyle(comments);
              comments.dataset.originalDisplay = computedStyle.display;
              comments.dataset.originalVisibility = computedStyle.visibility;
            }
            
            // Hide completely
            comments.style.display = 'none';
            comments.style.visibility = 'hidden';
            comments.dataset.noDistractionsHidden = 'true';
          }
        }
      } catch (e) {
        // Selector might not be supported (e.g., :has())
        // Continue with other selectors
      }
    });
  }

  function restoreComments() {
    // Restore comments - no throttling needed, just restore if hidden
    const selectors = [
      '#comments',
      'ytd-comments#comments',
      'ytd-watch-flexy #comments',
      '#primary #comments',
      'ytd-comments',
      'ytd-comments-header-renderer',
      '[id="comments"]',
      'ytd-watch-flexy ytd-item-section-renderer[target-id="watch-discussion"]'
    ];
    
    selectors.forEach(selector => {
      try {
        const comments = document.querySelectorAll(selector);
        comments.forEach(comment => {
          // Restore if hidden by our extension OR if display is none/visibility is hidden
          const isHidden = comment.dataset.noDistractionsHidden === 'true' ||
                          comment.style.display === 'none' ||
                          comment.style.visibility === 'hidden';
          
          if (isHidden) {
            // Restore display
            if (comment.dataset.originalDisplay) {
              comment.style.display = comment.dataset.originalDisplay;
            } else {
              comment.style.display = '';
            }
            // Restore visibility
            if (comment.dataset.originalVisibility !== undefined) {
              comment.style.visibility = comment.dataset.originalVisibility;
            } else {
              comment.style.visibility = '';
            }
            // Remove all data attributes
            comment.removeAttribute('data-no-distractions-hidden');
            comment.removeAttribute('data-original-display');
            comment.removeAttribute('data-original-visibility');
          }
        });
      } catch (e) {
        // Continue with other selectors
      }
    });
    
    // Also restore all hidden elements that might be comments
    const hiddenElements = document.querySelectorAll('[data-no-distractions-hidden="true"]');
    hiddenElements.forEach(element => {
      // Check if it's a comment element
      const isComment = element.id === 'comments' ||
                       element.tagName === 'YTD-COMMENTS' ||
                       element.tagName === 'YTD-COMMENTS-HEADER-RENDERER' ||
                       element.querySelector('ytd-comments') ||
                       element.querySelector('#comments') ||
                       element.getAttribute('target-id') === 'watch-discussion' ||
                       element.classList.contains('ytd-comments') ||
                       element.getAttribute('id') === 'comments';
      
      if (isComment) {
        // Restore display
        if (element.dataset.originalDisplay) {
          element.style.display = element.dataset.originalDisplay;
        } else {
          element.style.display = '';
        }
        // Restore visibility
        if (element.dataset.originalVisibility !== undefined) {
          element.style.visibility = element.dataset.originalVisibility;
        } else {
          element.style.visibility = '';
        }
        // Remove all data attributes
        element.removeAttribute('data-no-distractions-hidden');
        element.removeAttribute('data-original-display');
        element.removeAttribute('data-original-visibility');
      }
    });
  }

  // Remove end screen recommendations and related videos
  function removeEndScreenRecommendations() {
    // ONLY hide if mode is enabled
    if (!cachedNoDistractionsEnabled) return;
    
    // Selectors for end screen overlays and in-player suggestions (not the sidebar)
    const selectors = [
      // Modern end screen grid (the one you showed me)
      '.ytp-fullscreen-grid-stills-container',
      '.ytp-modern-videowall-still',
      '.ytp-suggestion-set',
      // End screen overlays
      'ytd-endscreen-renderer',
      'ytd-endscreen-content-renderer',
      '.ytp-endscreen-content',
      '.ytp-endscreen',
      // Autoplay overlays that appear over the player
      '.ytp-autonav-endscreen-countdown-overlay',
      '.ytp-autonav-endscreen-upnext-tooltip',
      '.ytp-autonav-endscreen-button-container',
      '.ytp-autonav-endscreen'
    ];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Store original state if not already stored
          if (!element.dataset.originalDisplay) {
            const computedStyle = window.getComputedStyle(element);
            element.dataset.originalDisplay = computedStyle.display;
            element.dataset.originalVisibility = computedStyle.visibility;
          }
          
          // Hide completely
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.dataset.noDistractionsHidden = 'true';
        });
      } catch (e) {
        // Continue with other selectors
      }
    });
  }

  function restoreEndScreenRecommendations() {
    // Selectors for end screen overlays and in-player suggestions
    const selectors = [
      // Modern end screen grid
      '.ytp-fullscreen-grid-stills-container',
      '.ytp-modern-videowall-still',
      '.ytp-suggestion-set',
      'ytd-endscreen-renderer',
      'ytd-endscreen-content-renderer',
      '.ytp-endscreen-content',
      '.ytp-endscreen',
      '.ytp-autonav-endscreen-countdown-overlay',
      '.ytp-autonav-endscreen-upnext-tooltip',
      '.ytp-autonav-endscreen-button-container',
      '.ytp-autonav-endscreen'
    ];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.dataset.noDistractionsHidden === 'true') {
            // Restore display
            if (element.dataset.originalDisplay) {
              element.style.display = element.dataset.originalDisplay;
            } else {
              element.style.display = '';
            }
            // Restore visibility
            if (element.dataset.originalVisibility !== undefined) {
              element.style.visibility = element.dataset.originalVisibility;
            } else {
              element.style.visibility = '';
            }
            // Remove all data attributes
            element.removeAttribute('data-no-distractions-hidden');
            element.removeAttribute('data-original-display');
            element.removeAttribute('data-original-visibility');
          }
        });
      } catch (e) {
        // Continue with other selectors
      }
    });
  }

  // Hide action buttons (share, download, etc.) - keep only like
  function hideActionButtons() {
    // ONLY hide if mode is enabled
    if (!cachedNoDistractionsEnabled) return;
    
    // Find the buttons container
    const buttonsContainer = document.querySelector('#top-level-buttons-computed, ytd-menu-renderer, #actions, #menu-container') ||
                             document.querySelector('ytd-watch-metadata #top-level-buttons-computed');
    
    if (!buttonsContainer) return;
    
    // Check if already processed
    if (buttonsContainer.dataset.noDistractionsProcessed) return;
    buttonsContainer.dataset.noDistractionsProcessed = 'true';
    
    // Find like button (keep it visible)
    const likeButton = buttonsContainer.querySelector('ytd-toggle-button-renderer:first-child, button:first-child, #like-button, ytd-like-button-renderer');
    
    // Find buttons to hide: dislike, share, download
    const buttonsToHide = Array.from(buttonsContainer.children).filter(child => {
      if (child === likeButton) return false;
      
      // Check for specific buttons by aria-label or text content
      const ariaLabel = child.getAttribute('aria-label') || '';
      const textContent = child.textContent || '';
      
      return ariaLabel.includes('Dislike') ||
             ariaLabel.includes('Share') ||
             ariaLabel.includes('Download') ||
             ariaLabel.includes('Save') ||
             textContent.includes('Share') ||
             textContent.includes('Download') ||
             child.tagName === 'YTD-DISLIKE-BUTTON-RENDERER';
    });
    
    // Hide the buttons
    buttonsToHide.forEach(btn => {
      // Store original state if not already stored
      if (!btn.dataset.originalDisplay) {
        btn.dataset.originalDisplay = window.getComputedStyle(btn).display;
      }
      
      btn.style.display = 'none';
      btn.dataset.noDistractionsHidden = 'true';
    });
  }

  function showActionButtons() {
    // Find all containers that might have hidden buttons
    const containers = document.querySelectorAll('#top-level-buttons-computed, ytd-menu-renderer, #actions, #menu-container, ytd-watch-metadata #top-level-buttons-computed');
    
    containers.forEach(container => {
      // Restore buttons hidden by no distractions
      // Check all buttons, not just those with the attribute (in case YouTube replaced elements)
      const allButtons = Array.from(container.children);
      allButtons.forEach(btn => {
        const isHidden = btn.dataset.noDistractionsHidden === 'true' || 
                        btn.style.display === 'none' ||
                        window.getComputedStyle(btn).display === 'none';
        
        if (isHidden) {
          // Restore original display state
          if (btn.dataset.originalDisplay) {
            btn.style.display = btn.dataset.originalDisplay;
          } else {
            btn.style.display = '';
          }
          btn.removeAttribute('data-no-distractions-hidden');
          btn.removeAttribute('data-original-display');
        }
      });
      
      // Remove processed flag
      if (container.dataset.noDistractionsProcessed) {
        delete container.dataset.noDistractionsProcessed;
      }
    });
    
    const menuBtn = document.querySelector('.yt-quiet-mode-actions-menu-btn, .yt-quiet-mode-fallback-menu');
    const menuContainer = document.querySelector('.yt-quiet-mode-actions-menu');
    
    if (menuBtn) menuBtn.remove();
    if (menuContainer) menuContainer.remove();
  }

  // Helper function to check if an element is a loading element that shouldn't be restored
  function isLoadingElement(element) {
    if (!element) return false;
    
    // Check for common YouTube loading element classes and attributes
    const classList = element.classList || [];
    const className = element.className || '';
    const id = element.id || '';
    const tagName = element.tagName || '';
    
    // YouTube loading/skeleton elements
    const loadingPatterns = [
      'loading', 'skeleton', 'spinner', 'placeholder', 'shimmer',
      'ytp-big-mode', 'ytp-loading', 'ytp-spinner', 'ytp-cued-thumbnail',
      'skeleton-text', 'skeleton-image', 'skeleton-button'
    ];
    
    // Check class names
    for (const pattern of loadingPatterns) {
      if (className.toLowerCase().includes(pattern) || id.toLowerCase().includes(pattern)) {
        return true;
      }
    }
    
    // Check for player loading overlays (these should never be restored)
    if (className.includes('ytp-') && (
      className.includes('loading') || 
      className.includes('buffering') ||
      className.includes('spinner') ||
      id.includes('loading') ||
      id.includes('buffering')
    )) {
      return true;
    }
    
    // Check for loading-related data attributes
    if (element.hasAttribute('loading') || 
        element.hasAttribute('aria-busy') ||
        element.getAttribute('data-loading') === 'true') {
      return true;
    }
    
    // Check if it's inside a loading container
    const loadingContainer = element.closest('[class*="loading"], [class*="skeleton"], [class*="spinner"], [id*="loading"]');
    if (loadingContainer) {
      return true;
    }
    
    // Check if it's inside the player and looks like a loading element
    const player = element.closest('#movie_player, .html5-video-player, ytd-player');
    if (player && (className.includes('ytp-') || id.includes('ytp-'))) {
      // Be more careful with player elements - only exclude obvious loading elements
      if (className.includes('loading') || className.includes('buffering') || 
          className.includes('spinner') || id.includes('loading') || id.includes('buffering')) {
        return true;
      }
    }
    
    return false;
  }

  // Generic fallback: unhide anything we tagged as hidden by the extension
  function restoreAllHiddenElements() {
    // ONLY restore when mode is OFF - don't interfere when mode is ON
    if (cachedNoDistractionsEnabled) return;
    
    const hiddenElements = document.querySelectorAll('[data-no-distractions-hidden="true"]');
    hiddenElements.forEach(element => {
      // Skip loading elements - don't restore them as they're YouTube's own loading UI
      if (isLoadingElement(element)) {
        return;
      }
      
      clearSecondaryHiddenStyles(element);
      if (element.hasAttribute('hidden')) {
        element.removeAttribute('hidden');
      }

      if (element.dataset.originalDisplay) {
        const displayValue = element.dataset.originalDisplay === 'none' ? '' : element.dataset.originalDisplay;
        element.style.display = displayValue;
      } else {
        element.style.display = '';
      }

      if (element.dataset.originalVisibility !== undefined) {
        element.style.visibility = element.dataset.originalVisibility;
      } else {
        element.style.visibility = '';
      }

      element.removeAttribute('data-no-distractions-hidden');
      element.removeAttribute('data-original-display');
      element.removeAttribute('data-original-visibility');
    });
    
    restorePrimaryColumn();
    window.dispatchEvent(new Event('resize'));
  }

  // Track if this is initial page load (vs toggle)
  let isInitialPageLoad = true;
  
  function scheduleRestoreAfterDisable() {
    if (cachedNoDistractionsEnabled === null || cachedNoDistractionsEnabled || !isVideoPage()) return;
    
    const restoreAll = () => {
      if (cachedNoDistractionsEnabled) return;
      
      // On initial page load, wait longer to avoid interfering with loading elements
      // Check if page is still loading
      if (isInitialPageLoad && (document.readyState !== 'complete' || document.querySelector('video')?.readyState < 3)) {
        return; // Don't restore yet if page is still loading
      }
      
      restoreSuggestions();
      restoreComments();
      showActionButtons();
      restoreEndScreenRecommendations();
      restoreAllHiddenElements();
      
      // Force-restore secondary if nothing is visible yet
      const visibleSecondary = Array.from(document.querySelectorAll('#secondary, ytd-watch-flexy #secondary, #related, ytd-watch-flexy #related'))
        .find(el => el.offsetParent !== null || el.getBoundingClientRect().width > 10);
      if (!visibleSecondary) {
        const candidate = document.querySelector('#secondary, ytd-watch-flexy #secondary, #related, ytd-watch-flexy #related');
        if (candidate) {
          candidate.removeAttribute('hidden');
          candidate.style.display = 'block';
          candidate.style.visibility = 'visible';
        }
      }
    };
    
    // On initial page load, wait longer before first restore attempt
    // This prevents interfering with YouTube's loading elements
    if (isInitialPageLoad) {
      // Wait for page to be fully loaded before restoring
      [2000, 3000, 4000, 5000, 7000, 10000, 15000].forEach(delay => {
        setTimeout(restoreAll, delay);
      });
    } else {
      // On toggle, restore immediately
      [0, 100, 300, 500, 1000, 2000, 3000, 5000, 8000, 12000].forEach(delay => {
        setTimeout(restoreAll, delay);
      });
    }
    
    hasRestoredAfterToggle = true;
    lastRestoreTime = Date.now();
  }

  // Monitor for video page and apply no distractions features
  function checkAndApplyNoDistractions() {
    // ONLY apply when mode is ENABLED
    // When disabled, do NOTHING - restoration is handled separately
    if (isVideoPage() && cachedNoDistractionsEnabled) {
      // Apply immediately
      applyNoDistractionsToVideoPage();
      
      // Aggressive retry for comments and suggestions (they load asynchronously)
      // Multiple immediate attempts
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        hideActionButtons();
        removeEndScreenRecommendations();
        enableTheaterMode();
      }, 100);
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        hideActionButtons();
        removeEndScreenRecommendations();
        enableTheaterMode();
      }, 300);
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        hideActionButtons();
        removeEndScreenRecommendations();
        enableTheaterMode();
      }, 500);
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        hideActionButtons();
        removeEndScreenRecommendations();
        enableTheaterMode();
      }, 1000);
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        hideActionButtons();
        removeEndScreenRecommendations();
        enableTheaterMode();
      }, 2000);
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        hideActionButtons();
        removeEndScreenRecommendations();
        enableTheaterMode();
      }, 3000);
      setTimeout(() => {
        removeComments();
        removeSuggestions();
        removeEndScreenRecommendations();
      }, 5000);
    }
    // When disabled, do NOT restore here - it's handled by the message listener
  }

  // Watch for URL changes and DOM changes
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Reset initial page load flag on navigation
      isInitialPageLoad = true;
      
      // Update icon when navigating (theme or page type might have changed)
      if (noDistractionsButton) {
        chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
          updateIcon(noDistractionsEnabled);
        });
      }
      
      // If navigating to video page
      if (isVideoPage()) {
        if (cachedNoDistractionsEnabled) {
          // Remove comments/suggestions when enabled
          removeComments();
          removeSuggestions();
          hideActionButtons();
          removeEndScreenRecommendations();
          enableTheaterMode();
        } else {
          // When disabled, do NOTHING here
          // Restoration is handled by the message listener only
        }
      }
      
      // Check when URL changes
      checkAndApplyNoDistractions();
      
      // Also check after delays for async content (reduced frequency)
      setTimeout(() => {
        if (isVideoPage() && cachedNoDistractionsEnabled) {
          checkAndApplyNoDistractions();
        }
        // When disabled, do NOTHING - restoration handled by message listener
      }, 1000);
      setTimeout(() => {
        if (isVideoPage() && cachedNoDistractionsEnabled) {
          checkAndApplyNoDistractions();
        }
      }, 3000);
    }
  }, 500); // Check less frequently to reduce erratic behavior

  // Initialize observer
  setupVideoPageObserver();

  // Initial check - multiple immediate attempts to catch async content
  if (isVideoPage() && cachedNoDistractionsEnabled) {
    // Immediate removal
    removeComments();
    removeSuggestions();
    hideActionButtons();
    removeEndScreenRecommendations();
    enableTheaterMode();
    checkAndApplyNoDistractions();
  }
  setTimeout(() => {
    if (isVideoPage() && cachedNoDistractionsEnabled) {
      removeComments();
      removeSuggestions();
      removeEndScreenRecommendations();
      checkAndApplyNoDistractions();
    }
  }, 100);
  setTimeout(() => {
    if (isVideoPage() && cachedNoDistractionsEnabled) {
      removeComments();
      removeSuggestions();
      removeEndScreenRecommendations();
      checkAndApplyNoDistractions();
    }
  }, 300);
  setTimeout(checkAndApplyNoDistractions, 500);
  setTimeout(checkAndApplyNoDistractions, 1500);
  setTimeout(checkAndApplyNoDistractions, 3000);

  // Update when no distractions state changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.noDistractionsEnabled) {
      cachedNoDistractionsEnabled = changes.noDistractionsEnabled.newValue;
      
      // Setup or teardown observer based on mode
      setupVideoPageObserver();
      setupRestoreObserverWhenDisabled();
      
      // Reset restore tracking when state changes
      if (!cachedNoDistractionsEnabled) {
        hasRestoredAfterToggle = false;
        lastRestoreTime = 0;
        // Mark that this is NOT initial page load (it's a toggle via storage change)
        isInitialPageLoad = false;
        scheduleRestoreAfterDisable();
      }
      
      // Only apply when enabled - restoration is handled by message listener
      if (cachedNoDistractionsEnabled) {
        checkAndApplyNoDistractions();
      }
      applyNoDistractionsToNavbar();
    }
  });
  
  // Initial navbar setup
  setTimeout(() => applyNoDistractionsToNavbar(), 2000);
  
  // Retry applying navbar changes periodically to catch dynamically loaded buttons
  setInterval(() => {
    if (cachedNoDistractionsEnabled) {
      applyNoDistractionsToNavbar();
    }
  }, 3000);
  
  // Continuous monitoring for comments and suggestions on video pages
  // ONLY when no distractions is enabled
  setInterval(() => {
    if (isVideoPage() && cachedNoDistractionsEnabled) {
      // Continuously remove comments and suggestions as they appear
      removeComments();
      removeSuggestions();
      removeEndScreenRecommendations();
    }
    // When disabled, do NOTHING - completely stop monitoring
    // This prevents fighting with YouTube's own loading behavior
  }, 3000); // Check every 3 seconds

  // Replace "Human verified" tags with "Likely human" and AI tags with "Likely AI"
  function replaceVerificationTags() {
    // Find elements that likely contain verification badges/labels
    // YouTube typically uses badges, chips, or metadata elements for these tags
    const selectors = [
      // Common badge/chip selectors
      '[class*="badge"]',
      '[class*="chip"]',
      '[class*="label"]',
      '[class*="tag"]',
      '[class*="metadata"]',
      '[class*="verified"]',
      // YouTube-specific selectors
      'ytd-badge-supported-renderer',
      'ytd-badge-renderer',
      'yt-chip-cloud-chip-renderer',
      'ytd-metadata-row-renderer',
      // Any element with verification-related text
      '*'
    ];

    // Function to replace text in an element
    function replaceTextInElement(element) {
      if (!element || element.dataset.tagReplaced === 'true') return;
      
      const text = element.textContent?.trim() || '';
      const ariaLabel = element.getAttribute('aria-label') || '';
      const title = element.getAttribute('title') || '';
      
      let changed = false;
      
      // Replace "Human verified" with "Likely human"
      if (text.match(/human\s+verified/i) && !text.match(/likely\s+human/i)) {
        element.textContent = text.replace(/human\s+verified/gi, 'Likely human');
        changed = true;
      }
      
      // Replace "AI generated" or "AI" with "Likely AI"
      if (text.match(/\bai\s+generated\b/i) && !text.match(/likely\s+ai/i)) {
        element.textContent = text.replace(/\bai\s+generated\b/gi, 'Likely AI');
        changed = true;
      } else if (text.trim().toLowerCase() === 'ai' && !text.match(/likely\s+ai/i)) {
        element.textContent = 'Likely AI';
        changed = true;
      }
      
      // Update aria-label
      if (ariaLabel && (ariaLabel.match(/human\s+verified/i) || ariaLabel.match(/\bai\s+generated\b/i) || ariaLabel.trim().toLowerCase() === 'ai')) {
        let newAriaLabel = ariaLabel;
        if (ariaLabel.match(/human\s+verified/i) && !ariaLabel.match(/likely\s+human/i)) {
          newAriaLabel = newAriaLabel.replace(/human\s+verified/gi, 'Likely human');
        }
        if (ariaLabel.match(/\bai\s+generated\b/i) && !ariaLabel.match(/likely\s+ai/i)) {
          newAriaLabel = newAriaLabel.replace(/\bai\s+generated\b/gi, 'Likely AI');
        } else if (ariaLabel.trim().toLowerCase() === 'ai' && !ariaLabel.match(/likely\s+ai/i)) {
          newAriaLabel = 'Likely AI';
        }
        if (newAriaLabel !== ariaLabel) {
          element.setAttribute('aria-label', newAriaLabel);
          changed = true;
        }
      }
      
      // Update title
      if (title && (title.match(/human\s+verified/i) || title.match(/\bai\s+generated\b/i) || title.trim().toLowerCase() === 'ai')) {
        let newTitle = title;
        if (title.match(/human\s+verified/i) && !title.match(/likely\s+human/i)) {
          newTitle = newTitle.replace(/human\s+verified/gi, 'Likely human');
        }
        if (title.match(/\bai\s+generated\b/i) && !title.match(/likely\s+ai/i)) {
          newTitle = newTitle.replace(/\bai\s+generated\b/gi, 'Likely AI');
        } else if (title.trim().toLowerCase() === 'ai' && !title.match(/likely\s+ai/i)) {
          newTitle = 'Likely AI';
        }
        if (newTitle !== title) {
          element.setAttribute('title', newTitle);
          changed = true;
        }
      }
      
      if (changed) {
        element.dataset.tagReplaced = 'true';
      }
    }

    // Search for elements containing verification text
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      const text = element.textContent?.trim() || '';
      const ariaLabel = element.getAttribute('aria-label') || '';
      const title = element.getAttribute('title') || '';
      
      // Only process elements that contain verification-related text
      // and haven't been processed yet
      if ((text.match(/human\s+verified/i) && !text.match(/likely\s+human/i)) ||
          (text.match(/\bai\s+generated\b/i) && !text.match(/likely\s+ai/i)) ||
          (text.trim().toLowerCase() === 'ai' && !text.match(/likely\s+ai/i)) ||
          (ariaLabel.match(/human\s+verified/i) && !ariaLabel.match(/likely\s+human/i)) ||
          (ariaLabel.match(/\bai\s+generated\b/i) && !ariaLabel.match(/likely\s+ai/i)) ||
          (ariaLabel.trim().toLowerCase() === 'ai' && !ariaLabel.match(/likely\s+ai/i)) ||
          (title.match(/human\s+verified/i) && !title.match(/likely\s+human/i)) ||
          (title.match(/\bai\s+generated\b/i) && !title.match(/likely\s+ai/i)) ||
          (title.trim().toLowerCase() === 'ai' && !title.match(/likely\s+ai/i))) {
        replaceTextInElement(element);
      }
    });
  }

  // Run tag replacement on page load and continuously monitor for new content
  if (isVideoPage()) {
    // Initial replacement
    setTimeout(replaceVerificationTags, 500);
    setTimeout(replaceVerificationTags, 1500);
    setTimeout(replaceVerificationTags, 3000);
    
    // Monitor for dynamically loaded content
    const tagReplacementObserver = new MutationObserver(() => {
      replaceVerificationTags();
    });
    
    tagReplacementObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Also run periodically to catch any missed updates
    setInterval(replaceVerificationTags, 2000);
  }
})();
