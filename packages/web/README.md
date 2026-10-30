# OpenCode Website and Documentation

This package contains the OpenCode website and its user documentation. The site uses Astro with Starlight; documentation pages live under `src/content/docs`, and the documentation is mounted at `/docs` by `astro.config.mjs`.

Dependencies are managed by the Bun workspace. Install them from the repository root with `bun install`.

## Development

Run the website from the repository root:

```bash
bun run --cwd packages/web dev
```

Astro prints the local URL when the server starts.

## Build and preview

```bash
bun run --cwd packages/web build
bun run --cwd packages/web preview
```

The site uses Astro's server output with the Cloudflare adapter; it is not a standalone static export. See `astro.config.mjs` and `config.mjs` for site and deployment settings.
