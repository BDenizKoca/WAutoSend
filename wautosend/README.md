# WAutoSend — WhatsApp Web Message Scheduler



Local-only Chrome extension that schedules and sends messages in WhatsApp Web. No APIs. No servers. Just a clean in-page UI and a reliable "send at time" engine with privacy-focused post-send actions.

![Logo](icons/icon-128.png)

---

## Why?

Because I needed it.  
And because everything else either required WhatsApp Business, signing up for some shady API key, or just didn’t work.  
So I built a dumb, brute-force solution that just... works. Locall and mostly reliably.

---

## ✨ Key Features

### 🕐 **Smart Scheduling**
- Schedule multiple messages at specific times (24h format)
- Multi-contact support (comma-separated names) with auto chat-switching
- Message source: typed text or clipboard fallback
- Duplicate prevention and concurrent schedule protection

### 🔒 **Privacy-First Post-Send Actions**
- **Auto-refresh page** (default) - Avoids read confirmations by refreshing WhatsApp Web
- **Auto-close tab** - Maximum privacy: avoids read confirmations AND online status
- **Do nothing** - Stay in current chat (original behavior)

### 🎯 **Reliable Delivery**
- Smart delivery with send confirmation detection
- Exponential backoff retries for failed sends
- Robust message injection with multiple fallback methods
- Real-time status updates and notifications

### 🎨 **Clean Interface**
- Non-intrusive floating FAB (bottom-right corner)
- Taller, spacious panel with improved radio button layout
- Visual status indicators and human-friendly time display
- Keyboard shortcut (Ctrl+Shift+W) for quick access

### 🛡️ **Local & Secure**
- Everything stored locally in your browser (chrome.storage)
- No external services, APIs, or data collection
- Anti-inactivity system prevents WhatsApp Web disconnects

---

## Install (Unpacked)

This is not in the Chrome Web Store. Load it locally:

1) Clone the repo

```bash
git clone https://github.com/BDenizKoca/WAutoSend---Message-Scheduler.git
cd WAutoSend---Message-Scheduler
```

2) In Chrome go to chrome://extensions
- Enable Developer mode
- Click "Load unpacked" and select the cloned folder

3) Open https://web.whatsapp.com and log in

4) Use the floating FAB

---

## 🚀 Usage

### Basic Setup
1) Open WhatsApp Web and bring up the panel (FAB or Ctrl+Shift+W)
2) Add a schedule:
   - **Time** (24h format, e.g., 14:30)
   - **Message text** or check "Use clipboard if empty"
   - **Contacts** (optional, comma-separated; if empty, sends to current chat)
3) **Choose post-send action:**
   - **Auto-refresh** (default) - Refreshes page to avoid read confirmations
   - **Auto-close tab** - Closes tab to avoid read confirmations + online status
   - **Do nothing** - Stay in current chat
4) Click **"Test Send"** to validate functionality
5) Keep the tab open; the extension will send at scheduled time(s)

### 🔧 Advanced Tips
- **Contact Names**: Use exact names as they appear in your WhatsApp
- **Similar Names**: Add qualifiers (e.g., "John Smith" vs "John S.")
- **Groups**: Use the exact group name as it appears in your chat list
- **Privacy**: Use "Auto-close tab" for maximum privacy (no read confirmations + appears offline)
- **Testing**: Always use "Test Send" first to verify everything works

---

## 🔧 How It Works

At send time, the extension:

1. **🔍 Contact Search**: Searches for contact name, tabs to result, opens chat
2. **📝 Message Injection**: Injects your message using multiple fallback methods
3. **📤 Smart Sending**: Clicks send button with verification and retry logic
4. **✅ Confirmation**: Verifies send success by checking cleared input
5. **🔒 Privacy Action**: Executes your chosen post-send action:
   - **Refresh**: Reloads page to exit chat
   - **Close**: Closes tab completely
   - **None**: Stays in current chat

### 🛡️ Anti-Duplicate Protection
- Prevents concurrent schedule processing
- 2-second cooldown between sends
- Semaphore locks to avoid race conditions
- Enhanced verification to prevent false failures

No external services. It automates the same UI steps a person would take, but more reliably.

---

## ⌨️ Interface & Controls

### 🎯 **Access Methods**
- **FAB**: Floating circular button in bottom-right of WhatsApp Web
- **Keyboard**: Ctrl+Shift+W to toggle the panel
- **Mobile**: Responsive design works on touch devices

### 🎨 **UI Features**
- **Taller Panel**: Spacious 850px height with improved radio button layout
- **Status Bar**: Real-time connection and schedule status
- **Smart Notifications**: Success/error feedback with clear messaging
- **Version Display**: Shows extension version in panel header
- **Scrollable Content**: Handles many scheduled messages gracefully

