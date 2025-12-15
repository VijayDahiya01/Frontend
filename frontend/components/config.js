// Configuration helper for API and WebSocket URLs
// Supports both Vite environment variables and window.__ENV fallback

const getEnvVar = (key, defaultValue = '') => {
    // Check Vite environment variables (for dev mode)
    try {
        if (import.meta && import.meta.env && import.meta.env[key]) {
            const viteValue = import.meta.env[key];
            if (viteValue && viteValue !== '') {
                return viteValue;
            }
        }
    } catch (e) {
        // import.meta not available
    }
    
    // Check window.__ENV fallback
    if (typeof window !== 'undefined' && window.__ENV && window.__ENV[key]) {
        return window.__ENV[key];
    }
    
    return defaultValue;
};

/**
 * Build API URL with proper path joining
 * @param {string} path - API path (e.g., '/dashboard', '/api/users')
 * @returns {string} Complete API URL
 */
export const buildApiUrl = (path) => {
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Get base API URL from environment
    let baseApiUrl = getEnvVar('VITE_API_URL', '');
    
    // If no explicit API URL configured, use same origin with /api fallback
    if (!baseApiUrl) {
        const isHttps = window.location.protocol === 'https:';
        const protocol = isHttps ? 'https:' : 'http:';
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Build same-origin API URL
        baseApiUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    }
    
    // Remove trailing slash from base URL and add leading slash to path
    const cleanBaseUrl = baseApiUrl.replace(/\/$/, '');
    const cleanPathWithSlash = '/' + cleanPath;
    
    return cleanBaseUrl + cleanPathWithSlash;
};

/**
 * Build WebSocket URL with proper path joining
 * @param {string} path - WebSocket path (e.g., '/ws', '/websocket')
 * @returns {string} Complete WebSocket URL
 */
export const buildWsUrl = (path) => {
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Get base WebSocket URL from environment
    let baseWsUrl = getEnvVar('VITE_WS_URL', '');
    
    // If no explicit WS URL configured, use same origin with ws:// protocol
    if (!baseWsUrl) {
        const isHttps = window.location.protocol === 'https:';
        const protocol = isHttps ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Build same-origin WebSocket URL
        baseWsUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/ws`;
    }
    
    // Remove trailing slash from base URL and add leading slash to path
    const cleanBaseUrl = baseWsUrl.replace(/\/$/, '');
    const cleanPathWithSlash = '/' + cleanPath;
    
    return cleanBaseUrl + cleanPathWithSlash;
};

/**
 * Get current environment configuration
 * @returns {Object} Environment configuration object
 */
export const getEnvConfig = () => {
    return {
        API_URL: getEnvVar('VITE_API_URL', ''),
        WS_URL: getEnvVar('VITE_WS_URL', ''),
        NODE_ENV: getEnvVar('NODE_ENV', 'development')
    };
};

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
    return getEnvVar('NODE_ENV', 'development') === 'development';
};

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
    return getEnvVar('NODE_ENV', 'development') === 'production';
};

// Export default configuration object
export default {
    buildApiUrl,
    buildWsUrl,
    getEnvConfig,
    isDevelopment,
    isProduction
};