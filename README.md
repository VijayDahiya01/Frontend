# Customer Care Dashboard

A modern frontend application for managing customer care operations, built with Vite.

## Features

- **Real-time Updates**: WebSocket integration for live data streaming
- **Customer Management**: View and manage customer information
- **Support Ticket System**: Track and resolve customer support tickets
- **Analytics Dashboard**: Monitor key metrics and performance indicators
- **User Authentication**: Secure login and session management
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Search & Filtering**: Quickly find customers and tickets
- **Status Tracking**: Monitor ticket status and resolution progress
- **Notes & History**: Maintain detailed interaction logs
- **Notifications**: Real-time alerts for important events

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd customer-care-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file to configure your API and WebSocket URLs:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
```

**Note**: These URLs should point to your backend API server. The frontend and backend are separate repositories.

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

### `npm run dev`

Starts the Vite development server with hot module replacement (HMR). The server will automatically reload when you make changes to the source files.

### `npm run build`

Creates an optimized production build in the `dist/` directory. The build is minified and optimized for best performance.

### `npm run preview`

Serves the production build locally for testing. Run `npm run build` first to generate the production files.

## Project Structure

```
customer-care-dashboard/
├── frontend/                # Frontend source files
│   ├── components/         # Reusable components
│   │   └── config.js       # Environment configuration
│   ├── index.html          # Entry HTML file
│   ├── main.js             # Main JavaScript entry point
│   └── style.css           # Global styles
├── dist/                   # Production build output (generated)
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Dependency lock file
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## Backend Integration

This frontend application is designed to work with a separate backend repository. The communication happens through:

1. **REST API**: HTTP requests to `VITE_API_URL` for CRUD operations
2. **WebSocket**: Real-time bidirectional communication via `VITE_WS_URL`

Make sure your backend server is running and accessible at the URLs configured in your `.env` file before starting the frontend.

### Backend Requirements

The backend should provide:

- RESTful API endpoints at `/api/*`
- WebSocket server at `/ws`
- CORS configuration allowing the frontend origin
- Authentication endpoints if applicable

## Environment Variables

All environment variables used by the frontend must be prefixed with `VITE_` to be exposed to the client-side code:

- `VITE_API_URL`: Base URL for the REST API
- `VITE_WS_URL`: WebSocket server URL

These are accessed in the code via `import.meta.env.VITE_*`.

## Building for Production

To create a production build:

```bash
npm run build
```

The optimized files will be in the `dist/` directory. You can serve these files with any static hosting service (Nginx, Apache, Netlify, Vercel, etc.).

To test the production build locally:

```bash
npm run preview
```

## Development Tips

- The development server supports Hot Module Replacement (HMR) for instant updates
- Environment variables are loaded from `.env` during development
- For production, make sure to set environment variables in your hosting platform
- The `dist/` directory is automatically cleaned on each build

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check the terminal output for the actual URL.

### Environment Variables Not Working

- Ensure your `.env` file exists in the project root
- Variable names must start with `VITE_`
- Restart the dev server after changing `.env`

### Cannot Connect to Backend

- Verify the backend server is running
- Check that `VITE_API_URL` and `VITE_WS_URL` are correct in your `.env` file
- Ensure the backend has proper CORS configuration

## License

[Your License Here]