### 🔍 **Debug Tools**
Available in browser console for troubleshooting:
```javascript
WASDebug.checkStatus()           // Check overall status
WASDebug.testChatDetection()     // Test chat detection
WASDebug.testMessageInjection()  // Test message injection
WASDebug.testPostSendActions()   // Test post-send actions
WASDebug.testConcurrentSchedules() // Test multiple schedules
```

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 🔍 **FAB Not Visible**
- Reload the extension (chrome://extensions → Reload)
- Refresh WhatsApp Web page
- Check if extension is enabled

#### 🖼️ **Toolbar Shows Text Icon**
- Reload the extension (background worker will reset icons)
- Check if icon files are present in icons/ folder

#### 📱 **Chat Doesn't Switch to Contact**
- Ensure exact visible name matches your WhatsApp contact/group
- Try adding unique qualifiers (e.g., "John Smith" vs "John S.")
- Check contact name spelling and spacing
- Test with "Test Send" button first

#### 📋 **Clipboard Permission Issues**
- Grant permission when Chrome asks
- Or type the message directly instead of using clipboard
- Check browser clipboard permissions in settings

#### 🔄 **Messages Not Sending**
- Check if WhatsApp Web is logged in and active
- Verify you're in a valid chat (not search/settings)
- Use debug tools: `WASDebug.checkStatus()` in console
- Try "Test Send" to isolate issues

#### 🕐 **Schedule Not Triggering**
- Keep WhatsApp Web tab open and active
- Check if schedules are enabled (not sent)
- Verify time format is correct (24h: HH:MM)
- Extension must be running (check status indicator)

---

## 📁 Project Structure

```
WAutoSend/
├─ manifest.json                 # Extension manifest with permissions
├─ content.js                    # Bootstraps UI + scheduler in WhatsApp Web
├─ scheduler.js                  # Core scheduling, timing, and send logic
├─ storage.js                    # chrome.storage wrapper with fallbacks
├─ ui.js                         # Overlay UI, FAB, and user interactions
├─ styles.css                    # Complete UI styling (FAB, panel, radio buttons)
├─ popup.html / popup.js         # Extension toolbar popup
├─ debug.js                      # Debug tools and diagnostic functions
├─ icons/                        # Complete icon set (16px to 128px)
│  ├─ icon-16.png  icon-24.png  icon-32.png  
│  ├─ icon-38.png  icon-48.png  icon-128.png
├─ LICENSE                       # MIT License
├─ README.md                     # This file
├─ TEST_PLAN.md                  # Testing procedures and scenarios
└─ setup.bat                     # Quick setup script for Windows
```

### 🔧 **Key Components**
- **scheduler.js**: Message timing, injection, sending, and post-send actions
- **ui.js**: Interactive panel with radio buttons and real-time status
- **storage.js**: Persistent settings and schedule management
- **styles.css**: Modern, responsive UI with privacy-focused design
- **debug.js**: Comprehensive testing and diagnostic tools

---

## ⚖️ Responsible Use & Ethics

### 🚫 **What WAutoSend is NOT**
WAutoSend is **not a spam tool** and should **not be used for**:
- Harvesting phone numbers or chat lists
- Using private or undocumented WhatsApp APIs
- Running or managing marketing campaigns
- Bypassing WhatsApp rate limits or policies
- Mass messaging or bulk sending
- Automated customer service or bots

### ✅ **Intended Use Cases**
WAutoSend is designed for **personal, legitimate use** such as:
- Scheduling birthday wishes or reminders
- Sending important messages at specific times
- Coordinating with family/friends across time zones
- Personal productivity and time management
- Small group coordination (sports teams, study groups, etc.)

### 🔒 **Scope and Limitations**
- Automates only the **visible WhatsApp Web UI** on your computer
- WhatsApp Web must remain **open and logged in**
- You manually provide a **small list of contacts**
- **No bulk sending capabilities** by design
- Respects WhatsApp's normal rate limiting

### ⚠️ **User Responsibility**
- Use responsibly and **respect recipients' privacy**
- Follow WhatsApp's Terms of Service
- **Do not spam** or send unwanted messages
- Be mindful of different time zones
- Use post-send privacy features appropriately

---

## 🔐 Privacy & Legal

### 🛡️ **Privacy Commitment**
- **100% Local**: No data leaves your machine; everything stored locally by Chrome
- **No Tracking**: Zero analytics, telemetry, or user behavior monitoring  
- **No Servers**: No external APIs, databases, or cloud services
- **Open Source**: Full code transparency - inspect everything yourself

### 🔒 **Post-Send Privacy Features**
- **Auto-refresh**: Removes you from specific chats to avoid read confirmations
- **Auto-close**: Maximum privacy - avoids read confirmations AND online status
- **User Control**: You choose your privacy level for each use

### ⚖️ **Legal Disclaimers**
- **Not affiliated** with WhatsApp, Meta, or Facebook
- **Use at your own risk** - no warranties or guarantees
- **User responsibility** to follow WhatsApp Terms of Service
- **Personal use only** - not for commercial or bulk messaging

### 🌍 **Compliance**
- Respects WhatsApp's rate limiting and UI automation policies
- Does not access private APIs or encrypted message content
- Follows browser extension best practices and security guidelines
- Compatible with GDPR, CCPA, and similar privacy regulations

---

## 🤝 Contributing

### 🎯 **Development Principles**
- **Keep it simple** - No unnecessary bloat or complexity
- **Privacy first** - Local-only, no external dependencies
- **User-friendly** - Clean UI and clear functionality
- **Reliable** - Robust error handling and fallback methods

### 🔧 **How to Contribute**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** thoroughly with real WhatsApp Web scenarios
4. **Commit** with clear, descriptive messages
5. **Submit** a Pull Request with detailed description

### 🐛 **Bug Reports**
When reporting issues, please include:
- Browser version and OS
- WhatsApp Web version/interface
- Extension version
- Steps to reproduce
- Console output from debug tools (`WASDebug.checkStatus()`)

### 💡 **Feature Requests**
- Keep suggestions aligned with core mission (personal scheduling)
- Consider privacy implications
- Provide clear use cases and rationale
- Remember: simple is better

---

## 📄 License

**MIT License** - See [LICENSE](LICENSE) file for full details

---

## 🙏 Acknowledgments

- Built out of necessity for reliable, local-only WhatsApp scheduling
- Inspired by the lack of privacy-focused alternatives
- Thanks to the Chrome extension development community
- Special recognition for WhatsApp Web's consistent UI (mostly 😅)

---

**⭐ Star this repo if it helps you stay connected while respecting privacy!**
