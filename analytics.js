/*
 * Google Analytics helper for Chrome Extension
 * Uses Measurement Protocol API (no external scripts needed)
 */

class Analytics {
  constructor(measurementId, apiSecret) {
    this.measurementId = measurementId; // G-XXXXXXXXXX
    this.apiSecret = apiSecret; // Your Measurement Protocol API secret
  }

  // Get or create a unique client ID for this installation
  async getOrCreateClientId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['ga_client_id'], (result) => {
        if (result.ga_client_id) {
          resolve(result.ga_client_id);
        } else {
          // Generate a unique client ID
          const clientId = this.generateClientId();
          chrome.storage.local.set({ ga_client_id: clientId }, () => {
            resolve(clientId);
          });
        }
      });
    });
  }

  generateClientId() {
    // Generate a UUID-like client ID
    return `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
  }

  // Send event to Google Analytics
  async sendEvent(eventName, eventParams = {}) {
    try {
      const clientId = await this.getOrCreateClientId();
      
      const payload = {
        client_id: clientId,
        events: [{
          name: eventName,
          params: {
            ...eventParams,
            engagement_time_msec: 100
          }
        }]
      };

      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
      
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Analytics error:', error);
      // Fail silently - don't break extension functionality
    }
  }

  // Track page view (for extension pages)
  async trackPageView(pagePath, pageTitle = '') {
    await this.sendEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  // Track extension installation
  async trackInstall() {
    await this.sendEvent('extension_installed', {
      extension_version: chrome.runtime.getManifest().version
    });
  }

  // Track toggle action
  async trackToggle(enabled) {
    await this.sendEvent('toggle_no_distractions', {
      enabled: enabled,
      value: enabled ? 1 : 0
    });
  }

  // Track feature usage
  async trackFeature(featureName, action = 'used') {
    await this.sendEvent('feature_usage', {
      feature_name: featureName,
      action: action
    });
  }

  // Track video page visit
  async trackVideoPage() {
    await this.sendEvent('video_page_visited');
  }

  // Track homepage redirect
  async trackHomepageRedirect() {
    await this.sendEvent('homepage_redirected');
  }
}

// Export for use in service worker
if (typeof self !== 'undefined') {
  self.Analytics = Analytics;
}

