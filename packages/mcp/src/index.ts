import { createApp, toErrorResponse } from "./app";

const app = await createApp();

const server = Bun.serve({
	hostname: app.config.host,
	port: app.config.port,
	fetch: async (request) => {
		try {
			return await app.handleRequest(request);
		} catch (error) {
			return toErrorResponse(error, request, app.config);
		}
	},
});

console.log(`SISI MCP listening on http://${server.hostname}:${server.port}/mcp`);
console.log(`Health endpoint: http://${server.hostname}:${server.port}/health`);

process.on("SIGINT", async () => {
	await app.shutdown();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await app.shutdown();
	process.exit(0);
});
