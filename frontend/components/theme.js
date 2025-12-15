// Theme management for the dashboard

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'Light',
                isDark: false,
                colors: {
                    primary: '#3498db',
                    secondary: '#2c3e50',
                    background: '#f5f7fa',
                    surface: '#ffffff',
                    text: '#333333',
                    textSecondary: '#7f8c8d',
                    border: '#e1e8ed',
                    success: '#27ae60',
                    warning: '#f39c12',
                    error: '#e74c3c'
                }
            },
            dark: {
                name: 'Dark',
                isDark: true,
                colors: {
                    primary: '#3498db',
                    secondary: '#34495e',
                    background: '#2c3e50',
                    surface: '#34495e',
                    text: '#ecf0f1',
                    textSecondary: '#bdc3c7',
                    border: '#4a6741',
                    success: '#27ae60',
                    warning: '#f39c12',
                    error: '#e74c3c'
                }
            }
        };
        
        this.currentTheme = 'light';
        this.listeners = new Set();
        
        // Load saved theme preference
        this.loadThemePreference();
        
        // Apply theme on initialization
        this.applyTheme();
    }

    /**
     * Switch to a different theme
     * @param {string} themeName - Name of the theme ('light' or 'dark')
     */
    switchTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.applyTheme();
            this.saveThemePreference();
            this.notifyListeners();
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.switchTheme(newTheme);
    }

    /**
     * Apply the current theme to the document
     */
    applyTheme() {
        const theme = this.themes[this.currentTheme];
        const root = document.documentElement;
        
        // Apply CSS custom properties
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
        
        // Set data attribute for CSS selectors
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Update meta theme-color for mobile browsers
        this.updateThemeColor(theme.colors.primary);
        
        console.log(`Applied ${theme.name} theme`);
    }

    /**
     * Update meta theme-color for mobile browsers
     * @param {string} color - Theme color
     */
    updateThemeColor(color) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = color;
    }

    /**
     * Get the current theme object
     * @returns {Object} Current theme object
     */
    getCurrentTheme() {
        return this.themes[this.currentTheme];
    }

    /**
     * Get available themes
     * @returns {Object} Available themes
     */
    getAvailableThemes() {
        return this.themes;
    }

    /**
     * Check if current theme is dark
     * @returns {boolean} True if dark theme is active
     */
    isDarkTheme() {
        return this.themes[this.currentTheme].isDark;
    }

    /**
     * Add theme change listener
     * @param {Function} callback - Callback function(themeName, theme)
     */
    addListener(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove theme change listener
     * @param {Function} callback - Callback function to remove
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify theme change listeners
     */
    notifyListeners() {
        const theme = this.themes[this.currentTheme];
        this.listeners.forEach(callback => {
            try {
                callback(this.currentTheme, theme);
            } catch (error) {
                console.error('Error in theme listener:', error);
            }
        });
    }

    /**
     * Save theme preference to localStorage
     */
    saveThemePreference() {
        try {
            localStorage.setItem('dashboard-theme', this.currentTheme);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    /**
     * Load theme preference from localStorage
     */
    loadThemePreference() {
        try {
            const saved = localStorage.getItem('dashboard-theme');
            if (saved && this.themes[saved]) {
                this.currentTheme = saved;
            }
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
        }
    }

    /**
     * Get system theme preference
     * @returns {string} 'light' or 'dark'
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Follow system theme preference
     */
    followSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            const systemTheme = e.matches ? 'dark' : 'light';
            this.switchTheme(systemTheme);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        
        // Apply current system theme
        this.switchTheme(this.getSystemTheme());
        
        return () => mediaQuery.removeEventListener('change', handleChange);
    }

    /**
     * Initialize theme toggle functionality in the UI
     */
    initializeThemeToggle() {
        // Create theme toggle button if it doesn't exist
        let themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) {
            themeToggle = document.createElement('button');
            themeToggle.id = 'themeToggle';
            themeToggle.className = 'theme-toggle';
            themeToggle.innerHTML = this.isDarkTheme() ? '☀️' : '🌙';
            themeToggle.title = 'Toggle theme';
            
            // Add to navbar
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                const statusDiv = navbar.querySelector('.connection-status').parentNode;
                statusDiv.appendChild(themeToggle);
            }
        }
        
        // Add click event listener
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
            themeToggle.innerHTML = this.isDarkTheme() ? '☀️' : '🌙';
        });
    }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export both the class and instance
export default themeManager;
export { ThemeManager };