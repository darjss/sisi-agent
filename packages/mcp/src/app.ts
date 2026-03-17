import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { SisiApiClient } from "./api-client";
import {
	BOOTSTRAP_CORS_ALLOWED_HEADERS,
	createRuntimeConfig,
	isOriginAllowed,
	MCP_CORS_ALLOWED_HEADERS,
	MCP_CORS_EXPOSED_HEADERS,
	type RuntimeConfig,
} from "./constants";
import { registerDomains } from "./domains/index";
import { SessionError, UpstreamHttpError } from "./errors";
import {
	clearSessionInputSchema,
	healthResponseSchema,
	refreshSessionInputSchema,
	registerSessionInputSchema,
	registerSessionResponseSchema,
	type RegisterSessionInput,
} from "./schemas";
import { SessionStore } from "./session-store";

type JsonData = Record<string, unknown>;

export type SisiMcpApp = {
	config: RuntimeConfig;
	handleRequest: (request: Request) => Promise<Response>;
	sessionStore: SessionStore;
	shutdown: () => Promise<void>;
};

export async function createApp(config: RuntimeConfig = createRuntimeConfig()): Promise<SisiMcpApp> {
	const sessionStore = new SessionStore(config.sessionIdleTtlMs);
	const apiClient = new SisiApiClient(config);
	const mcpServer = new McpServer({
		name: "sisi-agent-mcp",
		version: "0.1.0",
	});
	const transport = new WebStandardStreamableHTTPServerTransport();

	registerDomains(mcpServer, { apiClient, sessionStore });
	await mcpServer.connect(transport);

	return {
		config,
		sessionStore,
		handleRequest: async (request) => {
			const url = new URL(request.url);

			if (request.method === "OPTIONS") {
				return handleOptions(request, config);
			}

			if (url.pathname === "/health" && request.method === "GET") {
				const activeSession = sessionStore.getActive();
				const response = healthResponseSchema.parse({
					status: "ok",
					sessionActive: Boolean(activeSession),
					expiresAt: activeSession ? new Date(activeSession.expiresAt).toISOString() : null,
				});
				return jsonResponse(response, 200);
			}

			if (url.pathname === "/local/session/register" && request.method === "POST") {
				enforceBrowserOrigin(request, config.allowedOrigins, true);
				const payload = registerSessionInputSchema.parse(await readJsonBody(request));
				const derived = await apiClient.verifySession(payload);
				const session = sessionStore.register({
					auth: payload,
					derived,
				});
				const response = registerSessionResponseSchema.parse({
					sessionId: session.sessionId,
					expiresAt: new Date(session.expiresAt).toISOString(),
					sih: session.derived.sih,
				});
				return withCors(
					jsonResponse(response, 201),
					request.headers.get("origin"),
					config.allowedOrigins,
					BOOTSTRAP_CORS_ALLOWED_HEADERS,
				);
			}

			if (url.pathname === "/local/session/refresh" && request.method === "POST") {
				enforceBrowserOrigin(request, config.allowedOrigins, true);
				const payload = refreshSessionInputSchema.parse(await readJsonBody(request));
				const session = sessionStore.refresh(payload.sessionId);
				return withCors(
					jsonResponse(
						registerSessionResponseSchema.parse({
							sessionId: session.sessionId,
							expiresAt: new Date(session.expiresAt).toISOString(),
							sih: session.derived.sih,
						}),
						200,
					),
					request.headers.get("origin"),
					config.allowedOrigins,
					BOOTSTRAP_CORS_ALLOWED_HEADERS,
				);
			}

			if (url.pathname === "/local/session/clear" && request.method === "POST") {
				enforceBrowserOrigin(request, config.allowedOrigins, true);
				const payload = clearSessionInputSchema.parse(await readJsonBody(request));
				const cleared = sessionStore.clear(payload.sessionId);
				return withCors(
					jsonResponse({ cleared }, 200),
					request.headers.get("origin"),
					config.allowedOrigins,
					BOOTSTRAP_CORS_ALLOWED_HEADERS,
				);
			}

			if (url.pathname === "/mcp") {
				enforceBrowserOrigin(request, config.allowedOrigins, false);
				const response = await transport.handleRequest(request);
				return withCors(response, request.headers.get("origin"), config.allowedOrigins, MCP_CORS_ALLOWED_HEADERS, MCP_CORS_EXPOSED_HEADERS);
			}

			return jsonResponse({ error: "Not found" }, 404);
		},
		shutdown: async () => {
			await mcpServer.close();
		},
	};
}

