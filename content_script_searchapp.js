(function() {
  // On search app, always use the white icon (quiet_mode_off.png)
  // The icon files are reversed in naming, so "off" icon shows "ON" state
  const doNotDisturbOffIconURL = chrome.runtime.getURL('icons/quiet_mode_off.png');

  // Create the button element
  const button = document.createElement('button');
  button.id = 'quiet-mode-toggle-button';
  button.className = 'search-app-quiet-mode-button'; // For CSS styling
  button.type = 'button'; // Prevent form submission
  // Don't set inline styles - let CSS handle everything
  
  // Create the icon image
  const icon = document.createElement('img');
  icon.id = 'quiet-mode-toggle-icon';
  icon.width = 24; // Same size as YouTube navbar icon
  icon.height = 24;
  icon.src = doNotDisturbOffIconURL; // Set icon immediately
  icon.alt = ''; // Decorative icon
  button.appendChild(icon);

  // Create custom tooltip (YouTube-style, not browser default)
  const tooltip = document.createElement('div');
  tooltip.className = 'yt-quiet-mode-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = 'No Distractions - Off'; // Will be updated (matches icon visual)
  button.appendChild(tooltip);

  // Add click listener
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggleNoDistractions' });
  });

  // Add hover listeners for custom tooltip and circular background
  let hoverTimeout;
  button.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimeout);
    // Show circular background on hover (force with inline style to ensure it works)
    button.style.setProperty('background-color', 'rgba(0, 0, 0, 0.1)', 'important');
    hoverTimeout = setTimeout(() => {
      tooltip.classList.add('visible');
    }, 200); // Show after 200ms
  });
  
  button.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimeout);
    // Remove background on mouse leave
    button.style.removeProperty('background-color');
    tooltip.classList.remove('visible');
  });

  // Add aria-label for accessibility
  button.setAttribute('aria-label', 'Toggle No Distractions Mode');

  // Add the button to the page
  function addButtonToPage() {
    // Check if button already exists
    if (document.getElementById('quiet-mode-toggle-button')) {
      return; // Button already exists
    }
    
    // Wait for body to be available
    if (document.body) {
      document.body.appendChild(button);
    } else {
      // If body isn't ready, wait for it
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButtonToPage);
      } else {
        // Fallback: try again after a short delay
        setTimeout(addButtonToPage, 100);
      }
    }
  }
  
  // Add button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButtonToPage);
  } else {
    addButtonToPage();
  }

  function updateIcon(noDistractionsEnabled) {
    // On search app, no distractions is always ON, so we use the "off" icon (which shows ON state)
    // Always use white icon on search app (original behavior)
    icon.src = doNotDisturbOffIconURL;
    
    // Update custom tooltip - on search app, mode is always ON (but text matches icon visual)
    const tooltip = button.querySelector('.yt-quiet-mode-tooltip');
    if (tooltip) {
      // On search app, mode is always ON, but icon shows "off" visual, so tooltip says "Off"
      tooltip.textContent = 'No Distractions - Off';
    }
    
    // Update aria-label for accessibility
    button.setAttribute('aria-label', 'No Distractions Mode: ON - Click to disable and go to YouTube Home');
    button.setAttribute('aria-pressed', 'true');
  }

  // Set its initial state
  chrome.storage.sync.get(['noDistractionsEnabled'], ({ noDistractionsEnabled }) => {
    // Default to true if storage is not set (shouldn't happen, but safe)
    updateIcon(noDistractionsEnabled ?? true);
  });
  
  // No need to watch for theme changes on search app - always uses white icon

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateIcon') {
      updateIcon(message.noDistractionsEnabled);
    }
  });
})();