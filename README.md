# YouTube No Distractions

> **A distraction-free YouTube experience: no homepage noise, no recommendations, no comments — just the video you want.**

A Chrome extension that transforms YouTube into a distraction-free viewing experience by removing recommendations, comments, and other distracting elements.


<img width="1440" height="900" alt="Screenshot 2025-11-18 at 23 00 48" src="https://github.com/user-attachments/assets/344e62a0-50b6-4598-80ac-8dc2121f02d7" />


## 💭 Why I Built This

I built this extension because YouTube became too overwhelming. Many times I found myself opening YouTube and clicking on almost all the recommended videos in new tabs, ending up with thousands of tabs open with videos I felt I "had to watch." Sometimes I'd watch them at 3x speed just to finish them because I felt they were important somehow, and I didn't want to miss anything.

I didn't want that anymore. I wanted to go on YouTube, search for what I was actually looking for, watch it, and move on — without the endless rabbit hole of recommendations, trending videos, shorts, and comments pulling me in different directions.

This tool makes YouTube calm again. It's for anyone who wants to use YouTube intentionally, not compulsively.

## 🎯 Purpose

YouTube No Distractions helps you focus on the content you want to watch by:
- Redirecting the YouTube homepage to a clean search interface
- Removing sidebar recommendations on video pages
- Hiding comments sections
- Removing end-screen recommendations
- Hiding distracting UI elements (Create button, notifications, etc.)
- Enabling theater mode automatically

## ✨ Features

### Homepage Redirection
- Automatically redirects YouTube homepage (`youtube.com` or `youtube.com/feed`) to a distraction-free search bar
- Toggle on/off with a single click

### Video Page Enhancements
When "No Distractions" mode is enabled on video pages:
- **Theater Mode**: Automatically enables theater mode for a focused viewing experience
- **No Sidebar**: Removes the recommendations sidebar completely
- **No Comments**: Hides the comments section
- **No End Screen**: Removes end-screen video recommendations that appear when videos finish
- **Minimal Actions**: Hides share, download, and other action buttons (keeps the like button)

### Navigation Bar Cleanup
- Hides the "Create" button
- Hides the notifications bell
- Adds a toggle button to easily enable/disable the mode

## 🚀 Installation

### 🛠️ How to Install (Manual Installation)

#### Option 1: Download from GitHub Releases (Recommended)

1. **Download the latest release**
   - Go to [Releases](https://github.com/danielgued/yt-no-distractions-ext/releases)
   - Download `yt-no-distractions-ext.zip` from the latest release

2. **Extract the ZIP file**
   - Extract the folder to a location you'll remember (e.g., `Downloads/yt-no-distractions-ext`)

3. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right corner)
   - Click "Load unpacked"
   - Select the extracted `yt-no-distractions-ext` folder
   - The extension should now appear in your extensions list

4. **Verify Installation**
   - You should see the extension icon in your Chrome toolbar
   - Visit `youtube.com` - it should redirect to the search interface

