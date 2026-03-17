# sisi-agent

`sisi-agent` is an AI assistant project for **NUM**. It connects the university portal APIs to LLM tools through MCP, with a Chrome extension as the main client and a local MCP server exposing SISI data.

## Structure

- `apps/extension` - Chrome extension client
- `apps/server` - AI server
- `apps/web` - experimental web UI
- `packages/mcp` - local SISI MCP server
- `packages/db` - database setup
- `report/midway-report-latex` - thesis report source and PDF

## Quick Start

```bash
bun install
bun run dev
```

`bun run dev` starts:

- the AI API server
- the Chrome extension dev server
- the local MCP server

Useful commands:

```bash
bun run check
bun run check-types
bun run dev:extension
bun run dev:server
bun run dev:mcp
bun run db:push
bun run db:studio
```

## Run The Chrome Extension

```bash
bun run dev:extension
```

This starts the WXT development server for the Chrome extension on port `5555`.

## Start The MCP Server

The local MCP server runs on `http://127.0.0.1:3901/mcp` by default.

```bash
bun run dev:mcp
```

Optional health check:

```bash
curl http://127.0.0.1:3901/health
```

## Add It To An Agent Client

For agent clients that support HTTP MCP servers, add this to their MCP config:

```json
{
  "mcpServers": {
    "sisi-agent": {
      "url": "http://127.0.0.1:3901/mcp"
    }
  }
}
```

Then start the MCP server and connect your agent client to test the read-only SISI tools.

## Report

- Source: `report/midway-report-latex/main.tex`
- PDF: `report/midway-report-latex/main.pdf`

## Notes

- This repo uses Bun workspaces and Turborepo.
- The two large sample reference PDFs in `report/` are ignored by git.
