# Components

Modular components for the status page with **original design preserved**.

## Structure

```
src/components/
├── Icons.ts           # SVG icons (service, hero, status)
├── StatusBadge.ts     # Status indicator badge
├── ServiceCard.ts     # Service card component
├── RefreshTimer.ts    # Circular refresh timer ⏰
├── StatusPage.ts      # Complete page layout (original design)
├── ServiceChecker.ts  # Service health checking
├── ResponseBuilder.ts # HTTP response helpers
└── index.ts           # Exports
```

## Features

### ✨ Original Design Preserved
- Navigation bar with logo
- Hero banner with status indicators
- 90-day uptime history bars
- Incident cards
- API documentation section
- Footer with columns
- Client-side auto-refresh

### ⏰ New Circular Refresh Timer
- Small, text-sized (16px)
- Shows countdown next to "รีเฟรชใน" text
- Full circle = recently refreshed
- Empties as time runs out
- Auto-reloads page when timer reaches zero
- Added below the services card

## Usage

All components are exported from `./components`:

```typescript
import { 
  StatusPage, 
  checkAllServices, 
  calculateOverallStatus,
  RefreshTimer
} from './components';
```

## Main Components

### StatusPage
Complete HTML page with original design + circular refresh timer.

### RefreshTimer
Circular progress timer showing time until auto-refresh.

```typescript
RefreshTimer({
  lastUpdated: new Date().toISOString(),
  refreshInterval: 60
})
```

### ServiceChecker
Check service health with timeout and JSON status support.

```typescript
const services = await checkAllServices(SERVICES);
const overall = calculateOverallStatus(services);
```

## Architecture

**Main file (78 lines):** `src/index.ts`
- Clean request handler
- Uses components for all rendering
- No monolithic HTML strings

**Components:** ~41KB total (down from 88KB monolithic)
- Reusable
- Type-safe
- Easy to maintain

## Example

See `src/index.ts` for complete usage example.