export function enforceBrowserOrigin(
	request: Request,
	allowedOrigins: string[],
	requireConfiguredAllowlist: boolean,
) {
	const origin = request.headers.get("origin");
	if (!origin) {
		if (requireConfiguredAllowlist) {
			throw new UpstreamHttpError(400, "Browser Origin header is required for localhost session bootstrap.");
		}

		return;
	}

	if (allowedOrigins.length === 0 && requireConfiguredAllowlist) {
		throw new UpstreamHttpError(503, "SISI_MCP_ALLOWED_ORIGINS is not configured.");
	}

	if (allowedOrigins.length > 0 && !isOriginAllowed(origin, allowedOrigins)) {
		throw new UpstreamHttpError(403, "Origin is not allowed to use this localhost SISI MCP server.");
	}
}

async function handleOptions(request: Request, config: RuntimeConfig): Promise<Response> {
	const url = new URL(request.url);
	const isBootstrap = url.pathname.startsWith("/local/session/");
	const allowHeaders = isBootstrap ? BOOTSTRAP_CORS_ALLOWED_HEADERS : MCP_CORS_ALLOWED_HEADERS;

	try {
		enforceBrowserOrigin(request, config.allowedOrigins, isBootstrap);
		return withCors(new Response(null, { status: 204 }), request.headers.get("origin"), config.allowedOrigins, allowHeaders, isBootstrap ? undefined : MCP_CORS_EXPOSED_HEADERS);
	} catch (error) {
		return toErrorResponse(error, request, config);
	}
}

async function readJsonBody(request: Request): Promise<unknown> {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		throw new UpstreamHttpError(415, "Expected application/json request body.");
	}

	return await request.json();
}

function jsonResponse(data: JsonData, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}

function withCors(
	response: Response,
	origin: string | null,
	allowedOrigins: string[],
	allowHeaders: readonly string[],
	exposeHeaders?: readonly string[],
): Response {
	const headers = new Headers(response.headers);
	if (origin && allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
		headers.set("Access-Control-Allow-Origin", origin);
		headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
		headers.set("Access-Control-Allow-Headers", allowHeaders.join(", "));
		headers.set("Vary", "Origin");
		if (exposeHeaders && exposeHeaders.length > 0) {
			headers.set("Access-Control-Expose-Headers", exposeHeaders.join(", "));
		}
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function toErrorResponse(error: unknown, request: Request, config: RuntimeConfig): Response {
	const origin = request.headers.get("origin");
	const status =
		error instanceof UpstreamHttpError
			? error.status
			: error instanceof SessionError
				? 409
				: error instanceof SyntaxError
					? 400
					: 500;
	const message =
		error instanceof Error
			? error.message
			: "Unexpected error";

	const response = jsonResponse({ error: message }, status);
	const isBootstrap = new URL(request.url).pathname.startsWith("/local/session/");
	return withCors(
		response,
		origin,
		config.allowedOrigins,
		isBootstrap ? BOOTSTRAP_CORS_ALLOWED_HEADERS : MCP_CORS_ALLOWED_HEADERS,
		isBootstrap ? undefined : MCP_CORS_EXPOSED_HEADERS,
	);
}

export async function registerAndVerifySession(
	app: SisiMcpApp,
	input: RegisterSessionInput,
) {
	const derived = await new SisiApiClient(app.config).verifySession(input);
	return app.sessionStore.register({ auth: input, derived });
}
