/**
 * WAutoSend UI Module
 * Manages the overlay interface, user interactions, and real-time updates
 * Provides clean, non-intrusive dashboard for schedule management
 */

class WASUI {
    constructor() {
        this.isVisible = false;
        this.currentView = 'schedules'; // 'schedules', 'settings', 'about'
        this.schedules = [];
        this.settings = {};
        
        // FAB drag state
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.fabPosition = { x: 20, y: 20 }; // Default bottom-right position
        this.justFinishedDragging = false;
        
        this.init();
    }

    setVersionLabel() {
        try {
            const version = chrome?.runtime?.getManifest?.().version || '';
            const span = this.overlay.querySelector('#was-version');
            if (span && version) span.textContent = `v${version}`;
        } catch {}
    }

    /**
     * Initialize the UI system
     */
    async init() {
        this.createOverlay();
        this.bindEvents();
        await this.loadData();
        await this.loadFabPosition();
        this.startStatusUpdates();
        this.setVersionLabel();
        
        console.log('[WAS UI] Interface initialized');
    }

    /**
     * Create the main overlay structure
     */
    createOverlay() {
        // Create main container
        this.overlay = document.createElement('div');
        this.overlay.className = 'was-overlay';
        this.overlay.innerHTML = this.getOverlayHTML();
        
        // Append to body
        document.body.appendChild(this.overlay);
        
        // Get element references
        this.launcher = this.overlay.querySelector('.was-launcher');
        // Ensure launcher icon loads correctly; fallback to text if it fails
        try {
            const img = this.overlay.querySelector('.was-launcher-icon-img');
            if (img) {
                const src = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
                    ? chrome.runtime.getURL('icons/icon-128.png')
                    : 'icons/icon-48.png';
                img.addEventListener('error', () => {
                    // Fallback: replace with text label
                    this.launcher.innerHTML = '<div class="was-launcher-icon">WAS</div>';
                }, { once: true });
                img.src = src; // set (or reset) src after attaching error listener
            }
        } catch {}
        this.panel = this.overlay.querySelector('.was-panel');
        this.content = this.overlay.querySelector('.was-content');
        this.statusBar = this.overlay.querySelector('.was-status');
    }

    /**
     * Get the HTML structure for the overlay
     * @returns {string} HTML string
     */
    getOverlayHTML() {
        return `
            <button class="was-launcher" title="WAutoSend - Message Scheduler">
                <img class="was-launcher-icon-img" src="${chrome.runtime.getURL('icons/icon-128.png')}" alt="WAutoSend" />
            </button>
            
            <div class="was-panel">
                <div class="was-header">
                    <h3 class="was-title">WAutoSend <span id="was-version" style="color:#888;font-weight:500;font-size:12px;margin-left:6px;"></span></h3>
                    <button class="was-close" title="Close">&times;</button>
                </div>
                
                <div class="was-status">
                    <div class="was-status-indicator"></div>
                    <span class="was-status-text">Initializing...</span>
                </div>
                
                <div class="was-content">
                    ${this.getSchedulesHTML()}
                </div>
            </div>
        `;
    }

