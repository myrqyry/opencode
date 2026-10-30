# OpenCode Web App

The shared OpenCode browser UI is a SolidJS application built with Vite. Dependencies are managed by the Bun workspace; install them from the repository root with `bun install`.

## Development

Start the OpenCode API server from the repository root:

```bash
bun dev serve --port 4096
```

In another terminal, start the web app from the repository root:

```bash
bun run --cwd packages/app dev
```

Vite serves the app on port 3000 by default. The UI connects to the API server at `localhost:4096`; set `VITE_OPENCODE_SERVER_HOST` or `VITE_OPENCODE_SERVER_PORT` to use another address.

## Checks

Run checks and tests from `packages/app`:

```bash
bun typecheck
bun run build
bun run test:unit
bun run test:browser
```

## End-to-end tests

Playwright starts the Vite dev server automatically. The OpenCode API server must be available at `127.0.0.1:4096` by default.

Run end-to-end tests from `packages/app`:

```bash
bun run test:e2e:local
bun run test:e2e:local -- --grep "settings"
```

`PLAYWRIGHT_SERVER_HOST` and `PLAYWRIGHT_SERVER_PORT` select the API server, while `PLAYWRIGHT_PORT` and `PLAYWRIGHT_BASE_URL` configure the Vite test server URL. See `playwright.config.ts` for defaults and related options.
