# Dashboard Frontend

Production-ready dashboard frontend with modular architecture, built for call center and customer service operations.

## Features

- **Modular Architecture**: Clean separation of concerns with ES6 modules
- **Configurable API Integration**: Environment-based URL configuration
- **Real-time Updates**: WebSocket integration for live data
- **Responsive Design**: Mobile-friendly interface
- **Theme Support**: Light/dark theme switching
- **Accessibility**: WCAG compliant design patterns

## Architecture

```
frontend/
├── index.html          # Main HTML file
├── styles.css          # Global styles
├── app.js             # Application bootstrap
└── components/        # Modular components
    ├── config.js      # API/WebSocket URL helpers
    ├── theme.js       # Theme management
    ├── websocket.js   # WebSocket connection management
    ├── dashboard.js   # Analytics dashboard
    ├── call-history.js # Call history management
    ├── tickets.js     # Ticket system
    ├── customer-lookup.js # Customer search/management
    └── call-playback.js  # Audio playback controls
```

## Setup & Development

### Prerequisites
- Node.js >= 16.0.0

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
This will start a Vite development server at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Configuration

The frontend supports both Vite environment variables and runtime configuration:

### Environment Variables
Set these during development:
```bash
API_URL=http://localhost:3000/api npm run dev
WS_URL=ws://localhost:3000/ws npm run dev
```

### Runtime Configuration
For production deployment, you can inject configuration via global variables:
```html
<script>
  window.__ENV = {
    API_URL: 'https://api.yourdomain.com',
    WS_URL: 'wss://ws.yourdomain.com'
  };
</script>
```

### Same-Origin Fallback
If no explicit URLs are configured, the app will automatically use:
- API: `{protocol}//{hostname}:{port}/api`
- WebSocket: `{protocol.replace('http', 'ws')}//{hostname}:{port}/ws`

## API Integration

All network requests go through the `config.js` helpers:

### API Calls
```javascript
import { buildApiUrl } from './components/config.js';

const response = await fetch(buildApiUrl('/dashboard/analytics'));
const data = await response.json();
```

### WebSocket Connection
```javascript
import { buildWsUrl } from './components/config.js';

const ws = new WebSocket(buildWsUrl('/ws'));
```

### Recording Uploads
Uploads are handled via fetch to the configured API base:
```javascript
const formData = new FormData();
formData.append('recording', audioFile);

const response = await fetch(buildApiUrl(`/calls/${callId}/recordings`), {
  method: 'POST',
  body: formData
});
```

## Components

### Dashboard
- Real-time analytics cards
- Auto-refresh every 5 minutes
- Animated number transitions

### Call History
- Paginated call listing
- Search and filter capabilities
- Direct playback/download links

### Tickets
- CRUD operations for support tickets
- Status and priority management
- Customer association

### Customer Lookup
- Real-time customer search
- Customer details modal
- Call initiation integration

### Call Playback
- Audio playback controls
- Progress tracking
- Speed control and seeking

### WebSocket
- Automatic reconnection
- Heartbeat monitoring
- Message event handling

## Global Functions

The application exposes several global functions:

```javascript
// Navigation
window.navigateToSection('dashboard');

// Notifications
window.showNotification('Success message', 'success');

// Play call recording (as mentioned in requirements)
window.playCallRecording(audioUrl, callId, callData);

// Access to components
window.dashboardComponent
window.callHistoryComponent
window.ticketsComponent
window.customerLookupComponent
window.callPlaybackComponent
```

## Theme Support

- Automatic system theme detection
- Manual theme toggle
- Persistent theme preference
- CSS custom properties integration

## Browser Support

- Modern browsers with ES6 module support
- Chrome 61+
- Firefox 60+
- Safari 11.1+
- Edge 16+

## Development Notes

- Uses ES6 modules with named imports/exports
- Follows modern JavaScript patterns
- Includes mock data fallbacks for development
- Responsive CSS with mobile-first approach
- Accessible HTML with semantic elements

## Integration with Backend

The frontend is designed to work with a REST API backend and WebSocket server. Expected endpoints:

- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/call-history` - Call history with pagination
- `GET /api/tickets` - Tickets with filtering
- `GET /api/customers/search` - Customer search
- `GET /api/calls/{id}/recording` - Audio file download
- `POST /api/calls/{id}/recordings` - Upload recording
- `WebSocket /ws` - Real-time updates

See the component files for detailed API interaction patterns.