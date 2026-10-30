# OpenCode CLI and Server

This package contains the OpenCode CLI and server runtime. The terminal UI implementation lives in `packages/tui`.

Install workspace dependencies from the repository root:

```bash
bun install
```

To inspect the CLI commands from the repository root:

```bash
bun dev --help
```

To run the CLI entry point directly from this package directory:

```bash
bun run ./src/index.ts --help
```
