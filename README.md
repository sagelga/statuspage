# ByteSide.one Status Page

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)

Real-time status monitoring page for ByteSide.one services — a Thai technology and gaming news platform.

![Status Page Preview](./public/img/status-preview.png)

## Features

- 🟢 **Real-time Monitoring** — Checks service health with response time tracking
- 📊 **Status Indicators** — Overall system status (operational, degraded, down)
- 📅 **30-Day History** — Visual incident history for each service
- 🌙 **Theme Toggle** — Dark/light mode with system preference detection
- 🇹🇭 **Thai Language** — Localized interface for Thai users
- 🔄 **Auto-refresh** — Automatic status updates every minute

## Monitored Services

| Service | Description |
|---------|-------------|
| Cloudflare | CDN & DDoS protection |
| Website | Main website availability |
| R2 Content | Image & video hosting |
| Notion Sync | Content synchronization |
| Notion | Database availability |

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/statuspage.git
cd statuspage

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the status page.

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Linting

```bash
npm run lint
```

## Configuration

Edit [`src/config.ts`](src/config.ts) to customize:

```typescript
// Service definitions
export const SERVICES: ServiceDefinition[] = [
  {
    id: 'cloudflare',
    name: 'เครือข่าย Cloudflare',
    icon: 'shield',
    url: 'https://www.cloudflarestatus.com/api/v2/status.json',
    jsonStatus: { /* ... */ }
  },
  // Add more services...
];

// Thresholds
export const TIMEOUT_MS = 5000;        // Request timeout
export const DEGRADED_THRESHOLD_MS = 1500;  // Slow response threshold
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── status/         # Main status API endpoint
│   │   └── minutes/        # Minute-level history API
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── Navbar/             # Navigation
│   ├── Hero/               # Status hero section
│   ├── ServiceList/        # Service status cards
│   ├── IncidentHistory/    # History charts
│   ├── Footer/             # Footer with theme toggle
│   └── ...
├── config.ts               # Service & site configuration
└── types.ts                # TypeScript definitions
```

## API

### `GET /api/status`

Returns current status of all monitored services.

**Response:**
```json
{
  "status": "operational",
  "checkedAt": "2026-03-17T10:00:00.000Z",
  "services": [
    {
      "id": "cloudflare",
      "name": "เครือข่าย Cloudflare",
      "status": "operational",
      "responseTime": 120,
      "statusCode": 200
    }
  ],
  "history": {
    "cloudflare": ["operational", "operational", "..."]
  }
}
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel deploy
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Technologies

- [Next.js 16](https://nextjs.org) — React framework
- [TypeScript](https://typescriptlang.org) — Type safety
- [Tailwind CSS 4](https://tailwindcss.com) — Styling
- [IBM Plex Sans Thai](https://fonts.google.com) — Thai font
- [JetBrains Mono](https://fonts.google.com) — Code font

## License

MIT © ByteSide.one

## Contact

- **Website**: [byteside.one](https://byteside.one)
- **Status**: [status.sagelga.com](https://status.sagelga.com)
- **Email**: support@byteside.one
- **Facebook**: [facebook.com/byteside](https://facebook.com/byteside)