    /**
     * Get HTML for schedules view
     * @returns {string} HTML string
     */
    getSchedulesHTML() {
        return `
            <div class="was-add-form">
                <div class="was-form-group">
                    <label class="was-label">Time (24h format)</label>
                    <input type="time" class="was-input" id="was-time-input" required>
                </div>
                
                <div class="was-form-group">
                    <label class="was-label">Message</label>
                    <textarea class="was-input was-textarea" id="was-message-input" 
                              placeholder="Enter your message here..."></textarea>
                </div>

                <div class="was-form-group">
                    <label class="was-label">Contacts (comma-separated)</label>
                    <input class="was-input" id="was-contacts-input" placeholder="e.g. Ali, Ayşe, Can" />
                </div>
                
                <div class="was-checkbox-group">
                    <input type="checkbox" class="was-checkbox" id="was-clipboard-checkbox">
                    <label class="was-checkbox-label" for="was-clipboard-checkbox">
                        Use clipboard if message is empty
                    </label>
                </div>
                
                <div class="was-radio-group">
                    <label class="was-radio-group-title">After sending messages:</label>
                    <div class="was-radio-option">
                        <input type="radio" class="was-radio" id="was-refresh-radio" name="post-send-action" value="refresh">
                        <label class="was-radio-label" for="was-refresh-radio">
                            Auto-refresh page (avoids read confirmations)
                        </label>
                    </div>
                    <div class="was-radio-option">
                        <input type="radio" class="was-radio" id="was-close-radio" name="post-send-action" value="close">
                        <label class="was-radio-label" for="was-close-radio">
                            Auto-close tab (avoids read confirmations & online status)
                        </label>
                    </div>
                    <div class="was-radio-option">
                        <input type="radio" class="was-radio" id="was-none-radio" name="post-send-action" value="none">
                        <label class="was-radio-label" for="was-none-radio">
                            Do nothing (stay in current chat)
                        </label>
                    </div>
                </div>
                  <button class="was-btn was-btn-primary" id="was-add-btn">
                    Add Schedule
                </button>
                
                <button class="was-btn was-btn-secondary" id="was-test-btn" style="margin-left: 8px;">Test Send</button>
            </div>
            
            <div class="was-schedules" id="was-schedules-list">
                <!-- Schedules will be populated here -->
            </div>
        `;
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Launcher click
        this.launcher.addEventListener('click', (e) => {
            // Prevent panel toggle if we just finished dragging
            if (this.justFinishedDragging) {
                this.justFinishedDragging = false;
                return;
            }
            this.togglePanel();
        });
        
        // FAB drag events
        this.launcher.addEventListener('mousedown', (e) => this.startDrag(e));
        this.launcher.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('touchmove', (e) => this.handleDrag(e.touches[0]), { passive: false });
        
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());
        
        // Close button
        this.overlay.querySelector('.was-close').addEventListener('click', () => this.hidePanel());
        // Add schedule button
        this.overlay.querySelector('#was-add-btn').addEventListener('click', () => this.addSchedule());
        
        // Test send button (smart behavior)
        this.overlay.querySelector('#was-test-btn').addEventListener('click', () => this.testSend());
        