#### Option 2: Clone from GitHub (For Developers)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/danielgued/yt-no-distractions-ext.git
   cd yt-no-distractions-ext
   ```

2. **Install Dependencies** (for icon conversion - optional)
   ```bash
   npm install
   ```

3. **Load the Extension in Chrome**
   - Follow steps 3-4 from Option 1 above

## 📖 Usage

### Toggle No Distractions Mode

**Method 1: Using the Toggle Button**
- Look for the toggle button (do-not-disturb icon) in the YouTube navigation bar
- Click it to enable/disable "No Distractions" mode
- The icon changes to indicate the current state

**Method 2: Using the Extension Icon**
- Click the extension icon in Chrome's toolbar
- This will toggle the mode on/off

### What Happens When Enabled

- **On Homepage**: Redirects to `yt-search-bar.web.app` (a clean search interface)
- **On Video Pages**: 
  - Removes sidebar recommendations
  - Hides comments
  - Removes end-screen recommendations
  - Enables theater mode
  - Hides distracting action buttons

### What Happens When Disabled

- All hidden elements are restored
- Normal YouTube experience returns
- Homepage redirect is disabled

## 🧪 Testing Instructions

We're currently in **beta testing**! Please test the following scenarios and report any issues:

### Test Scenarios

1. **Homepage Redirection**
   - [ ] Visit `youtube.com` - should redirect to search interface
   - [ ] Visit `youtube.com/feed` - should redirect to search interface
   - [ ] Toggle mode off - should allow normal homepage access
   - [ ] Toggle mode on - should redirect again

2. **Video Page Features**
   - [ ] Navigate to any video with mode enabled
   - [ ] Verify sidebar recommendations are hidden
   - [ ] Verify comments section is hidden
   - [ ] Verify theater mode is enabled automatically
   - [ ] Let a video finish - verify end-screen recommendations are hidden
   - [ ] Toggle mode off - verify everything restores

3. **Navigation Bar**
   - [ ] Verify toggle button appears in navbar
   - [ ] Verify Create button is hidden when mode is on
   - [ ] Verify notifications bell is hidden when mode is on
   - [ ] Toggle mode off - verify buttons restore

4. **Edge Cases**
   - [ ] Test on different video lengths (short videos, long videos)
   - [ ] Test with YouTube Shorts
   - [ ] Test navigating between videos
   - [ ] Test refreshing the page
   - [ ] Test with multiple tabs open

### Reporting Issues

When reporting issues, please include:
- **Browser version**: Chrome version
- **Extension version**: Currently 1.0
- **Steps to reproduce**: What you did before the issue occurred
- **Expected behavior**: What should have happened
- **Actual behavior**: What actually happened
- **Screenshots**: If applicable

## 🐛 Known Issues / Limitations

- **YouTube Shorts**: Some Shorts-related features may not be fully hidden
- **Dynamic Content**: Some elements may briefly appear before being hidden (they load asynchronously)
- **Theater Mode**: May take a moment to activate on some videos
- **End Screen**: May appear briefly before being hidden when videos end

## 🔧 Technical Details

### Permissions Used
- `storage`: To save your preference (enabled/disabled state)
- `webNavigation`: To intercept and redirect homepage navigation

### Files Structure
```
yt-no-distractions-ext/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (handles redirects)
├── content_script_youtube.js  # Main content script for YouTube
├── content_script_searchapp.js # Content script for search interface
├── styles.css                 # Extension styles
├── icons/                     # Extension icons
└── convert_svg_node.js        # Build script for icons
```

### How It Works

1. **Homepage Redirect**: The background service worker intercepts navigation to YouTube's homepage and redirects to the search interface when mode is enabled.

2. **Video Page Modifications**: The content script monitors the page and:
   - Hides elements using CSS (`display: none`)
   - Stores original display states for restoration
   - Continuously monitors for dynamically loaded content

3. **State Management**: Uses Chrome's `storage.sync` API to persist your preference across tabs and browser sessions.

## 🤝 Contributing & Feedback

This extension is currently in **beta testing**. Your feedback is valuable!

### Ways to Contribute

1. **Report Bugs**: Use GitHub Issues to report any problems
2. **Suggest Features**: Share ideas for improvements
3. **Test Thoroughly**: Try different scenarios and report findings
4. **Share Feedback**: Let us know what works well and what doesn't

### Feedback Areas

We're particularly interested in feedback on:
- **Performance**: Does the extension slow down YouTube?
- **Reliability**: Do elements sometimes not get hidden?
- **User Experience**: Is the toggle button easy to find and use?
- **Missing Features**: What else would make YouTube less distracting?

## 📝 License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

See the [LICENSE](LICENSE) file for the full license text.

### What this means:
- ✅ You are free to use, modify, and distribute this software
- ✅ You must keep the same license (GPL-3.0) when distributing
- ✅ You must include the license and copyright notices
- ✅ You must make source code available when distributing
- ❌ No warranty is provided (see LICENSE for details)

Full license text: https://www.gnu.org/licenses/gpl-3.0.en.html

## 🙏 Acknowledgments

- Built for users who want to focus on content without distractions
- Uses YouTube's public interface (no API access required)

## 📧 Contact

For questions, suggestions, or bug reports, please open an issue on GitHub.

---

**Note**: This extension is not affiliated with or endorsed by YouTube/Google. It's an independent project to improve the YouTube viewing experience.
