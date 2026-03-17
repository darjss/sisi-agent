import { z } from "zod/v4";

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 3901;
export const DEFAULT_SESSION_IDLE_TTL_MS = 15 * 60 * 1000;

const originSchema = z.url().refine((value) => {
	const url = new URL(value);
	return url.protocol === "chrome-extension:" || url.protocol === "http:" || url.protocol === "https:";
}, "Origin must use chrome-extension, http, or https");

const runtimeConfigSchema = z.object({
	SISI_MCP_HOST: z.string().default(DEFAULT_HOST),
	SISI_MCP_PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
	SISI_MCP_SESSION_IDLE_TTL_MS: z.coerce
		.number()
		.int()
		.min(60_000)
		.max(24 * 60 * 60 * 1000)
		.default(DEFAULT_SESSION_IDLE_TTL_MS),
	SISI_MCP_ALLOWED_ORIGINS: z.string().optional(),
	SISI_AUTH_BASE: z.url().default("https://auth.num.edu.mn"),
	SISI_SUPPORT2_BASE: z.url().default("https://support2.num.edu.mn/prod/api"),
	SISI_TREE_BASE: z.url().default("https://tree.num.edu.mn"),
	SISI_PHOST_BASE: z.url().default("https://phost.num.edu.mn"),
	SISI_TEACH_SISI_BASE: z.url().default("https://teach-sisi.num.edu.mn/api"),
});

export type RuntimeConfig = {
	host: string;
	port: number;
	sessionIdleTtlMs: number;
	allowedOrigins: string[];
	upstream: {
		authBase: string;
		support2Base: string;
		treeBase: string;
		phostBase: string;
		teachSisiBase: string;
	};
};

export const MCP_CORS_ALLOWED_HEADERS = [
	"content-type",
	"last-event-id",
	"mcp-protocol-version",
	"mcp-session-id",
] as const;

export const MCP_CORS_EXPOSED_HEADERS = [
	"mcp-protocol-version",
	"mcp-session-id",
] as const;

export const BOOTSTRAP_CORS_ALLOWED_HEADERS = ["content-type"] as const;

export function createRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
	const parsed = runtimeConfigSchema.parse(env);

	return {
		host: parsed.SISI_MCP_HOST,
		port: parsed.SISI_MCP_PORT,
		sessionIdleTtlMs: parsed.SISI_MCP_SESSION_IDLE_TTL_MS,
		allowedOrigins: parseAllowedOrigins(parsed.SISI_MCP_ALLOWED_ORIGINS),
		upstream: {
			authBase: parsed.SISI_AUTH_BASE,
			support2Base: parsed.SISI_SUPPORT2_BASE,
			treeBase: parsed.SISI_TREE_BASE,
			phostBase: parsed.SISI_PHOST_BASE,
			teachSisiBase: parsed.SISI_TEACH_SISI_BASE,
		},
	};
}

export function parseAllowedOrigins(raw: string | undefined): string[] {
	if (!raw) {
		return [];
	}

	return raw
		.split(",")
		.map((value) => value.trim())
		.filter((value) => value.length > 0)
		.map((value) => originSchema.parse(value));
}

export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
	if (!origin) {
		return false;
	}

	return allowedOrigins.includes(origin);
}

export function buildUrl(base: string, path: string, query?: Record<string, string | undefined>): string {
	const normalizedBase = base.endsWith("/") ? base : `${base}/`;
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	const url = new URL(normalizedPath, normalizedBase);

	for (const [key, value] of Object.entries(query ?? {})) {
		if (value) {
			url.searchParams.set(key, value);
		}
	}

	return url.toString();
}

export function encodeUriSegment(value: string): string {
	return encodeURIComponent(value);
}
