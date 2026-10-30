# OpenCode Console App

This workspace package contains the OpenCode Console web application. Dependencies are managed from the repository root with `bun install`.

## Development

Run the Vite development server from the repository root:

```bash
bun run --cwd packages/console/app dev
```

## Checks and builds

```bash
bun run --cwd packages/console/app typecheck
bun run --cwd packages/console/app build
```

The `dev:remote` script runs the app through the configured SST development stage and requires that environment to be available.
