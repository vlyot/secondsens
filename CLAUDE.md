# CLAUDE.md

Project-wide guidance for Claude Code when working in this repository.

## Documentation Structure

**MANDATORY**: Before making changes, ALWAYS read the relevant CLAUDE.md file first:

- **[src/CLAUDE.md](src/CLAUDE.md)** - Frontend development (React, TypeScript, Tailwind, shadcn/ui)
- **[backend/CLAUDE.md](backend/CLAUDE.md)** - Backend development (API, database, services)
- **[docs/](docs/)** - Detailed references and examples:
  - [typography.md](docs/typography.md) - Complete typography system reference
  - [shadcn-workflow.md](docs/shadcn-workflow.md) - shadcn/ui workflow and philosophy
  - [component-examples.md](docs/component-examples.md) - Real-world code patterns

## Files to NEVER Edit

**DO NOT TOUCH** these files unless explicitly requested:
- `todo` - User's task tracking file
- `plan.md` - Implementation planning document

## Project Overview

React + TypeScript + Vite application using Tailwind CSS v4 and shadcn/ui ("new-york" style).

**Key Technologies**:
- React 19.2.0 with TypeScript
- Vite 7.x for build tooling
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- shadcn/ui components with Lucide icons
- FontAwesome icons (preferred for custom icons)

**Critical Rules**:
1. Always use typography components instead of raw HTML + Tailwind
2. Check shadcn/ui before creating custom components
3. Use FontAwesome icons - **NEVER use emojis in the UI**
4. Maintain semantic HTML for accessibility
5. Refer to `plan.md` for implementation tasks

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript build → Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

### Path Aliases
- `@/*` → `./src/*`
- `@/components` - UI components directory
- `@/lib/utils` - Utility functions (includes `cn()` helper)
- `@/ui` - UI component subdirectory
- `@/hooks` - React hooks directory

### Key Utilities
- **`cn()` in `src/lib/utils.ts`** - Merges Tailwind classes using `clsx` and `tailwind-merge` for proper class deduplication

### TypeScript Configuration
- `tsconfig.json` - Root configuration with path aliases
- `tsconfig.app.json` - Application source code configuration
- `tsconfig.node.json` - Build tooling configuration

### ESLint Configuration
Flat config format with:
- TypeScript ESLint recommended rules
- React Hooks recommended rules
- React Refresh rules for Vite HMR
- Global ignores for `dist` directory

## Styling

Tailwind CSS v4 configuration:
- **Base Color**: Stone
- **CSS Variables**: Enabled
- **Style**: shadcn/ui "new-york" variant
- **Icon Libraries**: Lucide React (shadcn/ui) + FontAwesome (custom icons)

The Tailwind plugin is integrated via Vite (`@tailwindcss/vite`), so no separate `tailwind.config.js` file is needed.

### Font System

Modern system font stack configured in `src/index.css`:

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI',
             'Roboto', 'Helvetica Neue', Arial, sans-serif,
             'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
```

**Benefits**: No external font downloads, native platform appearance, optimal readability.

## Quick Reference

### Typography
Use semantic components from `@/components/ui/typography`:
- **Headings**: H1, H2, H3, H4, Display
- **Body**: P, Lead, Large, Small, Muted, Medium
- **Special**: PriceDisplay, StatDisplay, Code, Blockquote, List

See [docs/typography.md](docs/typography.md) for complete reference.

### shadcn/ui Components
Always check `@/llms.txt` for available components before creating custom ones.

**Installation**: `npx shadcn-ui@latest add <component-name>`

See [docs/shadcn-workflow.md](docs/shadcn-workflow.md) for complete workflow.

### Component Patterns
See [docs/component-examples.md](docs/component-examples.md) for:
- Form implementations
- Layout patterns
- Data display
- Navigation
- Error/loading states

## Getting Started

1. Read [src/CLAUDE.md](src/CLAUDE.md) for frontend development guidelines
2. Review [docs/typography.md](docs/typography.md) for typography system
3. Review [docs/shadcn-workflow.md](docs/shadcn-workflow.md) for component workflow
4. Check `plan.md` for current implementation tasks
5. Never edit `todo` or `plan.md` unless explicitly requested