        // Post-send action radio buttons
        this.overlay.querySelectorAll('input[name="post-send-action"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.handlePostSendActionChange(e.target.value);
                }
            });
        });        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.overlay.contains(e.target) && this.isVisible) {
                this.hidePanel();
            }
        });
        
        // Listen for scheduler events
        window.addEventListener('wasSchedulerEvent', (e) => this.handleSchedulerEvent(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                e.preventDefault();
                this.togglePanel();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hidePanel();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.updateFabPosition();
            if (this.isVisible) {
                this.updatePanelPosition();
            }
        });
    }

    /**
     * Toggle panel visibility
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Show the panel
     */
    async showPanel() {
        this.isVisible = true;
        this.updatePanelPosition();
        this.panel.classList.add('show');
        await this.refreshSchedules();
        
        // Restore UI settings when panel is shown (elements are guaranteed to exist)
        this.restoreUISettings();
    }

    /**
     * Update panel position based on FAB location
     */
    updatePanelPosition() {
        const fabRect = this.launcher.getBoundingClientRect();
        const panelWidth = 400;
        const panelMaxHeight = 850;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 10;
        
        // Reset panel positioning
        this.panel.style.left = 'auto';
        this.panel.style.right = 'auto';
        this.panel.style.top = 'auto';
        this.panel.style.bottom = 'auto';
        
        // Determine horizontal position
        const spaceRight = viewportWidth - fabRect.right;
        const spaceLeft = fabRect.left;
        
        if (spaceRight >= panelWidth + margin) {
            // Position to the right of FAB
            this.panel.style.left = '80px';
        } else if (spaceLeft >= panelWidth + margin) {
            // Position to the left of FAB
            this.panel.style.right = '80px';
        } else {
            // Center the panel horizontally if not enough space on either side
            const centerX = Math.max(margin, Math.min(viewportWidth - panelWidth - margin, 
                fabRect.left + fabRect.width/2 - panelWidth/2));
            this.panel.style.left = `${centerX - fabRect.left}px`;
        }
        
        // Determine vertical position
        const spaceBelow = viewportHeight - fabRect.bottom;
        const spaceAbove = fabRect.top;
        
        if (spaceBelow >= Math.min(panelMaxHeight, 300) + margin) {
            // Position below FAB
            this.panel.style.top = '80px';
        } else if (spaceAbove >= Math.min(panelMaxHeight, 300) + margin) {
            // Position above FAB
            this.panel.style.bottom = '80px';
        } else {
            // Position to fit in viewport
            const maxAvailableHeight = Math.max(spaceAbove, spaceBelow) - margin;
            this.panel.style.maxHeight = `${Math.min(panelMaxHeight, maxAvailableHeight)}px`;
            
            if (spaceBelow >= spaceAbove) {
                this.panel.style.top = '80px';
            } else {
                this.panel.style.bottom = '80px';
            }
        }
    }

    /**
     * Hide the panel
     */
    hidePanel() {
        this.isVisible = false;
        this.panel.classList.remove('show');
    }

    /**
     * Load data from storage
     */
    async loadData() {
        try {
            this.schedules = await window.wasStorage.getSchedules();
            this.settings = await window.wasStorage.getSettings() || {};
            
            // Restore UI settings
            this.restoreUISettings();
        } catch (error) {
            console.error('[WAS UI] Error loading data:', error);
        }
    }

    /**
     * Restore UI settings from storage
     */
    restoreUISettings() {
        try {
            // Restore post-send action radio buttons (default to 'refresh')
            const postSendAction = this.settings.postSendAction || 'refresh';
            const radioButton = document.getElementById(`was-${postSendAction}-radio`);
            if (radioButton) {
                radioButton.checked = true;
            }
            
            // You can add other UI settings here in the future
        } catch (error) {
            console.error('[WAS UI] Error restoring UI settings:', error);
        }
    }

    /**
     * Add a new schedule
     */
    async addSchedule() {
        const timeInput = document.getElementById('was-time-input');
        const messageInput = document.getElementById('was-message-input');
        const clipboardCheckbox = document.getElementById('was-clipboard-checkbox');
        const contactsInput = document.getElementById('was-contacts-input');
        
        const time = timeInput.value;
        const message = messageInput.value.trim();
        const useClipboard = clipboardCheckbox.checked;
        const contactList = (contactsInput.value || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        
        if (!time) {
            this.showNotification('Error', 'Please select a time', 'error');
            return;
        }
        
        if (!message && !useClipboard) {
            this.showNotification('Error', 'Please enter a message or enable clipboard option', 'error');
            return;
        }
        if (contactList.length === 0) {
            this.showNotification('Note', 'No contacts specified. Message will be sent to the currently open chat.', 'success');
        }
        
        try {
            const success = await window.wasStorage.addSchedule({
                time,
                message,
                useClipboard,
                contactList
            });
            
            if (success) {
                this.showNotification('Success', 'Schedule added successfully', 'success');
                
                // Clear form
                timeInput.value = '';
                messageInput.value = '';
                clipboardCheckbox.checked = false;
                contactsInput.value = '';
                
                // Refresh list
                await this.refreshSchedules();
            } else {
                this.showNotification('Error', 'Failed to add schedule', 'error');
            }
        } catch (error) {
            console.error('[WAS UI] Error adding schedule:', error);
            this.showNotification('Error', 'An error occurred', 'error');
        }
    }

    /**
     * Delete a schedule
     * @param {string} id - Schedule ID
     */
    async deleteSchedule(id) {
        try {
            const success = await window.wasStorage.removeSchedule(id);
            if (success) {
                this.showNotification('Success', 'Schedule deleted', 'success');
                await this.refreshSchedules();
            } else {
                this.showNotification('Error', 'Failed to delete schedule', 'error');
            }
        } catch (error) {
            console.error('[WAS UI] Error deleting schedule:', error);
            this.showNotification('Error', 'An error occurred', 'error');
        }
    }

    /**
     * Refresh the schedules list
     */
    async refreshSchedules() {
        await this.loadData();
        const schedulesList = document.getElementById('was-schedules-list');
        
        if (this.schedules.length === 0) {
            schedulesList.innerHTML = this.getEmptyStateHTML();
        } else {
            schedulesList.innerHTML = this.schedules
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(schedule => this.getScheduleItemHTML(schedule))
                .join('');
            
            // Bind delete buttons
            schedulesList.querySelectorAll('.was-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    this.deleteSchedule(id);
                });
            });
        }
    }

    /**
     * Get HTML for a schedule item
     * @param {Object} schedule - Schedule object
     * @returns {string} HTML string
     */
    getScheduleItemHTML(schedule) {
        const messagePreview = schedule.message || 
            (schedule.useClipboard ? '[Clipboard content]' : '[No message]');
        const statusClass = schedule.sent ? 'sent' : '';
        const statusText = schedule.sent ? 'Sent' : 'Pending';
        
        return `
            <div class="was-schedule-item">
                <div class="was-schedule-time">${schedule.time}</div>
                <div class="was-schedule-message ${!schedule.message ? 'empty' : ''}">
                    ${messagePreview.substring(0, 40)}${messagePreview.length > 40 ? '...' : ''}
                </div>
                <div class="was-schedule-status ${statusClass}">${statusText}</div>
                <div class="was-schedule-actions">
                    <button class="was-btn-sm delete was-delete-btn" 
                            data-id="${schedule.id}" title="Delete">×</button>
                </div>
            </div>
        `;
    }

    /**
     * Get HTML for empty state
     * @returns {string} HTML string
     */
    getEmptyStateHTML() {
        return `
            <div class="was-empty">
                <div class="was-empty-icon">📅</div>
                <div class="was-empty-text">No scheduled messages</div>
                <div class="was-empty-subtext">Add your first message above</div>
            </div>
        `;
    }

    /**
     * Update status bar
     */
    updateStatus() {
        const indicator = this.statusBar.querySelector('.was-status-indicator');
        const text = this.statusBar.querySelector('.was-status-text');
        
        if (!window.wasScheduler) {
            indicator.className = 'was-status-indicator';
            text.textContent = 'Scheduler not ready';
            return;
        }
        
        const status = window.wasScheduler.getStatus();
        
        // Update indicator
        indicator.className = 'was-status-indicator';
        if (status.isConnected && status.isRunning) {
            indicator.classList.add('connected');
        } else if (status.isRunning) {
            indicator.classList.add('running');
        }
        
        // Update text
        const parts = [];
        parts.push(status.isConnected ? 'Connected' : 'Disconnected');
        parts.push(status.isRunning ? 'Running' : 'Stopped');
        parts.push(`Time: ${status.currentTime}`);
        
        text.textContent = parts.join(' • ');
    }

    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        setInterval(() => {
            this.updateStatus();
        }, 1000);
    }

    /**
     * Start dragging the FAB
     * @param {MouseEvent|Touch} e - Mouse or touch event
     */
    startDrag(e) {
        e.preventDefault();
        this.isDragging = false; // Start as false, will be set to true on actual drag
        this.dragStartTime = Date.now();
        this.dragStartPosition = { x: e.clientX, y: e.clientY };
        
        const rect = this.overlay.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        this.launcher.style.cursor = 'grab';
    }

    /**
     * Handle dragging the FAB
     * @param {MouseEvent|Touch} e - Mouse or touch event
     */
    handleDrag(e) {
        if (!this.dragStartTime) return;
        
        // Check if we've moved enough to consider this a drag
        const distance = Math.sqrt(
            Math.pow(e.clientX - this.dragStartPosition.x, 2) + 
            Math.pow(e.clientY - this.dragStartPosition.y, 2)
        );
        
        if (distance > 5 && !this.isDragging) {
            // Start actual dragging
            this.isDragging = true;
            this.launcher.style.cursor = 'grabbing';
            this.overlay.style.transition = 'none'; // Disable transitions during drag
        }
        
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const newX = e.clientX - this.dragOffset.x;
        const newY = e.clientY - this.dragOffset.y;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const fabSize = 70; // FAB width/height
        
        // Constrain to viewport boundaries
        const constrainedX = Math.max(0, Math.min(viewportWidth - fabSize, newX));
        const constrainedY = Math.max(0, Math.min(viewportHeight - fabSize, newY));
        
        // Update position
        this.overlay.style.left = `${constrainedX}px`;
        this.overlay.style.top = `${constrainedY}px`;
        this.overlay.style.right = 'auto';
        this.overlay.style.bottom = 'auto';
    }

    /**
     * End dragging the FAB
     */
    async endDrag() {
        if (!this.dragStartTime) return;
        
        const wasDragging = this.isDragging;
        
        this.dragStartTime = null;
        this.isDragging = false;
        this.launcher.style.cursor = 'pointer';
        this.overlay.style.transition = ''; // Re-enable transitions
        
        if (wasDragging) {
            // Set flag to prevent click event from firing
            this.justFinishedDragging = true;
            
            // Save the new position
            const rect = this.overlay.getBoundingClientRect();
            this.fabPosition = {
                x: rect.left,
                y: rect.top
            };
            
            await this.saveFabPosition();
            
            // Clear the flag after a short delay to allow for any pending click events
            setTimeout(() => {
                this.justFinishedDragging = false;
            }, 50);
        }
    }

    /**
     * Load FAB position from storage
     */
    async loadFabPosition() {
        try {
            const savedPosition = await window.wasStorage.getSetting('fabPosition');
            if (savedPosition) {
                this.fabPosition = savedPosition;
                this.updateFabPosition();
            }
        } catch (error) {
            console.error('[WAS UI] Error loading FAB position:', error);
        }
    }

    /**
     * Save FAB position to storage
     */
    async saveFabPosition() {
        try {
            await window.wasStorage.saveSetting('fabPosition', this.fabPosition);
        } catch (error) {
            console.error('[WAS UI] Error saving FAB position:', error);
        }
    }

    /**
     * Update FAB position based on stored coordinates
     */
    updateFabPosition() {
        // Validate position is still within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const fabSize = 70;
        
        const x = Math.max(0, Math.min(viewportWidth - fabSize, this.fabPosition.x));
        const y = Math.max(0, Math.min(viewportHeight - fabSize, this.fabPosition.y));
        
        this.overlay.style.left = `${x}px`;
        this.overlay.style.top = `${y}px`;
        this.overlay.style.right = 'auto';
        this.overlay.style.bottom = 'auto';
    }

    /**
     * Handle scheduler events
     * @param {CustomEvent} event - Scheduler event
     */
    handleSchedulerEvent(event) {
        const { event: eventType, data } = event.detail;
        
        switch (eventType) {
            case 'messageSent':
                this.showNotification(
                    'Message Sent',
                    `${data.time}: ${data.message}`,
                    'success'
                );
                if (this.isVisible) {
                    this.refreshSchedules();
                }
                break;
        }
    }

    /**
     * Handle post-send action change
     * @param {string} action - Selected action: 'refresh', 'close', or 'none'
     */
    async handlePostSendActionChange(action) {
        try {
            // Save the setting
            this.settings.postSendAction = action;
            await window.wasStorage.saveSetting('postSendAction', action);
            
            // Show feedback to user
            let message = '';
            switch (action) {
                case 'refresh':
                    message = 'Page will refresh after sending scheduled messages to avoid read confirmations';
                    break;
                case 'close':
                    message = 'Tab will close after sending scheduled messages to avoid read confirmations and online status';
                    break;
                case 'none':
                    message = 'No action will be taken after sending messages';
                    break;
            }
            
            this.showNotification(
                'Post-Send Action Updated',
                message,
                'info'
            );
            
            console.log('[WAS UI] Post-send action setting:', action);
        } catch (error) {
            console.error('[WAS UI] Error saving post-send action setting:', error);
            this.showNotification('Error', 'Failed to save post-send action setting', 'error');
        }
    }

    /**
     * Show notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error')
     */
    showNotification(title, message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `was-notification ${type}`;
        notification.innerHTML = `
            <div class="was-notification-title">${title}</div>
            <div class="was-notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }    /**
     * Test message sending functionality
     */
    async testSend() {
        const messageInput = document.getElementById('was-message-input');
        const clipboardCheckbox = document.getElementById('was-clipboard-checkbox');
        const contactsInput = document.getElementById('was-contacts-input');

        let text = (messageInput.value || '').trim();
        if (!text && clipboardCheckbox.checked) {
            try { text = await navigator.clipboard.readText(); } catch { /* ignore */ }
        }
        if (!text) {
            text = 'Test message from WAutoSend';
        }

        const contacts = (contactsInput?.value || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        this.showNotification('Testing', contacts.length ? 'Sending to contacts...' : 'Sending to current chat...', 'success');

        try {
            let success = false;
            if (contacts.length > 0 && window.wasScheduler?.sendToTargets) {
                success = await window.wasScheduler.sendToTargets(text, contacts);
            } else {
                success = await window.wasScheduler.injectAndSendMessage(text);
            }
            
            if (success) {
                this.showNotification('Success', 'Message sent successfully!', 'success');
                
                // Apply post-send action for test sends too
                if (window.wasScheduler?.handlePostSendAction) {
                    await window.wasScheduler.handlePostSendAction();
                }
            } else {
                this.showNotification('Failed', 'Message failed to send', 'error');
            }
        } catch (error) {
            console.error('Test send error:', error);
            this.showNotification('Error', 'Test send error: ' + (error?.message || 'Unknown'), 'error');
        }
    }

    
    getNextSchedule() {
        const currentTime = new Date();
        const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        const pendingSchedules = this.schedules
            .filter(s => !s.sent && s.time > currentTimeStr)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        return pendingSchedules.length > 0 ? pendingSchedules[0] : null;
    }
}

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wasUI = new WASUI();
    });
} else {
    window.wasUI = new WASUI();
}
