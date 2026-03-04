# API Routes with REST

A [Next.js API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) example running on Cloudflare Workers via openvite. Demonstrates how to build a REST API using the Pages Router `pages/api/` convention.

## How to use

1. Install dependencies:

```bash
bun install
```

2. Start the dev server:

```bash
bun run dev
```

3. Build for production:

```bash
bun run build
```

### Deploy to Cloudflare

```bash
# Build the application
bun run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```
