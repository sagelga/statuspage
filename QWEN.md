# ByteSide.one Status Page

## Project Overview

This is a **Next.js 16** status page application for ByteSide.one, a Thai technology and gaming news website. The application provides real-time monitoring and display of service statuses for various infrastructure components including Cloudflare, website, image hosting, and Notion integration.

### Key Features
- Real-time service status checking with response time monitoring
- Overall system status calculation (operational, degraded, down)
- 30-day incident history tracking
- Dark/light theme toggle with system preference detection
- Thai language interface
- RESTful API for status data

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19.2.3 |
| Styling | Tailwind CSS 4 |
| Linting | ESLint 9 + eslint-config-next |

## Project Structure

```
statuspage/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── status/         # GET /api/status - Main status endpoint
│   │   │   └── minutes/        # GET /api/minutes/[serviceId] - Minute history
│   │   ├── layout.tsx          # Root layout with Thai language & fonts
│   │   ├── page.tsx            # Main status page component
│   │   └── globals.css         # Global styles with CSS variables
│   ├── components/
│   │   ├── Navbar/             # Navigation bar
│   │   ├── Hero/               # Status hero section
│   │   ├── ServiceList/        # Service status list display
│   │   ├── IncidentHistory/    # 30-day incident history
│   │   ├── ApiSection/         # API documentation
│   │   ├── Footer/             # Footer with theme toggle
│   │   ├── RefreshTimer/       # Auto-refresh timer
│   │   ├── Icons.ts            # Icon components (Lucide-style)
│   │   ├── ServiceChecker.ts   # Service health checking logic
│   │   └── HistoryManager.ts   # History data management
│   ├── config.ts               # Service definitions & thresholds
│   ├── types.ts                # TypeScript type definitions
│   └── App.css                 # Additional app styles
├── public/                     # Static assets
├── package.json
├── tsconfig.json               # TypeScript config with path aliases (@/*)
├── next.config.ts              # Next.js configuration
├── eslint.config.mjs           # ESLint configuration
└── postcss.config.mjs          # PostCSS with Tailwind
```

## Building and Running

### Development
```bash
npm run dev
```
Starts the development server at `http://localhost:3000`

### Production Build
```bash
npm run build    # Build for production
npm run start    # Start production server
```

### Linting
```bash
npm run lint     # Run ESLint
```

## Configuration

### Service Definitions (`src/config.ts`)

Services are configured in the `SERVICES` array with the following structure:

```typescript
{
  id: string,           // Unique identifier
  name: string,         // Display name (Thai)
  icon: string,         // Icon name from Icons.ts
  url: string,          // Health check endpoint
  jsonStatus?: {        // Optional: JSON response parsing
    path: string,       // Dot-notation path to status field
    map: Record<string, ServiceStatus>
  }
}
```

### Thresholds
- **Timeout**: 5000ms (5 seconds)
- **Degraded**: Response time > 1500ms

### Site Config
- **Name**: ByteSide.one
- **URL**: https://status.sagelga.com
- **Brand Color**: #52006A
- **Contact**: support@byteside.one

## Type Definitions (`src/types.ts`)

```typescript
ServiceStatus = 'operational' | 'degraded' | 'down'

ServiceDefinition {
  id, name, icon, url, jsonStatus?
}

ServiceResult {
  id, name, icon, status, responseTime, statusCode
}

StatusResponse {
  status, checkedAt, services, history
}
```

## Development Conventions

### TypeScript
- Strict mode enabled
- Path alias `@/*` maps to `./src/*`
- No emit (Next.js handles compilation)

### Code Style
- ESLint with `eslint-config-next` (Next.js recommended rules)
- Tailwind CSS 4 for styling
- Functional React components with hooks
- ES modules syntax

### Component Patterns
- Client components use `'use client'` directive
- Server components for API routes
- Props interfaces defined separately or inline
- Icons imported from centralized `Icons.ts`

### Testing
No test framework configured. Consider adding Jest/React Testing Library for future testing needs.

## API Endpoints

### `GET /api/status`
Returns current status of all services.

**Response:**
```json
{
  "status": "operational",
  "checkedAt": "2026-03-17T10:00:00.000Z",
  "services": [
    {
      "id": "cloudflare",
      "name": "เครือข่าย Cloudflare",
      "icon": "shield",
      "status": "operational",
      "responseTime": 120,
      "statusCode": 200
    }
  ],
  "history": {
    "cloudflare": ["operational", "operational", ...]
  }
}
```

### `GET /api/minutes/[serviceId]`
Returns minute-by-minute history for a specific service.

## Notes

- History management uses mock implementations (in-memory arrays)
- Theme preference stored in localStorage
- Auto-refresh mechanism via RefreshTimer component
- Google Fonts: IBM Plex Sans Thai (UI) + JetBrains Mono (code)
