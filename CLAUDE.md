# ByteSide Status Page — Claude Instructions

## Design Context

### Users
Thai tech and gaming enthusiasts who visit ByteSide.one for news. They come to the status page when something feels off — they want a quick, honest answer about service health. Context: often on mobile, may be mid-frustration, need immediate clarity without jargon.

### Brand Personality
**Playful, Approachable, Fresh**

ByteSide is a Thai-native tech and gaming brand with personality. The status page should feel like a friendly, transparent extension of that brand — not a cold enterprise dashboard. Tone: honest, warm, never corporate or stiff.

### Aesthetic Direction
- **Visual tone**: Light, modern cards with the signature ByteSide purple (`#52006A`) as an accent — not dominant. Status colors (green/amber/red) do the heavy lifting.
- **Feel**: Approachable and fresh — subtle personality without being distracting when users are checking for problems.
- **Theme**: Light and dark mode both polished; system preference detection already in place.
- **Anti-reference**: Avoid cold enterprise aesthetics. Avoid over-engineering animations or making it feel like a SaaS product dashboard.

### Typography
- **Body/UI**: IBM Plex Sans Thai — must remain crisp and legible for Thai script at all sizes
- **Code/Metrics**: JetBrains Mono for response times and technical values
- Thai script legibility is a primary accessibility concern; never sacrifice font size or weight for density

### Accessibility Requirements
- **WCAG AA** contrast (4.5:1 minimum) — especially critical for status badge text on colored backgrounds
- **Thai font clarity** — sufficient size (min 14px body), comfortable line-height (1.6)

### Design Principles

1. **Honest at a glance** — Status must be immediately obvious without reading. Color + icon + label, never ambiguous.

2. **Fresh but functional** — Personality lives in brand touches (purple accent, warm card radius, smooth micro-animations). Data is always the hero.

3. **Thai-first** — Typography and spacing validated for Thai script. IBM Plex Sans Thai should shine.

4. **Calm by default, urgent when needed** — Reassuring when green; visually escalates when degraded or down.

5. **Light touch on animation** — Every animation communicates state, never decorates.
