<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UI work: read the design system first

Before creating or changing any UI (components, pages, layouts, styles, or any task that touches what the user sees), read [`docs/design-system.md`](docs/design-system.md) and follow it. In short: use the existing components in `components/ui` and the colour tokens from `app/globals.css` instead of raw markup or raw colours. If you add or change a component, update the doc and `app/design-system/page.tsx` as it describes.
