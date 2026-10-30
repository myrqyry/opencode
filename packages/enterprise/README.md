# OpenCode Enterprise

This workspace package contains the private enterprise application. Dependencies are managed from the repository root with `bun install`.

## Development

Run the Vite development server from the repository root:

```bash
bun run --cwd packages/enterprise dev
```

## Checks and builds

```bash
bun run --cwd packages/enterprise typecheck
bun run --cwd packages/enterprise build
```

For the Cloudflare deployment target, use `bun run --cwd packages/enterprise build:cloudflare`.
