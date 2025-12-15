import { buildApiUrl } from './config.js';

class CallPlayback {
    constructor() {
        this.currentAudio = null;
        this.currentCall = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.duration = 0;
        this.progressInterval = null;
        this.volume = 1.0;
    }

    /**
     * Initialize call playback
     */
    async init() {
        console.log('Initializing Call Playback...');
        this.bindEvents();
        this.setupGlobalFunctions();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Play button
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlayPause());
        }

        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }

        // Stop button
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }

        // Speed control
        const speedControl = document.getElementById('playbackSpeed');
        if (speedControl) {
            speedControl.addEventListener('change', () => this.changePlaybackSpeed());
        }

        // Volume control
        const volumeControl = document.getElementById('volumeControl');
        if (volumeControl) {
            volumeControl.addEventListener('input', () => this.changeVolume());
        }

        // Time display controls
        this.bindTimeControls();
    }

    /**
     * Bind time control events
     */
    bindTimeControls() {
        // Jump back 10 seconds
        const jumpBackBtn = document.getElementById('jumpBackBtn');
        if (jumpBackBtn) {
            jumpBackBtn.addEventListener('click', () => this.jumpTime(-10));
        }

        // Jump forward 10 seconds
        const jumpForwardBtn = document.getElementById('jumpForwardBtn');
        if (jumpForwardBtn) {
            jumpForwardBtn.addEventListener('click', () => this.jumpTime(10));
        }

        // Seek bar
        const seekBar = document.getElementById('seekBar');
        if (seekBar) {
            seekBar.addEventListener('input', () => this.seekTo(seekBar.value));
        }

        // Progress bar click
        const progressBar = document.getElementById('playbackProgress');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekToProgressBar(e));
        }
    }

    /**
     * Set up global functions for external access
     */
    setupGlobalFunctions() {
        // Global function to play call recording (as mentioned in the ticket)
        window.playCallRecording = (audioUrl, callId) => {
            this.playRecording(audioUrl, callId);
        };

        // Make this instance globally accessible for modal callbacks
        window.callPlayback = this;
    }

    /**
     * Play call recording
     * @param {string} audioUrl - Audio file URL
     * @param {string} callId - Call ID
     * @param {Object} callData - Additional call data
     */
    async playRecording(audioUrl, callId, callData = null) {
        try {
            this.stop(); // Stop any currently playing audio
            
            this.currentCall = {
                id: callId,
                ...callData
            };

            // Create new audio element
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.volume = this.volume;

            // Bind audio events
            this.bindAudioEvents();

            // Load and play
            this.currentAudio.load();
            await this.currentAudio.play();

            this.isPlaying = true;
            this.isPaused = false;
            this.updatePlayButtonStates();
            this.updateCallInfo();

            // Start progress updates
            this.startProgressUpdates();

            console.log(`Playing recording for call ${callId}`);

        } catch (error) {
            console.error('Failed to play recording:', error);
            this.showNotification('Failed to play recording', 'error');
        }
    }

    /**
     * Bind audio element events
     */
    bindAudioEvents() {
        if (!this.currentAudio) return;

        this.currentAudio.addEventListener('loadedmetadata', () => {
            this.duration = this.currentAudio.duration;
            this.updateDurationDisplay();
            this.updateSeekBar();
        });

        this.currentAudio.addEventListener('timeupdate', () => {
            this.currentTime = this.currentAudio.currentTime;
            this.updateTimeDisplay();
            this.updateProgressBar();
            this.updateSeekBar();
        });

        this.currentAudio.addEventListener('ended', () => {
            this.onPlaybackEnded();
        });

        this.currentAudio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            this.showNotification('Audio playback error', 'error');
            this.stop();
        });

        this.currentAudio.addEventListener('loadstart', () => {
            this.showNotification('Loading recording...', 'info');
        });

        this.currentAudio.addEventListener('canplay', () => {
            this.hideNotification();
        });
    }

    /**
     * Toggle play/pause
     */
    async togglePlayPause() {
        if (this.isPlaying && !this.isPaused) {
            this.pause();
        } else if (this.isPaused || (!this.isPlaying && this.currentAudio)) {
            this.resume();
        } else {
            this.showNotification('No recording loaded', 'warning');
        }
    }

    /**
     * Pause playback
     */
    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.isPaused = true;
            this.isPlaying = false;
            this.updatePlayButtonStates();
        }
    }

    /**
     * Resume playback
     */
    async resume() {
        if (this.currentAudio && this.isPaused) {
            try {
                await this.currentAudio.play();
                this.isPaused = false;
                this.isPlaying = true;
                this.updatePlayButtonStates();
                this.startProgressUpdates();
            } catch (error) {
                console.error('Failed to resume playback:', error);
                this.showNotification('Failed to resume playback', 'error');
            }
        }
    }

    /**
     * Stop playback
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.currentTime = 0;
            this.updatePlayButtonStates();
            this.updateTimeDisplay();
            this.updateProgressBar();
            this.updateSeekBar();
        }
        
        this.stopProgressUpdates();
    }

    /**
     * Jump time forward/backward
     * @param {number} seconds - Seconds to jump (negative for back)
     */
    jumpTime(seconds) {
        if (!this.currentAudio) return;

        const newTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
        this.currentAudio.currentTime = newTime;
        this.currentTime = newTime;
        this.updateTimeDisplay();
        this.updateProgressBar();
        this.updateSeekBar();
    }

    /**
     * Seek to specific time
     * @param {number} time - Time in seconds
     */
    seekTo(time) {
        if (!this.currentAudio) return;

        const seekTime = Math.max(0, Math.min(this.duration, time));
        this.currentAudio.currentTime = seekTime;
        this.currentTime = seekTime;
        this.updateProgressBar();
        this.updateTimeDisplay();
    }

    /**
     * Seek based on progress bar click
     * @param {Event} event - Click event
     */
    seekToProgressBar(event) {
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const seekTime = percentage * this.duration;
        this.seekTo(seekTime);
    }

    /**
     * Change playback speed
     */
    changePlaybackSpeed() {
        const speedControl = document.getElementById('playbackSpeed');
        if (speedControl && this.currentAudio) {
            const speed = parseFloat(speedControl.value);
            this.currentAudio.playbackRate = speed;
            this.showNotification(`Playback speed: ${speed}x`, 'info');
        }
    }

    /**
     * Change volume
     */
    changeVolume() {
        const volumeControl = document.getElementById('volumeControl');
        if (volumeControl) {
            this.volume = parseFloat(volumeControl.value);
            if (this.currentAudio) {
                this.currentAudio.volume = this.volume;
            }
        }
    }

    /**
     * Start progress updates
     */
    startProgressUpdates() {
        this.stopProgressUpdates();
        // Progress is handled by audio timeupdate event
    }

    /**
     * Stop progress updates
     */
    stopProgressUpdates() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Update play button states
     */
    updatePlayButtonStates() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (playBtn && pauseBtn) {
            if (this.isPlaying && !this.isPaused) {
                playBtn.disabled = true;
                pauseBtn.disabled = false;
            } else if (this.isPaused) {
                playBtn.disabled = false;
                pauseBtn.disabled = true;
            } else {
                playBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        }
    }

    /**
     * Update call info display
     */
    updateCallInfo() {
        const callInfo = document.getElementById('currentCallInfo');
        if (!callInfo) return;

        if (this.currentCall) {
            callInfo.innerHTML = `
                <div class="call-details">
                    <h4>Call #${this.currentCall.id}</h4>
                    ${this.currentCall.customer ? `<p><strong>Customer:</strong> ${this.currentCall.customer}</p>` : ''}
                    ${this.currentCall.agent ? `<p><strong>Agent:</strong> ${this.currentCall.agent}</p>` : ''}
                    ${this.currentCall.duration ? `<p><strong>Duration:</strong> ${this.formatDuration(this.currentCall.duration)}</p>` : ''}
                    ${this.currentCall.date ? `<p><strong>Date:</strong> ${this.formatDate(this.currentCall.date)}</p>` : ''}
                </div>
            `;
        } else {
            callInfo.innerHTML = '<p>No call selected</p>';
        }
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const currentTimeDisplay = document.getElementById('currentTime');
        const durationDisplay = document.getElementById('duration');
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(this.currentTime);
        }
        
        if (durationDisplay) {
            durationDisplay.textContent = this.formatTime(this.duration);
        }
    }

    /**
     * Update duration display
     */
    updateDurationDisplay() {
        const durationDisplay = document.getElementById('duration');
        if (durationDisplay) {
            durationDisplay.textContent = this.formatTime(this.duration);
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progressBar = document.getElementById('playbackProgress');
        if (progressBar && this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }

    /**
     * Update seek bar
     */
    updateSeekBar() {
        const seekBar = document.getElementById('seekBar');
        if (seekBar && this.duration > 0) {
            seekBar.max = this.duration.toString();
            seekBar.value = this.currentTime.toString();
        }
    }

    /**
     * Handle playback ended
     */
    onPlaybackEnded() {
        this.isPlaying = false;
        this.isPaused = false;
        this.updatePlayButtonStates();
        this.stopProgressUpdates();
        
        // Auto-reset to beginning
        setTimeout(() => {
            this.currentAudio.currentTime = 0;
            this.currentTime = 0;
            this.updateTimeDisplay();
            this.updateProgressBar();
            this.updateSeekBar();
        }, 1000);
        
        this.showNotification('Playback completed', 'success');
    }

    /**
     * Load call recording from call ID
     * @param {string} callId - Call ID
     */
    async loadCallRecording(callId) {
        try {
            const apiUrl = buildApiUrl(`/calls/${callId}/recording`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            // Get call details
            const callDetailsUrl = buildApiUrl(`/calls/${callId}`);
            const detailsResponse = await fetch(callDetailsUrl);
            let callData = null;
            
            if (detailsResponse.ok) {
                callData = await detailsResponse.json();
            }
            
            await this.playRecording(audioUrl, callId, callData);
            
        } catch (error) {
            console.error('Failed to load call recording:', error);
            this.showNotification('Failed to load call recording', 'error');
        }
    }

    /**
     * Format time in seconds to MM:SS or HH:MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        if (!seconds || seconds < 0) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Format duration in seconds to readable format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        return this.formatTime(seconds);
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (!date) return 'Unknown';
        
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Hide current notification
     */
    hideNotification() {
        // This would hide any loading notifications
        // Implementation depends on how notifications are displayed
    }

    /**
     * Get current playback state
     * @returns {Object} Playback state
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentTime: this.currentTime,
            duration: this.duration,
            currentCall: this.currentCall,
            volume: this.volume
        };
    }

    /**
     * Check if currently playing
     * @returns {boolean} True if playing
     */
    isCurrentlyPlaying() {
        return this.isPlaying && !this.isPaused;
    }

    /**
     * Clean up call playback component
     */
    destroy() {
        this.stop();
        this.currentAudio = null;
        this.currentCall = null;
        this.stopProgressUpdates();
    }
}

// Export the CallPlayback class
export default CallPlayback;