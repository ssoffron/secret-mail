# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

This is an **Astro** project - an all-in-one web framework for building high-performance websites using island architecture and server-first design. Astro reduces client-side JavaScript overhead while supporting popular UI frameworks like React through official integrations.

## Development Commands

This project uses pnpm as the package manager. All commands should be run from the root directory:

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server (typically localhost:4321, but may use alternate port)
- `pnpm build` - Build production site to ./dist/
- `pnpm preview` - Preview build locally
- `pnpm astro ...` - Run Astro CLI commands
- `pnpm astro check` - Type check the project

## Architecture

This Astro project uses TypeScript with strict configuration and follows Astro's file-based routing system:

### Core Astro Structure
- `src/pages/` - File-based routing where each .astro file becomes a route
- `src/layouts/` - Reusable page layouts using Astro's slot system
- `src/components/` - Reusable Astro and React components
- `src/assets/` - Static assets that can be imported and optimized by Astro
- `astro.config.mjs` - Astro configuration with React integration
- `tsconfig.json` - Extends Astro's strict TypeScript configuration

### Astro Features in Use
- **.astro templating**: HTML-like syntax with frontmatter for server-side logic
- **Island Architecture**: React components hydrated client-side only when needed
- **Component-scoped styling**: `<style>` tags within .astro files
- **Vite-powered development**: Fast dev server and optimized builds
- **React Integration**: `@astrojs/react` for interactive components

### Secure Mail Application
- `src/pages/secure-mail.astro` - Main secure mail page using Astro layout
- `src/components/secure-mail/` - React island components for interactive features:
  - **SecureMailApp.tsx**: Main React app with tab navigation
  - **SendPage.tsx**: Encryption interface with Web Crypto API (AES-256-GCM)
  - **ReceivePage.tsx**: Decryption interface with password inputs
  - **Input.tsx, Button.tsx, Card.tsx, Icons.tsx**: UI components with Tailwind CSS
- **Client-side encryption**: Uses browser Web Crypto API for security
- **Islands pattern**: Only interactive components are hydrated with `client:load`

### Styling and Design System
- **Tailwind CSS**: Utility-first CSS framework integrated via `@tailwindcss/vite`
- **Color Palette**: Uses Tailwind's stone/amber palette for warm, paper-like theme
  - `amber-50/100/200` for backgrounds and accents (cream tones)
  - `stone-400/700/800/900` for text and borders (sepia tones)
  - `red-600/700` for primary actions and seals
- **Responsive Design**: Mobile-first with `sm:` breakpoint utilities
- **Custom Animations**: Uses Tailwind's built-in animation utilities

### Development Notes
- Uses React islands for interactivity while maintaining Astro's performance benefits
- Tailwind CSS for consistent, utility-based styling
- All encryption/decryption happens client-side for security
- TypeScript strict mode enabled for type safety