# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application using Tailwind CSS v4 for styling. The project is configured to use shadcn/ui components with the "new-york" style. Always check if a shadcn/ui component can be used before created a UI component in tailwind

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts the Vite development server with HMR (Hot Module Replacement).

### Build for Production
```bash
npm run build
```
Runs TypeScript compiler in build mode (`tsc -b`) followed by Vite build. Output goes to the `dist` directory.

### Lint Code
```bash
npm run lint
```
Runs ESLint across the codebase with TypeScript and React-specific rules.

### Preview Production Build
```bash
npm run preview
```
Previews the production build locally.

## Architecture

### Tech Stack
- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.x with @vitejs/plugin-react
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite plugin
- **UI Components**: shadcn/ui with Lucide icons
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins

### Path Aliases
The project uses TypeScript path aliases configured in both `tsconfig.json` and `vite.config.ts`:
- `@/*` maps to `./src/*`

shadcn/ui component aliases (from `components.json`):
- `@/components` - UI components directory
- `@/lib/utils` - Utility functions
- `@/ui` - UI component subdirectory
- `@/hooks` - React hooks directory

### Project Structure
```
src/
├── App.tsx          # Main application component
├── main.tsx         # Application entry point with React StrictMode
├── index.css        # Global styles and Tailwind directives
├── assets/          # Static assets (images, icons)
└── lib/
    └── utils.ts     # Utility functions (cn helper for class merging)
```

### Key Utilities
- `cn()` function in `src/lib/utils.ts`: Merges Tailwind classes using `clsx` and `tailwind-merge` for proper class deduplication and precedence.

## Styling

This project uses Tailwind CSS v4 with the following configuration:
- **Base Color**: Stone
- **CSS Variables**: Enabled
- **Style**: shadcn/ui "new-york" variant
- **Icon Library**: Lucide React

The Tailwind plugin is integrated via Vite (`@tailwindcss/vite`), so no separate `tailwind.config.js` file is needed.

## TypeScript Configuration

The project uses TypeScript project references:
- `tsconfig.json` - Root configuration with path aliases
- `tsconfig.app.json` - Application source code configuration
- `tsconfig.node.json` - Build tooling configuration

## ESLint Configuration

ESLint is configured with flat config format using:
- TypeScript ESLint recommended rules
- React Hooks recommended rules
- React Refresh rules for Vite HMR
- Global ignores for `dist` directory

## Adding shadcn/ui Components

This project is configured to use shadcn/ui components. To add new components, use the shadcn CLI (if installed) or manually add component files to `src/components/ui/` following the project's path alias structure. Refer to C:\Users\Admin\ .vscode\secondsens\llms.txt
