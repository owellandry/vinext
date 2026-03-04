# Performance Benchmarks

A dashboard for viewing openvite performance benchmarks, built with the App Router on Cloudflare Workers.

Compares build times and metrics across Next.js 16 (Turbopack), openvite (Rollup), and openvite (Rolldown) on every merge to main.

Uses a D1 database for benchmark storage and Tailwind CSS for styling.

## Running Locally

1. Install dependencies:

```sh
bun install
```

2. Start the dev server:

```sh
bun run dev
```

3. Build for production:

```sh
bun run build
```

4. Preview the production build:

```sh
bun run preview
```
